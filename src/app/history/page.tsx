'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
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
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user?.id) return;

    const fetchHistory = async () => {
      try {
        const res = await fetch(`/api/get-history?userId=${user.id}`);
        const data = await res.json();
        setResumes(data || []);
      } catch (error) {
        console.error('Error fetching history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user?.id]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this resume?')) return;
    try {
      await fetch(`/api/delete-resume/${id}`, { method: 'DELETE' });
      setResumes(resumes.filter((r) => r._id !== id));
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const filteredResumes = resumes.filter((r) =>
    r.filename.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-[#0f0f1a] via-[#1a0f2a] to-[#0a0a1f] text-white animate-pulse">
        ⏳ Loading your resume history...
      </div>
    );
  }

  if (resumes.length === 0) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-[#0f0f1a] via-[#1a0f2a] to-[#0a0a1f] text-white">
        🚫 No resume uploads found.
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen w-full p-6 bg-gradient-to-b from-[#0f0f1a] via-[#1a0f2a] to-[#0a0a1f]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.h1
        className="text-4xl font-extrabold text-center mb-8 text-white bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        🗂️ Your Uploaded Resumes
      </motion.h1>

      {/* Search Bar */}
      <div className="flex justify-center mb-8">
        <input
          type="text"
          placeholder="🔍 Search resumes..."
          className="w-full max-w-md px-4 py-2 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#33ffdd]"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <AnimatePresence>
          {filteredResumes.map((item, index) => (
            <motion.div
              key={item._id}
              className="bg-gray-900 rounded-2xl p-6 border-2 border-transparent hover:border-[#33ffdd] shadow-lg hover:shadow-[#33ffdd]/40 transition flex flex-col justify-between"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div>
                <h4 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                  📎 {item.filename}
                </h4>
                <p className="text-gray-400 mb-4">
                  🕒 Uploaded: {new Date(item.uploadedAt).toLocaleString()}
                </p>
              </div>

              <div className="flex gap-3 mt-4">
                <a
                  href={`http://localhost:8000/api/download-resume/${item._id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center bg-[#33ffdd] hover:bg-[#33ffdd]/80 text-black font-semibold rounded-lg px-4 py-2 transition"
                >
                  ⬇️ View / Download
                </a>
                <button
                  onClick={() => handleDelete(item._id)}
                  className="flex-1 text-center bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg px-4 py-2 transition"
                >
                  🗑️ Delete
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
