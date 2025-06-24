import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
    matcher: [
        '/dashboard(.*)',
        '/resume-upload(.*)',
        '/recommendatios(.*)',
        '/sign-in(.*)',
        '/sign-up(.*)',
        '/api/(.*)'
    ],
};