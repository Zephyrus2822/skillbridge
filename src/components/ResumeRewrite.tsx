'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { ResumePDF } from './ResumePDF';
import { motion } from 'framer-motion';

interface ResumeRewriteProps {
  originalResume: string;
}

export default function ResumeRewrite({ originalResume }: ResumeRewriteProps) {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [jobText, setJobText] = useState('');
  const [markdownResume, setMarkdownResume] = useState('');
  const [latexResume, setLatexResume] = useState('');
  const [userRole, setUserRole] = useState('resume');

  const handleRewrite = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:8000/api/rewrite-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id || 'anonymous',
          resumeText: originalResume,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Rewrite failed');

      setMarkdownResume(data.markdown || '');
      setLatexResume(data.latex || '');
    } catch (err: any) {
      console.error('❌ Rewrite failed:', err);
      setError(err.message || 'Failed to rewrite resume.');
    } finally {
      setLoading(false);
    }
  };

  const compileLatexAndSave = async () => {
    if (!latexResume) {
      alert('⚠️ LaTeX content missing. Please rewrite resume first.');
      return;
    }

    try {
      const res = await fetch('http://localhost:8000/api/compile-latex', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id || 'anonymous',
          texContent: latexResume,
          role: userRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to save LaTeX');

      console.log(`[✅ COMPILED LaTeX] Saved at: ${data.file_path}`);
    } catch (err) {
      console.error('❌ Error saving LaTeX:', err);
      setError('Failed to compile and save LaTeX.');
    }
  };

  const handlePublish = async () => {
    if (!jobText || !latexResume) {
      alert('⚠️ Please enter job description and rewrite resume first.');
      return;
    }

    try {
      await fetch('http://localhost:8000/api/store-job-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id || 'anonymous',
          jobText,
        }),
      });

      await compileLatexAndSave();

      const res = await fetch('http://localhost:8000/api/trigger-publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id || 'anonymous',
          job_text: jobText,
          mode: 'latex',
          texContent: latexResume,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert('✅ Resume pushed to GitHub via Jenkins!');
      } else {
        throw new Error(data.error || 'Pipeline trigger failed');
      }
    } catch (err) {
      console.error('❌ Publish error:', err);
      alert('❌ Error publishing to GitHub via Jenkins.');
    }
  };

  const handleDownloadMarkdown = () => {
    const blob = new Blob([markdownResume], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Resume.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const fetchRole = async () => {
      if (!user?.id) return;
      try {
        const res = await fetch(`http://localhost:8000/api/get-role/${user.id}`);
        const data = await res.json();
        setUserRole(data.role || 'resume');
        if (data.job_text) setJobText(data.job_text);
      } catch (err) {
        console.error('❌ Failed to fetch user role:', err);
        setUserRole('resume');
      }
    };
    fetchRole();
  }, [user?.id]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mt-10 bg-white p-8 rounded-xl shadow-md"
    >
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        ✨ AI-Rewritten Resume
      </h2>

      {!markdownResume && !loading && (
        <button
          onClick={handleRewrite}
          className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          🚀 Rewrite Resume with AI Agent
        </button>
      )}

      {loading && <p className="text-gray-500 mt-4">🤖 Rewriting in progress...</p>}
      {error && <p className="text-red-600 mt-4">❌ {error}</p>}

      {markdownResume && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-6"
        >
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            📝 Rewritten Markdown
          </h3>

          <pre className="whitespace-pre-wrap bg-gray-100 p-4 rounded-lg border text-sm text-gray-800 overflow-x-auto">
            {markdownResume}
          </pre>

          <div className="mt-6">
            <label className="text-sm font-medium text-gray-600 mb-1 block">
              Paste job description for targeted improvements:
            </label>
            <textarea
              className="w-full border border-gray-300 rounded-lg p-3 text-sm"
              rows={4}
              value={jobText}
              onChange={(e) => setJobText(e.target.value)}
              placeholder="Paste job description here..."
            />
          </div>

          <div className="mt-6 flex flex-wrap gap-4">
            <button
              onClick={handleDownloadMarkdown}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              📄 Download as .md
            </button>

            <PDFDownloadLink
              document={<ResumePDF content={markdownResume} />}
              fileName="Resume.pdf"
            >
              {({ loading }) =>
                loading ? (
                  <button className="px-4 py-2 bg-purple-400 text-white rounded-lg">
                    ⏳ Generating PDF...
                  </button>
                ) : (
                  <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
                    🧾 Download as PDF
                  </button>
                )
              }
            </PDFDownloadLink>

            <button
              onClick={handlePublish}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
            >
              🔧 Push LaTeX to GitHub via Jenkins
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
