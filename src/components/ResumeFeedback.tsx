'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { motion } from 'framer-motion';

type FeedbackType = string | { content: string };

interface ResumeFeedbackProps {
  feedback: FeedbackType;
  resumeText: string;
  onRate: (rating: 'up' | 'down') => void;
}

export default function ResumeFeedback({
  feedback,
  resumeText,
  onRate,
}: ResumeFeedbackProps) {
  const { user } = useUser();
  const [generatedFeedback, setGeneratedFeedback] = useState<string>(
    typeof feedback === 'string' ? feedback : feedback?.content || 'No feedback available.'
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [rated, setRated] = useState<boolean>(false);

  const rate = async (thumb: 'up' | 'down') => {
    try {
      const rating = thumb === 'up' ? 'positive' : 'negative';

      await fetch('http://localhost:8000/api/store-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id || 'anonymous',
          resumeText,
          feedback: generatedFeedback,
          rating,
        }),
      });

      setRated(true);
      onRate(thumb);
    } catch (err) {
      console.error('Rating failed:', err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mt-10 bg-white p-6 rounded-xl shadow-md"
    >
      <h2 className="text-xl font-semibold text-gray-800 mb-4">🤖 AI Feedback</h2>

      {loading ? (
        <p className="text-gray-500">Generating smart feedback...</p>
      ) : (
        <p className="text-gray-700 whitespace-pre-line leading-relaxed">
          {generatedFeedback}
        </p>
      )}

      {!rated ? (
        <div className="flex gap-6 mt-6 items-center">
          <button
            onClick={() => rate('up')}
            className="text-gray-500 hover:text-green-600 transition"
            title="Helpful"
          >
            <ThumbsUp size={24} />
          </button>
          <button
            onClick={() => rate('down')}
            className="text-gray-500 hover:text-red-600 transition"
            title="Needs Improvement"
          >
            <ThumbsDown size={24} />
          </button>
        </div>
      ) : (
        <p className="text-green-600 mt-4 font-medium">
          ✅ Thanks for your feedback!
        </p>
      )}
    </motion.div>
  );
}
