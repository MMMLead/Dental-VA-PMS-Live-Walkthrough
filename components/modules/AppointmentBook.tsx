import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSimulationContext } from '../../context/SimulationContext';
import { Appointment, Module, Patient } from '../../types';
import { PROVIDERS, TREATMENTS, PROVIDER_SCHEDULES, APPOINTMENT_TYPES, APPOINTMENT_STATUSES, PROVIDER_COLORS } from '../../constants';
import AppointmentSymbolsGuide from '../ui/AppointmentSymbolsGuide';

interface AppointmentBookProps {
  setActiveModule: (module: Module) => void;
}

const isSameDay = (d1: Date, d2: Date) => 
  d1.getFullYear() === d2.getFullYear() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getDate() === d2.getDate();

const validateProviderAvailability = (
    provider: string,
    operatory: number,
    startTime: Date,
    duration: number,
    appointments: Appointment[],
    excludeAppointmentId?: string
): { valid: boolean; reason?: string; type?: 'block' | 'collision' | 'gap' } => {
    return { valid: true };
};

const ConfirmationModal: React.FC<{
    title: string;
    message: string;
    confirmText: string;
    onConfirm: () => void;
    onCancel: () => void;
    variant?: 'danger' | 'warning';
}> = ({ title, message, confirmText, onConfirm, onCancel, variant = 'danger' }) => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-[100] animate-fade-in-fast" onClick={onCancel}>
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 transform animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-6 mx-auto ${variant === 'danger' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                {variant === 'danger' ? (
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                ) : (
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                )}
            </div>
            <h3 className="text-xl font-black text-gray-800 text-center uppercase tracking-tight mb-2">{title}</h3>
            <p className="text-gray-500 text-center text-sm font-medium leading-relaxed mb-8">{message}</p>
            <div className="flex flex-col gap-3">
                <button 
                    onClick={onConfirm}
                    className={`w-full py-3 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg transition-all active:scale-95 ${variant === 'danger' ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-orange-500 text-white hover:bg-orange-600'}`}
                >
                    {confirmText}
                </button>
                <button 
                    onClick={onCancel}
                    className="w-full py-3 bg-gray-100 text-gray-500 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-gray-200 transition-colors"
                >
                    Keep Appointment
                </button>
            </div>
        </div>
    </div>
);

const AppointmentIcons: React.FC<{ appointment: Appointment; patient: Patient | undefined; isConflict: boolean }> = ({ appointment, patient, isConflict }) => {
  if (appointment.isBlock) return null; 
  if (!patient) return null;

  const { hasNote, insuranceEligibility, labCase } = appointment;
  const hasMedicalAlert = patient.medicalHistory.length > 0 && patient.medicalHistory[0] !== 'None';
  const hasPatientAlert = patient.patientAlerts && patient.patientAlerts.length > 0;

  return (
    <div className="flex items-center space-x-1 text-xs mt-1">
        {isConflict && <span title="Scheduling Conflict" className="text-base">🔥</span>}
        {hasNote && <span title="Has Note">🎵</span>}
        {appointment.isNewPatient && <span className="font-bold text-black" title="New Patient">NP</span>}
        {insuranceEligibility === 'issue' && <span title="Insurance Issue" className="w-4 h-4 flex items-center justify-center font-bold text-xs text-yellow-800 bg-yellow-200 border border-yellow-400">E</span>}
        {insuranceEligibility === 'pending' && <span title="Insurance Pending"  className="w-4 h-4 flex items-center justify-center font-bold text-xs text-blue-800 bg-blue-200 border border-blue-400">E</span>}
        {labCase === 'sent' && <span title="Lab Case Sent" className="w-4 h-4 flex items-center justify-center font-bold text-xs text-red-800 bg-transparent border-2 border-red-600">L</span>}
        {labCase === 'received' && <span title="Lab Case Received" className="w-4 h-4 flex items-center justify-center font-bold text-xs text-white bg-red-600 border border-red-800">L</span>}
        {hasMedicalAlert && <span title="Medical Alert" className="w-4 h-4 flex items-center justify-center font-bold text-white bg-red-500 border border-red-700">+</span>}
        {hasPatientAlert && <span title="Patient Alert" className="text-yellow-500 text-lg">▼</span>}
    </div>
  );
};

