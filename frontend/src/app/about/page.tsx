"use client";

import React from "react";

const About = () => {
  return (
    <div className="container mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold mb-8 text-center text-black">About Us & FinSync</h1>
      
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Who We Are</h2>
        <p className="leading-relaxed text-lg text-gray-700">
          We are Daren, Ines, Anika, and Aziret, four Computer Science graduates from University College London (UCL). In collaboration with Chanel, we have developed FinSync, a state-of-the-art platform designed to revolutionize Chanel's financial processes within their media and finance departments.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">FinSync: Our Platform</h2>
        <p className="leading-relaxed text-lg text-gray-700">
        FinSync automates and consolidates financial data handling, enhancing the efficiency and clarity of Chanel's financial operations. Here are the key functionalities now available on the platform:
        <ul className="list-disc list-inside text-lg text-gray-700">
            <li>Automated data aggregation of budgets, planned and actual spends, and invoice details.</li>
            <li>User-friendly dashboard featuring real-time financial tracking and decision-making support, complete with Excel previews and a variety of graphs for comprehensive visual analytics.  </li>
            <li>Advanced filtering capabilities accessible through a user-friendly downloadable Excel sheet, allowing detailed analysis by market, division, channel, month, and campaign.</li>
            <li>Seamless integration with existing systems to ensure workflow continuity and enhance operational efficiency.</li>
        </ul>
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Key Challenges Overcome</h2>
        <ul className="list-disc list-inside text-lg text-gray-700">
          <li>Integration of disparate financial data sources into a unified platform.</li>
          <li>Elimination of manual data entry and associated errors.</li>
          <li>Standardization of financial reporting across multiple divisions.</li>
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Project Impact</h2>
        <ul className="list-disc list-inside text-lg text-gray-700">
        <li>Significantly reduced the time required for financial data processing, cutting it down from weeks to mere minutes.</li>
        <li>Enhanced accuracy and reliability of financial reports.</li>
          <li>Empowered the Chanel teams with data-driven insights for better strategic planning.</li>
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Accomplishments</h2>
        <p className="leading-relaxed text-lg text-gray-700">
          The deployment of FinSync has successfully transformed Chanel's financial management approach, aligning with our initial vision to streamline and enhance financial operations. The platform could now become a critical tool for Chanel UK, driving efficiency and accuracy across financial departments.
        </p>
      </section>
    </div>
  );
};

export default About;
