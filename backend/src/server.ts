import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { config } from "dotenv";
import crypto from "crypto";
import { SiweMessage } from "siwe";

config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(
  cors({
    origin: true, // semua origin diizinkan
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

interface Session {
  address: string;
  createdAt: number;
}

const nonceStore = new Set<string>();
const sessionStore = new Map<string, Session>();

function createSession(address: string) {
  const sessionId = crypto.randomUUID();
  sessionStore.set(sessionId, { address, createdAt: Date.now() });
  return sessionId;
}

function getSession(req: express.Request) {
  const token = req.cookies["certify_session"];
  if (!token) return null;
  const session = sessionStore.get(token);
  return session ?? null;
}

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.get("/api/auth/nonce", (_req, res) => {
  const nonce = crypto.randomBytes(16).toString("hex");
  nonceStore.add(nonce);
  res.json({ nonce });
});

app.post("/api/auth/verify", async (req, res) => {
  const { message, signature } = req.body as {
    message: string;
    signature: string;
  };
  if (!message || !signature)
    return res.status(400).json({ error: "Missing payload" });
  try {
    const siweMessage = new SiweMessage(message);
    if (!nonceStore.has(siweMessage.nonce)) {
      return res.status(422).json({ error: "Nonce expired" });
    }
    const { data } = await siweMessage.verify({
      signature,
      time: new Date().toISOString(),
    });
    nonceStore.delete(siweMessage.nonce);
    const sessionId = createSession(data.address);

    console.log(data);

    res.cookie("certify_session", sessionId, {
      httpOnly: true,
      sameSite: "lax",
      // secure: process.env.NODE_ENV === "production",
      secure: false,
      maxAge: 1000 * 60 * 60 * 24,
    });
    res.json({ address: data.address });
  } catch (error: any) {
    res.status(401).json({ error: error?.message ?? "Invalid signature" });
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
});
