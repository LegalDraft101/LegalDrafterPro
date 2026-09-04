# Legal DrafterPro

A modern, full-stack legal drafting application designed for generating legal documents, affidavits, and rent agreements with real-time OCR extraction, dynamic form rendering, and authentication.

---

## 📌 What It's For

**Legal DrafterPro** simplifies and automates the creation of legal documents for individuals, advocates, and businesses:

- 📄 **Legal Document Generation**: Instantly generate customized, formatted `.docx` and PDF documents for name difference affidavits, gap certificates, rent agreements, and fee remission forms.
- 🔍 **OCR & Document Extraction**: Upload image scans, PDFs, or Word documents to extract plain text using Tesseract.js, pdf-parse, and Mammoth.
- 🔐 **Authentication & User Management**: User signup, profile management, and authentication powered by Firebase Auth and Supabase PostgreSQL database.
- ⚡ **Modular Backend API**: Clean, scalable Express & TypeScript REST API structured around health, auth, user queries, OCR, and document modules.

---

## 🚀 How to Run Locally

### Prerequisites

Ensure you have installed:
- [Node.js](https://nodejs.org/) (v18+)
- `npm` (v9+)
- [Supabase CLI](https://supabase.com/docs/guides/cli) *(Optional, for local database management)*

---

### 1. Running the Backend

Navigate to the `backend/` directory, set up your environment file, and start the development server:

```bash
# Navigate to backend
cd backend

# Copy environment template
cp .env.example .env

# Install dependencies
npm install

# Start development server (runs on http://localhost:4000)
npm run dev
```

---

### 2. Running the Frontend

Navigate to the `frontend/` directory and start the Vite React development server:

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start frontend dev server (runs on http://localhost:5173)
npm run dev
```

---

### 3. Supabase Setup (Local / Cloud)

#### Option A: Local Supabase CLI
```bash
# Navigate to supabase
cd supabase

# Start local Supabase containers (Studio runs on http://localhost:54323)
supabase start
```

#### Option B: Remote Supabase Cloud
Apply the schema migration to your Supabase project via SQL Editor or CLI:
- Run `supabase/migrations/initial_schema.sql` on your Supabase SQL editor.
- Update `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` inside `backend/.env`.

---

## 📁 Project Folder Structure

```
LegalDrafterPro/
│
├── frontend/                     # React + Vite Frontend Application
│   ├── public/                   # Public static assets & favicon
│   ├── src/
│   │   ├── api/                  # Axios API client & endpoints
│   │   ├── components/           # UI components (Header, Footer, DynamicForm, etc.)
│   │   ├── pages/                # Page routes (Home, Affidavit, RentAgreement, Auth)
│   │   ├── store/                # Redux state management
│   │   ├── styles/               # Global SCSS & styling rules
│   │   ├── App.jsx               # Main React Application
│   │   └── main.tsx              # Frontend Entry Point
│   ├── package.json              # Frontend dependencies
│   ├── tsconfig.json             # TypeScript configuration
│   └── vite.config.js            # Vite configuration & dev proxy
│
├── backend/                      # Node.js + Express + TypeScript API Server
│   ├── src/
│   │   ├── config/               # App configs (env.ts, cors.ts, supabase.ts, firebase.ts)
│   │   ├── lib/                  # Application logger & custom errors
│   │   ├── middleware/           # Auth guard, rate limiting & error handlers
│   │   ├── modules/              # Domain modules
│   │   │   ├── auth/             # Authentication controller & routes
│   │   │   ├── users/            # User query functions & type definitions
│   │   │   ├── ocr/              # File upload & text extraction controller
│   │   │   ├── health/           # System & Database health endpoints (/health, /health/db)
│   │   │   └── documents/        # Legal document generators
│   │   │       ├── document.service.ts
│   │   │       ├── drafts/       # Draft forms & generation subfolders
│   │   │       ├── affidavits/   # Affidavit format subfolders
│   │   │       └── agreements/   # Agreement format subfolders
│   │   ├── utils/                # Helper functions (crypto, JWT, validators)
│   │   ├── app.ts                # Express application setup
│   │   └── server.ts             # Bootstrap entry point
│   ├── .env.example              # Environment variables template
│   ├── package.json              # Backend dependencies
│   └── tsconfig.json             # TypeScript configuration
│
├── supabase/                     # Database Schema & Migrations
│   ├── config.toml               # Supabase CLI configuration
│   ├── seed.sql                  # Initial database seed data
│   └── migrations/
│       └── initial_schema.sql    # PostgreSQL database schema
│
├── .gitignore                    # Root Git ignore rules
└── README.md                     # Project documentation
```

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Redux Toolkit, Fluent UI / SCSS
- **Backend**: Node.js, Express, TypeScript, Supabase JS, Firebase Admin SDK
- **Document Processing**: `docx`, `pdf-parse`, `mammoth`, `tesseract.js`
- **Database**: Supabase PostgreSQL
