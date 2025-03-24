"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import ChanelLogo from "@/public/chanel.jpg";


const NavigationBar = () => {
  return (
    <nav className="bg-black text-white py-4">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo and Branding */}
        <Link href="/">
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
        </Link>

        {/* Navigation Links */}
        <div className="space-x-8 text-sm">
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
        </div>
      </div>
    </nav>
  );
};

export default NavigationBar;
