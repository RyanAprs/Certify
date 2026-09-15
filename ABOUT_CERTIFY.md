# About Certify — Trusted, Privacy-Preserving Credential Verification

*Explanatory document (non-technical) — background, problem, solution, and how it works.*

---

## Quick Summary

**Certify** is a system for issuing and verifying academic and competency credentials
(diplomas, competency certificates, professional licenses) that **cannot be forged** and
**protects the privacy of their owners**. Institutions issue credentials digitally,
owners keep them themselves, and any party (companies, universities, selection
committees) can verify them within seconds — **without having to call the
university** and **without forcing the owner to reveal all of their personal data**.

---

## 1. Background

Diplomas and certificates are important "tickets" in life: applying for jobs, registering
for scholarships, taking part in public office selections, and even starting a professional
practice. Because their value is high, these documents also become **targets of massive
forgery**.

Several phenomena that have repeatedly drawn attention from the media and the government:

- **Widespread buying, selling, and forgery of diplomas.** Practices such as "fake
  diplomas," ghostwriting, and services that print counterfeit diplomas are easy to find,
  and are even openly offered online. Such cases often surface ahead of recruitment seasons
  and general elections (e.g. discoveries of fake diplomas among candidates for public
  office/legislative positions).
- **A difficult and slow verification process.** Company HR departments often have to
  contact universities one by one to confirm the authenticity of applicants' diplomas —
  a manual process that is slow, inconsistent, and easily "fooled" by neatly forged
  documents.
- **The government has already recognized this problem.** The Ministry of Education,
  Culture, Research, and Technology has built systems such as **SIVIL** (Electronic Diploma
  Verification System) and **PIN** (National Diploma Numbering) to check the authenticity of
  diplomas. This is concrete proof that the problem is acknowledged nationally — however, its
  coverage, dependence on a single central authority, and privacy aspects still leave room
  for improvement.
- **Competency and training certificates are also vulnerable.** Not only diplomas;
  skill certificates (for example in construction, occupational health and safety, IT, or
  professional licenses) can also be forged, even though the stakes involve safety and the
  quality of work.

