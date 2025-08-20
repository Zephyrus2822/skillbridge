import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0f0f1a] via-[#1a0f2a] to-[#0a0a1f]">
      {/* Glassmorphic card */}
      <div className="w-full max-w-md p-8 bg-white/5 backdrop-blur-md rounded-3xl shadow-xl border border-[#33ffdd]/30">
        {/* Gradient neon heading */}
        <h1 className="text-3xl font-extrabold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
          Join SkillBridge
        </h1>

        {/* SignUp component */}
        <div className="space-y-4">
          <SignUp redirectUrl="/dashboard" />
        </div>
      </div>
    </div>
  );
}
