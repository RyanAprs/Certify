import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { config } from "dotenv";
import crypto from "crypto";
import { SiweMessage } from "siwe";

config();

const app = express();
const PORT = process.env.PORT || 4000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const IS_PROD = process.env.NODE_ENV === "production";

// Expected SIWE domain (host[:port]) derived from the configured frontend URL.
const EXPECTED_DOMAIN = (() => {
  try {
    return new URL(FRONTEND_URL).host;
  } catch {
    return undefined;
  }
})();

const NONCE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Restrict CORS to the known frontend origin (reflecting any origin with
// credentials enabled is a security hole).
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

interface Session {
  address: string;
  createdAt: number;
}

const nonceStore = new Map<string, number>(); // nonce -> issuedAt
const sessionStore = new Map<string, Session>();

// Periodically evict expired nonces and sessions so the maps do not grow
// unbounded (the previous Set/Map never expired anything).
setInterval(() => {
  const now = Date.now();
  for (const [nonce, issuedAt] of nonceStore) {
    if (now - issuedAt > NONCE_TTL_MS) nonceStore.delete(nonce);
  }
  for (const [id, session] of sessionStore) {
    if (now - session.createdAt > SESSION_TTL_MS) sessionStore.delete(id);
  }
}, 60 * 1000).unref();

function createSession(address: string) {
  const sessionId = crypto.randomUUID();
  sessionStore.set(sessionId, { address, createdAt: Date.now() });
  return sessionId;
}

function getSession(req: express.Request) {
  const token = req.cookies["certify_session"];
  if (!token) return null;
  const session = sessionStore.get(token);
  if (!session) return null;
  if (Date.now() - session.createdAt > SESSION_TTL_MS) {
    sessionStore.delete(token);
    return null;
  }
  return session;
}

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.get("/api/auth/nonce", (_req, res) => {
  const nonce = crypto.randomBytes(16).toString("hex");
  nonceStore.set(nonce, Date.now());
  res.json({ nonce });
});

app.post("/api/auth/verify", async (req, res) => {
  const { message, signature } = req.body ?? {};

  if (!message || !signature) {
    return res.status(400).json({ error: "Missing message or signature" });
  }

  try {
    const siweMessage = new SiweMessage(message);

    // Nonce must exist and be unexpired; consume it up-front to prevent replay.
    const issuedAt = nonceStore.get(siweMessage.nonce);
    if (issuedAt === undefined || Date.now() - issuedAt > NONCE_TTL_MS) {
      nonceStore.delete(siweMessage.nonce);
      return res.status(401).json({ error: "Invalid or expired nonce" });
    }
    nonceStore.delete(siweMessage.nonce);

    // Bind the signed message to our own domain and nonce.
    const { data, success } = await siweMessage.verify({
      signature,
      nonce: siweMessage.nonce,
      domain: EXPECTED_DOMAIN,
      time: new Date().toISOString(),
    });

    if (!success) {
      return res.status(401).json({ error: "Signature verification failed" });
    }

    const sessionId = createSession(data.address);
    res.cookie("certify_session", sessionId, {
      httpOnly: true,
      sameSite: "lax",
      secure: IS_PROD,
      maxAge: SESSION_TTL_MS,
    });

    res.json({ address: data.address });
  } catch (error: any) {
    console.error("Verification error:", error?.message ?? error);
    res.status(401).json({ error: "Invalid signature" });
  }
});

app.get("/api/auth/me", (req, res) => {
  const session = getSession(req);
  if (!session) return res.status(401).json({ error: "Unauthenticated" });
  res.json({ address: session.address });
});

app.post("/api/auth/logout", (req, res) => {
  const token = req.cookies["certify_session"];
  if (token) {
    sessionStore.delete(token);
    res.clearCookie("certify_session");
  }
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Certify backend listening on port ${PORT}`);
  if (!EXPECTED_DOMAIN) {
    console.warn("⚠️  Could not derive SIWE domain from FRONTEND_URL:", FRONTEND_URL);
  }
});
