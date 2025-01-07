"use client";

import React, { ReactNode } from "react";
import Image from "next/image";
import NavigationBar from "../components/NavigationBar"; // Adjust the path if necessary
import ChanelLogo from "@/public/chanel.jpg";
import "./globals.css";
import { Button } from "@/components/ui/button";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>Chanel Expense Dashboard</title>
        <meta name="description" content="Manage and analyze your expenses with the Chanel Expense Dashboard." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="antialiased bg-background text-foreground font-sans">
        {/* Header */}
        <header className="w-full bg-black flex items-center justify-between px-8 py-4 shadow-lg">
          <div className="flex items-center gap-4">
            <Image
              src={ChanelLogo}
              alt="Chanel Logo"
              width={100}
              height={100}
              className="object-contain"
            />
          </div>
          <div>
            <Button className="p-0 bg-transparent border-none">
              <Image
                src="https://ok4static.oktacdn.com/fs/bco/1/fs012r07i1rX4ZtdW1t8"
                alt="Coupa Logo"
                width={160}
                height={50}
                className="rounded bg-white"
              />
            </Button>
          </div>
        </header>

        {/* Navigation Bar */}
        <NavigationBar />

        {/* Main Content */}
        <main className="container mx-auto py-6 px-4">
          {children}
        </main>

        {/* Footer */}
        <footer className="w-full bg-gray-900 text-white text-center py-4">
          <p className="text-sm">© 2024 Chanel. All rights reserved.</p>
        </footer>
      </body>
    </html>
  );
}
