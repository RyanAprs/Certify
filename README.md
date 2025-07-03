# 🎓 Certify

**Certify** adalah sistem verifikasi **sertifikat digital akademik** berbasis **blockchain** yang mengintegrasikan **Zero-Knowledge Proofs (ZKP)**, **Internet Computer Protocol (ICP)**, dan **IPFS** untuk menjamin **keaslian, privasi**, dan **keamanan** data akademik.

---

## 🚀 Fitur Utama

- 🔐 **Blockchain Security** – Data sertifikat disimpan di canister ICP yang immutable  
- 🕵️‍♂️ **Zero-Knowledge Proofs** – Verifikasi data tanpa mengungkapkan seluruh informasi  
- 🗂️ **IPFS Storage** – Sertifikat dalam bentuk file disimpan secara terdesentralisasi  
- 🔑 **Internet Identity** – Autentikasi tanpa password berbasis identitas digital  
- 👥 **Multi-Role System** – 3 peran utama: **Issuer**, **Holder**, dan **Verifier**  

---

## 🏗️ Arsitektur Sistem

```
┌─────────────────┐    ┌────────────────────┐    ┌─────────────────┐
│     Frontend    │    │   ICP Canister     │    │      IPFS       │
│   (React + TS)  │◄──►│   (Motoko Smart    │◄──►│   (Pinata Web3)  │
└─────────────────┘    │    Contract)       │    └─────────────────┘
         │             └────────────────────┘             ▲
         ▼                                                │
 ┌────────────────────┐                                   │
 │ Zero-Knowledge     │◄──────────────────────────────────┘
 │ Proof Engine       │
 │   (SnarkJS)        │
 └────────────────────┘
```

---

## 🛠️ Teknologi

| Komponen      | Teknologi              |
|---------------|------------------------|
| Frontend      | React, TypeScript, Vite, Tailwind CSS |
| Backend       | Motoko (ICP Canister)  |
| Blockchain    | Internet Computer Protocol (ICP) |
| Storage       | IPFS via Pinata Web3   |
| Autentikasi   | Internet Identity      |
| Verifikasi    | Zero-Knowledge Proofs (SnarkJS) |

---

## 📋 Prasyarat

- [Node.js](https://nodejs.org) v16+
- [DFX SDK](https://internetcomputer.org/docs/current/developer-docs/setup/install/)
- Akun [Pinata Web3](https://www.pinata.cloud/) untuk penyimpanan IPFS

---

## 🚀 Instalasi & Setup

1. **Clone repository dan jalankan setup**:
   ```bash
   git clone <repository-url>
   cd blockchain-certificate-system
   chmod +x scripts/setup.sh
   ./scripts/setup.sh
   ```

2. **Konfigurasi environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env dan tambahkan API Key dari akun Pinata
   ```

3. **Jalankan development server**:
   ```bash
   npm run dev
   ```

---

## 🎯 Cara Penggunaan

### 🔑 Login
- Klik **"Login with Internet Identity"**
- Pilih role: **Issuer**, **Holder**, atau **Verifier**

### 📜 Issuer
- **Create Certificate**: Buat sertifikat untuk holder yang telah disetujui  
- **Manage Members**: Terima atau tolak permintaan bergabung  
- **View Certificates**: Tampilkan daftar sertifikat yang telah diterbitkan

### 🙋‍♂️ Holder
- **Join Issuer**: Ajukan permintaan menjadi member dari issuer  
- **View Certificates**: Lihat koleksi sertifikat yang dimiliki  
- **Share Certificate**: Bagikan sertifikat dengan *selective disclosure*

### 🔍 Verifier
- **Search Certificate**: Cari sertifikat berdasarkan ID  
- **Select Fields**: Pilih field yang ingin diverifikasi  
- **Verify**: Verifikasi keaslian data menggunakan ZKP

---

## 🔐 Zero-Knowledge Proofs

Certify menggunakan ZKP untuk:

- ✅ **Privacy**: Verifikasi tanpa membuka seluruh data
- 🔍 **Selective Disclosure**: Holder memilih data yang ditampilkan
- 🧠 **Proof of Authenticity**: Sertifikat dapat dibuktikan asli tanpa mengekspos isinya

---

## 📁 Struktur Proyek

```
├── src/
│   ├── backend/               # Motoko canister (ICP)
│   │   └── main.mo
│   └── frontend/              # Frontend React
│       ├── components/
│       ├── services/
│       ├── types/
│       └── declarations/      # Canister declarations
├── scripts/
│   └── setup.sh               # Setup script
├── dfx.json                   # Konfigurasi DFX
├── package.json
└── README.md
```

---

## ⚙️ Perintah Penting

```bash
# Jalankan pengembangan
npm run dev

# Build untuk produksi
npm run build

# Blockchain (ICP)
dfx start            # Jalankan replica lokal
dfx deploy           # Deploy canister ke lokal/mainnet
dfx stop             # Hentikan replica

# Setup awal
./scripts/setup.sh
```

---

## 🌐 Deployment

### 🔧 Local Development
```bash
dfx start --background
dfx deploy
npm run dev
```

### 🚀 Deploy ke ICP Mainnet
```bash
dfx deploy --network ic
```

---

## 🔒 Fitur Keamanan

- 📜 **Immutable Records** – Sertifikat disimpan di blockchain
- 🔍 **Cryptographic Proofs** – Verifikasi menggunakan ZKP
- 📂 **Decentralized Storage** – File sertifikat tersimpan di IPFS
- 🧑‍💻 **Identity Verification** – Internet Identity untuk login aman

---

To get started, you might want to explore the project directory structure and the default configuration file. Working with this project in your development environment will not affect any production deployment or identity tokens.

To learn more before you start working with `Certify`, see the following documentation available online:

- [Quick Start](https://internetcomputer.org/docs/current/developer-docs/setup/deploy-locally)
- [SDK Developer Tools](https://internetcomputer.org/docs/current/developer-docs/setup/install)
- [Motoko Programming Language Guide](https://internetcomputer.org/docs/current/motoko/main/motoko)
- [Motoko Language Quick Reference](https://internetcomputer.org/docs/current/motoko/main/language-manual)

If you want to start working on your project right away, you might want to try the following commands:

```bash
cd Certify/
dfx help
dfx canister --help
```

## Running the project locally

If you want to test your project locally, you can use the following commands:

```bash
# Starts the replica, running in the background
dfx start --background

# Deploys your canisters to the replica and generates your candid interface
dfx deploy
```

Once the job completes, your application will be available at `http://localhost:4943?canisterId={asset_canister_id}`.

If you have made changes to your backend canister, you can generate a new candid interface with

```bash
npm run generate
```

at any time. This is recommended before starting the frontend development server, and will be run automatically any time you run `dfx deploy`.

If you are making frontend changes, you can start a development server with

```bash
npm start
```

Which will start a server at `http://localhost:8080`, proxying API requests to the replica at port 4943.

### Note on frontend environment variables

If you are hosting frontend code somewhere without using DFX, you may need to make one of the following adjustments to ensure your project does not fetch the root key in production:

- set`DFX_NETWORK` to `ic` if you are using Webpack
- use your own preferred method to replace `process.env.DFX_NETWORK` in the autogenerated declarations
  - Setting `canisters -> {asset_canister_id} -> declarations -> env_override to a string` in `dfx.json` will replace `process.env.DFX_NETWORK` with the string in the autogenerated declarations
- Write your own `createActor` constructor
