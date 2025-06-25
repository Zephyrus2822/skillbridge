// ✅ FIX: Use `authMiddleware` instead of `clerkMiddleware`
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    '/dashboard(.*)',
    '/resume-upload(.*)',
    '/recommendations(.*)', // typo fix too
    // '/sign-in(.*)',
    // '/sign-up(.*)',
    '/api/(.*)',
  ],
};