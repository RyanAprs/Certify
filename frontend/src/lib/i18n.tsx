import { createContext, useContext, useState, ReactNode } from "react";

export type Lang = "en" | "id";
type Dict = Record<string, string>;

const en: Dict = {
  // common
  "common.refresh": "Refresh",
  "common.refreshing": "Refreshing…",
  "common.back": "Back to Home",
  "common.loading": "Loading…",

  // brand / nav
  "brand.subtitle": "Credential Registry",
  "nav.home": "Home",
  "nav.issuer": "Issuer",
  "nav.holder": "Holder",
  "nav.verifier": "Verifier",
  "workspace": "Workspace",
  "signedIn": "signed in",

  // landing
  "landing.eyebrow": "Zero-knowledge academic credentials",
  "landing.title": "Verify what matters. Reveal nothing else.",
  "landing.subtitle":
    "Certify is an on-chain registry for academic credentials. Institutions issue, students hold, and anyone can verify a claim with a zero-knowledge proof — without exposing the data behind it.",
  "landing.connectPrompt": "Connect your wallet to get started.",
  "landing.goIssuer": "Issuer workspace",
  "landing.goHolder": "Holder workspace",
  "landing.goVerifier": "Verifier workspace",
  "landing.howTitle": "How a credential flows",
  "landing.step": "Step",
  "landing.flow.issuer":
    "A registered institution approves a holder and issues a certificate, storing only a commitment on-chain.",
  "landing.flow.holder":
    "The student holds the credential and shares it selectively — proving a threshold, never the exact value.",
  "landing.flow.verifier":
    "A verifier checks the zero-knowledge proof on-chain. The claim checks out; the underlying data stays private.",

  // role guard
  "guard.notConfigured.title": "Contract not configured",
  "guard.notConfigured.body":
    "The registry address is empty. Deploy the contracts, then reload.",
  "guard.connect": "Connect your wallet to access the {role} workspace.",
  "guard.checkingIssuer": "Checking issuer authorization…",
  "guard.denied.title": "Not a registered issuer",
  "guard.denied.body":
    "This wallet can't issue certificates yet. The registry admin must authorize it.",

  // issuer
  "issuer.desc": "Issue academic and competency credentials, and manage which holders can receive them.",
  "admin.title": "Admin · issuer registry",
  "admin.desc": "Authorize another wallet to issue credentials.",
  "admin.placeholder": "0x… wallet to authorize",
  "admin.register": "Register issuer",
  "admin.registering": "Registering…",
  "admin.registered": "Registered issuers",
  "issue.title": "Issue a credential",
  "issue.type": "Credential type",
  "issue.holder": "Holder address",
  "issue.claimsTitle": "Private claims",
  "issue.claimsHint": "— committed on-chain, provable by threshold, never revealed",
  "issue.image": "Certificate image",
  "issue.submit": "Issue {type}",
  "issue.submitting": "Issuing…",
  "pending.title": "Pending requests",
  "pending.empty": "No pending requests",
  "pending.emptyBody": "When a holder requests membership, they'll appear here for approval.",
  "approve": "Approve",
  "members.title": "Approved members",
  "members.empty": "No approved members yet.",
  "issued.title": "Issued credentials",
  "issued.empty": "No credentials issued yet",

  // holder
  "holder.desc": "Collect your credentials and share exactly what a verifier needs — nothing more.",
  "holder.memberOf": "Member of",
  "join.title": "Join an issuer",
  "join.placeholder": "Issuer address (0x…)",
  "join.request": "Request access",
  "join.requesting": "Requesting…",
  "share.title": "Share a credential",
  "share.credential": "Credential",
  "share.select": "Select a credential…",
  "share.verifier": "Verifier address",
  "share.fields": "Fields to disclose",
  "share.selectPrompt": "Pick one of your credentials to choose which fields to disclose.",
  "share.notice":
    "Selective disclosure reveals the ticked fields in plaintext to this verifier. To prove a fact without revealing it, use the Verifier's zero-knowledge proofs instead.",
  "share.submit": "Share {n} fields",
  "share.submit_one": "Share {n} field",
  "share.sharing": "Sharing…",
  "creds.title": "Your credentials",
  "creds.empty": "No credentials yet",

  // verifier
  "verifier.desc": "Look up a credential and verify a claim on-chain — without seeing the underlying value.",
  "zk.missing.title": "ZK artifacts not built",
  "search.title": "Find a credential",
  "search.placeholder": "Certificate ID",
  "search.button": "Search",
  "search.searching": "Searching…",
  "proof.title": "Request a proof",
  "proof.claim": "Claim",
  "proof.statement": "Statement",
  "proof.generate": "Generate proof",
  "proof.generating": "Generating…",
  "proof.generated": "Proof generated",
  "proof.verify": "Verify on-chain",
  "proof.verifying": "Verifying…",
  "pred.range": "Threshold ≥",
  "pred.equality": "Equals",
  "pred.membership": "One of",
  "disc.title": "Disclosure history",
  "disc.empty": "No disclosures yet",

  // status
  "status.Active": "Active",
  "status.Pending": "Pending",
  "status.Revoked": "Revoked",
  "revoke": "Revoke",
  "reactivate": "Reactivate",
};

