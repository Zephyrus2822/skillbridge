'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import FileUploader from '@/components/FileUploader';
import ResumeFeedback from '@/components/ResumeFeedback';
import ResumeEditor from '@/components/ResumeEditor';
import SaveFinalResume from '@/components/SaveFinalResume';

export default function DashboardPage() {
  const { user, isSignedIn } = useUser();
  const [resumeText, setResumeText] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');
  const [showEditor, setShowEditor] = useState<boolean>(false);

  // if(isSignedIn) { console.log(user.id); }
  useEffect(() => {
  if (user) {
    console.log("[🔐 USER INFO]", user?.id, isSignedIn);
  }
}, [user]);


  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Welcome to your Dashboard!</h1>

     <FileUploader
  onParsed={async (parsedText: string) => {
    setResumeText(parsedText);

     const payload = {
      resumeText: parsedText,
      userId: user?.id || "anonymous"
    };

    // console.log("[📤 FRONTEND] Payload to /get-feedback:", payload); 
   
    
    const res = await fetch('http://localhost:8000/api/get-feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({

       userId: user?.id,  
      resumeText: parsedText,  
     
  }),
    });

    const data = await res.json();
    //  console.log("[📥 FRONTEND] Response from /get-feedback:", data); // 🔍 Response
    const extractedFeedback = typeof data.feedback === "object" && data.feedback.content
    ? data.feedback.content
    : data.feedback;

  // console.log("[🧪 Extracted Feedback]", extractedFeedback);

  setFeedback(extractedFeedback);
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
