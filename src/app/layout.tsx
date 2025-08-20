import { ClerkProvider } from "@clerk/nextjs";
import Navbar from "@/components/Navbar";
import "./globals.css"
import Head from "next/head";

export const metadata = {
  title: "SkillBridge",
  description: "Your AI - powered careeer assistant."
}
export default function RootLayout({ children } : {children: React.ReactNode }) {
  return (
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
  signInUrl="/sign-in"
  signUpUrl="/sign-up"
  afterSignInUrl="/dashboard"   
  afterSignUpUrl="/dashboard" >  
      <html lang="en">
        <Head>
          <title>{metadata.title}</title>
          <link rel="icon" href="/favicon-skillbridge.png" />
          <meta name="description" content={metadata.description} />
        </Head>
        <body className="bg-gray-100 text-gray-900 antialiased">
          <Navbar />
          <main>{children}</main>
        </body>
      </html>
    </ClerkProvider>
  )
}