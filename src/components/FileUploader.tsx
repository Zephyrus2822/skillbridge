'use client';

import { useDropzone } from 'react-dropzone';
import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'framer-motion';

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="max-w-2xl mx-auto mt-8"
    >
      <div
        {...getRootProps()}
        className="transition-all duration-300 ease-in-out p-10 border-2 border-dashed border-gray-300 rounded-2xl bg-white hover:bg-gray-50 cursor-pointer shadow-sm text-center"
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <motion.p
            key="active"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring' }}
            className="text-indigo-600 font-medium"
          >
            Drop the resume here...
          </motion.p>
        ) : (
          <motion.p
            key="idle"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 120 }}
            className="text-gray-700"
          >
            Drag and drop your resume <strong>PDF</strong> here,<br /> or click to select a file.
          </motion.p>
        )}
      </div>

      <AnimatePresence mode="wait">
        {uploading && (
          <motion.p
            key="uploading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-4 text-indigo-600 text-center"
          >
            ⏳ Uploading and parsing resume...
          </motion.p>
        )}

        {error && (
          <motion.p
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-4 text-red-600 text-center"
          >
            ❌ {error}
          </motion.p>
        )}

        {success && (
          <motion.p
            key="success"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-4 text-green-600 text-center"
          >
            ✅ Resume parsed successfully!
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
