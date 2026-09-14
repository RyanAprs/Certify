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
  "guard.noFunds.title": "This wallet has no ETH",
  "guard.noFunds.body":
    "It can't pay gas on the local chain. Send ETH to it from a funded Hardhat account (e.g. Account #0), or connect a funded account.",
  "guard.retry": "I've funded it — retry",

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

  // transactions (useRegistryWrite defaults)
  "tx.submitting": "Submitting transaction…",
  "tx.confirming": "Waiting for confirmation…",
  "tx.confirmed": "Transaction confirmed",
  "tx.failed": "Transaction failed",

  // operations (toasts)
  "op.registering": "Registering issuer…",
  "op.registered": "Issuer registered",
  "op.removing": "Removing issuer…",
  "op.removed": "Issuer removed",
  "op.approving": "Approving member…",
  "op.rejecting": "Rejecting member…",
  "op.memberApproved": "Member approved",
  "op.memberRejected": "Member rejected",
  "op.issuing": "Issuing certificate…",
  "op.issued": "Certificate issued",
  "op.uploadingImg": "Uploading image to IPFS…",
  "op.imgUploaded": "Image uploaded",
  "op.imgFailed": "Image upload failed",
  "op.requesting": "Requesting membership…",
  "op.requested": "Membership request sent",
  "op.uploadingDisc": "Uploading disclosure to IPFS…",
  "op.uploaded": "Uploaded",
  "op.uploadFailed": "Upload failed",
  "op.sharing": "Sharing credential…",
  "op.shared": "Credential shared",
  "op.verifyingChain": "Verifying proof on-chain…",
  "op.verifiedChain": "Proof verified on-chain",
  "op.revoking": "Revoking…",
  "op.revoked": "Certificate revoked",
  "op.reactivating": "Reactivating…",
  "op.reactivated": "Certificate reactivated",
  "op.proofDone": "Proof generated & self-verified",
  "op.commitmentCopied": "Commitment copied",
  "op.copied": "Copied to clipboard",
  "op.clipboard": "Clipboard unavailable",

  // validations & errors
  "valid.addr": "Enter a valid Ethereum address",
  "valid.holderReq": "Holder address is required",
  "valid.issuerReq": "Issuer address is required",
  "valid.verifierReq": "Verifier address is required",
  "valid.nameReq": "Name is required",
  "valid.gpaReq": "GPA is required",
  "valid.range": "Must be between {min} and {max}",
  "valid.imgReq": "Certificate image is required",
  "valid.fieldReq": "{label} is required",
  "issue.expiryHint": "expiry date",
  "issue.claimsHintFull": "— committed on-chain, provable by threshold, never revealed",
  "err.selectCred": "Select a credential to share",
  "err.selectField": "Select at least one field to disclose",
  "err.loadCert": "Load a certificate first",
  "err.noSalts": "This credential has no ZK salts (issued before the ZK upgrade).",
  "err.enterThreshold": "Enter a threshold",
  "err.enterValue": "Enter a value to match",
  "err.enterSet": "Enter allowed values (comma-separated)",
  "err.notFound": "Certificate not found",
  "err.metaFail": "Failed to load metadata from IPFS",
  "err.proofFail": "Failed to generate proof",

  // hints
  "hint.gpa": "0–5 scale",
  "hint.imgTypes": "PNG or JPEG, stored on IPFS",
  "hint.claims": "— committed on-chain, provable by threshold, never revealed",
  "hint.eq": "Revealed to the verifier; other claims stay hidden",
  "hint.set": "Comma-separated (max 8) — which one matched stays hidden",
  "hint.threshold": "Proves {label} ≥ threshold (range {min}–{max})",
  "hint.hidden": "Value stays hidden",
  "expiry.note": "Proves {label} ≥ now — the credential is not expired.",

  // verifier extras
  "proof.min": "Minimum {label}",
  "proof.eqLabel": "{label} equals",
  "proof.setLabel": "{label} is one of",
  "proof.connectNote": "Connect a wallet to submit the on-chain verification.",
  "proof.selfPassed": "self-verify passed",
  "proof.selfFailed": "self-verify failed",

  // card / loaders
  "card.metaError": "Metadata could not be loaded from IPFS.",
  "card.verified": "Verified",
  "card.issued": "Issued {date}",
  "load.members": "Loading members…",
  "load.fields": "Loading credential fields…",
  "load.proof": "Computing zero-knowledge proof…",
  "load.memberships": "Checking memberships…",
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
  "guard.noFunds.title": "Wallet ini belum punya ETH",
  "guard.noFunds.body":
    "Tak bisa bayar gas di chain lokal. Kirim ETH dari akun Hardhat yang berdana (mis. Account #0), atau hubungkan akun yang sudah berisi ETH.",
  "guard.retry": "Sudah diisi — coba lagi",

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

  "tx.submitting": "Mengirim transaksi…",
  "tx.confirming": "Menunggu konfirmasi…",
  "tx.confirmed": "Transaksi terkonfirmasi",
  "tx.failed": "Transaksi gagal",

  "op.registering": "Mendaftarkan penerbit…",
  "op.registered": "Penerbit terdaftar",
  "op.removing": "Menghapus penerbit…",
  "op.removed": "Penerbit dihapus",
  "op.approving": "Menyetujui anggota…",
  "op.rejecting": "Menolak anggota…",
  "op.memberApproved": "Anggota disetujui",
  "op.memberRejected": "Anggota ditolak",
  "op.issuing": "Menerbitkan sertifikat…",
  "op.issued": "Sertifikat diterbitkan",
  "op.uploadingImg": "Mengunggah gambar ke IPFS…",
  "op.imgUploaded": "Gambar terunggah",
  "op.imgFailed": "Unggah gambar gagal",
  "op.requesting": "Meminta membership…",
  "op.requested": "Permohonan terkirim",
  "op.uploadingDisc": "Mengunggah disclosure ke IPFS…",
  "op.uploaded": "Terunggah",
  "op.uploadFailed": "Unggah gagal",
  "op.sharing": "Membagikan kredensial…",
  "op.shared": "Kredensial dibagikan",
  "op.verifyingChain": "Memverifikasi bukti on-chain…",
  "op.verifiedChain": "Bukti terverifikasi on-chain",
  "op.revoking": "Mencabut…",
  "op.revoked": "Sertifikat dicabut",
  "op.reactivating": "Mengaktifkan…",
  "op.reactivated": "Sertifikat diaktifkan",
  "op.proofDone": "Bukti dibuat & terverifikasi lokal",
  "op.commitmentCopied": "Commitment disalin",
  "op.copied": "Disalin ke clipboard",
  "op.clipboard": "Clipboard tidak tersedia",

  "valid.addr": "Masukkan alamat Ethereum yang valid",
  "valid.holderReq": "Alamat holder wajib diisi",
  "valid.issuerReq": "Alamat penerbit wajib diisi",
  "valid.verifierReq": "Alamat verifier wajib diisi",
  "valid.nameReq": "Nama wajib diisi",
  "valid.gpaReq": "GPA wajib diisi",
  "valid.range": "Harus antara {min} dan {max}",
  "valid.imgReq": "Gambar sertifikat wajib",
  "valid.fieldReq": "{label} wajib diisi",
  "issue.expiryHint": "tanggal kedaluwarsa",
  "issue.claimsHintFull": "— di-commit on-chain, bisa dibuktikan lewat ambang, tak pernah diungkap",
  "err.selectCred": "Pilih kredensial untuk dibagikan",
  "err.selectField": "Pilih minimal satu field untuk diungkap",
  "err.loadCert": "Muat sertifikat dulu",
  "err.noSalts": "Kredensial ini tak punya ZK salt (diterbitkan sebelum upgrade ZK).",
  "err.enterThreshold": "Masukkan ambang",
  "err.enterValue": "Masukkan nilai yang dicocokkan",
  "err.enterSet": "Masukkan nilai yang diizinkan (pisahkan koma)",
  "err.notFound": "Sertifikat tidak ditemukan",
  "err.metaFail": "Gagal memuat metadata dari IPFS",
  "err.proofFail": "Gagal membuat bukti",

  "hint.gpa": "skala 0–5",
  "hint.imgTypes": "PNG atau JPEG, disimpan di IPFS",
  "hint.claims": "— di-commit on-chain, bisa dibuktikan lewat ambang, tak pernah diungkap",
  "hint.eq": "Diungkap ke verifier; klaim lain tetap tersembunyi",
  "hint.set": "Pisahkan koma (maks 8) — yang cocok tetap tersembunyi",
  "hint.threshold": "Membuktikan {label} ≥ ambang (rentang {min}–{max})",
  "hint.hidden": "Nilai tetap tersembunyi",
  "expiry.note": "Membuktikan {label} ≥ sekarang — kredensial belum kedaluwarsa.",

  "proof.min": "Minimal {label}",
  "proof.eqLabel": "{label} sama dengan",
  "proof.setLabel": "{label} salah satu dari",
  "proof.connectNote": "Hubungkan wallet untuk mengirim verifikasi on-chain.",
  "proof.selfPassed": "verifikasi lokal lolos",
  "proof.selfFailed": "verifikasi lokal gagal",

  "card.metaError": "Metadata gagal dimuat dari IPFS.",
  "card.verified": "Terverifikasi",
  "card.issued": "Terbit {date}",
  "load.members": "Memuat anggota…",
  "load.fields": "Memuat field kredensial…",
  "load.proof": "Menghitung bukti zero-knowledge…",
  "load.memberships": "Memeriksa keanggotaan…",

  // schema-driven labels (ID only; EN falls back to the schema's English label via `tt`)
  "field.name": "Nama penerima",
  "field.institution": "Institusi",
  "field.program": "Program",
  "field.description": "Deskripsi",
  "field.gpa": "GPA",
  "field.score": "Skor penilaian",
  "field.level": "Level",
  "field.skill": "Keahlian",
  "field.authority": "Otoritas penerbit",
  "field.validUntil": "Berlaku sampai",
  "schema.diploma": "Ijazah Akademik",
  "schema.competency": "Sertifikat Kompetensi",
  "schema.license": "Lisensi Profesi",
};

const dicts: Record<Lang, Dict> = { en, id };

interface LocaleValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  /** Translate with an explicit fallback (for schema-driven labels). */
  tt: (key: string, fallback: string) => string;
}

const LocaleContext = createContext<LocaleValue>({
  lang: "en",
  setLang: () => {},
  t: (k) => k,
  tt: (_k, fb) => fb,
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

  const tt = (key: string, fallback: string) => dicts[lang][key] ?? fallback;

  return (
    <LocaleContext.Provider value={{ lang, setLang, t, tt }}>{children}</LocaleContext.Provider>
  );
}

export const useT = () => useContext(LocaleContext);
