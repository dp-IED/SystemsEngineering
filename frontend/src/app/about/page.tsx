"use client";

import React from "react";

const About = () => {
  return (
    <div className="container mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold mb-8 text-center text-black">About Us</h1>
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Who We Are</h2>
        <p className="leading-relaxed text-lg text-gray-700">
          We are Daren, Ines, Anika, and Aziret, four University College London
          (UCL) Computer Science students collaborating with Chanel through the Systems
          Engineering module. Our mission is to create an innovative tech
          solution that enhances Chanel´s financial processes.
        </p>
      </section>
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Our Platform</h2>
        <h3 className="text-xl font-medium mb-2">Chanel Media Financial Process Efficiency Project</h3>
        <p className="leading-relaxed text-lg text-gray-700">
          <strong>Overview:</strong> Chanel UK seeks to enhance operational
          efficiencies in financial tracking within the media department. The
          project focuses on reducing administrative tasks to improve the client
          experience. By standardizing and automating processes, we aim to
          improve the efficiency and accuracy of financial reporting tasks.
        </p>
      </section>
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Key Challenges</h2>
        <ul className="list-disc list-inside text-lg text-gray-700">
          <li>Decentralized media spend tracking across divisions</li>
          <li>Manual collation of reports</li>
          <li>Inconsistent systems and file structures</li>
          <li>Varying data formats and report frequencies</li>
          <li>No control over data structure from different sources</li>
        </ul>
      </section>
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Our Objectives</h2>
        <ul className="list-disc list-inside text-lg text-gray-700">
          <li>
            <strong>Efficiency:</strong> Improve the efficiency of tasks and
            increase outputs in the media team
          </li>
          <li>
            <strong>Automation:</strong> Sync multiple files and create outputs
            aligned with the media team´s reporting needs
          </li>
          <li>
            <strong>Improvement:</strong> Standardize report structures and
            eliminate redundant information
          </li>
          <li>
            <strong>Innovation:</strong> Provide near real-time spend
            visualization and assist monitoring
          </li>
        </ul>
      </section>
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Desired Outcomes</h2>
        <p className="leading-relaxed text-lg text-gray-700">
          Our goal is to create an automated solution that pulls budgets,
          planned spend, actual spend, and invoice numbers into one place. The
          platform will support filtering by market, division, channel, month,
          and campaign. We aim to eliminate manual input, provide a dashboard
          for visualization, and deliver accurate insights for the Chanel Media
          and Finance teams.
        </p>
      </section>
    </div>
  );
};

export default About;
