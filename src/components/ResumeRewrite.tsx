'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';

interface ResumeRewriteProps {
  originalResume: string;
}

export default function ResumeRewrite({ originalResume }: ResumeRewriteProps) {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [rewrittenResume, setRewrittenResume] = useState('');
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

      setRewrittenResume(data.rewritten.content || '');
    } catch (err: any) {
      setError(err.message || 'Error rewriting resume');
    } finally {
      setLoading(false);
    }
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
          <pre className="whitespace-pre-wrap bg-gray-100 p-4 rounded border overflow-x-auto">
            {rewrittenResume}
          </pre>
        </div>
      )}
    </div>
  );
}
