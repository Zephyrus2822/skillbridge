'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { Button } from '@/components/ui/button'; // optional: your custom button
import { ArrowRight } from 'lucide-react';

export default function LandingPage() {
  const { isSignedIn } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white px-6 py-12">
      <header className="flex justify-between items-center max-w-7xl mx-auto mb-20">
        <h1 className="text-3xl font-bold text-indigo-700">SkillBridge</h1>
        <div className="space-x-4">
          <Link href="/dashboard">
            <Button variant="outline">Dashboard</Button>
          </Link>
          {!isSignedIn && (
            <>
              <Link href="/sign-in">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/sign-up">
                <Button>Sign Up</Button>
              </Link>
            </>
          )}
        </div>
      </header>

      <main className="text-center max-w-3xl mx-auto">
        <h2 className="text-5xl font-extrabold mb-6 text-gray-900 leading-tight">
          AI-Powered Career Coaching, <br />
          Tailored to You.
        </h2>
        <p className="text-lg text-gray-600 mb-8">
          SkillBridge helps you optimize your resume, suggest projects, and prep for interviews — all powered by agentic AI.
        </p>

        <Link href={isSignedIn ? '/dashboard' : '/sign-up'}>
          <Button className="text-lg px-6 py-4">
            {isSignedIn ? 'Go to Dashboard' : 'Get Started for Free'}
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </Link>
      </main>

      <footer className="mt-24 text-center text-sm text-gray-400">
        Built with ❤️ by Rudranil | © 2025 SkillBridge
      </footer>
    </div>
  );
}
