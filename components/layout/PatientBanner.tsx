import React from 'react';
import { useSimulationContext } from '../../context/SimulationContext';
import { PatientStatus } from '../../types';

interface PatientBannerProps {
    onSearchClick: () => void;
}

const PatientBanner: React.FC<PatientBannerProps> = ({ onSearchClick }) => {
    const { state } = useSimulationContext();
    const { patients, selectedPatientId } = state;

    const selectedPatient = patients.find(p => p.id === selectedPatientId);

    const calculateAge = (dob: string) => {
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const getStatusBadge = (status: PatientStatus) => {
      if (status === 'Active') return null;
      
      const styles = {
        Inactive: 'bg-gray-100 text-gray-700 border-gray-300',
        Archived: 'bg-purple-100 text-purple-700 border-purple-300',
        Deceased: 'bg-black text-white border-black'
      };

      return (
        <span className={`px-2 py-0.5 rounded border text-[10px] font-black uppercase tracking-widest ${styles[status as keyof typeof styles]}`}>
          {status}
        </span>
      );
    };

    return (
        <div className="bg-white shadow-sm p-2 flex items-center justify-between border-b-2 border-blue-500 flex-wrap gap-2">
            {selectedPatient ? (
                <div className="flex items-center space-x-4 text-gray-800 flex-wrap">
                    <div className="flex items-center gap-3">
                        <span className="font-bold text-lg">{selectedPatient.lastName}, {selectedPatient.firstName}</span>
                        {getStatusBadge(selectedPatient.status)}
                        <span className="text-gray-500">ID: {selectedPatient.id}</span>
                    </div>
                    <div><strong>DOB:</strong> {new Date(selectedPatient.dob).toLocaleDateString()} ({calculateAge(selectedPatient.dob)}y)</div>
                    <div><strong>Gender:</strong> {selectedPatient.gender}</div>
                    <div><strong>Phone:</strong> {selectedPatient.phone}</div>
                    {selectedPatient.medicalAlerts.length > 0 && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-1 rounded-md text-xs sm:text-sm">
                            <strong>Medical Alert:</strong> {selectedPatient.medicalAlerts.join('; ')}
                        </div>
                    )}
                    {selectedPatient.patientAlerts && selectedPatient.patientAlerts.length > 0 && (
                        <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-3 py-1 rounded-md text-xs sm:text-sm">
                            <strong>Patient Alert:</strong> {selectedPatient.patientAlerts.join('; ')}
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-gray-500 font-semibold">No patient selected. Use Family File to search or create a new patient.</div>
            )}
            <div className="flex items-center space-x-2">
                <button 
                    onClick={onSearchClick}
                    className="bg-gray-200 p-2 rounded-md hover:bg-gray-300"
                    aria-label="Search for a patient"
                >
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </button>
            </div>
        </div>
    );
};

export default PatientBanner;