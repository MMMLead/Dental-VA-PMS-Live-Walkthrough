import React from 'react';

interface AppointmentSymbolsGuideProps {
  onClose: () => void;
}

const SymbolRow: React.FC<{ symbol: React.ReactNode; title: string; description: string }> = ({ symbol, title, description }) => (
  <div className="flex items-start py-3 border-b">
    <div className="w-20 flex-shrink-0 flex items-center justify-center">{symbol}</div>
    <div className="ml-4">
      <p>
        <strong className="font-semibold">{title}</strong> – <span className="text-gray-600" dangerouslySetInnerHTML={{ __html: description }}></span>
      </p>
    </div>
  </div>
);

const AppointmentSymbolsGuide: React.FC<AppointmentSymbolsGuideProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl text-sm" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4 pb-2 border-b">
          <h2 className="text-xl font-bold text-gray-800">Appointment Symbols Defined</h2>
          <button onClick={onClose} className="p-1 rounded-full text-gray-500 hover:text-gray-800 hover:bg-gray-200" aria-label="Close">
            <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto">
          <SymbolRow
            symbol={<span className="text-3xl">🎵</span>}
            title="Appointment Note"
            description="The icon indicates the patient's appointment has a note attached to it. Click the icon to view the note."
          />
          <SymbolRow
            symbol={
              <div className="flex flex-col space-y-1">
                <div className="w-5 h-5 flex items-center justify-center font-bold text-blue-800 bg-blue-200 border border-blue-400">E</div>
                <div className="w-5 h-5 flex items-center justify-center font-bold text-yellow-800 bg-yellow-200 border border-yellow-400">E</div>
              </div>
            }
            title="Insurance Eligibility"
            description="The icon changes color to indicate a patient's insurance eligibility. Click the icon to check the patient's eligibility."
          />
          <SymbolRow
            symbol={
              <div className="flex flex-col space-y-1">
                <div className="w-5 h-5 flex items-center justify-center font-bold text-blue-800 bg-transparent border-2 border-blue-600">L</div>
                <div className="w-5 h-5 flex items-center justify-center font-bold text-red-800 bg-transparent border-2 border-red-600">L</div>
                <div className="w-5 h-5 flex items-center justify-center font-bold text-white bg-red-600 border border-red-800">L</div>
              </div>
            }
            title="Lab Case"
            description="The 'L' icon appears on a patient's appointment when you select the Lab Case option for the appointment. Click the icon to open the attached lab case. The icon changes color to represent the status of the lab case."
          />
          <SymbolRow
            symbol={<div className="w-5 h-5 flex items-center justify-center font-bold text-white bg-red-500 border border-red-700">+</div>}
            title="Health History Alert"
            description="The icon indicates the patient has a medical condition or allergy in their Health History. Click the icon to view the patient's Health History/Notes."
          />
          <SymbolRow
            symbol={<div className="text-yellow-500 text-3xl">▼</div>}
            title="Patient Alert"
            description="The icon indicates the patient has an alert. Click the icon to view the patient alert."
          />
          <SymbolRow
            symbol={<span className="font-bold text-lg">NP-</span>}
            title="New Patient"
            description="The letters 'NP' in front of a patient's name indicate that the appointment is for a new patient who does not yet have a patient account created in the Family File."
          />
           <SymbolRow
            symbol={
                <div className="w-5 h-8 border border-gray-500 flex flex-col justify-around items-center" aria-hidden="true">
                    <div style={{width: '120%', height: '1px', backgroundColor: 'rgb(107, 114, 128)', transform: 'rotate(45deg)'}}></div>
                    <div style={{width: '120%', height: '1px', backgroundColor: 'rgb(107, 114, 128)'}}></div>
                    <div style={{width: '120%', height: '1px', backgroundColor: 'rgb(107, 114, 128)', transform: 'rotate(-45deg)'}}></div>
                </div>
            }
            title="Appointment Time Pattern"
            description="The icon shows the length of the appointment broken into time intervals. Each interval is assigned as provider time (X), assistant time (/), or chair time (-)."
          />
           <SymbolRow
            symbol={<div className="w-4 h-4" style={{ background: 'linear-gradient(135deg, white 0%, white 50%, #B0B0B0 50%, #B0B0B0 100%)', borderRight: '1px solid #777', borderBottom: '1px solid #777' }} aria-hidden="true"></div>}
            title="Resize Handle"
            description="This icon, located in the bottom-right corner of the appointment, is used to increase or decrease the length of an appointment. Drag the icon upward to shorten the appointment length or downward to increase the appointment length."
          />
        </div>
      </div>
    </div>
  );
};

export default AppointmentSymbolsGuide;