const AppointmentTooltip: React.FC<{ appointment: Appointment; patient?: Patient; position: { x: number; y: number } }> = ({ appointment, patient, position }) => {
    const style: React.CSSProperties = {
        position: 'fixed',
        top: position.y + 10,
        left: position.x + 10,
        zIndex: 50,
        pointerEvents: 'none',
    };

    if (appointment.isBlock) {
         return (
            <div style={style} className="w-48 bg-gray-900 text-white p-3 rounded-lg shadow-xl text-xs border-l-4 border-red-500">
                <div className="font-bold text-sm mb-1">⛔ Provider Blocked</div>
                <div className="mb-1"><strong>Provider:</strong> {appointment.provider}</div>
                <div className="mb-1"><strong>Reason:</strong> {appointment.blockReason}</div>
                <div><strong>Duration:</strong> {appointment.duration} min</div>
            </div>
        );
    }

    if (!patient) return null;

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

    const statusLabel = APPOINTMENT_STATUSES.find(s => s.code === appointment.status)?.label || appointment.status;

    return (
        <div style={style} className="w-64 bg-gray-800 text-white p-3 rounded-lg shadow-xl text-xs">
            <div className="font-bold text-base mb-2 pb-2 border-b border-gray-600">
                {patient.lastName}, {patient.firstName}
                <span className="font-normal text-sm text-gray-300 ml-2">(#{patient.chartNumber})</span>
            </div>
            <div className="space-y-1">
                <p><strong>DOB:</strong> {patient.dob} ({calculateAge(patient.dob)}y)</p>
                <p><strong>Provider:</strong> {appointment.provider}</p>
                {appointment.additionalProvider && <p><strong>Asst. Provider:</strong> {appointment.additionalProvider}</p>}
                <p><strong>Time:</strong> {appointment.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({appointment.duration} min)</p>
                <p><strong>Treatment:</strong> {appointment.treatment}</p>
                {appointment.status && <p><strong>Status:</strong> <span className="font-semibold px-2 py-0.5 bg-gray-600 rounded-full">{statusLabel} ({appointment.status})</span></p>}
                {appointment.appointmentType && <p><strong>Type:</strong> <span className="font-semibold px-2 py-0.5 bg-blue-600 rounded-full">{appointment.appointmentType}</span></p>}
                {appointment.insuranceEligibility && <p><strong>Eligibility:</strong> <span className="font-semibold">{appointment.insuranceEligibility.charAt(0).toUpperCase() + appointment.insuranceEligibility.slice(1)}</span></p>}
                {appointment.labCase && <p><strong>Lab Case:</strong> <span className="font-semibold">{appointment.labCase.charAt(0).toUpperCase() + appointment.labCase.slice(1)}</span></p>}
                {patient.medicalAlerts && patient.medicalAlerts.length > 0 && (
                    <p className="p-1 bg-red-500 rounded font-bold">🚨 MEDICAL ALERT: {patient.medicalAlerts.join('; ')}</p>
                )}
                 {patient.patientAlerts && patient.patientAlerts.length > 0 && (
                    <p className="p-1 bg-yellow-500 text-black rounded font-bold">🗣️ PATIENT ALERT: {patient.patientAlerts.join('; ')}</p>
                )}
            </div>
        </div>
    );
};

const NewAppointmentModal: React.FC<{
  slotData: { startTime: Date; operatory: number };
  onClose: () => void;
  onSave: (newAppointments: (Omit<Appointment, 'id' | 'color'> & { color?: string })[]) => void;
}> = ({ slotData, onClose, onSave }) => {
    const { state, dispatch } = useSimulationContext();
    const [mode, setMode] = useState<'appointment' | 'block'>('appointment');

    const [patientId, setPatientId] = useState('');
    const [patientSearchTerm, setPatientSearchTerm] = useState('');
    const [provider, setProvider] = useState(PROVIDERS[0]);
    const [additionalProvider, setAdditionalProvider] = useState('');
    const [treatment, setTreatment] = useState('');
    const [appointmentType, setAppointmentType] = useState('General');
    const [status, setStatus] = useState('FIRM');
    const [duration, setDuration] = useState(60);
    const [notes, setNotes] = useState('');
    const [primaryInsuranceId, setPrimaryInsuranceId] = useState('none');
    const [secondaryInsuranceId, setSecondaryInsuranceId] = useState('none');
    const [labCase, setLabCase] = useState('');
    const [insuranceEligibility, setInsuranceEligibility] = useState('');
    const [blockReason, setBlockReason] = useState('');

    const filteredPatients = useMemo(() => {
        let results = state.patients;
        if (patientSearchTerm) {
            const term = patientSearchTerm.toLowerCase();
            results = results.filter(p => 
                `${p.firstName} ${p.lastName}`.toLowerCase().includes(term) ||
                p.id.toString().includes(term) ||
                p.dob.includes(term)
            );
        }
        return results.sort((a, b) => a.lastName.localeCompare(b.lastName));
    }, [state.patients, patientSearchTerm]);
    
    const selectedPatientForModal = useMemo(() => patientId ? state.patients.find(p => p.id === Number(patientId)) : null, [patientId, state.patients]);
    
    useEffect(() => {
        if (selectedPatientForModal) {
            setPrimaryInsuranceId(selectedPatientForModal.primaryInsurance?.isActive ? selectedPatientForModal.primaryInsurance.policyNumber : 'none');
            setSecondaryInsuranceId(selectedPatientForModal.secondaryInsurance?.isActive ? selectedPatientForModal.secondaryInsurance.policyNumber : 'none');
        } else {
            setPrimaryInsuranceId('none');
            setSecondaryInsuranceId('none');
        }
    }, [selectedPatientForModal]);


    const handleSave = () => {
        const colorClass = PROVIDER_COLORS[provider] || PROVIDER_COLORS['default'];

        if (mode === 'block') {
            if (!blockReason) {
                alert('Please provide a reason for blocking the schedule.');
                return;
            }
            const blockData: Omit<Appointment, 'id' | 'color'> & { color?: string } = {
                patientId: -1, 
                operatory: slotData.operatory,
                duration,
                provider,
                treatment: 'Block',
                startTime: slotData.startTime,
                isBlock: true,
                blockReason: blockReason,
                status: 'FIRM',
                color: 'bg-gray-400 text-white border-2 border-gray-500',
            };
            onSave([blockData]);
            return;
        }

        if (!patientId) {
            alert('Please select a patient.');
            return;
        }

        if (!treatment) {
            alert('Please select a procedure for the appointment.');
            return;
        }

        const baseAppointmentData: Omit<Appointment, 'id' | 'color' | 'startTime'> = {
            patientId: Number(patientId),
            operatory: slotData.operatory,
            duration,
            provider,
            treatment: treatment,
            additionalProvider: additionalProvider || undefined,
            labCase: labCase as 'sent' | 'received' | undefined || undefined,
            insuranceEligibility: insuranceEligibility as 'verified' | 'pending' | 'issue' | undefined || undefined,
            procedureCode: TREATMENTS.find(t => t.name === treatment)?.code,
            fee: TREATMENTS.find(t => t.name === treatment)?.fee,
            status: status,
            statusText: 'General',
            notes,
            hasNote: notes.trim().length > 0,
            appointmentType: appointmentType,
            scheduleType: 'Fixed',
            isNewPatient: appointmentType === 'New Patient',
            primaryInsuranceId: primaryInsuranceId !== 'none' ? primaryInsuranceId : undefined,
            secondaryInsuranceId: secondaryInsuranceId !== 'none' ? secondaryInsuranceId : undefined,
        };

        onSave([{ ...baseAppointmentData, startTime: slotData.startTime, color: colorClass }]);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <h2 className="text-xl font-bold text-gray-800">
                        {mode === 'appointment' ? 'New Appointment' : 'Block Provider Time'}
                    </h2>
                    <div className="flex bg-gray-200 rounded p-0.5">
                        <button onClick={() => setMode('appointment')} className={`px-3 py-1 text-xs font-medium rounded ${mode === 'appointment' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:bg-gray-300'}`}>Appointment</button>
                        <button onClick={() => setMode('block')} className={`px-3 py-1 text-xs font-medium rounded ${mode === 'block' ? 'bg-white shadow text-red-600' : 'text-gray-600 hover:bg-gray-300'}`}>Block Time</button>
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto pr-2">
                    <div className="space-y-4">
                        {mode === 'appointment' ? (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Patient</label>
                                    {patientId ? (
                                        <div className="flex items-center justify-between mt-1 p-2 border border-gray-300 rounded-md bg-gray-50">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">{selectedPatientForModal?.lastName}, {selectedPatientForModal?.firstName}</span>
                                                <span className="text-xs text-gray-500">DOB: {selectedPatientForModal?.dob}</span>
                                            </div>
                                            <button type="button" onClick={() => { setPatientId(''); setPatientSearchTerm(''); }} className="text-xs text-red-600 hover:text-red-800 font-medium px-2">Change</button>
                                        </div>
                                    ) : (
                                        <div className="relative mt-1">
                                            <input type="text" placeholder="Search by Name, ID, or DOB..." value={patientSearchTerm} onChange={(e) => setPatientSearchTerm(e.target.value)} className="input-field" autoFocus />
                                            {patientSearchTerm ? (
                                                <ul className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                                                    {filteredPatients.length > 0 ? (
                                                        filteredPatients.map((p) => (
                                                            <li key={p.id} className="cursor-pointer select-none relative py-2 p-3 pr-9 hover:bg-blue-100 text-gray-900 border-b last:border-0" onClick={() => { setPatientId(p.id.toString()); setPatientSearchTerm(''); }}>
                                                                <div className="flex justify-between items-center">
                                                                    <div className="flex flex-col">
                                                                        <span className="font-medium">{p.lastName}, {p.firstName}</span>
                                                                    </div>
                                                                    <div className="flex flex-col text-right">
                                                                        <span className="text-gray-500 text-xs">DOB: {p.dob}</span>
                                                                    </div>
                                                                </div>
                                                            </li>
                                                        ))
                                                    ) : (
                                                         <li className="cursor-default select-none relative py-2 pl-3 pr-9 text-gray-500 text-sm">No matching patients found.</li>
                                                    )}
                                                </ul>
                                            ) : null}
                                        </div>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Appt. Type</label>
                                        <select value={appointmentType} onChange={e => setAppointmentType(e.target.value)} className="input-field">
                                            {APPOINTMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Status</label>
                                        <select value={status} onChange={e => setStatus(e.target.value)} className="input-field">
                                            {APPOINTMENT_STATUSES.map(s => <option key={s.code} value={s.code}>{s.code}: {s.label}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Procedure</label>
                                    <select value={treatment} onChange={e => setTreatment(e.target.value)} className="input-field">
                                        <option value="">Select a procedure...</option>
                                        {TREATMENTS.map(t => <option key={t.name} value={t.name}>{t.name} (${t.fee.toFixed(2)})</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Primary Provider</label>
                                        <select value={provider} onChange={e => setProvider(e.target.value)} className="input-field">
                                            {PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Secondary Provider</label>
                                        <select value={additionalProvider} onChange={e => setAdditionalProvider(e.target.value)} className="input-field">
                                            <option value="">None</option>
                                            {PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Duration (minutes)</label>
                                    <input type="number" step="10" value={duration} onChange={e => setDuration(Number(e.target.value))} className="input-field" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                                    <textarea value={notes} onChange={e => setNotes(e.target.value)} className="input-field h-20" />
                                </div>
                            </>
                        ) : (
                            <div className="space-y-4 bg-red-50 p-4 rounded-md border border-red-200 animate-fade-in-fast">
                                <div className="flex items-center text-red-700 font-semibold mb-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                                    Block Provider Availability
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Provider to Block</label>
                                    <select value={provider} onChange={e => setProvider(e.target.value)} className="input-field">
                                        {PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Reason</label>
                                    <input type="text" value={blockReason} onChange={e => setBlockReason(e.target.value)} className="input-field" placeholder="e.g. Staff Meeting" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Duration (minutes)</label>
                                    <input type="number" step="30" value={duration} onChange={e => setDuration(Number(e.target.value))} className="input-field" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3 flex-shrink-0 pt-4 border-t">
                    <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                    <button 
                        type="button" 
                        onClick={handleSave} 
                        disabled={(mode === 'appointment' && (!patientId || !treatment))} 
                        className={`px-6 py-2.5 text-white rounded-lg text-[11px] font-black uppercase tracking-widest disabled:bg-gray-400 transition-all ${mode === 'appointment' ? 'bg-blue-600 hover:bg-blue-700 shadow-md' : 'bg-red-600 hover:bg-red-700'}`}
                    >
                        {mode === 'appointment' ? 'Save Appointment' : 'Block Time'}
                    </button>
                </div>
            </div>
        </div>
    );
};

interface AppointmentActionMenuProps {
    menu: { appointment: Appointment; position: { x: number; y: number } };
    onClose: () => void;
    onDelete: (id: string) => void;
    onPin: (id: string) => void;
    onWaitlist: (id: string) => void;
    onCancel: (id: string) => void;
    onReschedule: (appointment: Appointment) => void;
}

const AppointmentActionMenu: React.FC<AppointmentActionMenuProps> = ({ menu, onClose, onDelete, onPin, onWaitlist, onCancel, onReschedule }) => {
    const style: React.CSSProperties = {
        position: 'fixed',
        top: menu.position.y,
        left: menu.position.x,
        zIndex: 100,
    };
    const isBlock = menu.appointment.isBlock;

    return (
        <div style={style} className="bg-white rounded-md shadow-2xl border border-gray-200 text-sm animate-fade-in-fast overflow-hidden min-w-[220px]" onClick={e => e.stopPropagation()}>
            <ul className="py-1">
                {!isBlock && (
                    <>
                        <li><button onClick={(e) => { e.stopPropagation(); onReschedule(menu.appointment); }} className="w-full text-left px-4 py-2.5 hover:bg-blue-50 flex items-center cursor-pointer transition-colors font-medium"><span className="mr-3 text-base">📅</span> Edit/Reschedule</button></li>
                        <li className="border-t my-1"></li>
                        <li><button onClick={(e) => { e.stopPropagation(); onPin(menu.appointment.id); }} className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center cursor-pointer transition-colors"><span className="mr-3 text-base">📍</span> Move to Pinboard</button></li>
                        <li><button onClick={(e) => { e.stopPropagation(); onWaitlist(menu.appointment.id); }} className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center cursor-pointer transition-colors"><span className="mr-3 text-base">⏳</span> Add to Waitlist</button></li>
                        <li className="border-t my-1"></li>
                        <li><button onClick={(e) => { e.stopPropagation(); onCancel(menu.appointment.id); }} className="w-full text-left px-4 py-2.5 text-orange-600 hover:bg-orange-50 font-bold flex items-center cursor-pointer transition-colors border-l-4 border-l-transparent hover:border-l-orange-500"><span className="mr-3 text-base">🚫</span> Cancel Appointment</button></li>
                    </>
                )}
                <li><button onClick={(e) => { e.stopPropagation(); onDelete(menu.appointment.id); }} className="w-full text-left px-4 py-2.5 text-red-600 hover:bg-red-50 flex items-center border-t cursor-pointer transition-colors font-bold border-l-4 border-l-transparent hover:border-l-red-500">
                    <span className="mr-3 text-base">🗑️</span> {isBlock ? 'Delete Block' : 'Delete Appointment'}
                </button></li>
            </ul>
        </div>
    );
};

const Pinboard: React.FC<{ onDragStart: (e: React.DragEvent, appointment: Appointment, source: 'pinboard' | 'waitlist') => void }> = ({ onDragStart }) => {
    const { state } = useSimulationContext();
    const getPatient = (id: number) => state.patients.find(p => p.id === id);

    return (
        <div className="h-32 bg-gray-200 border-t-2 border-gray-300 p-2 flex-shrink-0 flex space-x-4">
            <div className="flex-1 flex flex-col min-w-0 border-r border-gray-300 pr-4">
                <h3 className="text-xs font-bold text-gray-700 mb-1 flex items-center uppercase tracking-wider">
                    <span className="mr-2">📍</span> Pinboard
                </h3>
                <div className="flex space-x-2 overflow-x-auto h-full pb-2 scrollbar-thin">
                    {state.pinboardAppointments.length === 0 ? (
                        <div className="flex items-center justify-center w-full h-full text-[10px] text-gray-400 italic border border-dashed border-gray-300 rounded-md">Empty</div>
                    ) : (
                        state.pinboardAppointments.map(apt => {
                            const patient = getPatient(apt.patientId);
                            return (
                                <div key={apt.id} draggable onDragStart={(e) => onDragStart(e, apt, 'pinboard')} className={`p-1 rounded-md text-xs w-32 flex-shrink-0 cursor-grab active:cursor-grabbing ${apt.color} text-gray-800 shadow-md border border-gray-400`}>
                                    <div className="font-bold truncate">{patient?.lastName}, {patient?.firstName}</div>
                                    <div className="truncate text-[10px] text-gray-600">{apt.treatment}</div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            <div className="flex-1 flex flex-col min-w-0">
                <h3 className="text-xs font-bold text-indigo-700 mb-1 flex items-center uppercase tracking-wider">
                    <span className="mr-2">⏳</span> Waitlist ({state.waitlistAppointments.length})
                </h3>
                <div className="flex space-x-2 overflow-x-auto h-full pb-2 scrollbar-thin">
                    {state.waitlistAppointments.length === 0 ? (
                        <div className="flex items-center justify-center w-full h-full text-[10px] text-indigo-300 italic border border-dashed border-indigo-200 rounded-md">No patients waiting</div>
                    ) : (
                        state.waitlistAppointments.map(apt => {
                            const patient = getPatient(apt.patientId);
                            return (
                                <div key={apt.id} draggable onDragStart={(e) => onDragStart(e, apt, 'waitlist')} className="p-1 rounded-md text-xs w-32 flex-shrink-0 cursor-grab active:cursor-grabbing bg-indigo-100 text-indigo-900 shadow-md border border-indigo-300">
                                    <div className="font-bold truncate">{patient?.lastName}, {patient?.firstName}</div>
                                    <div className="truncate text-[10px] text-indigo-700">{apt.treatment}</div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

const EditAppointmentModal: React.FC<{
  appointment: Appointment;
  onClose: () => void;
  onSave: (appointmentId: string, newStartTime: Date, newOperatory: number, newStatus: string, additionalProvider: string) => void;
  operatories: number[];
}> = ({ appointment, onClose, onSave, operatories }) => {
  const [date, setDate] = useState(appointment.startTime.toISOString().split('T')[0]);
  const [time, setTime] = useState(appointment.startTime.toTimeString().substring(0, 5));
  const [operatory, setOperatory] = useState(appointment.operatory);
  const [status, setStatus] = useState(appointment.status || 'FIRM');
  const [additionalProvider, setAdditionalProvider] = useState(appointment.additionalProvider || '');

  const handleSave = () => {
    const [hour, minute] = time.split(':').map(Number);
    const dateParts = date.split('-').map(Number);
    const newStartTime = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], hour, minute, 0);
    onSave(appointment.id, newStartTime, operatory, status, additionalProvider);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Appointment</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)} className="input-field">
              {APPOINTMENT_STATUSES.map(s => <option key={s.code} value={s.code}>{s.code}: {s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Time</label>
            <input type="time" value={time} onChange={e => setTime(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Secondary Provider</label>
            <select value={additionalProvider} onChange={e => setAdditionalProvider(e.target.value)} className="input-field">
              <option value="">None</option>
              {PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Operatory</label>
            <select value={operatory} onChange={e => setOperatory(Number(e.target.value))} className="input-field">
              {operatories.map(op => <option key={op} value={op}>OP-{op}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="button" onClick={handleSave} className="btn-primary">Save Changes</button>
        </div>
      </div>
    </div>
  );
};

interface MonthCalendarProps {
    currentDate: Date;
    appointments: Appointment[];
    patients: Patient[];
    onDateClick: (date: Date) => void;
}

const MonthCalendar: React.FC<MonthCalendarProps> = ({ currentDate, appointments, patients, onDateClick }) => {
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay(); 

    const getDaysArray = () => {
        const days = [];
        for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
        for (let i = 1; i <= daysInMonth; i++) days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
        return days;
    };

    const days = getDaysArray();
    const weeks = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const getAppointmentsForDay = (date: Date) => {
        return appointments.filter(a => isSameDay(a.startTime, date));
    };

    const getPatientLastName = (id: number) => patients.find(p => p.id === id)?.lastName || 'Unknown';

    return (
        <div className="flex-grow overflow-auto p-4 bg-gray-100">
            <div className="grid grid-cols-7 gap-1">
                {weeks.map(day => (
                    <div key={day} className="bg-gray-200 text-gray-600 font-bold text-center py-2 text-sm uppercase">{day}</div>
                ))}
                {days.map((day, index) => {
                    if (!day) return <div key={`empty-${index}`} className="bg-gray-50 min-h-[100px]"></div>;
                    const dayAppts = getAppointmentsForDay(day);
                    const isTodayLocal = isSameDay(new Date(), day);
                    return (
                        <div key={day.toISOString()} onClick={() => onDateClick(day)} className={`bg-white border border-gray-200 min-h-[120px] p-1 cursor-pointer hover:bg-blue-50 transition-colors ${isTodayLocal ? 'ring-2 ring-blue-500 z-10' : ''}`}>
                            <div className="flex justify-between items-start mb-1">
                                <span className={`text-sm font-semibold rounded-full w-6 h-6 flex items-center justify-center ${isTodayLocal ? 'bg-blue-600 text-white' : 'text-gray-700'}`}>{day.getDate()}</span>
                            </div>
                            <div className="space-y-1 overflow-y-auto max-h-[90px]">
                                {dayAppts.slice(0, 5).map(apt => (
                                    <div key={apt.id} className={`text-[10px] truncate rounded px-1 py-0.5 ${apt.color} bg-opacity-50 text-gray-900 border-l-2 border-gray-500`}>
                                        {apt.isBlock ? '🚫 Blocked' : `${apt.startTime.toLocaleTimeString([], {hour:'numeric', minute:'2-digit'})} ${getPatientLastName(apt.patientId)}`}
                                    </div>
                                ))}
                                {dayAppts.length > 5 && <div className="text-[10px] text-center text-gray-500 font-medium">+ {dayAppts.length - 5} more</div>}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

interface WeekViewProps {
    currentDate: Date;
    appointments: Appointment[];
    patients: Patient[];
    timeSlots: string[];
    onSlotClick: (startTime: Date, operatory: number) => void;
    onAppointmentClick: (e: React.MouseEvent, appointment: Appointment) => void;
    onAppointmentHover: (e: React.MouseEvent, appointment: Appointment) => void;
    onAppointmentMouseLeave: () => void;
}

const WeekView: React.FC<WeekViewProps> = ({ currentDate, appointments, patients, timeSlots, onSlotClick, onAppointmentClick, onAppointmentHover, onAppointmentMouseLeave }) => {
    const startOfWeek = useMemo(() => {
        const d = new Date(currentDate);
        const day = d.getDay();
        d.setDate(d.getDate() - day);
        d.setHours(0, 0, 0, 0);
        return d;
    }, [currentDate]);

    const weekDays = useMemo(() => {
        return Array.from({ length: 7 }).map((_, i) => {
            const d = new Date(startOfWeek);
            d.setDate(d.getDate() + i);
            return d;
        });
    }, [startOfWeek]);

    const getAppointmentsForDayAndSlot = (day: Date, time: string) => {
        const [hour, minute] = time.split(':').map(Number);
        return appointments.filter(a => {
            return isSameDay(a.startTime, day) && a.startTime.getHours() === hour && a.startTime.getMinutes() === minute;
        });
    };

    const getPatient = (id: number) => patients.find(p => p.id === id);

    return (
        <div className="flex-grow overflow-auto flex flex-col bg-white">
            <div className="flex border-b sticky top-0 bg-gray-50 z-20">
                <div className="w-16 border-r flex-shrink-0"></div>
                {weekDays.map(day => (
                    <div key={day.toISOString()} className="flex-1 text-center py-2 border-r last:border-r-0">
                        <div className="text-xs font-bold text-gray-500 uppercase">{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                        <div className="text-sm font-semibold">{day.getDate()}</div>
                    </div>
                ))}
            </div>
            <div className="flex relative">
                <div className="w-16 border-r bg-gray-50 sticky left-0 z-10">
                    {timeSlots.filter(t => t.endsWith(':00') || t.endsWith(':30')).map(time => (
                        <div key={time} className="h-12 border-b flex items-center justify-center text-[10px] text-gray-400">
                            {time}
                        </div>
                    ))}
                </div>
                <div className="flex-grow flex">
                    {weekDays.map(day => (
                        <div key={day.toISOString()} className="flex-1 border-r last:border-r-0 relative">
                            {timeSlots.filter(t => t.endsWith(':00') || t.endsWith(':30')).map(time => {
                                const dayAppts = getAppointmentsForDayAndSlot(day, time);
                                return (
                                    <div key={time} onClick={() => {
                                        const [h, m] = time.split(':').map(Number);
                                        const start = new Date(day);
                                        start.setHours(h, m, 0, 0);
                                        onSlotClick(start, 1);
                                    }} className="h-12 border-b hover:bg-blue-50 cursor-pointer transition-colors relative group">
                                        {dayAppts.map(apt => {
                                            const patient = getPatient(apt.patientId);
                                            return (
                                                <div key={apt.id} 
                                                    onClick={(e) => onAppointmentClick(e, apt)}
                                                    onMouseEnter={(e) => onAppointmentHover(e, apt)}
                                                    // FIX: Use prop onAppointmentMouseLeave instead of non-existent handleAppointmentMouseLeave
                                                    onMouseLeave={onAppointmentMouseLeave}
                                                    className={`absolute inset-x-0 mx-0.5 mt-0.5 rounded-sm p-1 text-[9px] shadow-sm border-l-2 border-gray-600 ${apt.color} truncate z-10`}
                                                    style={{ height: `${Math.max(20, (apt.duration / 30) * 44)}px` }}
                                                >
                                                    <strong>{apt.isBlock ? 'BLOCK' : patient?.lastName}</strong>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const AppointmentBook: React.FC<AppointmentBookProps> = ({ setActiveModule }) => {
  const { state, dispatch } = useSimulationContext();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day'); 

  const [tooltip, setTooltip] = useState<{ content: Appointment, patient?: Patient, position: { x: number, y: number } } | null>(null);
  const [newAppointmentSlot, setNewAppointmentSlot] = useState<{ startTime: Date, operatory: number } | null>(null);
  const [actionMenu, setActionMenu] = useState<{ appointment: Appointment, position: { x: number, y: number } } | null>(null);
  const [isSymbolsGuideOpen, setIsSymbolsGuideOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  
  // Custom Confirmation state
  const [pendingConfirmation, setPendingConfirmation] = useState<{ 
      type: 'cancel' | 'delete'; 
      appointment: Appointment; 
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
        if (actionMenu && containerRef.current && !containerRef.current.contains(e.target as Node)) {
            setActionMenu(null);
        }
    };
    window.addEventListener('mousedown', handleOutsideClick);
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, [actionMenu]);

  const appointmentsForDate = useMemo(() => {
    return state.appointments.filter(apt => isSameDay(apt.startTime, currentDate));
  }, [currentDate, state.appointments]);
  
  const conflictingAppointmentIds = useMemo(() => {
    const conflicts = new Set<string>();
    for (let i = 0; i < appointmentsForDate.length; i++) {
        for (let j = i + 1; j < appointmentsForDate.length; j++) {
            const aptA = appointmentsForDate[i];
            const aptB = appointmentsForDate[j];
            const startA = aptA.startTime.getTime();
            const endA = startA + aptA.duration * 60 * 1000;
            const startB = aptB.startTime.getTime();
            const endB = startB + aptB.duration * 60 * 1000;
            if (startA < endB && endA > startB) {
                if (aptA.operatory === aptB.operatory || aptA.provider === aptB.provider) {
                    conflicts.add(aptA.id);
                    conflicts.add(aptB.id);
                }
            }
        }
    }
    return conflicts;
  }, [appointmentsForDate]);

  const operatories = useMemo(() => {
      const ops = new Set<number>();
      state.appointments.forEach(a => ops.add(a.operatory));
      [1,2,3,4,5,6,7,8].forEach(op => ops.add(op));
      return Array.from(ops).sort((a,b) => a-b);
  }, [state.appointments]);

  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 7; hour < 18; hour++) { 
        for (let minute = 0; minute < 60; minute += 10) {
             slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
        }
    }
    return slots;
  }, []);

  const getAppointmentCoveringSlot = (operatory: number, time: string) => {
    const [hour, minute] = time.split(':').map(Number);
    const slotTime = new Date(currentDate);
    slotTime.setHours(hour, minute, 0, 0);
    return appointmentsForDate.find(apt => {
        if (apt.operatory !== operatory) return false;
        const aptStart = apt.startTime.getTime();
        const aptEnd = aptStart + apt.duration * 60 * 1000;
        return slotTime.getTime() >= aptStart && slotTime.getTime() < aptEnd;
    });
  };
  
  const getPatient = (id: number) => state.patients.find(p => p.id === id);

  const handleAppointmentHover = (e: React.MouseEvent, appointment: Appointment) => {
    if (appointment.isBlock) {
         setTooltip({ content: appointment, position: { x: e.clientX, y: e.clientY } });
         return;
    }
    const patient = getPatient(appointment.patientId);
    if (patient && !actionMenu) {
        setTooltip({ content: appointment, patient, position: { x: e.clientX, y: e.clientY } });
    }
  };

  const handleAppointmentMouseLeave = () => setTooltip(null);
  const handleAppointmentClick = (e: React.MouseEvent, appointment: Appointment) => {
      e.stopPropagation();
      setTooltip(null);
      setActionMenu({ appointment, position: { x: e.clientX, y: e.clientY } });
  };

  const handleSlotClick = (operatory: number, time: string) => {
    const [hour, minute] = time.split(':').map(Number);
    const startTime = new Date(currentDate);
    startTime.setHours(hour, minute, 0, 0);
    setNewAppointmentSlot({ startTime, operatory });
  };

  const handleSaveAppointments = (newAppointmentsData: (Omit<Appointment, 'id' | 'color'> & { color?: string })[]) => {
    const appointmentsToCreate: Appointment[] = newAppointmentsData.map((data, i) => ({
        ...data,
        id: `apt${Date.now()}${i}`,
        color: data.color || 'bg-cyan-300',
    } as Appointment));
    if (appointmentsToCreate.length === 0) return;
    // FIX: Passing array directly as payload, not wrapped in an object
    dispatch({ type: 'SCHEDULE_APPOINTMENTS', payload: appointmentsToCreate });
    const message = appointmentsToCreate.some(a => a.isBlock) ? 'Provider time blocked.' : 'Appointment booked.';
    dispatch({ type: 'ADD_TOAST', payload: { message, type: 'success' } });
    setNewAppointmentSlot(null);
  };

  const handleDeleteAppointment = (id: string) => {
    const apt = state.appointments.find(a => a.id === id);
    if (apt) {
        setPendingConfirmation({ type: 'delete', appointment: apt });
    }
    setActionMenu(null);
  };

  const handlePinAppointment = (id: string) => {
    dispatch({ type: 'PIN_APPOINTMENT', payload: id });
    dispatch({ type: 'ADD_TOAST', payload: { message: 'Appointment moved to pinboard.', type: 'info' } });
    setActionMenu(null);
  };

  const handleWaitlistAppointment = (id: string) => {
      dispatch({ type: 'WAITLIST_APPOINTMENT', payload: id });
      dispatch({ type: 'ADD_TOAST', payload: { message: 'Patient added to waitlist.', type: 'info' } });
      setActionMenu(null);
  };

  const handleCancelAppointment = (id: string) => {
      const apt = state.appointments.find(a => a.id === id);
      if (apt) {
          setPendingConfirmation({ type: 'cancel', appointment: apt });
      }
      setActionMenu(null);
  };

  const executeConfirmedAction = () => {
    if (!pendingConfirmation) return;
    const { type, appointment } = pendingConfirmation;
    
    if (type === 'cancel') {
        dispatch({ type: 'CANCEL_APPOINTMENT', payload: appointment.id });
        dispatch({ type: 'ADD_TOAST', payload: { message: 'Appointment removed from schedule.', type: 'warning' } });
    } else {
        dispatch({ type: 'DELETE_APPOINTMENT', payload: appointment.id });
        dispatch({ type: 'ADD_TOAST', payload: { message: 'Record purged from database.', type: 'info' } });
    }
    
    setPendingConfirmation(null);
  };

  const handleDragStart = (e: React.DragEvent, appointment: Appointment, source: 'calendar' | 'pinboard' | 'waitlist') => {
      if (appointment.isBlock) {
          e.preventDefault();
          return; 
      }
      e.dataTransfer.setData('appointmentId', appointment.id);
      e.dataTransfer.setData('source', source);
      setActionMenu(null);
      setTooltip(null);
  };

  const handleDrop = (e: React.DragEvent, operatory: number, time: string) => {
      e.preventDefault();
      const appointmentId = e.dataTransfer.getData('appointmentId');
      const source = e.dataTransfer.getData('source') as 'calendar' | 'pinboard' | 'waitlist';
      const [hour, minute] = time.split(':').map(Number);
      const newStartTime = new Date(currentDate);
      newStartTime.setHours(hour, minute, 0, 0);

      let appointment = state.appointments.find(a => a.id === appointmentId);
      if (source === 'pinboard') appointment = state.pinboardAppointments.find(a => a.id === appointmentId);
      else if (source === 'waitlist') appointment = state.waitlistAppointments.find(a => a.id === appointmentId);

      if (appointment) {
        dispatch({ type: 'MOVE_APPOINTMENT', payload: { appointmentId, newStartTime, newOperatory: operatory, source } });
        dispatch({ type: 'ADD_TOAST', payload: { message: 'Appointment moved successfully.', type: 'success' } });
      }
  };
  
  const handleSaveUpdate = (appointmentId: string, newStartTime: Date, newOperatory: number, newStatus: string, additionalProvider: string) => {
    const appointmentToUpdate = state.appointments.find(apt => apt.id === appointmentId);
    if (appointmentToUpdate) {
        dispatch({ 
            type: 'UPDATE_APPOINTMENT', 
            payload: { 
                ...appointmentToUpdate, 
                startTime: newStartTime, 
                operatory: newOperatory,
                status: newStatus,
                additionalProvider: additionalProvider || undefined
            } 
        });
        dispatch({ type: 'ADD_TOAST', payload: { message: 'Appointment updated successfully!', type: 'success' } });
        setEditingAppointment(null);
    }
  };

  const handlePrevDate = () => {
      setCurrentDate(prev => { 
          const d = new Date(prev); 
          if (viewMode === 'month') d.setMonth(d.getMonth() - 1);
          else if (viewMode === 'week') d.setDate(prev.getDate() - 7);
          else d.setDate(prev.getDate() - 1); 
          return d; 
      });
  };

  const handleNextDate = () => {
      setCurrentDate(prev => { 
          const d = new Date(prev); 
          if (viewMode === 'month') d.setMonth(d.getMonth() + 1);
          else if (viewMode === 'week') d.setDate(prev.getDate() + 7);
          else d.setDate(prev.getDate() + 1); 
          return d; 
      });
  };
  
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.value) setCurrentDate(new Date(e.target.value + 'T12:00:00')); 
  }

  const handleDateClickFromCalendar = (date: Date) => {
      setCurrentDate(date);
      setViewMode('day');
  };

  const renderedAppointments = new Set<string>();

  const getWeekRangeString = (date: Date) => {
      const d = new Date(date);
      d.setDate(d.getDate() - d.getDay());
      const end = new Date(d);
      end.setDate(d.getDate() + 6);
      return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  return (
    <div ref={containerRef} className="bg-white h-full shadow-lg rounded-md overflow-hidden flex flex-col font-sans">
      <div className="p-2 border-b flex justify-between items-center flex-shrink-0 bg-white">
        <div className="flex items-center space-x-4">
            <h2 className="text-lg font-black text-gray-800 tracking-tight">Appointment Book</h2>
            <div className="flex bg-gray-100 rounded-lg p-1 border border-gray-200">
                <button onClick={() => setViewMode('day')} className={`px-4 py-1 text-xs font-black rounded-md transition-all ${viewMode === 'day' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:bg-gray-200'}`}>Day</button>
                <button onClick={() => setViewMode('week')} className={`px-4 py-1 text-xs font-black rounded-md transition-all ${viewMode === 'week' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:bg-gray-200'}`}>Week</button>
                <button onClick={() => setViewMode('month')} className={`px-4 py-1 text-xs font-black rounded-md transition-all ${viewMode === 'month' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:bg-gray-200'}`}>Month</button>
            </div>
        </div>
        
        <div className="hidden lg:flex items-center space-x-3 text-[10px] font-black uppercase tracking-tighter text-gray-400 overflow-x-auto pb-1 max-w-xl">
            {Object.entries(PROVIDER_COLORS).filter(([k]) => k !== 'default').map(([name, color]) => (
                <div key={name} className="flex items-center space-x-1 whitespace-nowrap bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                    <div className={`w-2 h-2 rounded-full ${color}`}></div>
                    <span>{name}</span>
                </div>
            ))}
        </div>

        <div className="flex items-center space-x-4">
           <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200 p-1">
                <button onClick={handlePrevDate} className="p-1.5 rounded hover:bg-white hover:shadow-sm text-gray-500 transition-all font-bold">&larr;</button>
                <div className="flex flex-col items-center px-4">
                    <input type="date" value={currentDate.toLocaleDateString('en-CA')} onChange={handleDateChange} className="text-[10px] font-black uppercase text-gray-400 bg-transparent border-none p-0 focus:ring-0 text-center" />
                    <span className="font-black text-xs text-gray-800 whitespace-nowrap">
                        {viewMode === 'day' ? currentDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 
                            viewMode === 'week' ? getWeekRangeString(currentDate) :
                            currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </span>
                </div>
                <button onClick={handleNextDate} className="p-1.5 rounded hover:bg-white hover:shadow-sm text-gray-500 transition-all font-bold">&rarr;</button>
           </div>
           <button onClick={() => setIsSymbolsGuideOpen(true)} className="p-2.5 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors shadow-inner" title="View Appointment Symbols">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
           </button>
        </div>
      </div>
      
      {viewMode === 'day' ? (
        <div className="flex-grow overflow-auto bg-gray-100/50">
            <div className="flex min-w-max">
            <div className="sticky left-0 bg-white z-20 shadow-lg border-r border-gray-200">
                    <div className="h-10 border-b border-gray-200"></div>
                    {timeSlots.map(time => (
                        <div key={time} className="h-12 border-b border-gray-100 flex items-center justify-center text-[10px] text-gray-400 w-16 bg-white transition-colors hover:bg-blue-50 font-black">
                            {(time.endsWith(':00') || time.endsWith(':30')) ? (time.endsWith(':00') ? <span className="text-gray-800">{time}</span> : time) : null}
                        </div>
                    ))}
            </div>
            <div className="flex-grow grid bg-white" style={{ gridTemplateColumns: `repeat(${operatories.length}, minmax(140px, 1fr))` }}>
                    {operatories.map(op => (
                        <div key={op} className="border-r border-gray-100 relative group/col">
                            <div className="h-10 border-b border-gray-200 flex items-center justify-center font-black text-[11px] text-gray-500 sticky top-0 bg-white/95 backdrop-blur z-10 uppercase tracking-widest group-hover/col:text-blue-600 transition-colors">Operatory {op}</div>
                            {timeSlots.map(time => {
                                const appointment = getAppointmentCoveringSlot(op, time);
                                if (appointment && appointment.startTime.getHours() === parseInt(time.split(':')[0]) && appointment.startTime.getMinutes() === parseInt(time.split(':')[1])) {
                                    renderedAppointments.add(appointment.id);
                                    const patient = getPatient(appointment.patientId);
                                    const rowSpan = Math.ceil(appointment.duration / 10);
                                    const isConflict = conflictingAppointmentIds.has(appointment.id);
                                    const conflictClass = isConflict ? 'border-2 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'border-l-4 border-gray-700 shadow-sm';
                                    const isBlock = appointment.isBlock;
                                    
                                    const blockBaseStyle = `h-full rounded-md p-2 text-xs opacity-95 transition-all shadow-md flex flex-col justify-center items-center text-center overflow-hidden border-2`;
                                    const blockStyle = isBlock 
                                        ? `${blockBaseStyle} bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed`
                                        : `${blockBaseStyle} ${appointment.color} text-gray-900 ${conflictClass} cursor-pointer hover:brightness-95 hover:translate-y-[-1px] active:translate-y-0`;

                                    return (
                                        <div key={appointment.id} className="p-1 relative z-10" style={{ height: `${rowSpan * 3}rem` }} onDrop={(e) => handleDrop(e, op, time)} onDragOver={(e) => e.preventDefault()}>
                                            <div onClick={(e) => handleAppointmentClick(e, appointment)} onMouseEnter={(e) => handleAppointmentHover(e, appointment)} onMouseLeave={handleAppointmentMouseLeave} draggable={!isBlock} onDragStart={(e) => handleDragStart(e, appointment, 'calendar')} className={blockStyle} 
                                                style={isBlock ? { 
                                                    backgroundImage: 'repeating-linear-gradient(45deg, #f3f4f6, #f3f4f6 10px, #e5e7eb 10px, #e5e7eb 20px)',
                                                    boxShadow: 'inset 0 2px 4px 0 rgba(0,0,0,0.05)'
                                                } : {}}>
                                                {isBlock ? (
                                                    <>
                                                        <div className="font-black uppercase text-[10px] tracking-[0.2em] text-gray-500 mb-1 flex items-center">
                                                            <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.366zM7.5 14.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15.5 8a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" clipRule="evenodd"/></svg>
                                                            Schedule Block
                                                        </div>
                                                        <div className="text-[11px] font-black text-gray-800 leading-tight line-clamp-2">{appointment.blockReason}</div>
                                                        <div className="text-[9px] font-bold text-gray-400 mt-2 uppercase tracking-tighter">{appointment.provider}</div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="font-black truncate w-full flex items-center justify-between text-[11px]">
                                                            <span className="truncate">{patient?.lastName}, {patient?.firstName}</span>
                                                            {appointment.status && <span className="ml-1 px-1.5 py-0.5 bg-black/10 rounded text-[9px] font-black border border-black/5 uppercase tracking-tighter">{appointment.status}</span>}
                                                        </div>
                                                        <div className="truncate text-gray-600 font-bold text-[10px] w-full text-left mt-1">{appointment.treatment}</div>
                                                        <div className="mt-auto w-full border-t border-black/5 pt-1">
                                                            <AppointmentIcons appointment={appointment} patient={patient} isConflict={isConflict} />
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    );
                                }
                                if (appointment && renderedAppointments.has(appointment.id)) return null;
                                return (
                                    <div key={`${op}-${time}`} onClick={() => handleSlotClick(op, time)} onDrop={(e) => handleDrop(e, op, time)} onDragOver={(e) => e.preventDefault()} className="h-12 border-b border-gray-50 hover:bg-blue-50/50 cursor-pointer transition-all relative group">
                                        <div className="absolute inset-0 border-r border-gray-50 group-hover:border-blue-200"></div>
                                        {(time === '08:00' || time === '17:00') && <div className="absolute inset-x-0 top-0 h-px bg-blue-400 opacity-20"></div>}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
            </div>
            </div>
        </div>
      ) : viewMode === 'week' ? (
        <WeekView 
            currentDate={currentDate} 
            appointments={state.appointments} 
            patients={state.patients} 
            timeSlots={timeSlots}
            onSlotClick={(start) => setNewAppointmentSlot({ startTime: start, operatory: 1 })}
            onAppointmentClick={handleAppointmentClick}
            onAppointmentHover={handleAppointmentHover}
            onAppointmentMouseLeave={handleAppointmentMouseLeave}
        />
      ) : (
        <MonthCalendar currentDate={currentDate} appointments={state.appointments} patients={state.patients} onDateClick={handleDateClickFromCalendar} />
      )}
      
      <Pinboard onDragStart={(e, apt, source) => handleDragStart(e, apt, source)} />
      {tooltip && <AppointmentTooltip appointment={tooltip.content} patient={tooltip.patient} position={tooltip.position} />}
      {newAppointmentSlot && <NewAppointmentModal slotData={newAppointmentSlot} onClose={() => setNewAppointmentSlot(null)} onSave={handleSaveAppointments} />}
      {actionMenu && <AppointmentActionMenu 
        menu={actionMenu} 
        onClose={() => setActionMenu(null)} 
        onDelete={handleDeleteAppointment} 
        onPin={handlePinAppointment}
        onWaitlist={handleWaitlistAppointment}
        onCancel={handleCancelAppointment}
        onReschedule={(appointment) => {
            setActionMenu(null);
            setEditingAppointment(appointment);
        }}
      />}
      {isSymbolsGuideOpen && <AppointmentSymbolsGuide onClose={() => setIsSymbolsGuideOpen(false)} />}
      {editingAppointment && <EditAppointmentModal appointment={editingAppointment} onClose={() => setEditingAppointment(null)} onSave={handleSaveUpdate} operatories={operatories} />}
      
      {pendingConfirmation && (
          <ConfirmationModal 
            title={pendingConfirmation.type === 'cancel' ? 'Cancel Appointment?' : 'Delete Record?'}
            message={
                pendingConfirmation.appointment.isBlock 
                ? `Are you sure you want to remove this ${pendingConfirmation.appointment.provider} schedule block?`
                : `Are you sure you want to ${pendingConfirmation.type === 'cancel' ? 'cancel' : 'permanently delete'} the appointment for ${getPatient(pendingConfirmation.appointment.patientId)?.lastName}? This action will remove the entry from the active schedule.`
            }
            confirmText={pendingConfirmation.type === 'cancel' ? 'Yes, Cancel Appt' : 'Yes, Delete Record'}
            onConfirm={executeConfirmedAction}
            onCancel={() => setPendingConfirmation(null)}
            variant={pendingConfirmation.type === 'cancel' ? 'warning' : 'danger'}
          />
      )}
    </div>
  );
};

export default AppointmentBook;