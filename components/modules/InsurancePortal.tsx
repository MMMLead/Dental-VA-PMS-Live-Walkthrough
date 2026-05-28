
import React, { useState, useMemo, useEffect } from 'react';
import { useSimulationContext } from '../../context/SimulationContext';
import { Patient } from '../../types';

type PortalTab = 'claims' | 'authorizations' | 'eligibility' | 'settings';

const MOCK_AUTHORIZATIONS = [
  { id: 'AUTH-7721', name: 'Torres, Miguel', service: 'Crown (D2740)', status: 'Approved', submitted: '2025-10-10', payer: 'Delta Dental', ref: 'DX-1192-A' },
  { id: 'AUTH-7745', name: 'Smith, Jane', service: 'RCT (D3310)', status: 'Awaiting Review', submitted: '2025-11-02', payer: 'Aetna', ref: 'AE-9920-P' },
  { id: 'AUTH-7789', name: 'Gable, Jennifer', service: 'Bridge (D6750)', status: 'Requesting Docs', submitted: '2025-10-28', payer: 'MetLife', ref: 'ML-0021-R' },
  { id: 'AUTH-7801', name: 'White, Emily', service: 'Extraction (D7140)', status: 'Approved', submitted: '2025-11-05', payer: 'Cigna', ref: 'CG-8821-V' },
  { id: 'AUTH-7812', name: 'Brown, Michael', service: 'Implant (D6010)', status: 'Awaiting Review', submitted: '2025-11-08', payer: 'Guardian', ref: 'GU-7721-L' },
];

const AuthDetailsModal: React.FC<{ 
  auth: typeof MOCK_AUTHORIZATIONS[0]; 
  onClose: () => void;
}> = ({ auth, onClose }) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60]" onClick={onClose}>
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-in-up" onClick={e => e.stopPropagation()}>
      <div className="bg-[#004b8d] p-6 text-white flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight">Authorization Detail</h2>
          <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">Case ID: {auth.id}</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="p-8 space-y-6">
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Patient Name</p>
            <p className="font-black text-gray-800 text-sm">{auth.name}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Payer Reference</p>
            <p className="font-mono font-bold text-blue-700">{auth.ref}</p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] font-black text-gray-500 uppercase">Current Status</span>
            <span className={`px-3 py-1 rounded-full font-black uppercase text-[10px] border flex items-center gap-1.5 ${
              auth.status === 'Approved' ? 'bg-green-100 text-green-700 border-green-200' :
              auth.status === 'Requesting Docs' ? 'bg-orange-100 text-orange-700 border-orange-200' :
              'bg-blue-100 text-blue-700 border-blue-200'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                auth.status === 'Approved' ? 'bg-green-600' :
                auth.status === 'Requesting Docs' ? 'bg-orange-600' :
                'bg-blue-600'
              }`}></span>
              {auth.status}
            </span>
          </div>
          <div className="space-y-3 border-t pt-4">
            <div className="flex justify-between">
              <span className="text-gray-500 font-bold">Proposed Service:</span>
              <span className="font-black text-gray-800">{auth.service}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 font-bold">Date Submitted:</span>
              <span className="font-medium text-gray-800">{auth.submitted}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 font-bold">Insurance Payer:</span>
              <span className="font-medium text-gray-800">{auth.payer}</span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b pb-1 mb-2">Payer Commentary</h4>
          <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 italic text-xs text-gray-600 leading-relaxed">
            {auth.status === 'Approved' 
              ? "Service is medically necessary and approved per plan guidelines. Benefits are subject to patient eligibility at time of service."
              : auth.status === 'Requesting Docs'
              ? "Clinical documentation required. Please upload current periapical radiographs and periodontal charting for further review."
              : "Authorization is currently in medical review. Estimated turnaround time is 7-10 business days."}
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-gray-100 text-gray-600 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-gray-200"
          >
            Close View
          </button>
          <button 
            onClick={() => window.print()}
            className="px-8 py-3 bg-[#004b8d] text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-lg hover:bg-[#003666]"
          >
            Print Detail
          </button>
        </div>
      </div>
    </div>
  </div>
);

