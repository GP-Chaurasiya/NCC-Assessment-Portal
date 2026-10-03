# 🇮🇳 NCC Examination & Question Bank Portal

A comprehensive, state-of-the-art web application engineered for the **National Cadet Corps (NCC)** to conduct secure online examinations, manage an exhaustive multi-format question bank, and intelligently parse and ingest existing exam papers.

---

## 🎖️ Core Features

- **Tri-Service Design System**: Styled with authentic NCC colors (Army Red `#B71C1C`, Navy Blue `#133E87`, and Air Force Sky Blue `#4A90E2`) with dark/light mode support.
- **Role-Based Authentication**:
  - **Admin / ANO**: Manage exams, create questions, stage/approve uploaded papers, evaluate subjective answers, and view cadet performance analytics.
  - **Cadet / Student**: Access active examinations, attempt timed tests, and view detailed scorecards.
- **Multiple Question Types**:
  - Multiple Choice Questions (Single & Multiple Select)
  - True / False
  - Fill in the Blanks
  - Match the Following (Interactive drag/pairing)
  - Subjective / Essay Type (with word counter & manual ANO evaluation)
- **Anti-Cheating & Exam Security**:
  - Live proctoring alerts on tab-switching/window focus change.
  - Auto-submission on timer expiration.
  - Randomized question sequencing support.
- **Intelligent Paper Ingestion**:
  - Upload question papers in PDF, DOCX, or Plain Text format.
  - Automated question parsing with a mandatory **"Needs Review"** review queue before banking.

---

## 🛠️ Technology Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, Server Actions & Route Handlers)
- **Language**: TypeScript
- **Styling**: Tailwind CSS & Lucide Icons
- **Database**: SQLite with [Prisma ORM](https://www.prisma.io/)
- **Auth**: Stateless JWT (`jose`) with HTTP-Only Cookies & `bcryptjs` password hashing

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18.17.0 or higher recommended)
- `npm` or `yarn`

### 2. Installation
```bash
git clone https://github.com/GP-Chaurasiya/NCC-Assessment-Portal.git
cd NCC-Assessment-Portal
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 4. Database Setup & Seeding
```bash
# Generate Prisma Client
npm run prisma:generate

# Push schema to SQLite database
npm run prisma:push

# Seed with NCC sample exams, cadets, and question bank
npm run prisma:seed
```

### 5. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Default Credentials

| Role | Username / Identifier | Password | Dashboard URL |
| :--- | :--- | :--- | :--- |
| **Admin (ANO)** | `admin` *(or `admin@example.com`)* | `admin123` | `/admin` |
| **Cadet / Student** | `cadet_aarav` *(or `student@example.com`)* | `student123` | `/student` |

---

## 📜 License
Created for National Cadet Corps evaluation & training management.
