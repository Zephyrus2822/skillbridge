'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface ResumeEditorProps {
  initialText: string;
  onUpdate: (updatedText: string) => void;
}

export default function ResumeEditor({
  initialText,
  onUpdate,
}: ResumeEditorProps) {
  const [text, setText] = useState(initialText);

  useEffect(() => {
    onUpdate(text);
  }, [text, onUpdate]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mt-10 bg-white shadow-lg rounded-xl p-6"
    >
      <h2 className="text-xl font-bold mb-4 text-gray-800">📝 Improve Your Resume</h2>

      <textarea
        className="w-full h-96 p-4 border border-gray-300 rounded-xl font-mono text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Edit your resume here..."
      />

      <p className="mt-3 text-sm text-gray-500">
        ✨ Make adjustments and improve the resume before saving or regenerating.
      </p>
    </motion.div>
  );
}
