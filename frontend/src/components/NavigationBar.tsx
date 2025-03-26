"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { UserButton } from "@clerk/nextjs"; // Import Clerk's UserButton
import ChanelLogo from "@/public/chanel.jpg";

const NavigationBar = () => {
  return (
    <nav className="bg-black text-white py-4">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo and Branding */}
        <div className="flex items-center">
          <Image
            src={ChanelLogo}
            alt="Chanel Logo"
            width={50}
            height={50}
            className="object-contain mr-4"
          />
          <h1 className="text-lg font-bold tracking-wide uppercase">
            Chanel Dashboard
          </h1>
        </div>

        {/* Navigation Links & Profile */}
        <div className="flex items-center space-x-8 text-sm">
          <Link href="/" className="hover:underline">
            Home
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
