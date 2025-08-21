'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';



const sections = [
  { id: 'overview', title: 'Overview' },
  { id: 'tech-stack', title: 'Tech Stack' },
  { id: 'pipeline', title: 'Resume Pipeline' },
  { id: 'jenkins', title: 'Jenkins CI/CD' },
  { id: 'ai-vector', title: 'AI & Vector DB' },
  { id: 'directory', title: 'Directory Structure' },
  { id: 'auth', title: 'Authentication' },
  { id: 'setup', title: 'Setup Instructions' },
  { id: 'apis', title: 'APIs' },
  { id: 'coming-soon', title: 'Coming Soon' },
  { id: 'author', title: 'Author' },
  { id: 'license', title: 'License' },
];


export default function DocumentationClient() {
  const [activeSection, setActiveSection] = useState('overview');

  return (
    <div className="flex min-h-screen text-white bg-[#0a0a1f]">
      {/* Sidebar */}
      <aside className="w-64 hidden md:flex flex-col bg-[#11111f] border-r border-[#333]/30 sticky top-0 h-screen p-6">
        <h1 className="text-2xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
          SkillBridge Docs
        </h1>
        <nav className="flex flex-col gap-3">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`text-left px-3 py-2 rounded-lg w-full transition 
                ${activeSection === section.id ? 'bg-[#33ffdd]/20 text-[#33ffdd]' : 'hover:bg-[#33ffdd]/10 text-gray-300'}`}
            >
              {section.title}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 max-w-5xl mx-auto space-y-12">
        <motion.section
          key="overview"
          id="overview"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className={activeSection === 'overview' ? '' : 'hidden'}
        >
          <h2 className="text-3xl font-bold mb-4">Overview</h2>
          <p className="text-gray-300 leading-relaxed">
            SkillBridge is a full-stack, AI-driven resume enhancement platform empowering users to upload resumes, receive intelligent feedback, store job descriptions, and automatically rewrite resumes using a RAG + RL pipeline. Users can generate LaTeX and Markdown versions, compile PDFs, and push files to GitHub via Jenkins CI.
          </p>
        </motion.section>

        <motion.section
          key="tech-stack"
          id="tech-stack"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className={activeSection === 'tech-stack' ? '' : 'hidden'}
        >
          <h2 className="text-3xl font-bold mb-4">🌐 Tech Stack</h2>
          <h3 className="text-xl font-semibold mt-4">Frontend (Next.js + Tailwind CSS)</h3>
          <ul className="list-disc ml-6 mt-2 text-gray-300 space-y-1">
            <li>React (with `use client` components)</li>
            <li>Clerk.js for authentication</li>
            <li>Framer Motion & Anime.js for animations</li>
            <li>PDF rendering with `@react-pdf/renderer`</li>
            <li>File handling with `react-dropzone`</li>
          </ul>
          <h3 className="text-xl font-semibold mt-4">Backend (FastAPI)</h3>
          <ul className="list-disc ml-6 mt-2 text-gray-300 space-y-1">
            <li>REST API built with FastAPI</li>
            <li>Google Gemini for AI feedback and rewriting</li>
            <li>Weaviate Cloud for vector storage (RAG)</li>
            <li>LaTeX compilation and role-based filename generation</li>
            <li>Secure Jenkins webhook trigger for GitHub pipeline automation</li>
          </ul>
        </motion.section>

        <motion.section
          key="pipeline"
          id="pipeline"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className={activeSection === 'pipeline' ? '' : 'hidden'}
        >
          <h2 className="text-3xl font-bold mb-4">Resume Processing Pipeline</h2>
          <ol className="list-decimal ml-6 space-y-2 text-gray-300">
            <li>Upload Resume → PDF uploaded, parsed, stored on disk</li>
            <li>Parse and Embed → Text embedded & stored in Weaviate</li>
            <li>Feedback Generation → AI agent returns resume feedback</li>
            <li>Job Description Storage → Added to RAG context</li>
            <li>Resume Rewrite → RAG-powered Gemini agent rewrites resume</li>
            <li>LaTeX/Markdown Generation → Stored as `.tex` & `.md`</li>
            <li>LaTeX Compilation → `.tex` compiled to `.pdf`</li>
            <li>Jenkins Pipeline Trigger → Pushes `.tex` & `.pdf` to GitHub</li>
          </ol>
        </motion.section>

        <motion.section
          key="jenkins"
          id="jenkins"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className={activeSection === 'jenkins' ? '' : 'hidden'}
        >
          <h2 className="text-3xl font-bold mb-4">⚙️ Jenkins CI/CD Setup</h2>
          <h3 className="text-xl font-semibold mt-2">Pipeline</h3>
          <p className="text-gray-300 ml-6">
            Triggered via `/api/trigger-publish`, clones GitHub repo, copies files, commits, and pushes to `main`.
          </p>
          <h3 className="text-xl font-semibold mt-2">Configuration</h3>
          <ul className="list-disc ml-6 text-gray-300 space-y-1">
            <li>GitHub credentials stored as `github-creds`</li>
            <li>Global Git config added in pipeline</li>
            <li>Safe directory explicitly set</li>
            <li>File names sanitized using custom utility</li>
          </ul>
        </motion.section>

        <motion.section
          key="ai-vector"
          id="ai-vector"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className={activeSection === 'ai-vector' ? '' : 'hidden'}
        >
          <h2 className="text-3xl font-bold mb-4">🧠 AI & Vector DB</h2>
          <p className="text-gray-300 ml-6">
            Model: Google Gemini Pro <br/>
            Storage: Weaviate Cloud (Resume → `Resume` class, JobDescription → `JobDescription` class)
          </p>
          <p className="text-gray-300 ml-6 mt-2">
            RAG workflow queries nearest neighbors for tailored resumes. RL signals stored from user thumbs-up/down feedback.
          </p>
        </motion.section>

        {/* Additional sections (directory, auth, setup, apis, coming soon, author, license) can follow the same structure */}
      </main>
    </div>
  );
}
