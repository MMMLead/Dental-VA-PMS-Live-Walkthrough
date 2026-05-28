import React, { useState, useEffect } from 'react';
import { Module } from '../../types';
import TopNavBar from './TopNavBar';
import PatientBanner from './PatientBanner';
import Dashboard from '../modules/Dashboard';
import AppointmentBook from '../modules/AppointmentBook';
import FamilyFile from '../modules/FamilyFile';
import Ledger from '../modules/Ledger';
import OfficeManager from '../modules/OfficeManager';
import Chart from '../modules/Chart';
import TreatmentPlanner from '../modules/TreatmentPlanner';
import DocumentCenter from '../modules/DocumentCenter';
import InsuranceVerifications from '../modules/InsuranceVerifications';
import MedicalRecords from '../modules/MedicalRecords';
import PortalInbox from '../modules/PortalInbox';
import InsurancePortal from '../modules/InsurancePortal';
import { useSimulationContext } from '../../context/SimulationContext';
import SandboxGuide from './SandboxGuide';
import ToastContainer from '../ui/ToastContainer';

// Patient search modal component
const PatientSearchModal: React.FC<{
  onClose: () => void;
  setActiveModule: (module: Module) => void;
}> = ({ onClose, setActiveModule }) => {
  const { state, dispatch } = useSimulationContext();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPatients = searchTerm
    ? state.patients.filter(p =>
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id.toString().includes(searchTerm) ||
        p.dob.includes(searchTerm)
      )
    : state.patients;

  const handleSelectPatient = (patientId: number) => {
    dispatch({ type: 'SELECT_PATIENT', payload: patientId });
    setActiveModule(Module.FamilyFile);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Find Patient</h2>
          <button onClick={onClose} className="p-1 rounded-full text-gray-500 hover:text-gray-800 hover:bg-gray-200" aria-label="Close">
            <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <input
          type="text"
          placeholder="Search by name, ID, or DOB..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
        <ul className="max-h-80 overflow-y-auto border rounded-md">
          {filteredPatients.length > 0 ? (
            filteredPatients.map(p => (
              <li
                key={p.id}
                onClick={() => handleSelectPatient(p.id)}
                className="p-3 border-b hover:bg-blue-100 cursor-pointer flex justify-between items-center"
              >
                <div>
                  <span className="font-semibold">{p.lastName}, {p.firstName}</span>
                  <span className="text-gray-500 text-sm ml-2">ID: {p.id}</span>
                </div>
                <span className="text-gray-600">{p.dob}</span>
              </li>
            ))
          ) : (
            <li className="p-3 text-center text-gray-500">No patients found.</li>
          )}
        </ul>
      </div>
    </div>
  );
};


interface MainLayoutProps {
    onEndSimulation: () => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({ onEndSimulation }) => {
  const [activeModule, setActiveModuleState] = useState<Module>(Module.Dashboard);
  const [isPatientSearchOpen, setIsPatientSearchOpen] = useState(false);
  const { state, dispatch } = useSimulationContext();

  const setActiveModule = (module: Module) => {
      dispatch({ type: 'LOG_ACTION', payload: { type: 'navigate_module', details: { module } } });
      setActiveModuleState(module);
  };

  // --- Task Reminder System ---
  useEffect(() => {
      const checkDueTasks = () => {
          const now = new Date();
          const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60 * 1000);

          state.tasks.forEach(task => {
              if (!task.completed && !task.reminded) {
                  const dueDate = new Date(task.dueDate);
                  // Check if due date is in the past (overdue) or within the next 15 minutes
                  if (dueDate <= fifteenMinutesFromNow) {
                      const timeText = dueDate < now ? "Overdue" : "Due soon";
                      
                      dispatch({ 
                          type: 'ADD_TOAST', 
                          payload: { 
                              message: `Reminder: Task "${task.title}" is ${timeText}!`, 
                              type: 'warning' 
                          } 
                      });
                      
                      dispatch({ type: 'MARK_TASK_REMINDED', payload: task.id });
                  }
              }
          });
      };

      // Check immediately on mount, then every 30 seconds
      checkDueTasks();
      const intervalId = setInterval(checkDueTasks, 30000);

      return () => clearInterval(intervalId);
  }, [state.tasks, dispatch]);


  const renderModule = () => {
    switch (activeModule) {
      case Module.Dashboard:
        return <Dashboard setActiveModule={setActiveModule} />;
      case Module.AppointmentBook:
        return <AppointmentBook setActiveModule={setActiveModule} />;
      case Module.FamilyFile:
        return <FamilyFile />;
      case Module.Ledger:
        return <Ledger />;
      case Module.OfficeManager:
        return <OfficeManager />;
      case Module.Chart:
        return <Chart />;
      case Module.TreatmentPlanner:
        return <TreatmentPlanner />;
      case Module.DocumentCenter:
        return <DocumentCenter />;
      case Module.InsuranceVerifications:
        return <InsuranceVerifications />;
      case Module.MedicalRecords:
        return <MedicalRecords />;
      case Module.Portal:
        return <PortalInbox setActiveModule={setActiveModule} />;
      case Module.InsurancePortal:
        return <InsurancePortal />;
      default:
        return <Dashboard setActiveModule={setActiveModule} />;
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-200 text-sm">
      <ToastContainer />
      <TopNavBar activeModule={activeModule} setActiveModule={setActiveModule} onEndSimulation={onEndSimulation} />
      <PatientBanner onSearchClick={() => setIsPatientSearchOpen(true)} />
      <div className="flex flex-grow overflow-hidden">
        <main className="flex-grow p-2 overflow-auto">
          {renderModule()}
        </main>
        <SandboxGuide />
      </div>
      {isPatientSearchOpen && <PatientSearchModal onClose={() => setIsPatientSearchOpen(false)} setActiveModule={setActiveModule} />}
    </div>
  );
};

export default MainLayout;