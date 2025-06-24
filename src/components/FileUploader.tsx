'use client';

import { useDropzone } from 'react-dropzone';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export default function FileUploader() {
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];

    if (!file || file.type !== 'application/pdf') {
      alert("Please upload a valid PDF file.");
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      setSuccess(false);

      const res = await fetch('/api/upload-resume', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to upload: ${errorText}`);
      }

      await res.json();
      setSuccess(true);
    } catch (err) {
      console.error('Upload error:', err);
      alert('Something went wrong while uploading the resume.');
    } finally {
      setUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
  });

  return (
    <div className="p-6 border-2 border-dashed rounded-lg text-center">
      <div {...getRootProps()} className="cursor-pointer p-10 bg-gray-50">
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the resume here...</p>
        ) : (
          <p>Drag and drop your resume PDF here, or click to select.</p>
        )}
      </div>

      {uploading && <p className="mt-4 text-indigo-600">Uploading and parsing resume...</p>}

      {success && (
        <div className="mt-6 text-center">
          <p className="text-green-600 font-semibold mb-4">✅ Resume parsed successfully!</p>
          <button
            onClick={() => router.push('/history')}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
          >
            View History
          </button>
        </div>
      )}
    </div>
  );
}
