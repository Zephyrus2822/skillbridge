'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import FileUploader, { ResumeEntry } from '@/components/FileUploader';
import ResumeFeedback from '@/components/ResumeFeedback';
import ResumeEditor from '@/components/ResumeEditor';
import SaveFinalResume from '@/components/SaveFinalResume';
import ResumeRewrite from '@/components/ResumeRewrite';

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
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">📂 SkillBridge Dashboard</h1>

      <FileUploader onParsed={handleParsed} />

      {activeResume && activeResume.feedback && (
        <ResumeFeedback
          feedback={activeResume.feedback}
          resumeText={activeResume.originalText}
          onRate={handleRate}
        />
      )}

      {showEditor && activeResume && (
        <>
          <ResumeEditor
            initialText={activeResume.editedText || activeResume.originalText}
            onUpdate={handleEditUpdate}
          />
          <SaveFinalResume
            resumeText={activeResume.editedText || activeResume.originalText}
          />
        </>
      )}

      {showRewrite && activeResume && (
        <ResumeRewrite originalResume={activeResume.originalText} />
      )}
    </div>
  );
}