const SubmitClaimModal: React.FC<{ 
  onClose: () => void; 
  patients: Patient[]; 
  selectedPatientId: number | null;
  onSuccess: (claimId: string) => void;
}> = ({ onClose, patients, selectedPatientId, onSuccess }) => {
  const [step, setStep] = useState<'form' | 'submitting' | 'success'>('form');
  const [formData, setFormData] = useState({
    patientId: selectedPatientId?.toString() || '',
    dateOfService: new Date().toISOString().split('T')[0],
    procedureCode: 'D0120',
    toothNumber: '',
    surface: '',
    fee: '95.00'
  });

  const selectedPatient = patients.find(p => p.id === Number(formData.patientId));

  const handleTransmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('submitting');
    setTimeout(() => {
      setStep('success');
      onSuccess(`EDI-${Math.floor(100000 + Math.random() * 900000)}`);
    }, 2000);
  };

  if (step === 'submitting') {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60]">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h3 className="text-lg font-black text-gray-800 uppercase tracking-widest">Transmitting EDI...</h3>
          <p className="text-xs text-gray-500 font-bold mt-2">Validating clearinghouse credentials & patient eligibility...</p>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60]">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl animate-fade-in-fast">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">Claim Accepted</h3>
          <p className="text-sm text-gray-600 font-medium mt-2">Claim has been successfully queued for adjudication.</p>
          <div className="mt-6 p-3 bg-gray-50 rounded-lg border border-dashed border-gray-300">
             <p className="text-[10px] font-black text-gray-400 uppercase">EDI Control Reference</p>
             <p className="text-sm font-mono font-bold text-blue-700">#TRX-882910-AQ</p>
          </div>
          <button 
            onClick={onClose}
            className="w-full mt-8 py-3 bg-[#004b8d] text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-lg hover:bg-[#003666]"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60]" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-slide-in-up" onClick={e => e.stopPropagation()}>
        <div className="bg-[#004b8d] p-6 text-white flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight">Electronic Claim Entry</h2>
            <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">Standard 837D Dental Format Simulation</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleTransmit} className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
               <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b pb-1">Patient Info</h4>
               <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Select Patient</label>
                  <select 
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.patientId}
                    onChange={e => setFormData({...formData, patientId: e.target.value})}
                    required
                  >
                    <option value="">Select...</option>
                    {patients.map(p => <option key={p.id} value={p.id}>{p.lastName}, {p.firstName}</option>)}
                  </select>
               </div>
               {selectedPatient && (
                 <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-[10px] font-black text-blue-800 uppercase">Payer ID: 00432 (Delta)</p>
                    <p className="text-xs font-bold text-blue-700 mt-1">Subscriber: {selectedPatient.primaryInsurance?.subscriberId || 'N/A'}</p>
                 </div>
               )}
            </div>

            <div className="space-y-4">
               <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b pb-1">Service Details</h4>
               <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Date of Service</label>
                    <input 
                      type="date" 
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.dateOfService}
                      onChange={e => setFormData({...formData, dateOfService: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">ADA Code</label>
                    <input 
                      type="text" 
                      placeholder="e.g. D0120"
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                      value={formData.procedureCode}
                      onChange={e => setFormData({...formData, procedureCode: e.target.value})}
                      required
                    />
                  </div>
               </div>
               <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Tooth #</label>
                    <input 
                      type="text" 
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.toothNumber}
                      onChange={e => setFormData({...formData, toothNumber: e.target.value})}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Billed Fee ($)</label>
                    <input 
                      type="text" 
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm font-black focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.fee}
                      onChange={e => setFormData({...formData, fee: e.target.value})}
                      required
                    />
                  </div>
               </div>
            </div>
          </div>

          <div className="pt-6 flex justify-end gap-4 border-t">
            <button 
              type="button" 
              onClick={onClose}
              className="px-6 py-2.5 text-xs font-black text-gray-400 uppercase tracking-widest hover:text-gray-600"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-8 py-2.5 bg-green-600 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-lg hover:bg-green-700 transition-all active:scale-95"
            >
              Transmit Claim
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const InsurancePortal: React.FC = () => {
  const { state, dispatch } = useSimulationContext();
  const { patients, selectedPatientId } = state;
  const currentPMSPatient = patients.find(p => p.id === selectedPatientId);

  const [activeTab, setActiveTab] = useState<PortalTab>('eligibility');
  const [isSearching, setIsSearching] = useState(false);
  const [searchStatus, setSearchStatus] = useState<string>('');
  const [searchResult, setSearchResult] = useState<Patient | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [authSearchQuery, setAuthSearchQuery] = useState('');
  const [selectedAuth, setSelectedAuth] = useState<typeof MOCK_AUTHORIZATIONS[0] | null>(null);
  const [recentInquiries, setRecentInquiries] = useState<any[]>([]);
  
  // Sorting state for Authorizations
  const [authSortConfig, setAuthSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'submitted', direction: 'desc' });

  const [searchCriteria, setSearchCriteria] = useState({
    memberId: '',
    dob: '',
    payer: 'Delta Dental PPO',
  });

  // Pre-fill search if a patient is selected in PMS
  useEffect(() => {
    if (currentPMSPatient && currentPMSPatient.primaryInsurance) {
      setSearchCriteria({
        memberId: currentPMSPatient.primaryInsurance.subscriberId || '',
        dob: currentPMSPatient.dob,
        payer: currentPMSPatient.primaryInsurance.company,
      });
    }
  }, [currentPMSPatient]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setError(null);
    setSearchResult(null);
    setSearchStatus('Connecting to Clearinghouse...');

    // Simulate multi-step real-time verification process
    setTimeout(() => setSearchStatus('X12 270 Request Sent...'), 400);
    setTimeout(() => setSearchStatus('Waiting for Payer Response...'), 800);

    setTimeout(() => {
      // Find patient matching member ID and DOB
      const found = patients.find(p => 
        (p.primaryInsurance?.subscriberId.toLowerCase() === searchCriteria.memberId.toLowerCase() || p.id.toString() === searchCriteria.memberId) &&
        p.dob === searchCriteria.dob
      );

      if (found) {
        setSearchResult(found);
        setRecentInquiries(prev => [{
            name: `${found.lastName}, ${found.firstName}`,
            id: found.primaryInsurance?.subscriberId || found.id,
            timestamp: new Date().toLocaleTimeString(),
            status: 'Success'
        }, ...prev].slice(0, 5));
      } else {
        setError('Transaction Rejected: Subscriber Not Found (AAA 03:72). Please verify Member ID and DOB and re-submit.');
        setRecentInquiries(prev => [{
            name: 'Unknown Subscriber',
            id: searchCriteria.memberId,
            timestamp: new Date().toLocaleTimeString(),
            status: 'Failed'
        }, ...prev].slice(0, 5));
      }
      setIsSearching(false);
      setSearchStatus('');
    }, 1800);
  };

  const getNetworkStatus = (patient: Patient) => {
    return patient.id < 20 ? 'In-Network (INN)' : 'Out-of-Network (OON)';
  };

  const sortedAndFilteredAuthorizations = useMemo(() => {
    let items = [...MOCK_AUTHORIZATIONS];
    
    if (authSearchQuery.trim()) {
      const query = authSearchQuery.toLowerCase();
      items = items.filter(auth => 
        auth.id.toLowerCase().includes(query) || 
        auth.name.toLowerCase().includes(query) ||
        auth.service.toLowerCase().includes(query)
      );
    }

    items.sort((a: any, b: any) => {
        const valA = a[authSortConfig.key];
        const valB = b[authSortConfig.key];
        
        if (valA < valB) return authSortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return authSortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    return items;
  }, [authSearchQuery, authSortConfig]);

  const handleAuthSort = (key: string) => {
    setAuthSortConfig(prev => ({
        key,
        direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const renderEligibility = () => (
    <div className="flex h-full overflow-hidden">
      {/* Inquiry Sidebar */}
      <aside className="w-80 bg-gray-50 border-r p-6 shrink-0 flex flex-col gap-6 overflow-y-auto">
        <div>
          <div className="flex items-center gap-2 mb-4">
             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
             <h2 className="text-sm font-black text-gray-800 uppercase tracking-widest">Real-Time Inquiry</h2>
          </div>
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase mb-1 tracking-tighter">Payer Connection</label>
              <select 
                className="w-full p-2.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#004b8d] outline-none bg-white font-medium"
                value={searchCriteria.payer}
                onChange={e => setSearchCriteria({...searchCriteria, payer: e.target.value})}
              >
                <option>Delta Dental PPO</option>
                <option>Aetna DMO</option>
                <option>MetLife PPO</option>
                <option>Cigna Plus</option>
                <option>Guardian Life</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase mb-1 tracking-tighter">Member ID / Subscriber ID</label>
              <input 
                type="text" 
                placeholder="Enter ID (e.g. SUB-98765)"
                className="w-full p-2.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#004b8d] outline-none font-black"
                value={searchCriteria.memberId}
                onChange={e => setSearchCriteria({...searchCriteria, memberId: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase mb-1 tracking-tighter">Subscriber DOB</label>
              <input 
                type="date" 
                className="w-full p-2.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#004b8d] outline-none font-medium"
                value={searchCriteria.dob}
                onChange={e => setSearchCriteria({...searchCriteria, dob: e.target.value})}
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={isSearching}
              className="w-full py-4 bg-[#004b8d] text-white rounded font-black uppercase text-xs tracking-widest shadow-lg hover:bg-[#003666] transition-all active:scale-95 disabled:bg-gray-400"
            >
              {isSearching ? 'Processing...' : 'Verify Coverage'}
            </button>
          </form>
        </div>

        {recentInquiries.length > 0 && (
            <div className="border-t pt-4">
                 <h4 className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Recent Activity</h4>
                 <div className="space-y-2">
                    {recentInquiries.map((iq, i) => (
                        <div key={i} className="p-2 bg-white rounded border text-[10px] flex justify-between items-center group cursor-pointer hover:border-blue-300 transition-colors">
                            <div className="truncate pr-2">
                                <p className="font-bold text-gray-700 truncate">{iq.name}</p>
                                <p className="text-gray-400">{iq.id}</p>
                            </div>
                            <span className={`font-black ${iq.status === 'Success' ? 'text-green-500' : 'text-red-400'}`}>{iq.status}</span>
                        </div>
                    ))}
                 </div>
            </div>
        )}

        <div className="mt-auto bg-[#004b8d]/5 p-4 rounded-xl border border-[#004b8d]/10">
           <p className="text-[10px] font-black text-[#004b8d] uppercase mb-2 flex items-center gap-1">
             <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
             Demo Logic
           </p>
           <p className="text-[11px] text-[#004b8d] leading-relaxed font-medium">
             Search criteria is <strong>functional</strong>. Try searching for "SUB-98765" with DOB "1991-12-22" to see a live verification for Miguel Torres.
           </p>
        </div>
      </aside>

      {/* Results Area */}
      <main className="flex-grow p-8 bg-gray-100/50 overflow-y-auto relative">
        {isSearching ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-white/50 backdrop-blur-[2px] rounded-2xl border-2 border-dashed border-gray-200">
            <div className="relative mb-6">
                <div className="w-16 h-16 border-4 border-[#004b8d]/20 border-t-[#004b8d] rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-blue-600 font-bold">EDI</div>
            </div>
            <p className="font-black uppercase tracking-widest text-sm text-gray-600">{searchStatus}</p>
            <p className="text-[10px] text-gray-400 mt-2 font-bold italic">Standard 270 Inquiry in progress...</p>
          </div>
        ) : error ? (
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-red-100 max-w-2xl mx-auto animate-shake">
            <div className="flex items-center gap-4 text-red-600 mb-6">
                 <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                 <h3 className="text-xl font-black uppercase tracking-tight">Eligibility Response Error</h3>
            </div>
            <div className="p-4 bg-red-50 rounded-lg border-l-4 border-red-500">
                <p className="text-red-700 font-bold text-sm leading-relaxed">{error}</p>
            </div>
            <div className="mt-6 flex justify-end">
                <button onClick={() => setError(null)} className="px-6 py-2 bg-red-600 text-white rounded text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-colors">Dismiss Error</button>
            </div>
          </div>
        ) : searchResult ? (
          <div className="max-w-5xl mx-auto space-y-6 animate-fade-in-fast relative">
            {/* Verified Watermark */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-[0.03] rotate-[-15deg]">
                <span className="text-[150px] font-black uppercase border-[10px] border-black p-4">Verified</span>
            </div>

            {/* Result Summary Header */}
            <div className="bg-white p-6 rounded-2xl shadow-xl border-t-8 border-[#004b8d] flex justify-between items-center">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 text-3xl font-black uppercase border-4 border-white shadow-lg overflow-hidden flex-shrink-0">
                  {searchResult.photoUrl ? <img src={searchResult.photoUrl} className="w-full h-full object-cover" /> : searchResult.lastName[0]}
                </div>
                <div>
                  <h2 className="text-3xl font-black text-gray-800 tracking-tight">{searchResult.lastName}, {searchResult.firstName}</h2>
                  <div className="flex items-center gap-4 text-xs font-bold text-gray-500 uppercase mt-1 tracking-wider">
                    <span>Subscriber DOB: <span className="text-gray-700">{searchResult.dob}</span></span>
                    <span className="opacity-30">|</span>
                    <span>Benefit Plan: <span className="text-[#004b8d]">{searchResult.primaryInsurance?.plan || 'PPO Advantage'}</span></span>
                  </div>
                </div>
              </div>
              <div className="text-right flex flex-col items-end">
                <div className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-md flex items-center gap-2 border-2 ${searchResult.primaryInsurance?.isActive ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                  <span className={`w-2 h-2 rounded-full ${searchResult.primaryInsurance?.isActive ? 'bg-green-600 animate-pulse' : 'bg-red-600'}`}></span>
                  {searchResult.primaryInsurance?.isActive ? 'Coverage Active' : 'Inactive'}
                </div>
                {searchResult.primaryInsurance?.isActive && (
                    <div className="mt-2 text-right">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Termination Date</p>
                        <p className="text-xs font-black text-slate-700">12/31/2026</p>
                    </div>
                )}
                <div className="mt-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Control #: EDI-TXN-8820-Z
                </div>
              </div>
            </div>

            {/* Benefits Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Plan Info */}
              <div className="bg-white rounded-2xl shadow-xl border overflow-hidden">
                <div className="bg-gray-800 px-6 py-3 text-white font-black text-[10px] uppercase tracking-[0.2em] flex justify-between items-center">
                    <span>Carrier Details</span>
                    <span className="text-blue-400">Secure EDI v4010</span>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex justify-between border-b border-gray-50 pb-2"><span className="text-gray-400 text-[10px] font-black uppercase tracking-tighter">Payer Name</span><span className="text-gray-800 text-sm font-black">{searchCriteria.payer}</span></div>
                  <div className="flex justify-between border-b border-gray-50 pb-2"><span className="text-gray-400 text-[10px] font-black uppercase tracking-tighter">Payer ID</span><span className="text-blue-700 text-sm font-black mono font-mono">00432-DELTA</span></div>
                  <div className="flex justify-between border-b border-gray-50 pb-2"><span className="text-gray-400 text-[10px] font-black uppercase tracking-tighter">Group Number</span><span className="text-gray-800 text-sm font-black uppercase">{searchResult.primaryInsurance?.groupNumber || '99-A-101'}</span></div>
                  <div className="flex justify-between border-b border-gray-50 pb-2">
                      <span className="text-gray-400 text-[10px] font-black uppercase tracking-tighter">Fee Schedule</span>
                      <span className="text-indigo-700 text-[9px] font-black px-2 py-0.5 bg-indigo-50 rounded border border-indigo-100 uppercase tracking-tighter">Negotiated PPO Schedule</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-50 pb-2">
                      <span className="text-gray-400 text-[10px] font-black uppercase tracking-tighter">Network Status</span>
                      <span className="text-blue-700 text-[10px] font-black px-3 py-1 bg-blue-50 rounded-lg border border-blue-100 uppercase tracking-widest">{getNetworkStatus(searchResult)}</span>
                  </div>
                </div>
              </div>

              {/* Accumulators */}
              <div className="bg-white rounded-2xl shadow-xl border overflow-hidden">
                <div className="bg-[#004b8d] px-6 py-3 text-white font-black text-[10px] uppercase tracking-[0.2em]">Accumulators (MTD)</div>
                <div className="p-6 grid grid-cols-1 gap-6">
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col justify-center shadow-inner">
                    <p className="text-[10px] font-black text-gray-400 uppercase mb-1 tracking-tighter">Plan Year Max</p>
                    <p className="text-3xl font-black text-gray-800">${searchResult.primaryInsurance?.coverage.toLocaleString()}</p>
                    <div className="w-full bg-gray-200 h-1.5 rounded-full mt-3 overflow-hidden">
                        <div className="bg-green-500 h-full" style={{ width: `${((searchResult.primaryInsurance!.coverage - searchResult.primaryInsurance!.used) / searchResult.primaryInsurance!.coverage) * 100}%` }}></div>
                    </div>
                    <p className="text-[9px] font-black text-green-600 mt-2 uppercase tracking-tighter">Remaining: ${(searchResult.primaryInsurance!.coverage - searchResult.primaryInsurance!.used).toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col justify-center shadow-inner">
                    <p className="text-[10px] font-black text-gray-400 uppercase mb-1 tracking-tighter">Deductible Status</p>
                    <p className="text-3xl font-black text-gray-800">${searchResult.primaryInsurance?.met}</p>
                    <div className="w-full bg-gray-200 h-1.5 rounded-full mt-3 overflow-hidden">
                        <div className="bg-blue-500 h-full" style={{ width: `${(searchResult.primaryInsurance!.met / searchResult.primaryInsurance!.deductible) * 100}%` }}></div>
                    </div>
                    <p className="text-[9px] font-black text-gray-400 mt-2 uppercase tracking-tighter">Met / Total: ${searchResult.primaryInsurance?.deductible}</p>
                  </div>
                </div>
              </div>

              {/* Policy Provisions & Clauses */}
              <div className="bg-white rounded-2xl shadow-xl border overflow-hidden">
                <div className="bg-slate-700 px-6 py-3 text-white font-black text-[10px] uppercase tracking-[0.2em] flex justify-between items-center">
                    <span>Policy Provisions</span>
                    <span className="text-orange-400">⚠️ Provisions Found</span>
                </div>
                <div className="p-6 space-y-5">
                   <div className="flex items-start gap-4 p-3 bg-orange-50 border border-orange-100 rounded-xl">
                      <div className="text-xl">🦷</div>
                      <div>
                         <p className="text-[10px] font-black text-orange-800 uppercase tracking-widest">Missing Tooth Clause</p>
                         <p className="text-xs font-bold text-orange-600 leading-tight">ACTIVE - Procedures related to teeth missing prior to effective date are EXCLUDED.</p>
                      </div>
                   </div>
                   <div className="space-y-3">
                      <div className="flex justify-between border-b border-gray-50 pb-2">
                        <span className="text-gray-400 text-[10px] font-black uppercase tracking-tighter">Waiting Periods</span>
                        <span className="text-gray-800 text-xs font-bold">None Detected</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-50 pb-2">
                        <span className="text-gray-400 text-[10px] font-black uppercase tracking-tighter">Downgrades</span>
                        <span className="text-gray-800 text-xs font-bold">Composite to Amalgam</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-50 pb-2">
                        <span className="text-gray-400 text-[10px] font-black uppercase tracking-tighter">Alternative Benefit</span>
                        <span className="text-gray-800 text-xs font-bold">Least Costly Service Applies</span>
                      </div>
                   </div>
                </div>
              </div>
            </div>

            {/* Coordination of Benefits Section */}
            <div className="bg-white rounded-2xl shadow-xl border overflow-hidden">
               <div className="bg-indigo-600 px-6 py-3 text-white font-black text-[10px] uppercase tracking-[0.2em] flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.826a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                        Coordination of Benefits (COB)
                    </div>
                    <span className="text-indigo-200">System Link Active</span>
               </div>
               <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                         <p className="text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest">Payer Identification Registry</p>
                         <div className="flex items-center gap-4 bg-indigo-50 border border-indigo-100 p-4 rounded-xl">
                            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-indigo-600 shadow-sm border">
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                            </div>
                            <div>
                                <p className="text-sm font-black text-indigo-900">Secondary Insurance Detected</p>
                                <p className="text-xs text-indigo-700 font-bold">Blue Cross Blue Shield (BCBS) - Federal Plan</p>
                                <div className="mt-2 flex items-center gap-2">
                                    <span className="px-2 py-0.5 bg-green-200 text-green-800 text-[9px] font-black rounded uppercase">Active Status</span>
                                    <span className="text-[10px] text-indigo-400 font-bold">ID: FED-882910</span>
                                </div>
                            </div>
                         </div>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest">Payer System Remark</p>
                        <div className="text-xs text-gray-600 leading-relaxed font-medium bg-gray-50 p-4 rounded-xl border border-dashed italic">
                            "Clearinghouse has identified a secondary payer on file via X12 271 EB01 response. Verification of Order of Benefits is recommended before clinical services are rendered."
                        </div>
                    </div>
               </div>
            </div>

            {/* Service Type Detail Table */}
            <div className="bg-white rounded-2xl shadow-xl border overflow-hidden">
              <div className="bg-slate-50 px-6 py-4 border-b flex justify-between items-center">
                  <h3 className="font-black text-xs uppercase text-slate-500 tracking-widest">Procedural Coverage Breakdown</h3>
                  <div className="flex gap-2">
                     <span className="px-2 py-0.5 bg-green-50 text-green-600 border border-green-100 text-[9px] font-black rounded uppercase">Negotiated Rates Applied</span>
                  </div>
              </div>
              <table className="w-full text-xs">
                <thead className="bg-gray-50/50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left font-black text-gray-500 uppercase tracking-tighter">Service Category</th>
                    <th className="px-6 py-4 text-center font-black text-gray-500 uppercase tracking-tighter">INN (%)</th>
                    <th className="px-6 py-4 text-center font-black text-gray-500 uppercase tracking-tighter">OON (%)</th>
                    <th className="px-6 py-4 text-center font-black text-gray-500 uppercase tracking-tighter bg-slate-100/50">Payer Max Allowed</th>
                    <th className="px-6 py-4 text-center font-black text-gray-500 uppercase tracking-tighter">Deductible App.</th>
                    <th className="px-6 py-4 text-left font-black text-gray-500 uppercase tracking-tighter">Payer Constraints</th>
                  </tr>
                </thead>
                <tbody className="divide-y font-medium text-gray-700">
                  <tr className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-6 py-4 font-black text-gray-800">Preventive (Diagnostic)</td>
                    <td className="px-6 py-4 text-center text-green-600 font-black text-lg">100%</td>
                    <td className="px-6 py-4 text-center text-indigo-700 font-black text-lg">80%</td>
                    <td className="px-6 py-4 text-center font-mono font-black text-slate-800 bg-slate-50/30">$125.00</td>
                    <td className="px-6 py-4 text-center text-gray-400 font-bold uppercase">No</td>
                    <td className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase">2 Exams per Benefit Period</td>
                  </tr>
                  <tr className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-6 py-4 font-black text-gray-800">Basic (Restorative)</td>
                    <td className="px-6 py-4 text-center text-blue-600 font-black text-lg">80%</td>
                    <td className="px-6 py-4 text-center text-indigo-700 font-black text-lg">60%</td>
                    <td className="px-6 py-4 text-center font-mono font-black text-slate-800 bg-slate-50/30">$450.00</td>
                    <td className="px-6 py-4 text-center text-indigo-500 font-bold uppercase">Yes</td>
                    <td className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase">Posterior Composites Downgraded</td>
                  </tr>
                  <tr className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-6 py-4 font-black text-gray-800">Major (Prosthetics)</td>
                    <td className="px-6 py-4 text-center text-blue-600 font-black text-lg">50%</td>
                    <td className="px-6 py-4 text-center text-indigo-700 font-black text-lg">30%</td>
                    <td className="px-6 py-4 text-center font-mono font-black text-slate-800 bg-slate-50/30">$1,200.00</td>
                    <td className="px-6 py-4 text-center text-indigo-500 font-bold uppercase">Yes</td>
                    <td className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase">6 Month Waiting Period Expired</td>
                  </tr>
                  <tr className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-6 py-4 font-black text-gray-800">Endodontic Services</td>
                    <td className="px-6 py-4 text-center text-blue-600 font-black text-lg">80%</td>
                    <td className="px-6 py-4 text-center text-indigo-700 font-black text-lg">60%</td>
                    <td className="px-6 py-4 text-center font-mono font-black text-slate-800 bg-slate-50/30">$850.00</td>
                    <td className="px-6 py-4 text-center text-indigo-500 font-bold uppercase">Yes</td>
                    <td className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase">Radiographs Required for Claim</td>
                  </tr>
                  <tr className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-6 py-4 font-black text-gray-800">Periodontal Scaling</td>
                    <td className="px-6 py-4 text-center text-blue-600 font-black text-lg">80%</td>
                    <td className="px-6 py-4 text-center text-indigo-700 font-black text-lg">60%</td>
                    <td className="px-6 py-4 text-center font-mono font-black text-slate-800 bg-slate-50/30">$220.00</td>
                    <td className="px-6 py-4 text-center text-indigo-500 font-bold uppercase">Yes</td>
                    <td className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase">4 Quad limit per 24 Months</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-3 pb-8">
              <button 
                onClick={() => setSearchResult(null)}
                className="px-8 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl text-xs font-black uppercase tracking-widest hover:border-blue-400 hover:text-blue-600 transition-all shadow-sm"
              >
                Clear Results
              </button>
              <button 
                onClick={() => window.print()}
                className="px-8 py-3 bg-[#004b8d] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#003666] shadow-lg flex items-center gap-2 transition-all active:scale-95"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                Print Verification Summary
              </button>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center max-w-md mx-auto">
            <div className="w-32 h-32 bg-white rounded-[2rem] shadow-xl flex items-center justify-center mb-8 border border-blue-50">
               <svg className="w-16 h-16 text-blue-100" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.4503-.385l-7 3a1 1 0 00-.547.895v10a1 1 0 001.45.894l7-3a1 1 0 00.547-.895v-10zM11 13.09l-5 2.143V7.16l5-2.143v8.073z" clipRule="evenodd" /></svg>
            </div>
            <h3 className="text-xl font-black text-gray-800 uppercase tracking-widest mb-4">Patient Eligibility Gateway</h3>
            <p className="text-sm font-medium leading-relaxed text-gray-500">
              Verify real-time insurance status and detailed benefit procedural coverage by entering subscriber information in the left panel.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-4 w-full">
                <div className="p-3 bg-white rounded-xl border border-gray-100 text-left">
                    <p className="text-[10px] font-black text-blue-600 uppercase mb-1">Status Coverage</p>
                    <p className="text-[11px] font-bold text-gray-400">Instant Active/Inactive verification via X12 271 response.</p>
                </div>
                <div className="p-3 bg-white rounded-xl border border-gray-100 text-left">
                    <p className="text-[10px] font-black text-blue-600 uppercase mb-1">Accumulators</p>
                    <p className="text-[11px] font-bold text-gray-400">View real-time remaining annual maximums and deductibles.</p>
                </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );

  const renderClaims = () => (
    <div className="flex-grow bg-gray-50 p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-2xl font-black text-[#004b8d] uppercase tracking-tight">Claims Management</h2>
            <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">Real-Time Electronic Submissions Control</p>
          </div>
          <button 
            onClick={() => setIsClaimModalOpen(true)}
            className="px-6 py-2 bg-[#004b8d] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#003666] shadow-lg transition-all active:scale-95"
          >
            Submit New Claim
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-[#004b8d] text-white uppercase text-[10px] font-black tracking-widest">
              <tr>
                <th className="px-6 py-4 text-left">Claim ID</th>
                <th className="px-6 py-4 text-left">Patient Name</th>
                <th className="px-6 py-4 text-left">Date of Service</th>
                <th className="px-6 py-4 text-left">Status</th>
                <th className="px-6 py-4 text-right">Charge Amount</th>
                <th className="px-6 py-4 text-right">Payer Paid</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y font-medium text-gray-700">
              {[
                { id: 'CLM-00921', name: 'Torres, Miguel', date: '2025-10-15', status: 'Paid', charge: 220.00, paid: 176.00 },
                { id: 'CLM-00944', name: 'Smith, Jane', date: '2025-10-22', status: 'Pending', charge: 125.00, paid: 0.00 },
                { id: 'CLM-00958', name: 'Gable, Jennifer', date: '2025-10-25', status: 'Rejected', charge: 950.00, paid: 0.00, reason: 'Missing X-Rays' },
                { id: 'CLM-00982', name: 'Nguyen, Liam', date: '2025-11-01', status: 'In Process', charge: 300.00, paid: 0.00 },
              ].map(claim => (
                <tr key={claim.id} className="hover:bg-blue-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-blue-800">{claim.id}</td>
                  <td className="px-6 py-4 font-black">{claim.name}</td>
                  <td className="px-6 py-4">{claim.date}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full font-black uppercase text-[9px] border-2 ${
                      claim.status === 'Paid' ? 'bg-green-50 text-green-700 border-green-100' :
                      claim.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-100' :
                      'bg-blue-50 text-blue-700 border-blue-100'
                    }`}>
                      {claim.status}
                    </span>
                    {claim.reason && <p className="text-[9px] text-red-500 mt-2 font-black uppercase italic tracking-tighter">Reason: {claim.reason}</p>}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-gray-900">${claim.charge.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right font-black text-green-600">${claim.paid.toFixed(2)}</td>
                  <td className="px-6 py-4 text-center">
                    <button className="text-[#004b8d] font-black uppercase hover:underline text-[10px] tracking-widest">View EOB</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderAuthorizations = () => (
    <div className="flex-grow bg-gray-50 p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        <h2 className="text-2xl font-black text-[#004b8d] uppercase tracking-tight">Prior Authorizations</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-xl border-l-8 border-l-orange-500">
            <p className="text-[10px] font-black text-gray-400 uppercase mb-1 tracking-widest">Awaiting Review</p>
            <p className="text-4xl font-black text-gray-800">12</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-xl border-l-8 border-l-green-500">
            <p className="text-[10px] font-black text-gray-400 uppercase mb-1 tracking-widest">Approved Cases</p>
            <p className="text-4xl font-black text-gray-800">45</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-xl border-l-8 border-l-red-500">
            <p className="text-[10px] font-black text-gray-400 uppercase mb-1 tracking-widest">Requesting Docs</p>
            <p className="text-4xl font-black text-gray-800">3</p>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-xl border p-6 flex flex-col gap-6">
          <div className="flex items-center gap-4 border-b pb-4">
             <div className="relative flex-grow">
               <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
               </span>
               <input 
                 type="text" 
                 placeholder="Filter by Patient Name, Auth ID, or Service..." 
                 className="w-full pl-12 pr-4 py-3 border rounded-xl text-sm focus:ring-4 focus:ring-[#004b8d]/10 outline-none font-medium transition-all" 
                 value={authSearchQuery}
                 onChange={e => setAuthSearchQuery(e.target.value)}
               />
             </div>
             <button className="px-8 py-3 bg-[#004b8d] text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-lg hover:bg-[#003666] transition-all active:scale-95">
               Find Case
             </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th onClick={() => handleAuthSort('id')} className="px-4 py-4 text-left font-black text-gray-500 uppercase tracking-tighter cursor-pointer hover:bg-gray-100 transition-colors">
                    Auth ID {authSortConfig.key === 'id' && (authSortConfig.direction === 'asc' ? '▲' : '▼')}
                  </th>
                  <th onClick={() => handleAuthSort('name')} className="px-4 py-4 text-left font-black text-gray-500 uppercase tracking-tighter cursor-pointer hover:bg-gray-100 transition-colors">
                    Patient {authSortConfig.key === 'name' && (authSortConfig.direction === 'asc' ? '▲' : '▼')}
                  </th>
                  <th className="px-4 py-4 text-left font-black text-gray-500 uppercase tracking-tighter">Proposed Service</th>
                  <th onClick={() => handleAuthSort('submitted')} className="px-4 py-4 text-left font-black text-gray-500 uppercase tracking-tighter cursor-pointer hover:bg-gray-100 transition-colors">
                    Submitted {authSortConfig.key === 'submitted' && (authSortConfig.direction === 'asc' ? '▲' : '▼')}
                  </th>
                  <th onClick={() => handleAuthSort('status')} className="px-4 py-4 text-left font-black text-gray-500 uppercase tracking-tighter cursor-pointer hover:bg-gray-100 transition-colors">
                    Status {authSortConfig.key === 'status' && (authSortConfig.direction === 'asc' ? '▲' : '▼')}
                  </th>
                  <th className="px-4 py-4 text-center font-black text-gray-500 uppercase tracking-tighter">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y font-medium text-gray-700">
                {sortedAndFilteredAuthorizations.length > 0 ? sortedAndFilteredAuthorizations.map(auth => (
                  <tr key={auth.id} className="hover:bg-blue-50 transition-colors group">
                    <td className="px-4 py-4 font-bold text-blue-800 flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                            auth.status === 'Approved' ? 'bg-green-500' :
                            auth.status === 'Requesting Docs' ? 'bg-orange-500' :
                            'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]'
                        }`}></span>
                        {auth.id}
                    </td>
                    <td className="px-4 py-4 font-black">{auth.name}</td>
                    <td className="px-4 py-4">{auth.service}</td>
                    <td className="px-4 py-4 text-gray-400 font-bold">{auth.submitted}</td>
                    <td className="px-4 py-4">
                      <span className={`px-3 py-1 rounded-full font-black uppercase text-[9px] border-2 flex items-center gap-1.5 w-fit ${
                        auth.status === 'Approved' ? 'bg-green-50 text-green-700 border-green-100' :
                        auth.status === 'Requesting Docs' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                        'bg-blue-50 text-blue-700 border-blue-100'
                      }`}>
                        <span className={`w-1 h-1 rounded-full ${
                            auth.status === 'Approved' ? 'bg-green-600' :
                            auth.status === 'Requesting Docs' ? 'bg-orange-600' :
                            'bg-blue-600'
                        }`}></span>
                        {auth.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button onClick={() => setSelectedAuth(auth)} className="px-4 py-1.5 bg-white border border-gray-200 rounded-lg text-[#004b8d] font-black uppercase text-[10px] tracking-widest hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm">Details</button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="py-20 text-center text-gray-400 italic font-bold">No authorizations matching your current search parameters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="flex-grow bg-gray-50 p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-between items-end mb-4">
            <div>
                <h2 className="text-2xl font-black text-[#004b8d] uppercase tracking-tight">Portal Settings</h2>
                <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">Clearinghouse & EDI Global Configuration</p>
            </div>
            <button 
                onClick={() => dispatch({ type: 'ADD_TOAST', payload: { message: 'Global EDI Settings synchronized with Clearinghouse.', type: 'success' } })}
                className="px-6 py-2 bg-green-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-green-700 shadow-lg transition-all active:scale-95"
            >
                Sync with Payer
            </button>
        </div>
        
        <div className="grid grid-cols-1 gap-8">
          {/* Section: Identifiers */}
          <div className="bg-white p-8 rounded-2xl shadow-xl border space-y-6">
            <h3 className="font-black text-gray-800 uppercase text-xs tracking-widest border-b pb-2 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-5m-4 0V5a2 2 0 012-2h2a2 2 0 012 2v1m-4 0h4" /></svg>
                Practice Identification
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-tighter">Federal Tax ID / EIN</label>
                <input type="text" value="99-8877665" className="w-full p-3 border-2 border-gray-100 rounded-xl bg-gray-50 text-gray-600 font-black outline-none focus:border-blue-200" readOnly />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-tighter">Billing NPI (Type 2)</label>
                <input type="text" value="1234567890" className="w-full p-3 border-2 border-gray-100 rounded-xl bg-gray-50 text-gray-600 font-black outline-none focus:border-blue-200" readOnly />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-tighter">Clearinghouse Sender ID</label>
                <input type="text" value="EDI-SND-WALKTHRU-9" className="w-full p-3 border-2 border-gray-100 rounded-xl bg-gray-50 text-blue-700 font-mono font-bold outline-none focus:border-blue-200 uppercase" readOnly />
              </div>
            </div>
          </div>

          {/* Section: Connectivity */}
          <div className="bg-white p-8 rounded-2xl shadow-xl border space-y-6">
            <h3 className="font-black text-gray-800 uppercase text-xs tracking-widest border-b pb-2 flex items-center gap-2">
                <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071a9.5 9.5 0 0113.84 0m-16.14-5.656a13.5 13.5 0 0118.44 0" /></svg>
                Payer Connectivity Hub
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['Delta Dental', 'Aetna', 'Cigna', 'MetLife'].map(payer => (
                <div key={payer} className="flex justify-between items-center p-4 border-2 rounded-2xl bg-white hover:border-blue-200 transition-all shadow-sm group">
                  <div>
                    <span className="font-black text-gray-700 tracking-tight">{payer}</span>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">Active EDI Stream</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => dispatch({ type: 'ADD_TOAST', payload: { message: `Opening secure credential vault for ${payer}...`, type: 'info' } })}
                    className="text-xs font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-2 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-all"
                  >
                    Manage Keys
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Preferences */}
          <div className="bg-white p-8 rounded-2xl shadow-xl border space-y-8">
             <h3 className="font-black text-gray-800 uppercase text-xs tracking-widest border-b pb-2 flex items-center gap-2">
                <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                Transaction Workflow Engine
             </h3>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                <div className="space-y-6">
                    <label className="flex items-center gap-4 cursor-pointer group">
                        <div className="relative">
                            <input type="checkbox" className="sr-only" defaultChecked />
                            <div className="w-12 h-6 bg-blue-600 rounded-full"></div>
                            <div className="absolute right-1 top-1 bg-white w-4 h-4 rounded-full transition-all translate-x-0"></div>
                        </div>
                        <div>
                            <span className="text-sm font-black text-gray-800 uppercase tracking-tight block">Pre-emptive Verification</span>
                            <span className="text-[11px] text-gray-400 font-bold leading-none">Auto-verify 24h prior to appointment start time.</span>
                        </div>
                    </label>

                    <label className="flex items-center gap-4 cursor-pointer group">
                        <div className="relative">
                            <input type="checkbox" className="sr-only" />
                            <div className="w-12 h-6 bg-gray-300 rounded-full"></div>
                            <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-all"></div>
                        </div>
                        <div>
                            <span className="text-sm font-black text-gray-800 uppercase tracking-tight block">Claim Error Shield</span>
                            <span className="text-[11px] text-gray-400 font-bold leading-none">Notify Billing Coordinator on 835 rejection.</span>
                        </div>
                    </label>

                    <label className="flex items-center gap-4 cursor-pointer group">
                        <div className="relative">
                            <input type="checkbox" className="sr-only" defaultChecked />
                            <div className="w-12 h-6 bg-blue-600 rounded-full"></div>
                            <div className="absolute right-1 top-1 bg-white w-4 h-4 rounded-full transition-all translate-x-0"></div>
                        </div>
                        <div>
                            <span className="text-sm font-black text-gray-800 uppercase tracking-tight block">X12 Real-Time Bridge</span>
                            <span className="text-[11px] text-gray-400 font-bold leading-none">Fetch historical EOBs automatically on claim login.</span>
                        </div>
                    </label>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">EDI Submission Frequency</label>
                        <select className="w-full p-3 border-2 border-gray-100 rounded-xl bg-gray-50 text-gray-700 font-black outline-none focus:border-blue-200">
                            <option>Real-Time (Per Claim)</option>
                            <option>Hourly Batch</option>
                            <option>End of Day (17:00)</option>
                            <option>Manual Release Only</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Eligibility History Depth</label>
                        <select className="w-full p-3 border-2 border-gray-100 rounded-xl bg-gray-50 text-gray-700 font-black outline-none focus:border-blue-200">
                            <option>Latest Response Only</option>
                            <option>Last 6 Months</option>
                            <option>Last 12 Months</option>
                            <option>Unlimited Archive</option>
                        </select>
                    </div>
                </div>
             </div>
          </div>
        </div>

        <div className="bg-blue-50 border-2 border-blue-100 p-6 rounded-2xl flex items-start gap-4">
            <div className="w-10 h-10 bg-white rounded-xl shadow-sm border flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
                <p className="text-xs font-black text-blue-800 uppercase tracking-tight">Technical Support Reference</p>
                <p className="text-[11px] text-blue-700 font-medium mt-1 leading-relaxed">
                    Changes made here impact the global behavior of the clearinghouse module. Ensure practice NPI and Tax ID match your provider contract on file with individual payers to avoid EDI transaction rejection.
                </p>
            </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-white animate-slide-in-from-right font-sans overflow-hidden">
      {/* Portal Header - Availity Style */}
      <header className="bg-[#004b8d] text-white p-4 flex justify-between items-center shadow-lg shrink-0 z-10">
        <div className="flex items-center gap-4">
          <div className="bg-white rounded-xl p-2 shadow-inner">
            <svg className="w-8 h-8 text-[#004b8d]" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12V13a1 1 0 00.553.894l4.5 2.25a1 1 0 00.894 0l4.5-2.25A1 1 0 0016 13v-2.88l1.69-.723a1 1 0 00.553-1.42l-1.028-1.542a1 1 0 00-.788-.388H3.575a1 1 0 00-.788.388l-1.028 1.542a1 1 0 00.551 1.42z" />
            </svg>
          </div>
          <div className="cursor-pointer group" onClick={() => setActiveTab('eligibility')}>
            <h1 className="text-2xl font-black tracking-tighter leading-none uppercase group-hover:text-blue-200 transition-colors">Payer Connect</h1>
            <p className="text-[10px] font-black text-blue-200 uppercase mt-1 tracking-[0.3em] opacity-80">X12 EDI Clearinghouse Simulation</p>
          </div>
        </div>
        <div className="flex items-center gap-8 text-[11px] font-black uppercase tracking-[0.2em]">
          <button 
            onClick={() => setActiveTab('claims')}
            className={`transition-all py-2 border-b-4 ${activeTab === 'claims' ? 'border-white text-white' : 'border-transparent text-white/60 hover:text-white'}`}
          >
            Claims
          </button>
          <button 
            onClick={() => setActiveTab('authorizations')}
            className={`transition-all py-2 border-b-4 ${activeTab === 'authorizations' ? 'border-white text-white' : 'border-transparent text-white/60 hover:text-white'}`}
          >
            Prior-Auths
          </button>
          <button 
            onClick={() => setActiveTab('eligibility')}
            className={`transition-all py-2 border-b-4 ${activeTab === 'eligibility' ? 'border-white text-white' : 'border-transparent text-white/60 hover:text-white'}`}
          >
            Inquiry
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`transition-all py-2 border-b-4 ${activeTab === 'settings' ? 'border-white text-white' : 'border-transparent text-white/60 hover:text-white'}`}
          >
            Settings
          </button>
        </div>
      </header>

      {/* Dynamic Content Switching */}
      <div className="flex-grow flex flex-col overflow-hidden">
        {activeTab === 'eligibility' && renderEligibility()}
        {activeTab === 'claims' && renderClaims()}
        {activeTab === 'authorizations' && renderAuthorizations()}
        {activeTab === 'settings' && renderSettings()}
      </div>

      {isClaimModalOpen && (
        <SubmitClaimModal 
          onClose={() => setIsClaimModalOpen(false)} 
          patients={patients} 
          selectedPatientId={selectedPatientId}
          onSuccess={(id) => {
            dispatch({ type: 'ADD_TOAST', payload: { message: `EDI Claim ${id} successfully queued for batch transmission.`, type: 'success' } });
            dispatch({ type: 'LOG_ACTION', payload: { type: 'transmit_edi_claim', details: { claimId: id } } });
            setIsClaimModalOpen(false);
          }}
        />
      )}

      {selectedAuth && (
        <AuthDetailsModal 
          auth={selectedAuth} 
          onClose={() => setSelectedAuth(null)} 
        />
      )}
    </div>
  );
};

export default InsurancePortal;
