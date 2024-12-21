"use client";

import React from "react";
import Link from "next/link";

const NavigationBar = () => {
  
  return (
    <nav className="bg-black text-white py-4">
      <div className="container mx-auto flex justify-between items-center">
        {/* Branding */}
        <h1 className="text-lg font-bold tracking-wide uppercase">
          Chanel Dashboard
        </h1>

        {/* Navigation Links */}
        <div className="space-x-8 text-sm">
          <Link href="/" className="hover:underline">
            Home
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
