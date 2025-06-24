'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

interface ResumeEntry {
  _id: string;
  filename: string;
  parsedText: string;
  uploadedAt: string;
}

export default function HistoryPage() {
  const { user } = useUser();
  const router = useRouter();
  const [resumes, setResumes] = useState<ResumeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const fetchHistory = async () => {
      try {
        const res = await fetch(`/api/get-history?userId=${user.id}`);
        const data = await res.json();
        setResumes(data);
      } catch (error) {
        console.error('Error fetching history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user?.id]);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading history...</div>;
  }

  if (resumes.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        No resume uploads found.
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">📄 Your Uploaded Resumes</h1>
      <div className="grid grid-cols-1 gap-4">
        {resumes.map((item: ResumeEntry) => (
          <div key={item._id} className="border rounded-lg p-4 mb-4 shadow">
            <h4 className="text-md font-semibold">{item.filename}</h4>
            <p className="text-sm text-gray-500">
              Uploaded: {new Date(item.uploadedAt).toLocaleString()}
            </p>

            <div className="mt-2 flex gap-4">
              <a
                href={`http://localhost:8000/api/download-resume/${item._id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                View / Download
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
