

import React, { useState } from 'react';
import { useSimulationContext } from '../../context/SimulationContext';
import { SANDBOX_TASKS as tasks } from '../../constants';

const SandboxGuide: React.FC = () => {
    const { state, dispatch } = useSimulationContext();
    const [activeTaskIndex, setActiveTaskIndex] = useState<number | null>(0);
    
    const handleToggleTask = (index: number) => {
        setActiveTaskIndex(prevIndex => prevIndex === index ? null : index);
    }

    const handleToggleStep = (taskIndex: number, stepIndex: number) => {
        dispatch({ type: 'TOGGLE_SANDBOX_STEP', payload: { taskIndex, stepIndex } });
    };

    const completedCount = Object.values(state.completedSandboxTasks).flat().filter(Boolean).length;
    const totalCount = tasks.reduce((acc, t) => acc + t.steps.length, 0);

    return (
        <aside className="w-80 bg-gray-50 border-l border-gray-300 flex-shrink-0 flex flex-col shadow-lg z-10">
            <div className="p-4 border-b bg-blue-600 text-white shadow-md">
                <h2 className="text-lg font-bold">Live Walkthrough Guide</h2>
                <p className="text-xs text-blue-100 mt-1 opacity-90">
                    Interactive Demo Checklist
                </p>
                 <div className="w-full bg-blue-800 rounded-full h-1.5 mt-2">
                    <div className={`bg-green-400 h-1.5 rounded-full transition-all duration-500`} style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}></div>
                </div>
            </div>
            
            <div className="flex-grow overflow-y-auto space-y-3 p-3">
                {tasks.map((task, taskIndex) => {
                    const completedSteps = state.completedSandboxTasks[taskIndex] || [];
                    const isModuleComplete = completedSteps.length > 0 && completedSteps.every(Boolean) && completedSteps.length === task.steps.length;
                    const completedStepsCount = completedSteps.filter(Boolean).length;

                    return (
                        <div key={taskIndex} className={`bg-white rounded-lg border ${isModuleComplete ? 'border-green-200 shadow-sm' : 'border-gray-200 shadow-sm'} overflow-hidden`}>
                            <button 
                              onClick={() => handleToggleTask(taskIndex)}
                              className="w-full text-left p-3 flex justify-between items-center hover:bg-gray-50 transition-colors"
                            >
                                <div>
                                    <h3 className={`font-semibold text-sm ${isModuleComplete ? 'text-green-700' : 'text-gray-800'}`}>{task.title}</h3>
                                    <div className="flex items-center mt-1">
                                         <span className="text-xs text-gray-500 mr-2">{completedStepsCount}/{task.steps.length} Steps</span>
                                         <div className="w-20 bg-gray-200 rounded-full h-1">
                                            <div className={`bg-blue-500 h-1 rounded-full transition-all duration-500`} style={{ width: `${(completedStepsCount/task.steps.length)*100}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                                 <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-gray-400 transition-transform ${activeTaskIndex === taskIndex ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            
                            {activeTaskIndex === taskIndex && (
                                <div className="p-3 bg-gray-50 border-t border-gray-100 animate-fade-in-down">
                                    <ul className="space-y-3">
                                        {task.steps.map((stepText, stepIndex) => {
                                            const isStepComplete = state.completedSandboxTasks[taskIndex]?.[stepIndex] || false;
                                            return (
                                                <li key={stepIndex} className="flex items-start group cursor-pointer" onClick={() => handleToggleStep(taskIndex, stepIndex)}>
                                                    <div className="flex items-center h-5 pt-1">
                                                        <input
                                                            type="checkbox"
                                                            readOnly
                                                            checked={isStepComplete}
                                                            className={`h-4 w-4 rounded border-gray-300 cursor-pointer ${isStepComplete ? 'text-green-600 focus:ring-green-500' : 'text-gray-300 bg-gray-100'}`}
                                                        />
                                                    </div>
                                                    <label className={`ml-3 text-xs cursor-pointer ${isStepComplete ? 'text-gray-500 line-through' : 'text-gray-700'} transition-colors duration-300`}
                                                      dangerouslySetInnerHTML={{ __html: stepText.replace(/\*\*(.*?)\*\*/g, '<span class="font-bold text-blue-900">$1</span>') }}
                                                    />
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </aside>
    );
};

export default SandboxGuide;