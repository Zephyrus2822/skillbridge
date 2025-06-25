'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

interface ResumeFeedbackProps {
  feedback: string;
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
  typeof feedback === 'string' ? feedback : (feedback as any)?.content || ''
);
  const [loading, setLoading] = useState<boolean>(false);
  const [rated, setRated] = useState<boolean>(false);

//   const fetchFeedback = async () => {
//     setLoading(true);
//     try {
//       const res = await fetch('http://localhost:8000/api/get-feedback', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ userId: user?.id, resumeText }),
//       });

//       const data = await res.json();
//       setGeneratedFeedback(
//   typeof data.feedback === 'string' ? data.feedback : data.feedback?.content || 'No feedback available.'
// );
  //   } catch (err) {
  //     console.error('Failed to fetch feedback:', err);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

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
    onRate(thumb); // trigger editor
  } catch (err) {
    console.error('Rating failed:', err);
  }
};

  // useEffect(() => {
  //   if (resumeText) {
  //     fetchFeedback();
  //   }
    
  // }, [resumeText]);

  return (
    <div className="mt-6 bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-2">🤖 AI Feedback</h2>
      {loading ? (
        <p>Generating smart feedback...</p>
      ) : (
        <p className="whitespace-pre-line">{generatedFeedback}</p>
      )}

      {!rated && (
        <div className="flex gap-4 mt-4">
          <button
            onClick={() => rate('up')}
            className="hover:text-green-600 transition"
          >
            <ThumbsUp />
          </button>
          <button
            onClick={() => rate('down')}
            className="hover:text-red-600 transition"
          >
            <ThumbsDown />
          </button>
        </div>
      )}

      {rated && (
        <p className="text-green-600 mt-2">✅ Thanks for your feedback!</p>
      )}
    </div>
  );
}
