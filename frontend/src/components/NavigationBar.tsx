"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { UserButton } from "@clerk/nextjs"; // Import Clerk's UserButton
import FinsyncLogo from "@/images/finsync.png";


const NavigationBar = () => {
  return (
    <nav className="bg-black text-white py-4">
      
      <div className="container mx-auto flex justify-between items-center">
        
        {/* Logo and Branding */}
        <Link href="/">
          <div className="flex items-center">
            <Image
              src={FinsyncLogo}
              alt="FinSync Logo"
              width={50}
              height={50}
              className="object-contain mr-4"
            />
            <h1 className="text-lg font-bold tracking-wide uppercase">
              FinSync Dashboard
            </h1>
          </div>
        </Link>

        {/* Navigation Links & Profile */}
        <div className="flex items-center space-x-8 text-sm">
          <Link href="/" className="hover:underline">
            Home
          </Link>
          <Link href="/upload" className="hover:underline">
            Upload
          </Link>
          <Link href="/about" className="hover:underline">
            About
          </Link>
          <Link href="/contact" className="hover:underline">
            Contact
          </Link>

          {/* Clerk User Profile & Sign Out */}
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </nav>
  );
};

export default NavigationBar;
