'use client';

import { useUser } from '@clerk/nextjs';
import { useState } from 'react';

interface SaveFinalResumeProps {
  resumeText: string;
}

export default function SaveFinalResume({ resumeText }: SaveFinalResumeProps) {
  const { user } = useUser();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
  

    setSaving(true);
    try {
      const res = await fetch('/api/db-push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // userId: user.id,
          finalResume: resumeText,
        }),
      });

      if (!res.ok) throw new Error('Save failed');
      setSaved(true);
    } catch (err) {
      console.error('Error saving resume:', err);
      alert('Failed to save resume.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-6 text-center">
      <button
        onClick={handleSave}
        disabled={saving}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition"
      >
        {saving ? 'Saving...' : saved ? '✅ Saved!' : '💾 Save Final Resume'}
      </button>
    </div>
  );
}