> 📌 *Note: a list of specific news links to support the points above can be found in the
> [References](#references) section at the end of this document — please complete it with
> relevant, up-to-date sources.*

---

## 2. The Problems That Occur

From the background above, there are four core problems:

1. **Easy to forge.** Diplomas/certificates in the form of paper or PDF are easy to edit,
   reprint, or create from scratch. The untrained eye finds it hard to tell genuine from
   fake.
2. **Verification is expensive and slow.** Confirming authenticity requires manual contact
   with the issuer, takes days, and is not always available (universities are closed,
   archives are lost, the issuer no longer operates).
3. **Too much personal data is exposed.** To prove one small thing (for example, "GPA of at
   least 3.5" or "holds an occupational health and safety certificate"), people often have to
   hand over their **entire** transcript/diploma — exposing data that other parties do not
   actually need to know.
4. **Dependence on a single party.** If verification relies solely on a single
   server/authority, there are risks: the server goes down, data is altered, or access is
   restricted.

---

## 3. Impact / Losses

- **Companies and institutions** wrongly recruit people with fake qualifications →
  cost losses, legal risk, and a decline in service quality.
- **Owners of genuine diplomas** are harmed because their credentials are "equated" with
  fake ones, and their privacy is exposed when applying.
- **The wider public** bears the risk when critical professions (healthcare,
  construction, finance) are filled by holders of bogus certificates.
- **Public trust** in degrees and certificates declines overall.

---

## 4. Solution: Certify

Certify addresses those four problems with three principles:

1. **Forgery-proof.** Every credential is digitally "sealed" and recorded on a
   **shared ledger (blockchain)** that cannot be quietly altered. Once
   issued, no one — including the issuer — can forge or change it without being detected.
2. **Instant and self-service verification.** Anyone can check the authenticity of a
   credential directly, within seconds, without having to contact the university.
3. **Privacy-preserving (selective disclosure).** The owner can **prove a fact
   without revealing the underlying data**. For example: proving "my GPA is ≥ 3.5" without
   disclosing the exact number — similar to showing a security guard that you are "already
   17+" without stating your date of birth.

Certify **complements** rather than replaces efforts such as SIVIL/PIN: the idea is
verification that is **distributed** (not dependent on a single server), **instantaneous**, and
**sparing with personal data**.

---

## 5. How It Works (without technical jargon)

There are three roles, with a simple flow:

**① Issuer** — for example a university or certification body.
Issues a credential for a person. What is recorded on the shared ledger
is only a **"digital fingerprint"** (proof of authenticity) — not the entire contents of
the document. So personal data is not exposed to the public.

**② Holder** — for example a student/worker.
Keeps their credential themselves in a digital wallet. They **decide** when and
to whom to share it, as well as **which part** to reveal.

**③ Verifier** — for example a company or selection committee.
Requests proof of a specific thing ("is the GPA ≥ 3.5?", "is the skill one of
{A, B, C}?", "has the license not yet expired?"). The system
checks the proof against the shared ledger and answers **valid / invalid** —
**without** the verifier ever seeing the actual figures or data.

The core analogy: **"proving without showing."** Like demonstrating that
your key fits a particular lock, without having to hand over the key.

---

## 6. What Makes Certify Different

- **Shared ledger (blockchain):** authenticity records are distributed and permanent — hard
  to forge or quietly delete, and not dependent on a single server.
- **Proof without revealing data (zero-knowledge proof):** proving a fact (a score threshold,
  possession of a skill, validity period) **without** disclosing the raw data.
- **The owner holds control:** the credential is in the owner's hands, not
  locked inside a single institution.
- **Flexible for many types of credentials:** not only diplomas/GPAs, but also
  competency certificates (score/level/skill) and professional licenses (validity period).

---

## 7. Benefits for Each Party

| Party | Benefit |
|---|---|
| **University / Certification body** | Reputation protected from forgery; the burden of manual verification services is drastically reduced. |
| **Owner (student/worker)** | Apply faster and more safely; reveal only the data that is necessary. |
| **Company / Selection committee** | Instant, trustworthy verification, without the hassle of contacting the issuer. |
| **Society and regulators** | A more honest credential ecosystem; critical professions are safer. |

---

## 8. Usage Scenario (example)

> **Rina** graduated with a GPA of 3.8. She applies for a job at the company **Nusantara Tech**,
> which requires a minimum GPA of 3.5.
>
> Instead of sending a scan of her full diploma and transcript (which contains all her grades,
> date of birth, and other data), Rina only needs to send **proof** that "GPA ≥ 3.5".
> Nusantara Tech's HR verifies it within seconds: **valid**. They are confident that
> the diploma is genuine (recorded on the shared ledger) and know that Rina meets the requirement —
> **without** ever seeing her exact GPA figure or any other personal data.
>
> If another applicant uses a fake diploma, their proof **will not match**
> the issuer's records, so they are immediately caught.

---

## 9. Limitations & Plans Ahead

Certify is currently a **working prototype (proof of concept)** to prove the
concept end to end — from issuance and storage to privacy-preserving verification.
For real-world use, the next steps include:

- **Adoption by official issuers** (universities/institutions) and integration with existing
  systems such as SIVIL/PIN.
- **Full encryption** of owner data so that it can only be read by the owner.
- **Governance and legal aspects** (who is entitled to become an issuer, handling credential
  revocation, compliance with data protection regulations).
- **Ease of use** for lay users (without needing to understand the technology behind it).

---

## 10. Closing

Forgery of diplomas and certificates is a real problem that harms many parties and
erodes public trust. Certify offers an approach that is **forgery-proof**,
**quick to verify**, and **respectful of privacy** — shifting verification from
"trusting a sheet of paper" to "trusting proof that cannot be forged".

---

## References

> Complete this with relevant, up-to-date news links/sources. Some types of sources
> that support this document:

1. National media coverage of **buying/selling and forgery of diplomas** —
   *[title, media outlet, year, link]*
2. Coverage of **discoveries of fake diplomas in public office selection / recruitment** —
   *[title, media outlet, year, link]*
3. **Ministry of Education, Culture, Research, and Technology — SIVIL (Electronic Diploma Verification System)** —
   *https://ijazah.kemdikbud.go.id* (national verification of diploma authenticity)
4. **Ministry of Education, Culture, Research, and Technology — PIN (National Diploma Numbering)** — a diploma numbering
   policy to prevent forgery *[official link]*
5. Data/reports on **losses caused by fake credentials** in recruitment —
   *[source, year, link]*

*(The placeholder-marked links above need to be filled in/verified with actual sources
before publication.)*
