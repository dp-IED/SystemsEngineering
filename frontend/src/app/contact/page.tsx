"use client";

import React from "react";

const Contact = () => {
  return (
    <div className="container mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold mb-8 text-center">Contact Us</h1>
      <p className="text-lg text-gray-700 leading-relaxed mb-6 text-center">
        Feel free to reach out to any of us via email or LinkedIn. We´re happy to assist you with the Chanel Media Dashboard or any inquiries.
      </p>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-100 p-4 rounded-lg shadow-md text-center">
          <h2 className="text-xl font-semibold">Ines Elasri</h2>
          <p className="text-gray-600 mb-2">ines.elasri.23@ucl.ac.uk</p>
          <a
            href="https://www.linkedin.com/in/ines-el-asri-1aa70231a/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            LinkedIn Profile
          </a>
        </div>
        <div className="bg-gray-100 p-4 rounded-lg shadow-md text-center">
          <h2 className="text-xl font-semibold">Daren Palmer</h2>
          <p className="text-gray-600 mb-2">daren.palmer.22@ucl.ac.uk</p>
          <a
            href="https://uk.linkedin.com/in/daren-palmer-b473b424b?trk=people-guest_people_search-card"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            LinkedIn Profile
          </a>
        </div>
        <div className="bg-gray-100 p-4 rounded-lg shadow-md text-center">
          <h2 className="text-xl font-semibold">Aziret Asanov</h2>
          <p className="text-gray-600 mb-2">aziret.asanov.23@ucl.ac.uk</p>
          <a
            href="https://uk.linkedin.com/in/aziret-asanov-68736b203?trk=people-guest_people_search-card"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            LinkedIn Profile
          </a>
        </div>
        <div className="bg-gray-100 p-4 rounded-lg shadow-md text-center">
          <h2 className="text-xl font-semibold">Anika Shankar</h2>
          <p className="text-gray-600 mb-2">anika.shankar.23@ucl.ac.uk</p>
          <a
            href="https://uk.linkedin.com/in/anika-shankar-7592b7293?trk=people-guest_people_search-card"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            LinkedIn Profile
          </a>
        </div>
      </div>
    </div>
  );
};

export default Contact;
