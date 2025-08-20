'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { ResumePDF } from './ResumePDF';
import { motion } from 'framer-motion';

interface ResumeRewriteProps {
  originalResume: string;
}

interface RewriteResponse {
  text?: string;
  error?: string;
}

interface PublishResponse {
  success?: boolean;
  error?: string;
  message: string;
  file_path: string;
}

interface RoleResponse {
  role?: string;
  job_text?: string;
}

export default function ResumeRewrite({ originalResume }: ResumeRewriteProps) {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [jobText, setJobText] = useState('');
  const [textResume, setTextResume] = useState('');
  const [latexResume, setLatexResume] = useState('');
  const [userRole, setUserRole] = useState('resume'); // eslint-disable-next-line @typescript-eslint/no-unused-vars

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

      const data: RewriteResponse = await res.json();
      if (!res.ok) throw new Error(data.error || 'Rewrite failed');

      setTextResume(data.text || '');
      setLatexResume(data.text || ''); // same text used for LaTeX internally
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError('Failed to rewrite resume.');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!latexResume) {
      alert('⚠️ No LaTeX content available. Please rewrite the resume first.');
      return;
    }

    try {
      const payload = {
        userId: user?.id || 'anonymous',
        job_text: jobText || "No job description provided",
        mode: 'latex',
        texContent: latexResume,
      };

      const res = await fetch('http://localhost:8000/api/trigger-publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data: PublishResponse = await res.json();

      if (data.success) {
        alert('✅ Jenkins pipeline triggered successfully!');
        console.log('[✅ Jenkins]', data.message, 'File saved at:', data.file_path);
      } else {
        throw new Error(data.error || 'Pipeline trigger failed');
      }
    } catch (err: unknown) {
      if (err instanceof Error) alert(`❌ Error triggering Jenkins: ${err.message}`);
      else alert('❌ Unknown error triggering Jenkins.');
    }
  };

  const handleDownloadText = () => {
    const blob = new Blob([textResume], { type: 'text/plain' });
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
        const data: RoleResponse = await res.json();
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

      {!textResume && !loading && (
        <button
          onClick={handleRewrite}
          className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          🚀 Rewrite Resume with AI Agent
        </button>
      )}

      {loading && <p className="text-gray-500 mt-4">🤖 Rewriting in progress...</p>}
      {error && <p className="text-red-600 mt-4">❌ {error}</p>}

      {textResume && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-6"
        >
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            📝 Rewritten Resume (Text)
          </h3>

          <div className="prose prose-slate max-w-none bg-gray-50 p-4 rounded-lg border">
            {textResume}
          </div>

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
              onClick={handleDownloadText}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              📄 Download as .md
            </button>

            <PDFDownloadLink
              document={<ResumePDF content={textResume} />}
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
