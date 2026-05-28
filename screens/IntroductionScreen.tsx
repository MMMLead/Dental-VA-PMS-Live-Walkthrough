import React from 'react';

interface IntroductionScreenProps {
  onStartSimulation: () => void;
}

// Simple icon components for clarity
const UserGroupIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.124-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.124-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ChartIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);

const GuideIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
);

const IntroductionScreen: React.FC<IntroductionScreenProps> = ({ onStartSimulation }) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl p-10 space-y-8 bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800">Welcome to the PMS Sandbox</h1>
          <p className="mt-3 text-lg text-gray-600">
            Your hands-on training ground for mastering a modern dental PMS system.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-6">
          {/* Your Mission */}
          <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Your Mission</h2>
            <p className="text-gray-600">
              Dive into a realistic simulation to practice and perfect your front-desk skills. This is a safe space to learn without real-world consequences, using entirely fictional patient data.
            </p>
          </div>

          {/* What You'll Master */}
          <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">What You'll Master</h2>
            <ul className="space-y-4">
              <li className="flex items-start">
                <div className="flex-shrink-0"><UserGroupIcon /></div>
                <div className="ml-3">
                  <h3 className="font-semibold text-gray-800">Family File</h3>
                  <p className="text-gray-600">Manage the master list of all patients.</p>
                </div>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0"><CalendarIcon /></div>
                <div className="ml-3">
                  <h3 className="font-semibold text-gray-800">Appointment Book</h3>
                  <p className="text-gray-600">Schedule and manage appointments for multiple providers.</p>
                </div>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0"><ChartIcon /></div>
                <div className="ml-3">
                  <h3 className="font-semibold text-gray-800">Patient Chart</h3>
                  <p className="text-gray-600">Dive into a patient's record, including their tooth chart and ledger.</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Guided Activities */}
        <div className="pt-6 border-t border-gray-200">
             <div className="bg-yellow-100 border-l-4 border-yellow-400 p-6 rounded-r-lg">
                 <div className="flex items-start">
                    <div className="flex-shrink-0"><GuideIcon /></div>
                    <div className="ml-3">
                      <h3 className="font-bold text-yellow-900">Get Started with Guided Activities</h3>
                      <p className="text-yellow-800">Ready to jump in? The <strong className="font-semibold text-yellow-900">Sandbox Guide</strong> on your right contains step-by-step tasks to get you started. Follow along to master essential workflows.</p>
                    </div>
                  </div>
             </div>
        </div>

        {/* Explore Notice */}
        <div className="bg-blue-50 border-l-4 border-blue-400 text-blue-800 p-6 rounded-r-lg">
          <h3 className="font-bold text-center text-sm uppercase tracking-wider mb-2">Explore With Confidence</h3>
          <p className="text-center text-blue-700">
            This isn't a test. The goal is to build your skills and muscle memory. Don't be afraid to click, experiment, and learn by doing. A summary of your actions will be available at the end.
          </p>
        </div>

        <div className="text-center pt-6">
          <button
            onClick={onStartSimulation}
            className="w-full max-w-xs px-8 py-3 text-lg font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-transform transform hover:scale-105"
          >
            Start Simulation
          </button>
        </div>
      </div>
    </div>
  );
};

export default IntroductionScreen;