'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface ResumeEntry {
  _id: string;
  filename: string;
  parsedText: string;
  uploadedAt: string;
}

export default function HistoryPage() {
  const { user } = useUser();
  const [resumes, setResumes] = useState<ResumeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const fetchHistory = async () => {
      try {
        const res = await fetch(`/api/get-history?userId=${user.id}`);
        const data = await res.json();
        console.log('[📄 History Data]', data);
        setResumes(data || []);
      } catch (error) {
        console.error('Error fetching history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="p-10 text-center text-gray-500 animate-pulse">
        ⏳ Loading your resume history...
      </div>
    );
  }

  if (resumes.length === 0) {
    return (
      <div className="p-10 text-center text-gray-500">
        🚫 No resume uploads found.
      </div>
    );
  }

  return (
    <motion.div
      className="p-6 max-w-5xl mx-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.h1
        className="text-3xl font-bold text-center mb-8 text-gray-800"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        🗂️ Your Uploaded Resumes
      </motion.h1>

      <div className="grid md:grid-cols-2 gap-6">
        <AnimatePresence>
          {resumes.map((item: ResumeEntry, index: number) => (
            <motion.div
              key={item._id}
              className="bg-white rounded-2xl shadow-md p-6 border hover:shadow-xl transition"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <h4 className="text-lg font-semibold text-gray-800 mb-1">
                📎 {item.filename}
              </h4>
              <p className="text-sm text-gray-500 mb-3">
                🕒 Uploaded: {new Date(item.uploadedAt).toLocaleString()}
              </p>
              <a
                href={`http://localhost:8000/api/download-resume/${item._id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-white bg-blue-600 hover:bg-blue-700 transition px-4 py-2 rounded-lg text-sm font-medium"
              >
                ⬇️ View / Download
              </a>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
