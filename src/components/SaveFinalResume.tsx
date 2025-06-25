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
    alert('Failed to save resume. Check console.');
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
