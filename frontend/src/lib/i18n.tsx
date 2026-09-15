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
  "footer.note":
    "A privacy-preserving credential registry — a proof of concept running on a local blockchain.",
  "nav.home": "Home",
  "nav.issuer": "Issuer",
  "nav.holder": "Holder",
  "nav.verifier": "Verifier",
  "workspace": "Workspace",
  "signedIn": "signed in",

  // landing
  "landing.eyebrow": "Zero-knowledge credential verification",
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

  // dashboard empty-state bodies
  "issued.emptyBody":
    "Approve a holder above, then issue their first credential. It is recorded on-chain with a zero-knowledge commitment.",
  "creds.emptyBody":
    "Once an issuer you've joined grants you a certificate, it appears here — ready to share.",
  "disc.emptyBody": "Search a certificate above to see who it has been shared with.",

  // ---------------- landing page ----------------
  "lp.hero.title": "Prove your credentials are real — without revealing what's inside.",
  "lp.hero.subtitle":
    "Certify issues diplomas, competency certificates, and professional licenses to a shared ledger no one can forge. Holders keep their own records and prove a single fact — a GPA threshold, a valid license — while everything else stays private.",
  "lp.hero.learn": "See how it works",
  "lp.hero.hidden": "private",
  "lp.hero.proof": "proof valid · on-chain",

  "lp.problem.title": "Forged credentials are a real, expensive problem.",
  "lp.problem.lead":
    "Diplomas and certificates open doors — to jobs, scholarships, public office, licensed practice. That value makes them a target for forgery, and today's paper-and-PDF checks can't keep up.",
  "lp.problem.forgery.title": "Easy to fake",
  "lp.problem.forgery.body":
    "Paper and PDF documents are trivially edited, reprinted, or fabricated from scratch. The untrained eye can't tell an original from a clean forgery.",
  "lp.problem.verify.title": "Slow, costly verification",
  "lp.problem.verify.body":
    "Confirming authenticity means contacting each issuer by hand — days of waiting, and often no answer when an office is closed or records are lost.",
  "lp.problem.privacy.title": "Too much data exposed",
  "lp.problem.privacy.body":
    "To prove one small fact — 'GPA at least 3.5', 'holds a safety certificate' — people hand over an entire transcript, revealing data no one needed to see.",
  "lp.problem.central.title": "A single point of failure",
  "lp.problem.central.body":
    "When verification depends on one server or authority, one outage or one altered record can break trust for everyone.",
  "lp.problem.context":
    "Indonesia already recognises this: national systems like SIVIL (electronic diploma verification) and PIN (national diploma numbering) exist precisely to fight forgery. Certify complements them with verification that is distributed, instant, and sparing with personal data.",

  "lp.solution.title": "Certify answers all four.",
  "lp.solution.lead":
    "Three principles, working together — so a credential is impossible to forge, instant to check, and private by default.",
  "lp.principle.antifraud.title": "Impossible to forge",
  "lp.principle.antifraud.body":
    "Every credential is sealed and recorded on a shared, tamper-evident ledger. Once issued, no one — not even the issuer — can alter it unnoticed.",
  "lp.principle.instant.title": "Instant, self-service checks",
  "lp.principle.instant.body":
    "Anyone can verify a credential directly, in seconds, with no phone calls to the issuing institution.",
  "lp.principle.privacy.title": "Private by design",
  "lp.principle.privacy.body":
    "Holders prove a fact without exposing the underlying data — that a GPA clears a bar, without revealing the number itself.",
  "lp.solution.analogyLead": "Prove without showing.",
  "lp.solution.analogy":
    "It's like proving your key fits a specific lock without ever handing the key over — or showing a guard you're over 18 without stating your birth date.",

  "lp.how.title": "Three roles, one simple flow.",
  "lp.how.lead":
    "Issuers create, holders keep, verifiers check. Only a cryptographic commitment ever touches the ledger — never the document itself.",

  "lp.diff.title": "What makes Certify different",
  "lp.diff.ledger.title": "Shared ledger",
  "lp.diff.ledger.body":
    "Proof of authenticity is distributed and permanent — hard to forge or quietly delete, and not dependent on any single server.",
  "lp.diff.zk.title": "Proof without disclosure",
  "lp.diff.zk.body":
    "Zero-knowledge proofs confirm a threshold, a match, or a validity date without leaking the raw value behind it.",
  "lp.diff.holder.title": "Holder in control",
  "lp.diff.holder.body":
    "Credentials live in the holder's wallet, not locked inside one institution's database.",
  "lp.diff.flexible.title": "Built for many credential types",
  "lp.diff.flexible.body":
    "Not just diplomas and GPAs — competency certificates (scores, levels, skills) and professional licenses (validity, issuing authority) too.",

  "lp.benefits.title": "What each side gains",
  "lp.benefit.issuer.party": "Universities & certifiers",
  "lp.benefit.issuer.gain":
    "Reputation protected from forgery; the manual verification burden drops sharply.",
  "lp.benefit.holder.party": "Holders (students & workers)",
  "lp.benefit.holder.gain":
    "Apply faster and safer — disclosing only what's strictly needed, nothing more.",
  "lp.benefit.verifier.party": "Employers & selection panels",
  "lp.benefit.verifier.gain":
    "Instant, trustworthy verification with no need to chase the issuer.",
  "lp.benefit.public.party": "Society & regulators",
  "lp.benefit.public.gain":
    "A more honest credential ecosystem; safer outcomes in critical professions.",

  "lp.scenario.tag": "Worked example",
  "lp.scenario.title":
    "Rina applies to Nusantara Tech — and proves she qualifies without oversharing.",
  "lp.scenario.p1":
    "Rina graduated with a 3.8 GPA. Nusantara Tech requires at least 3.5. Instead of emailing a full scan of her diploma and transcript — every grade, her date of birth, everything — she sends a single proof: 'GPA ≥ 3.5'.",
  "lp.scenario.p2":
    "HR verifies it in seconds. They know the diploma is genuine (it's recorded on the shared ledger) and that Rina meets the bar — without ever seeing her exact GPA or any other personal data. A forged diploma simply wouldn't match the issuer's record.",
  "lp.scenario.result": "Verified in seconds · exact GPA never seen",

  "lp.faq.title": "Questions, answered",
  "lp.faq.lead":
    "The essentials on how Certify works, what it protects, and where it fits.",
  "lp.faq.q1": "Does Certify replace SIVIL or PIN?",
  "lp.faq.a1":
    "No — it complements them. SIVIL and PIN are centralized national systems; Certify adds verification that is distributed (not reliant on one server), instant, and privacy-preserving. The vision is integration, not replacement.",
  "lp.faq.q2": "What is a zero-knowledge proof, in plain terms?",
  "lp.faq.a2":
    "It's a way to prove a statement is true without revealing the data behind it. Certify can prove 'GPA ≥ 3.5', 'the skill is one of {A, B, C}', or 'the license hasn't expired' — and the verifier learns only valid or not valid, never the underlying value.",
  "lp.faq.q3": "Is it only for university diplomas?",
  "lp.faq.a3":
    "No. Certify handles diplomas (GPA thresholds), competency certificates (scores, levels, skills), and professional licenses (issuing authority, expiry). New credential types are added as schemas — no new cryptography required.",
  "lp.faq.q4": "What if the issuing institution shuts down?",
  "lp.faq.a4":
    "The credential stays valid. Proof of authenticity lives on the shared ledger and in the holder's own wallet, so verification doesn't depend on the issuer still being online.",
  "lp.faq.q5": "Is my personal data stored on the blockchain?",
  "lp.faq.a5":
    "No. Only a cryptographic commitment — a digital fingerprint — is recorded on-chain. The actual document and its values stay off-chain, and holders decide what, if anything, to disclose.",
  "lp.faq.q6": "Is Certify production-ready today?",
  "lp.faq.a6":
    "It's a working proof of concept that demonstrates the full flow end-to-end: issuing, holding, and privacy-preserving verification. Real-world deployment would add full encryption of holder data, issuer governance, and integration with existing systems.",

  "lp.close.title": "Verification you can trust — and privacy you keep.",
  "lp.close.body":
    "Certify shifts verification from 'trust a piece of paper' to 'trust a proof that can't be faked.' Explore it from any of the three roles.",
  "lp.close.note":
    "Certify is a proof-of-concept running on a local blockchain. Connect a funded local wallet to explore the issuer, holder, and verifier workspaces.",
};

