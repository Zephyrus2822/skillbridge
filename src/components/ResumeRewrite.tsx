'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { ResumePDF } from './ResumePDF';

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

  // 🔁 Rewrite the resume using AI
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

  // 💾 Compile and save LaTeX
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

  // 🚀 Trigger Jenkins pipeline
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

  // ⬇️ Download markdown
  const handleDownloadMarkdown = () => {
    const blob = new Blob([markdownResume], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Resume.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  // 👤 Fetch role/job description for file naming
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
    <div className="mt-8 bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">✨ AI Rewritten Resume</h2>

      {!markdownResume && !loading && (
        <button
          onClick={handleRewrite}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Rewrite Resume with AI Agent
        </button>
      )}

      {loading && <p>🤖 Rewriting with agent... Please wait.</p>}
      {error && <p className="text-red-600 mt-4">{error}</p>}

      {markdownResume && (
        <div className="mt-6">
          <h3 className="text-lg font-bold mb-2">📝 Rewritten Markdown Resume</h3>
          <pre className="whitespace-pre-wrap text-black bg-gray-100 p-4 rounded border overflow-x-auto">
            {markdownResume}
          </pre>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Paste your job description for targeted publishing:
            </label>
            <textarea
              className="w-full border rounded p-2 text-black"
              rows={4}
              value={jobText}
              onChange={(e) => setJobText(e.target.value)}
              placeholder="Paste job description here..."
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-4">
            <button
              onClick={handleDownloadMarkdown}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
            >
              📄 Download as .md
            </button>

            <PDFDownloadLink
              document={<ResumePDF content={markdownResume} />}
              fileName="Resume.pdf"
            >
              {({ loading }) =>
                loading ? (
                  <button className="px-4 py-2 bg-purple-400 text-white rounded">
                    ⏳ Generating PDF...
                  </button>
                ) : (
                  <button className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition">
                    🧾 Download as PDF
                  </button>
                )
              }
            </PDFDownloadLink>

            <button
              onClick={handlePublish}
              className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition"
            >
              🚀 Push LaTeX to GitHub via Jenkins
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
