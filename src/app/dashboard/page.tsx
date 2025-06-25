'use client';

import { useState } from 'react';
import FileUploader from '@/components/FileUploader';
import ResumeFeedback from '@/components/ResumeFeedback';
import ResumeEditor from '@/components/ResumeEditor';
import SaveFinalResume from '@/components/SaveFinalResume';

export default function DashboardPage() {
  const [resumeText, setResumeText] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');
  const [showEditor, setShowEditor] = useState<boolean>(false);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Welcome to your Dashboard!</h1>

     <FileUploader
  onParsed={async (parsedText: string) => {
    setResumeText(parsedText);

    const res = await fetch('/api/get-feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resumeText: parsedText }), // fix here
    });

    const data = await res.json();
    setFeedback(data.feedback || data.text);
  }}
/>


      {feedback && (
        <ResumeFeedback
          feedback={feedback}
          resumeText={resumeText}
          onRate={() => setShowEditor(true)}
        />
      )}

      {showEditor && (
        <ResumeEditor
          initialText={resumeText}
          onUpdate={(updated) => setResumeText(updated)}
        />
      )}

      {showEditor && <SaveFinalResume resumeText={resumeText} />}
    </div>
  );
}
