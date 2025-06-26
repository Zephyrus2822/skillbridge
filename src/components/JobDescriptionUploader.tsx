'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';

export default function JobDescriptionUploader() {
  const { user } = useUser();
  const [jobText, setJobText] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleSubmit = async () => {
    setMessage('');
    setError('');

    if (!jobText.trim()) {
      setError('Please paste a job description first.');
      return;
    }

    try {
      const res = await fetch('http://localhost:8000/api/store-job-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id || 'anonymous',
          jobText,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to store job description');
      setMessage('✅ Job description stored successfully!');
      setJobText('');
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    }
  };

  return (
    <div className="bg-white p-6 mt-8 shadow rounded-lg">
      <h2 className="text-xl font-semibold mb-4">📄 Paste Job Description</h2>
      <textarea
        value={jobText}
        onChange={(e) => setJobText(e.target.value)}
        rows={8}
        placeholder="Paste the job description here..."
        className="w-full p-3 border border-gray-300 rounded resize-none"
      />
      <button
        onClick={handleSubmit}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Store Job Description
      </button>
      {message && <p className="text-green-600 mt-2">{message}</p>}
      {error && <p className="text-red-600 mt-2">{error}</p>}
    </div>
  );
}
