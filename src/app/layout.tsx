import { ClerkProvider } from "@clerk/nextjs";
import Navbar from "@/components/Navbar";
import "./globals.css"


export default function RootLayout({ children } : {children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="bg-gray-100 text-gray-900 antialiased">
          <Navbar />
          <main>{children}</main>
        </body>
      </html>
    </ClerkProvider>
  )
}