'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import FileUploader, { ResumeEntry } from '@/components/FileUploader';
import ResumeFeedback from '@/components/ResumeFeedback';
import ResumeEditor from '@/components/ResumeEditor';
import SaveFinalResume from '@/components/SaveFinalResume';
import ResumeRewrite from '@/components/ResumeRewrite';
import JobDescriptionUploader from '@/components/JobDescriptionUploader';
import { motion, AnimatePresence } from 'framer-motion';

export default function DashboardPage() {
  const { user, isSignedIn } = useUser();

  const [resumeList, setResumeList] = useState<ResumeEntry[]>([]);
  const [activeResumeId, setActiveResumeId] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState<boolean>(false);
  const [showRewrite, setShowRewrite] = useState(false);

  const activeResume = resumeList.find(r => r.id === activeResumeId);

  useEffect(() => {
    if (user) {
      console.log('[🔐 USER INFO]', user?.id, isSignedIn);
    }
  }, [user, isSignedIn]);

  const handleParsed = async (resume: ResumeEntry) => {
    const res = await fetch('http://localhost:8000/api/get-feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user?.id || 'anonymous',
        resumeText: resume.originalText,
      }),
    });

    const data = await res.json();
    const extractedFeedback =
      typeof data.feedback === 'object' && data.feedback.content
        ? data.feedback.content
        : data.feedback;

    const resumeWithFeedback: ResumeEntry = {
      ...resume,
      feedback: extractedFeedback,
    };

    setResumeList(prev => [...prev, resumeWithFeedback]);
    setActiveResumeId(resumeWithFeedback.id);
    setShowEditor(false);
  };

  const handleRate = (rating: 'up' | 'down') => {
    setShowEditor(true);
    if (rating === 'down') setShowRewrite(true);
  };

  const handleEditUpdate = (editedText: string) => {
    if (!activeResume) return;
    const updated = resumeList.map(r =>
      r.id === activeResume.id ? { ...r, editedText } : r
    );
    setResumeList(updated);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen w-full p-6 bg-gradient-to-b from-[#0f0f1a] via-[#1a0f2a] to-[#0a0a1f] text-white"
    >
      <motion.h1
        className="text-4xl md:text-5xl font-extrabold text-center mb-12 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        📂 SkillBridge Resume Dashboard
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <FileUploader onParsed={handleParsed} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-12"
      >
        <JobDescriptionUploader />
      </motion.div>

      <AnimatePresence>
        {activeResume?.feedback && (
          <motion.div
            key="feedback"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4 }}
            className="mb-12 p-6 rounded-2xl bg-gray-900 border-2 border-transparent hover:border-[#33ffdd] shadow-lg hover:shadow-[#33ffdd]/50 transition"
          >
            <ResumeFeedback
              feedback={activeResume.feedback}
              resumeText={activeResume.originalText}
              onRate={handleRate}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEditor && activeResume && (
          <motion.div
            key="editor"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
            className="mb-12 p-6 rounded-2xl bg-gray-900 border-2 border-transparent hover:border-[#33ffdd] shadow-lg hover:shadow-[#33ffdd]/50 transition"
          >
            <ResumeEditor
              initialText={activeResume.editedText || activeResume.originalText}
              onUpdate={handleEditUpdate}
            />
            <SaveFinalResume
              resumeText={activeResume.editedText || activeResume.originalText}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRewrite && activeResume && (
          <motion.div
            key="rewrite"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
            className="mb-12 p-6 rounded-2xl bg-gray-900 border-2 border-transparent hover:border-[#33ffdd] shadow-lg hover:shadow-[#33ffdd]/50 transition"
          >
            <ResumeRewrite originalResume={activeResume.originalText} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
