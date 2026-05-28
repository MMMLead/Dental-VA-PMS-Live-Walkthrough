

import React from 'react';
import { useSimulationContext } from '../../context/SimulationContext';
import { SANDBOX_TASKS } from '../../constants';

interface SummaryProps {
    onRestart: () => void;
}

const SimulationSummary: React.FC<SummaryProps> = ({ onRestart }) => {
    const { state } = useSimulationContext();
    
    // Count manual checks
    const completedCount = Object.values(state.completedSandboxTasks).flat().filter(Boolean).length;
    const totalCount = SANDBOX_TASKS.reduce((acc, t) => acc + t.steps.length, 0);
    const percentage = Math.round((completedCount / totalCount) * 100);

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-2xl w-full border border-gray-100">
                <div className="p-8 text-center bg-gradient-to-r from-blue-600 to-blue-800 text-white">
                    <h1 className="text-3xl font-bold mb-2">Live Walkthrough Complete</h1>
                    <p className="opacity-90 text-lg">Thank you for participating in the demonstration.</p>
                </div>

                <div className="p-10 text-center">
                     <div className="mb-8">
                         <div className="inline-block p-6 rounded-full bg-blue-50 mb-4">
                            <span className="text-5xl">👋</span>
                         </div>
                         <h2 className="text-xl font-bold text-gray-800 mb-2">Session Overview</h2>
                         <p className="text-gray-600">
                             You covered <strong>{completedCount}</strong> out of <strong>{totalCount}</strong> key scenarios outlined in the guide.
                         </p>
                         
                         <div className="w-full bg-gray-200 rounded-full h-4 mt-6 overflow-hidden">
                            <div className="bg-blue-500 h-full transition-all duration-1000 ease-out" style={{ width: `${percentage}%` }}></div>
                         </div>
                         <p className="text-xs text-gray-500 mt-2 font-medium">{percentage}% Coverage</p>
                     </div>

                    <div className="flex justify-center space-x-4">
                        <button onClick={onRestart} className="bg-gray-800 text-white font-bold py-3 px-8 rounded-lg hover:bg-gray-900 transition-all shadow-md hover:shadow-lg">
                            Return to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SimulationSummary;