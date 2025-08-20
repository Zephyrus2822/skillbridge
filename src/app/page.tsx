'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

const features = [
  {
    title: 'AI Resume Optimization',
    description: 'Receive AI-driven insights on your resumes with context-aware suggestions. Our RAG + RL pipeline learns from user feedback to refine future iterations.',
    image: '/feat3.webp', // replace with your uploaded images
  },
  {
    title: 'Tailored Resume Rewriting',
    description: 'Automatically reshape your resume for specific job descriptions. Incorporates saved edits, thumbs-down feedback, and vector-based context for precision tailoring."',
    image: '/feat2.webp',
  },
  {
    title: 'Seamless GitHub Integration',
    description: 'Practice with AI-generated mock interview questionsPush LaTeX sources or finalized PDFs to GitHub with a single click. Fully CI/CD ready for professional workflows and automated version control..',
    image: '/feat1.webp',
  },
  {
    title: 'Job Matching',
    description: 'Paste job descriptions to inform resume rewrites. Our system matches your profile with role requirements using vector embeddings and semantic search.',
    image: '/feat4.webp',
  },
];

export default function LandingPage() {
  const [activeFeature, setActiveFeature] = useState(0);

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#0f0f1a] via-[#1a0f2a] to-[#0a0a1f] text-white overflow-hidden">
      {/* Hero Section */}
      <header className="max-w-7xl mx-auto px-6 py-8 flex justify-between items-center">
        <h1 className="text-4xl font-extrabold text-white">SkillBridge</h1>
        <div className="flex gap-4">
          <Button className="bg-[#ff00ff] hover:bg-[#ff33ff] text-white">Sign Up</Button>
          <Button variant="outline" className="border-[#33ffdd] text-[#33ffdd] hover:bg-[#33ffdd]/20">Dashboard</Button>
        </div>
      </header>

      <main className="flex flex-col items-center justify-center text-center max-w-5xl mx-auto px-6 mt-20">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-5xl md:text-6xl font-extrabold leading-tight mb-6"
        >
          AI-Powered Career Coaching <br /> Tailored to You
        </motion.h2>
        <p className="text-lg text-gray-300 mb-12">
          Polish your resume, match with the right jobs, and get AI-powered guidance to land your dream role.
        </p>
        <div className="flex gap-6 justify-center">
          <Button className="bg-[#33ffdd] h-15 w-55 text-black font-bold text-xl px-6 py-3 hover:bg-violet-500 transition">Get Started</Button>
          
        </div>
      </main>

  

{/* Features Section */}
<section className="mt-32 w-full relative z-10">
  <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start gap-20 px-6">
    {/* Left: Image */}
    <div className="w-full md:w-1/2 flex justify-center">
      <motion.div
        key={activeFeature}
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-full h-96 md:h-[28rem]"
      >
        <Image
          src={features[activeFeature].image}
          alt={features[activeFeature].title}
          fill
          className="object-contain mt-30"
        />
      </motion.div>
    </div>

    {/* Right: Features List */}
    <div className="w-full md:w-1/2 flex flex-col gap-6 relative">
      {features.map((feature, idx) => (
        <div
          key={idx}
          className={`flex items-start gap-4 cursor-pointer p-4 rounded-xl transition-all duration-300
            ${activeFeature === idx ? 'border-2 border-[#33ffdd] shadow-[0_0_20px_#33ffdd]' : 'border border-transparent'}`}
          onClick={() => setActiveFeature(idx)}
        >
          {/* Neon Number Ball */}
          <motion.div
            animate={{
              scale: activeFeature === idx ? 1.3 : 1,
              backgroundColor: activeFeature === idx ? '#33ffdd' : '#ff33ff',
            }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="w-10 h-10 rounded-full flex items-center justify-center text-black font-bold flex-shrink-0 mt-1"
          >
            {idx + 1}
          </motion.div>

          <div>
            <h3 className="text-2xl font-bold">{feature.title}</h3>
            <p className="text-gray-300 mt-1">{feature.description}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
</section>


      <footer className="mt-32 text-center text-sm text-gray-500 pb-12">
        Built with ❤️ by Rudranil | © 2025 SkillBridge
      </footer>
    </div>
  );
}