const id: Dict = {
  "common.refresh": "Muat ulang",
  "common.refreshing": "Memuat…",
  "common.back": "Kembali ke Beranda",
  "common.loading": "Memuat…",

  "brand.subtitle": "Registri Kredensial",
  "nav.home": "Beranda",
  "nav.issuer": "Penerbit",
  "nav.holder": "Pemegang",
  "nav.verifier": "Pemverifikasi",
  "workspace": "Ruang Kerja",
  "signedIn": "masuk sebagai",

  "landing.eyebrow": "Kredensial akademik zero-knowledge",
  "landing.title": "Verifikasi yang penting. Sembunyikan sisanya.",
  "landing.subtitle":
    "Certify adalah registri on-chain untuk kredensial akademik. Institusi menerbitkan, mahasiswa menyimpan, dan siapa pun bisa memverifikasi klaim dengan bukti zero-knowledge — tanpa membuka data di baliknya.",
  "landing.connectPrompt": "Hubungkan wallet untuk mulai.",
  "landing.goIssuer": "Ruang Penerbit",
  "landing.goHolder": "Ruang Pemegang",
  "landing.goVerifier": "Ruang Pemverifikasi",
  "landing.howTitle": "Alur sebuah kredensial",
  "landing.step": "Langkah",
  "landing.flow.issuer":
    "Institusi terdaftar menyetujui pemegang dan menerbitkan sertifikat, hanya menyimpan commitment di on-chain.",
  "landing.flow.holder":
    "Mahasiswa menyimpan kredensial dan membagikannya selektif — membuktikan ambang, bukan nilai persisnya.",
  "landing.flow.verifier":
    "Pemverifikasi memeriksa bukti zero-knowledge on-chain. Klaim valid; data di baliknya tetap privat.",

  "guard.notConfigured.title": "Kontrak belum dikonfigurasi",
  "guard.notConfigured.body":
    "Alamat registry kosong. Deploy kontrak dulu, lalu muat ulang.",
  "guard.connect": "Hubungkan wallet untuk mengakses ruang {role}.",
  "guard.checkingIssuer": "Memeriksa otorisasi penerbit…",
  "guard.denied.title": "Bukan penerbit terdaftar",
  "guard.denied.body":
    "Wallet ini belum bisa menerbitkan sertifikat. Admin registry harus mengotorisasinya.",

  "issuer.desc": "Terbitkan kredensial akademik & kompetensi, dan kelola holder yang boleh menerimanya.",
  "admin.title": "Admin · registri penerbit",
  "admin.desc": "Otorisasi wallet lain untuk menerbitkan kredensial.",
  "admin.placeholder": "0x… wallet yang diotorisasi",
  "admin.register": "Daftarkan penerbit",
  "admin.registering": "Mendaftarkan…",
  "admin.registered": "Penerbit terdaftar",
  "issue.title": "Terbitkan kredensial",
  "issue.type": "Jenis kredensial",
  "issue.holder": "Alamat holder",
  "issue.claimsTitle": "Klaim privat",
  "issue.claimsHint": "— di-commit on-chain, bisa dibuktikan lewat ambang, tak pernah diungkap",
  "issue.image": "Gambar sertifikat",
  "issue.submit": "Terbitkan {type}",
  "issue.submitting": "Menerbitkan…",
  "pending.title": "Permohonan masuk",
  "pending.empty": "Belum ada permohonan",
  "pending.emptyBody": "Saat holder meminta membership, mereka muncul di sini untuk disetujui.",
  "approve": "Setujui",
  "members.title": "Anggota disetujui",
  "members.empty": "Belum ada anggota.",
  "issued.title": "Kredensial terbit",
  "issued.empty": "Belum ada kredensial diterbitkan",

  "holder.desc": "Kumpulkan kredensialmu dan bagikan tepat yang verifier butuhkan — tidak lebih.",
  "holder.memberOf": "Anggota dari",
  "join.title": "Gabung penerbit",
  "join.placeholder": "Alamat penerbit (0x…)",
  "join.request": "Minta akses",
  "join.requesting": "Meminta…",
  "share.title": "Bagikan kredensial",
  "share.credential": "Kredensial",
  "share.select": "Pilih kredensial…",
  "share.verifier": "Alamat verifier",
  "share.fields": "Field yang diungkap",
  "share.selectPrompt": "Pilih salah satu kredensialmu untuk menentukan field yang diungkap.",
  "share.notice":
    "Selective disclosure membuka field tercentang dalam plaintext ke verifier ini. Untuk membuktikan tanpa membuka, gunakan ZK proof di halaman Verifier.",
  "share.submit": "Bagikan {n} field",
  "share.submit_one": "Bagikan {n} field",
  "share.sharing": "Membagikan…",
  "creds.title": "Kredensialmu",
  "creds.empty": "Belum ada kredensial",

  "verifier.desc": "Cari kredensial dan verifikasi klaim on-chain — tanpa melihat nilainya.",
  "zk.missing.title": "Artefak ZK belum dibuild",
  "search.title": "Cari kredensial",
  "search.placeholder": "Certificate ID",
  "search.button": "Cari",
  "search.searching": "Mencari…",
  "proof.title": "Minta bukti",
  "proof.claim": "Klaim",
  "proof.statement": "Pernyataan",
  "proof.generate": "Buat bukti",
  "proof.generating": "Membuat…",
  "proof.generated": "Bukti dibuat",
  "proof.verify": "Verifikasi on-chain",
  "proof.verifying": "Memverifikasi…",
  "pred.range": "Ambang ≥",
  "pred.equality": "Sama dengan",
  "pred.membership": "Salah satu dari",
  "disc.title": "Riwayat disclosure",
  "disc.empty": "Belum ada disclosure",

  "status.Active": "Aktif",
  "status.Pending": "Menunggu",
  "status.Revoked": "Dicabut",
  "revoke": "Cabut",
  "reactivate": "Aktifkan lagi",
};

const dicts: Record<Lang, Dict> = { en, id };

interface LocaleValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const LocaleContext = createContext<LocaleValue>({
  lang: "en",
  setLang: () => {},
  t: (k) => k,
});

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = typeof localStorage !== "undefined" ? localStorage.getItem("lang") : null;
    return saved === "id" || saved === "en" ? saved : "en";
  });

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem("lang", l);
    } catch {
      /* ignore */
    }
  };

  const t = (key: string, vars?: Record<string, string | number>) => {
    let s = dicts[lang][key] ?? dicts.en[key] ?? key;
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
    return s;
  };

  return <LocaleContext.Provider value={{ lang, setLang, t }}>{children}</LocaleContext.Provider>;
}

export const useT = () => useContext(LocaleContext);
