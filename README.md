# 🛡️ Aegis-Lock: Interactive Demo Portal
**Built for the Frostbyte Hackathon**

[![Powered by aegis-lock](https://img.shields.io/badge/Powered%20by-aegis--lock-blue.svg)](https://www.npmjs.com/package/aegis-lock)

This repository contains the interactive frontend portal demonstrating **[aegis-lock](https://www.npmjs.com/package/aegis-lock)**, a zero-dependency, database-agnostic client-side encryption package. 

Instead of just telling you our encryption works, we built this playground so you can see the cryptography happen in real-time before the data ever touches the database.

## 🧠 Architecture Flow: Zero-Trust E2EE

This application utilizes **100% client-side encryption**. 

The `aegis-lock` npm package is imported directly into our React components. All cryptographic operations execute locally in the browser using the native Web Crypto API (`crypto.subtle`). Plaintext and encryption keys **never leave the client**. Only mathematically random `iv:ciphertext` composites are sent over the wire to the database.

```text
Browser (React)
  ├── aegis-lock (Web Crypto API)
  │     ├── generateKey / exportKey / importKey
  │     ├── encrypt (AES-256-GCM) → iv:ciphertext
  │     └── decrypt (AES-256-GCM) → plaintext
  │
  └── Supabase SDK
        └── stores/retrieves iv:ciphertext only
```

## ✨ Live Demo Features & Navigation
We built a comprehensive suite of tools to visualize the cryptographic pipeline:

* **`/` (Landing):** Secure portal entry point.
* **`/dashboard`:** High-level overview of encrypted records, key status, and quick-create actions.
* **`/records` & `/records/:id`:** Full CRUD interface. View the side-by-side reality of what the user sees (decrypted plaintext) versus what the database actually stores (raw ciphertext).
* **`/aegis-proof` (The Proof):** A three-column live comparison showing the exact moment plaintext transforms into a database-ready ciphertext, proving the database server is completely blind to the real data.
* **`/playground`:** A standalone, DB-free sandbox. Generate master keys, type a message, and step through the AES-256-GCM encryption/decryption pipeline visually.
* **`/code-showcase`:** Developer experience (DX) center. Features copy-pasteable snippets for Supabase/MongoDB integration, showing how easily developers can implement Contextual Binding and Blind Indexing.

## 🛠️ Tech Stack
This portal marries high-level UX with low-level cryptography:

* **Core Cryptography:** `aegis-lock` (Custom built for this hackathon!)
* **Frontend Framework:** React 18 + TypeScript + Vite
* **Routing:** React Router v6
* **UI & Styling:** Tailwind CSS, Radix UI, shadcn/ui, Framer Motion
* **Database & BaaS:** Supabase (Postgres) via the `SupabaseAdapter`

## 💻 Running the Demo Locally

**1. Clone the repository**
```bash
git clone https://github.com/HarshhGupta05/aegis
cd aegis-lock-demo
```
**2. Install dependencies**
```bash
npm install
```
**3. Set up Environment Variables**
Create a `.env.local` file and add your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**4. Run the development server**
```bash
npm run dev
```

## 🤝 The Frostbyte Team

This project was a massive collaborative effort bringing together low-level cryptography and modern frontend engineering:

* **[Hritesh](https://github.com/hritesh-saha):** Architect and developer of the `aegis-lock` core npm package, handling the mathematical implementations of AES-GCM, Contextual Binding, and Blind Indexing.
* **[Cherry](https://github.com/cxgx4):** Frontend Engineering & UI/UX — Designed the portal, wired up the Supabase integrations, and built the visual components to prove the client-side encryption flow in real-time.
* **[Trisha](https://github.com/trishab004):** Frontend Engineering & UI/UX — Collaborated on the interactive dashboard, state management, and the Aegis Proof visualization.
* **[Harshh](https://github.com/HarshhGupta05):** Frontend Engineering & UI/UX — Handled the seamless integration of the Web Crypto API into the React components and perfected the UI animations.

---
*Built with ❤️ and extreme paranoia for the Frostbyte Hackathon.*
