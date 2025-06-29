'use client';

import { useUser } from '@clerk/nextjs';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SaveFinalResumeProps {
  resumeText: string;
}

export default function SaveFinalResume({ resumeText }: SaveFinalResumeProps) {
  const { user } = useUser();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);

    try {
      console.log('[💾 SAVE] Sending userId:', user?.id);

      const res = await fetch('/api/save-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.id,
          resumeText,
        }),
      });

      if (!res.ok) {
        const error = await res.text();
        console.error('Error saving resume:', error);
        throw new Error('Save failed');
      }

      const data = await res.json();
      console.log('[✅ SAVE RESPONSE]', data);
      setSaved(true);
    } catch (error) {
      console.error('Save failed:', error);
      alert('❌ Failed to save resume. See console for details.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      className="mt-10 text-center"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <button
        onClick={handleSave}
        disabled={saving}
        className={`px-5 py-2 rounded-lg text-white transition duration-300 ${
          saving
            ? 'bg-gray-400 cursor-wait'
            : saved
            ? 'bg-emerald-600 hover:bg-emerald-700'
            : 'bg-green-600 hover:bg-green-700'
        }`}
      >
        {saving ? '⏳ Saving...' : saved ? '✅ Resume Saved!' : '💾 Save Final Resume'}
      </button>

      <AnimatePresence>
        {saved && (
          <motion.p
            className="mt-3 text-green-600 text-sm"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.4 }}
          >
            Your resume was saved successfully!
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
