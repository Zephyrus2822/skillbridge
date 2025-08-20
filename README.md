# SkillBridge: AI-Powered Resume Enhancement & Publishing Platform

SkillBridge is a full-stack, AI-driven resume enhancement platform that empowers users to:

* Upload resumes in PDF format!
* Receive intelligent feedback via a Generative AI agent (Gemini)
* Paste and store job descriptions for tailoring
* Automatically rewrite resumes using RAG + RL pipeline
* Generate LaTeX and Markdown versions
* Compile LaTeX to PDF and preview it
* Push LaTeX and PDF files to separate GitHub repos via Jenkins CI

---

## 🌐 Tech Stack

### Frontend (Next.js + Tailwind CSS)

* React (with `use client` components)
* Clerk.js for authentication
* Framer Motion & Anime.js for animations
* PDF rendering with `@react-pdf/renderer`
* File handling with `react-dropzone`

### Backend (FastAPI)

* REST API built with FastAPI
* Google Gemini for AI feedback and rewriting
* Weaviate (Cloud) for vector storage (RAG)
* LaTeX compilation and role-based filename generation
* Secure Jenkins webhook trigger for GitHub pipeline automation

### Resume Processing Pipeline

1. **Upload Resume**: PDF uploaded and parsed → stored on disk
2. **Parse and Embed**: Parsed text is embedded and stored in Weaviate
3. **Feedback Generation**: AI agent returns resume feedback
4. **Job Description Storage**: User stores job description → added to RAG context
5. **Resume Rewrite**: RAG-powered Gemini agent rewrites resume for job context
6. **LaTeX/Markdown Generation**: Rewritten output stored as `.tex` & `.md`
7. **LaTeX Compilation**: `.tex` compiled to `.pdf` locally
8. **Jenkins Pipeline Trigger**:

   * Upload `.tex` → push to `resume-latex` GitHub repo
   * Upload `.pdf` → push to `resume-pdf` GitHub repo

---

## ⚙️ Jenkins CI/CD Setup

### Jenkins Pipeline

* Triggered via `/api/trigger-publish`
* Parameters passed: `user_id`, `role`, `mode`
* Clones correct GitHub repo (`latex` or `pdf`)
* Copies file from `Desktop/Resumes` into repo workspace
* Commits and pushes to `main` branch

### Jenkins Configuration

* GitHub credentials stored as `github-creds`
* Global Git config added in pipeline
* Safe directory explicitly set
* File names sanitized using custom utility

---

## 🧠 AI & Vector DB

* **Model**: Google Gemini Pro
* **Storage**: Weaviate Cloud

  * Resume → stored in `Resume` class
  * Job Description → stored in `JobDescription` class
* **RAG Workflow**: Queries nearest neighbors for job-resume tailoring
* **RL Signal**: User thumb ratings (`up`/`down`) stored for feedback tuning

---

## 📁 Directory Structure (Frontend)

```
src/
├── components/
│   ├── FileUploader.tsx
│   ├── ResumeEditor.tsx
│   ├── JobDescriptionUploader.tsx
│   └── ResumeRewrite.tsx
├── app/
│   ├── page.tsx (Landing)
│   ├── dashboard/page.tsx
│   ├── history/page.tsx
│   └── upload/page.tsx
```

---

## 🔐 Authentication

* Clerk.js integrated for user management
* User ID used to scope Weaviate data and job descriptions

---

## 🔧 Setup Instructions

### Frontend

```bash
cd skillbridge-frontend
npm install
npm run dev
```

### Backend

```bash
cd skillbridge-backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Jenkins

* Install Jenkins + Git plugin on Windows
* Configure job `resume-latex-pipeline`
* Connect GitHub with `github-creds`
* Set Jenkins URL and port (default 8081)

### Docker 
```
docker compose up --build (Recommended)

If you know what you are doing:
1. ( in root ) docker build -t skillbridge-frontend -f Dockerfile-frontend .
2. ( in src/resume_parser ) docker build -t skillbridge-backend -f Dockerfile-backend .

then open two terminals and separately run:
1. docker run skillbridge-frontend:latest
2. docker run --env ../../.env -p 8000:8000 skillbridge-backend:latest
```
---

## 📦 APIs

### `/api/upload-resume`

Uploads and parses PDF.

### `/api/store-job-description`

Stores job description in Weaviate.

### `/api/rewrite-resume`

Uses RAG + Gemini to rewrite the resume.

### `/api/compile-latex`

Compiles LaTeX to `.pdf` and stores it.

### `/api/trigger-publish`

Triggers Jenkins to push `.tex` or `.pdf` to GitHub.

### `/api/get-role/{user_id}`

Infers role based on job description.

### `/api/get-history`

Returns uploaded resume history for the user.

### `/api/download-resume/{resume_id}`

Downloads previously uploaded resume.

---

## 🧪 Coming Soon

* In-browser LaTeX compilation & preview
* Fine-tuning AI feedback based on user rating
* Resume version comparison and diff

---

## 👨‍💻 Author

**Rudranil Chowdhury**

* GitHub: [Zephyrus2822](https://github.com/Zephyrus2822)
* Project: SkillBridge

---

## 📜 License

MIT License
