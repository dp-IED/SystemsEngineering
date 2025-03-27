"use client";

import React, { ReactNode } from "react";
import { ClerkProvider, RedirectToSignIn, useAuth } from "@clerk/nextjs";
import NavigationBar from "../components/NavigationBar";
import "./globals.css";
import ChanelLogo from "@/images/chanel.jpg";
import { Toaster } from "@/components/ui/toaster";
import Image from 'next/image'; // Add this line


function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }

  return <>{children}</>;
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider
      signInUrl="https://saving-tortoise-69.accounts.dev/sign-in"
      publishableKey="pk_test_c2F2aW5nLXRvcnRvaXNlLTY5LmNsZXJrLmFjY291bnRzLmRldiQ"
    >
      <html lang="en">
        <head>
          <title>Chanel Expense Dashboard</title>
          <meta
            name="description"
            content="Manage and analyze your expenses with the Chanel Expense Dashboard."
          />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
        </head>
        <body className="antialiased bg-background text-foreground font-sans min-h-screen flex flex-col">
          <header className="w-full bg-black flex items-center justify-end px-8 py-4 shadow-lg"></header>
          <NavigationBar />
          <main className="container mx-auto py-6 px-4 flex-grow">
            <ProtectedRoute>{children}</ProtectedRoute>
          </main>
          <Toaster />
          <footer className="mt-4 p-4 bg-slate-900 text-white flex justify-center items-center sticky bottom-0 w-full">
    <span>© 2024 Chanel. All rights reserved.</span>
    <Image
      src={ChanelLogo}
      alt="Chanel Logo"
      width={50}
      height={50}
      className="object-contain ml-2"
    />
</footer>

          
        </body>
      </html>
    </ClerkProvider>
  );
}
