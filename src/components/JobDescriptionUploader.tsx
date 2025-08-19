'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';

interface ApiResponse {
  error?: string;
  message?: string;
}

export default function JobDescriptionUploader() {
  const { user } = useUser();
  const [jobText, setJobText] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async () => {
    setMessage('');
    setError('');

    if (!jobText.trim()) {
      setError('⚠️ Please paste a job description first.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('http://localhost:8000/api/store-job-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id || 'anonymous',
          jobText,
        }),
      });

      const data: ApiResponse = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to store job description');

      setMessage('✅ Job description stored successfully!');
      setJobText('');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Something went wrong.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white p-6 mt-10 rounded-xl shadow-xl max-w-2xl mx-auto"
    >
      <h2 className="text-2xl font-bold mb-4 text-gray-800">📄 Paste Job Description</h2>

      <textarea
        value={jobText}
        onChange={(e) => setJobText(e.target.value)}
        rows={8}
        placeholder="Paste the job description here..."
        className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
      />

      <motion.button
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.03 }}
        onClick={handleSubmit}
        disabled={loading}
        className={`mt-4 px-5 py-2 rounded-lg font-medium transition duration-300 ${
          loading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
        }`}
      >
        {loading ? 'Storing...' : 'Store Job Description'}
      </motion.button>

      <AnimatePresence>
        {message && (
          <motion.p
            key="success"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-3 text-green-600"
          >
            {message}
          </motion.p>
        )}
        {error && (
          <motion.p
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-3 text-red-600"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