const id: Dict = {
  "common.refresh": "Muat ulang",
  "common.refreshing": "Memuat…",
  "common.back": "Kembali ke Beranda",
  "common.loading": "Memuat…",

  "brand.subtitle": "Registri Kredensial",
  "footer.note":
    "Registri kredensial yang menjaga privasi — proof of concept yang berjalan di blockchain lokal.",
  "nav.home": "Beranda",
  "nav.issuer": "Penerbit",
  "nav.holder": "Pemegang",
  "nav.verifier": "Pemverifikasi",
  "workspace": "Ruang Kerja",
  "signedIn": "masuk sebagai",

  "landing.eyebrow": "Verifikasi kredensial zero-knowledge",
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

  // dashboard empty-state bodies
  "issued.emptyBody":
    "Setujui holder di atas, lalu terbitkan kredensial pertamanya. Ia tercatat on-chain dengan commitment zero-knowledge.",
  "creds.emptyBody":
    "Begitu penerbit yang kamu ikuti memberi sertifikat, ia muncul di sini — siap dibagikan.",
  "disc.emptyBody": "Cari sertifikat di atas untuk melihat kepada siapa ia telah dibagikan.",

  // ---------------- landing page ----------------
  "lp.hero.title": "Buktikan kredensialmu asli — tanpa membuka isinya.",
  "lp.hero.subtitle":
    "Certify menerbitkan ijazah, sertifikat kompetensi, dan lisensi profesi ke buku besar bersama yang tak bisa dipalsukan. Pemilik menyimpan sendiri kredensialnya dan membuktikan satu fakta — ambang IPK, lisensi yang masih berlaku — sementara sisanya tetap privat.",
  "lp.hero.learn": "Lihat cara kerjanya",
  "lp.hero.hidden": "privat",
  "lp.hero.proof": "bukti valid · on-chain",

  "lp.problem.title": "Pemalsuan kredensial adalah masalah nyata yang mahal.",
  "lp.problem.lead":
    "Ijazah dan sertifikat membuka banyak pintu — kerja, beasiswa, jabatan publik, praktik profesi. Nilai itulah yang membuatnya jadi sasaran pemalsuan, dan pengecekan kertas atau PDF hari ini tak sanggup mengimbanginya.",
  "lp.problem.forgery.title": "Mudah dipalsukan",
  "lp.problem.forgery.body":
    "Dokumen kertas dan PDF gampang diedit, dicetak ulang, atau dibuat dari nol. Mata awam sulit membedakan asli dari palsu yang rapi.",
  "lp.problem.verify.title": "Verifikasi lambat & mahal",
  "lp.problem.verify.body":
    "Memastikan keaslian berarti menghubungi tiap penerbit satu per satu — menunggu berhari-hari, dan sering tak berjawab saat kantor tutup atau arsip hilang.",
  "lp.problem.privacy.title": "Terlalu banyak data terbuka",
  "lp.problem.privacy.body":
    "Untuk membuktikan satu hal kecil — 'IPK minimal 3,5', 'punya sertifikat K3' — orang menyerahkan seluruh transkrip, membuka data yang tak perlu diketahui siapa pun.",
  "lp.problem.central.title": "Bergantung pada satu pihak",
  "lp.problem.central.body":
    "Bila verifikasi bergantung pada satu server atau otoritas, satu gangguan atau satu catatan yang diubah bisa meruntuhkan kepercayaan semua orang.",
  "lp.problem.context":
    "Indonesia sudah menyadari ini: sistem nasional seperti SIVIL (verifikasi ijazah elektronik) dan PIN (Penomoran Ijazah Nasional) dibangun justru untuk melawan pemalsuan. Certify melengkapinya dengan verifikasi yang terdistribusi, seketika, dan hemat data pribadi.",

  "lp.solution.title": "Certify menjawab keempatnya.",
  "lp.solution.lead":
    "Tiga prinsip yang bekerja bersama — agar kredensial mustahil dipalsukan, seketika diperiksa, dan privat sejak awal.",
  "lp.principle.antifraud.title": "Mustahil dipalsukan",
  "lp.principle.antifraud.body":
    "Setiap kredensial disegel dan dicatat pada buku besar bersama yang tak bisa diubah diam-diam. Sekali terbit, tak seorang pun — bahkan penerbitnya — bisa mengubahnya tanpa ketahuan.",
  "lp.principle.instant.title": "Verifikasi instan & mandiri",
  "lp.principle.instant.body":
    "Siapa pun bisa memeriksa kredensial langsung, dalam hitungan detik, tanpa perlu menelepon institusi penerbit.",
  "lp.principle.privacy.title": "Privat sejak desain",
  "lp.principle.privacy.body":
    "Pemilik membuktikan sebuah fakta tanpa membuka data aslinya — bahwa IPK melewati ambang, tanpa menyebut angkanya.",
  "lp.solution.analogyLead": "Membuktikan tanpa memperlihatkan.",
  "lp.solution.analogy":
    "Seperti membuktikan kunci Anda cocok dengan gembok tertentu tanpa menyerahkan kuncinya — atau menunjukkan ke satpam bahwa Anda 17+ tanpa menyebut tanggal lahir.",

  "lp.how.title": "Tiga peran, satu alur sederhana.",
  "lp.how.lead":
    "Penerbit membuat, pemilik menyimpan, pemverifikasi memeriksa. Hanya 'sidik jari' kriptografis yang tercatat di buku besar — bukan dokumennya.",

  "lp.diff.title": "Apa yang membuat Certify berbeda",
  "lp.diff.ledger.title": "Buku besar bersama",
  "lp.diff.ledger.body":
    "Bukti keaslian tersebar dan permanen — sulit dipalsukan atau dihapus diam-diam, dan tak bergantung pada satu server.",
  "lp.diff.zk.title": "Bukti tanpa buka data",
  "lp.diff.zk.body":
    "Zero-knowledge proof memastikan sebuah ambang, kecocokan, atau masa berlaku tanpa membocorkan nilai mentah di baliknya.",
  "lp.diff.holder.title": "Pemilik yang memegang kendali",
  "lp.diff.holder.body":
    "Kredensial ada di dompet pemiliknya, bukan terkunci di database satu institusi.",
  "lp.diff.flexible.title": "Untuk banyak jenis kredensial",
  "lp.diff.flexible.body":
    "Bukan hanya ijazah dan IPK — sertifikat kompetensi (skor, level, keahlian) dan lisensi profesi (masa berlaku, otoritas) juga.",

  "lp.benefits.title": "Manfaat untuk tiap pihak",
  "lp.benefit.issuer.party": "Kampus & lembaga sertifikasi",
  "lp.benefit.issuer.gain":
    "Reputasi terlindungi dari pemalsuan; beban verifikasi manual turun drastis.",
  "lp.benefit.holder.party": "Pemilik (mahasiswa & pekerja)",
  "lp.benefit.holder.gain":
    "Melamar lebih cepat & aman — hanya membuka data seperlunya, tidak lebih.",
  "lp.benefit.verifier.party": "Perusahaan & panitia seleksi",
  "lp.benefit.verifier.gain":
    "Verifikasi instan dan tepercaya, tanpa repot menghubungi penerbit.",
  "lp.benefit.public.party": "Masyarakat & regulator",
  "lp.benefit.public.gain":
    "Ekosistem kredensial lebih jujur; profesi kritis lebih aman.",

  "lp.scenario.tag": "Contoh nyata",
  "lp.scenario.title":
    "Rina melamar ke Nusantara Tech — dan membuktikan dirinya memenuhi syarat tanpa membuka data berlebih.",
  "lp.scenario.p1":
    "Rina lulus dengan IPK 3,8. Nusantara Tech mensyaratkan minimal 3,5. Alih-alih mengirim scan ijazah dan transkrip lengkap — semua nilai, tanggal lahir, segalanya — ia cukup mengirim satu bukti: 'IPK ≥ 3,5'.",
  "lp.scenario.p2":
    "HRD memverifikasinya dalam hitungan detik. Mereka yakin ijazahnya asli (tercatat di buku besar bersama) dan Rina memenuhi syarat — tanpa pernah melihat IPK persisnya atau data pribadi lain. Ijazah palsu tak akan cocok dengan catatan penerbit.",
  "lp.scenario.result": "Terverifikasi dalam detik · IPK persis tak terlihat",

  "lp.faq.title": "Pertanyaan, terjawab",
  "lp.faq.lead":
    "Hal-hal penting soal cara kerja Certify, apa yang dilindungi, dan posisinya.",
  "lp.faq.q1": "Apakah Certify menggantikan SIVIL atau PIN?",
  "lp.faq.a1":
    "Tidak — ia melengkapi. SIVIL dan PIN adalah sistem nasional terpusat; Certify menambahkan verifikasi yang terdistribusi (tak bergantung satu server), seketika, dan menjaga privasi. Idenya integrasi, bukan penggantian.",
  "lp.faq.q2": "Apa itu zero-knowledge proof, secara sederhana?",
  "lp.faq.a2":
    "Cara membuktikan sebuah pernyataan benar tanpa membuka data di baliknya. Certify bisa membuktikan 'IPK ≥ 3,5', 'keahlian termasuk salah satu dari {A, B, C}', atau 'lisensi belum kedaluwarsa' — pemverifikasi hanya tahu valid atau tidak, tak pernah nilainya.",
  "lp.faq.q3": "Apakah hanya untuk ijazah kampus?",
  "lp.faq.a3":
    "Tidak. Certify menangani ijazah (ambang IPK), sertifikat kompetensi (skor, level, keahlian), dan lisensi profesi (otoritas penerbit, masa berlaku). Jenis baru ditambahkan sebagai schema — tanpa kriptografi baru.",
  "lp.faq.q4": "Bagaimana jika institusi penerbit tutup?",
  "lp.faq.a4":
    "Kredensial tetap valid. Bukti keaslian ada di buku besar bersama dan di dompet pemilik, jadi verifikasi tak bergantung pada penerbit yang masih online.",
  "lp.faq.q5": "Apakah data pribadi saya disimpan di blockchain?",
  "lp.faq.a5":
    "Tidak. Hanya commitment kriptografis — sidik jari digital — yang tercatat on-chain. Dokumen dan nilainya tetap off-chain, dan pemilik yang menentukan apa yang dibuka, jika ada.",
  "lp.faq.q6": "Apakah Certify sudah siap produksi?",
  "lp.faq.a6":
    "Ini prototipe kerja yang menunjukkan alur penuh dari ujung ke ujung: penerbitan, penyimpanan, dan verifikasi yang menjaga privasi. Untuk penggunaan nyata perlu enkripsi penuh data pemilik, tata kelola penerbit, dan integrasi dengan sistem yang ada.",

  "lp.close.title": "Verifikasi yang bisa dipercaya — privasi yang tetap terjaga.",
  "lp.close.body":
    "Certify menggeser verifikasi dari 'percaya pada selembar kertas' menjadi 'percaya pada bukti yang tak bisa dipalsukan.' Jelajahi dari salah satu dari tiga peran.",
  "lp.close.note":
    "Certify adalah proof-of-concept yang berjalan di blockchain lokal. Hubungkan wallet lokal yang berdana untuk menjelajahi ruang penerbit, pemilik, dan pemverifikasi.",

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
