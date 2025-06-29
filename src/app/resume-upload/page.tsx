'use client';

import { motion } from 'framer-motion';

export default function ResumeUploadPage() {
  return (
    <motion.div
      className="max-w-2xl mx-auto px-6 py-12"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        📤 Upload Your Resume
      </h1>

      <p className="text-gray-600 mb-6">
        Let our AI analyze and enhance your resume to maximize your job opportunities.
      </p>

      {/* This is where the upload component will be mounted */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
        <p className="text-center text-gray-400">
          ⬇️ Drag & drop your resume here or select a PDF file to begin.
        </p>
        {/* You can render <FileUploader /> component here */}
      </div>
    </motion.div>
  );
}
