"use client";

import React, { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import NavigationBar from "../components/NavigationBar";
import "./globals.css";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider signInUrl="https://saving-tortoise-69.accounts.dev/sign-in">
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
          <main className="container mx-auto py-6 px-4 flex-grow">{children}</main>
          <footer className="mt-4 p-4 bg-slate-900 text-white text-center sticky bottom-0 w-full">
            © 2024 Chanel. All rights reserved.
          </footer>
        </body>
      </html>
    </ClerkProvider>
  );
}
