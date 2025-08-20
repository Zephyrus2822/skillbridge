"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { motion } from "framer-motion";

export default function Navbar() {
  const { user, isSignedIn } = useUser();

  return (
    <nav className="bg-gray-900 text-white px-8 py-4 flex justify-between items-center shadow-lg">
      {/* Logo */}
      <motion.div
        className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 cursor-pointer"
        whileHover={{ scale: 1.1 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <Link href="/">SkillBridge</Link>
      </motion.div>

      {/* Navigation Links */}
      <div className="flex items-center gap-6">
        <motion.div
          whileHover={{ scale: 1.1 }}
          className="cursor-pointer font-medium text-gray-300 hover:text-white transition-colors"
        >
          <Link href="/features">Features</Link>
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.1 }}
          className="cursor-pointer font-medium text-gray-300 hover:text-white transition-colors"
        >
          <Link href="/pricing">Pricing</Link>
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.1 }}
          className="cursor-pointer font-medium text-gray-300 hover:text-white transition-colors"
        >
          <Link href="/about">About</Link>
        </motion.div>

        {/* User Greeting and Button */}
        {isSignedIn && user ? (
          <>
            <span className="hidden sm:inline font-medium text-gray-200 mr-2">
              Welcome, {user.firstName}
            </span>
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  userButtonAvatarBox: "w-10 h-10 rounded-full",
                  userButtonPopoverCard: "bg-gray-800 text-white",
                  userButtonSignOutButton: "hover:bg-red-500 transition-colors",
                },
              }}
            />
          </>
        ) : (
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="px-4 py-2 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-black font-semibold rounded-lg cursor-pointer hover:brightness-110 transition"
          >
            <Link href="/sign-in">Sign In / Sign Up</Link>
          </motion.div>
        )}
      </div>
    </nav>
  );
}
