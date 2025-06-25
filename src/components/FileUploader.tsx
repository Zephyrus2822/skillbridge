'use client';

import { useDropzone } from 'react-dropzone';
import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface FileUploaderProps {
  onParsed: (resume: ResumeEntry) => void;
}

export interface ResumeEntry {
  id: string;
  originalText: string;
  feedback: string;
  editedText?: string;
  rating?: 'up' | 'down';
  aiVersion?: boolean;
  createdAt?: string;
}

export default function FileUploader({ onParsed }: FileUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];

    if (!file || file.type !== 'application/pdf') {
      setError('Please upload a valid PDF file.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      setSuccess(false);
      setError(null);

      const res = await fetch('/api/upload-resume', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to upload: ${errorText}`);
      }

      const result = await res.json();
      console.log('[📦 Upload Response]', result);

      const resumeEntry: ResumeEntry = {
        id: uuidv4(),
        originalText: result.summary,
        feedback: result.feedback || result.summary,
        aiVersion: false,
        createdAt: new Date().toISOString(),
      };

      onParsed(resumeEntry);
      setSuccess(true);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Something went wrong while uploading the resume.');
    } finally {
      setUploading(false);
    }
  }, [onParsed]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: {
      'application/pdf': ['.pdf'],
    },
  });

  return (
    <div className="p-6 border-2 border-dashed rounded-lg text-center">
      <div {...getRootProps()} className="cursor-pointer p-10 bg-gray-50">
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the resume here...</p>
        ) : (
          <p>Drag and drop your resume PDF here, or click to select a file.</p>
        )}
      </div>

      {uploading && <p className="mt-4 text-indigo-600">Uploading and parsing resume...</p>}
      {error && <p className="mt-4 text-red-600">❌ {error}</p>}
      {success && <p className="mt-4 text-green-600">✅ Resume parsed successfully!</p>}
    </div>
  );
}
