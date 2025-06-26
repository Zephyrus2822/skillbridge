'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import {jsPDF} from 'jspdf';

interface ResumeRewriteProps {
  originalResume: string;
}

export default function ResumeRewrite({ originalResume }: ResumeRewriteProps) {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [rewrittenResume, setRewrittenResume] = useState<string>('');
  const [error, setError] = useState('');

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

      setRewrittenResume(data.rewritten?.content || '');
    } catch (err: any) {
      setError(err.message || 'Error rewriting resume');
    } finally {
      setLoading(false);
    }
  };

      const handleDownloadMarkdown = () => {
        if (!rewrittenResume) return;
        const blob = new Blob([rewrittenResume || ''], {type: 'text/markdown'});
          const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Resume.md';
        a.click();
        URL.revokeObjectURL(url);
      }

  const handleDownloadPdf = () => {
    if (!rewrittenResume) return;
    const doc = new jsPDF();
    const lines = doc.splitTextToSize(rewrittenResume, 180);
    doc.setFont('Courier', 'normal');
    doc.setFontSize(10);
    doc.text(lines, 10, 10);
    doc.save('Resume.pdf');
  };

  return (
    <div className="mt-8 bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">✨ AI Rewritten Resume</h2>

      {!rewrittenResume && !loading && (
        <button
          onClick={handleRewrite}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Rewrite Resume with AI Agent
        </button>
      )}

      {loading && <p>🤖 Rewriting with agent... Please wait.</p>}

      {error && <p className="text-red-600 mt-4">{error}</p>}

     {rewrittenResume && (
        <div className="mt-6">
          <pre className="whitespace-pre-wrap text-black bg-gray-100 p-4 rounded border overflow-x-auto">
            {rewrittenResume}
          </pre>

          <div className="mt-4 flex gap-4">
            <button
              onClick={handleDownloadMarkdown}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
            >
              📄 Download as .md
            </button>
            <button
              onClick={handleDownloadPdf}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
            >
              🧾 Download as PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
