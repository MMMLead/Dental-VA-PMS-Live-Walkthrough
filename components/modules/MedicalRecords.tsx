

import React, { useState, useMemo } from 'react';
import { useSimulationContext } from '../../context/SimulationContext';
import { MedicalRecord, RecordStatus, RecordType, MedicalRecordAuditEntry } from '../../types';
import { RECORD_STATUSES, RECORD_TYPES, PROVIDERS, DEPARTMENTS } from '../../constants';
import { GoogleGenAI } from '@google/genai';

// --- Helper Functions & Components ---

const StatusChip: React.FC<{ status: RecordStatus }> = ({ status }) => {
    const colors: Record<RecordStatus, string> = {
        'Draft': 'bg-gray-200 text-gray-800',
        'Finalized': 'bg-blue-200 text-blue-800',
        'Signed': 'bg-green-200 text-green-800',
        'Archived': 'bg-slate-200 text-slate-800',
    };
    return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colors[status]}`}>{status}</span>;
};

const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    const adjustedDate = new Date(date.valueOf() + date.getTimezoneOffset() * 60 * 1000);
    return adjustedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatDateTime = (dateString?: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
};

// --- Main Component ---

const MedicalRecords: React.FC = () => {
    const { state, dispatch } = useSimulationContext();
    const { medicalRecords, patients } = state;
    const [filters, setFilters] = useState({ search: '', recordType: 'All', dateStart: '', dateEnd: '', provider: 'All', status: 'All', isConfidential: 'All' });
    const [sortConfig, setSortConfig] = useState<{ key: keyof MedicalRecord | 'patientName'; direction: 'asc' | 'desc' }>({ key: 'recordDate', direction: 'desc' });
    const [activeRecord, setActiveRecord] = useState<MedicalRecord | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    const patientMap = useMemo(() => new Map(patients.map(p => [p.id, `${p.lastName}, ${p.firstName}`])), [patients]);

    const filteredRecords = useMemo(() => {
        return medicalRecords.filter(r => {
            const patientName = patientMap.get(r.patientId)?.toLowerCase() || '';
            const searchLower = filters.search.toLowerCase();

            if (filters.search && !(
                patientName.includes(searchLower) ||
                r.recordType.toLowerCase().includes(searchLower) ||
                r.providerName.toLowerCase().includes(searchLower) ||
                r.summary.toLowerCase().includes(searchLower)
            )) return false;
            
            if (filters.recordType !== 'All' && r.recordType !== filters.recordType) return false;
            if (filters.status !== 'All' && r.status !== filters.status) return false;
            if (filters.provider !== 'All' && r.providerName !== filters.provider) return false;
            if (filters.isConfidential !== 'All' && r.isConfidential !== (filters.isConfidential === 'Yes')) return false;

            if (filters.dateStart) {
                if (new Date(r.recordDate) < new Date(filters.dateStart)) return false;
            }
            if (filters.dateEnd) {
                if (new Date(r.recordDate) > new Date(filters.dateEnd)) return false;
            }

            return true;
        });
    }, [medicalRecords, filters, patientMap]);

    const sortedRecords = useMemo(() => {
        return [...filteredRecords].sort((a, b) => {
            const { key, direction } = sortConfig;
            let valA: any, valB: any;

            if (key === 'patientName') {
                valA = patientMap.get(a.patientId) || '';
                valB = patientMap.get(b.patientId) || '';
            } else {
                valA = a[key as keyof MedicalRecord];
                valB = b[key as keyof MedicalRecord];
            }

            let comparison = 0;
            if (valA > valB) comparison = 1;
            else if (valA < valB) comparison = -1;

            return direction === 'asc' ? comparison : -comparison;
        });
    }, [filteredRecords, sortConfig, patientMap]);

    const handleSort = (key: keyof MedicalRecord | 'patientName') => {
        setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
    };
    
    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters(f => ({...f, [e.target.name]: e.target.value}));
        // Log filter action for assessment
        dispatch({ type: 'LOG_ACTION', payload: { type: 'filter_medical_records', details: { [e.target.name]: e.target.value } } });
    };
    
    const handleAddNew = () => {
        setIsCreating(true);
        setActiveRecord(null);
    };

    const closeDrawer = () => {
        setActiveRecord(null);
        setIsCreating(false);
    };

    const handleSave = (record: MedicalRecord) => {
        const actionType = isCreating ? 'ADD_MEDICAL_RECORD' : 'UPDATE_MEDICAL_RECORD';
        dispatch({ type: actionType, payload: record });
        dispatch({ type: 'LOG_ACTION', payload: { type: isCreating ? 'add_medical_record' : 'update_medical_record', details: { id: record.id } } });
        closeDrawer();
    };

    return (
        <div className="bg-white h-full shadow-lg rounded-md overflow-hidden flex">
            <div className="flex-grow flex flex-col">
                <div className="p-2 border-b">
                    <h2 className="text-lg font-bold text-gray-700">Medical Records</h2>
                </div>
                {/* Toolbar */}
                <div className="p-2 bg-gray-50 border-b space-y-2">
                    <div className="flex justify-between items-center">
                        <input name="search" type="text" placeholder="Search Patient, Record Type, Provider, Notes..." className="input-field w-1/3" value={filters.search} onChange={handleFilterChange} />
                        <div className="flex items-center space-x-2">
                            <button onClick={() => dispatch({ type: 'ADD_TOAST', payload: { message: 'Simulated: Exporting records to PDF...', type: 'info' } })} className="btn-secondary-xs">Export PDF</button>
                            <button onClick={handleAddNew} className="btn-primary-xs">Add Record</button>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2 text-xs">
                        <span className="font-semibold text-gray-600">Filter by:</span>
                        <select name="recordType" value={filters.recordType} onChange={handleFilterChange} className="select-field-xs"><option value="All">All Types</option>{RECORD_TYPES.map(s => <option key={s} value={s}>{s}</option>)}</select>
                        <input name="dateStart" type="date" value={filters.dateStart} onChange={handleFilterChange} className="input-field-xs" />
                        <span>to</span>
                        <input name="dateEnd" type="date" value={filters.dateEnd} onChange={handleFilterChange} className="input-field-xs" />
                        <select name="provider" value={filters.provider} onChange={handleFilterChange} className="select-field-xs"><option value="All">All Providers</option>{PROVIDERS.map(s => <option key={s} value={s}>{s}</option>)}</select>
                        <select name="status" value={filters.status} onChange={handleFilterChange} className="select-field-xs"><option value="All">All Statuses</option>{RECORD_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select>
                        <select name="isConfidential" value={filters.isConfidential} onChange={handleFilterChange} className="select-field-xs"><option value="All">Confidentiality</option><option value="Yes">Yes</option><option value="No">No</option></select>
                    </div>
                </div>
                {/* Table */}
                <div className="flex-grow overflow-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-xs">
                        <thead className="bg-gray-100 sticky top-0">
                            <tr>
                                <SortableHeader label="Patient Name" onSort={() => handleSort('patientName')} sc={sortConfig} sk="patientName" />
                                <SortableHeader label="Record Type" onSort={() => handleSort('recordType')} sc={sortConfig} sk="recordType" />
                                <SortableHeader label="Date" onSort={() => handleSort('recordDate')} sc={sortConfig} sk="recordDate" />
                                <SortableHeader label="Provider" onSort={() => handleSort('providerName')} sc={sortConfig} sk="providerName" />
                                <SortableHeader label="Status" onSort={() => handleSort('status')} sc={sortConfig} sk="status" />
                                <th className="th-header">Updated By</th>
                                <th className="th-header">Conf.</th>
                                <th className="th-header">Notes</th>
                                <th className="th-header"></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                           {sortedRecords.map(r => (
                                <tr key={r.id} className="hover:bg-blue-50">
                                    <td className="td-cell font-semibold">{patientMap.get(r.patientId)}</td>
                                    <td className="td-cell">{r.recordType}</td>
                                    <td className="td-cell">{formatDate(r.recordDate)}</td>
                                    <td className="td-cell">{r.providerName}</td>
                                    <td className="td-cell"><StatusChip status={r.status} /></td>
                                    <td className="td-cell">{r.lastUpdatedBy}</td>
                                    <td className="td-cell text-center">{r.isConfidential && '🔒'}</td>
                                    <td className="td-cell max-w-xs truncate">{r.summary}</td>
                                    <td className="td-cell">
                                        <button onClick={() => { if(r.isConfidential && !window.confirm("This record is marked as confidential. Do you want to proceed?")) return; setActiveRecord(r); }} className="text-blue-600 hover:text-blue-800 p-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
             {(activeRecord || isCreating) && (
                <MedicalRecordDrawer record={activeRecord} isCreating={isCreating} onClose={closeDrawer} onSave={handleSave} />
            )}
        </div>
    );
};

const SortableHeader: React.FC<{ label: string, onSort: () => void, sc: any, sk: any }> = ({ label, onSort, sc, sk }) => (
    <th className="th-header cursor-pointer" onClick={onSort}>
        <div className="flex items-center">{label}{sc.key === sk && <span className="ml-1">{sc.direction === 'asc' ? '▲' : '▼'}</span>}</div>
    </th>
);

const MedicalRecordDrawer: React.FC<{ record: MedicalRecord | null, isCreating: boolean, onClose: () => void, onSave: (r: MedicalRecord) => void }> = ({ record, isCreating, onClose, onSave }) => {
    const { state, dispatch } = useSimulationContext();
    const emptyRecord: Omit<MedicalRecord, 'id'> = {
        patientId: 0, recordType: 'Progress Note', recordDate: new Date().toISOString().split('T')[0], providerName: '', status: 'Draft',
        isConfidential: false, summary: '', attachments: [], lastUpdated: new Date().toISOString(), lastUpdatedBy: 'RECEPTION', auditLog: [],
    };
    const [formData, setFormData] = useState<Partial<MedicalRecord>>(isCreating ? emptyRecord : record);
    const [isGenerating, setIsGenerating] = useState(false);
    
    const handleInputChange = (e: React.ChangeEvent<any>) => {
        const { name, value, type, checked } = e.target;
        if (name === 'patientId') {
            setFormData(p => ({ ...p, [name]: Number(value) }));
        } else {
            setFormData(p => ({...p, [name]: type === 'checkbox' ? checked : value }));
        }
    };

    const addAudit = (data: Partial<MedicalRecord>, action: string, details?: string): Partial<MedicalRecord> => ({
        ...data,
        lastUpdated: new Date().toISOString(),
        lastUpdatedBy: 'RECEPTION',
        auditLog: [...(data.auditLog || []), { action, user: 'RECEPTION', timestamp: new Date().toISOString(), details }]
    });

    const handleSaveDraft = () => {
        let payload = addAudit(formData, "Saved Draft");
        if(isCreating) payload = {...emptyRecord, ...payload, id: `mr${Date.now()}`};
        onSave(payload as MedicalRecord);
        dispatch({ type: 'ADD_TOAST', payload: { message: 'Record saved as draft.', type: 'success' } });
    };

    const handleFinalize = () => {
        const payload = addAudit({...formData, status: 'Finalized'}, 'Finalized Record');
        onSave(payload as MedicalRecord);
        dispatch({ type: 'ADD_TOAST', payload: { message: 'Record finalized.', type: 'info' } });
    };

    const handleSign = () => {
        const signature = { signedBy: 'Dr. Smith', signedOn: new Date().toISOString() };
        const payload = addAudit({...formData, status: 'Signed', signature}, 'Signed Record');
        onSave(payload as MedicalRecord);
        dispatch({ type: 'ADD_TOAST', payload: { message: 'Record signed.', type: 'success' } });
    };

    const handleArchive = () => {
        const payload = addAudit({...formData, status: 'Archived'}, 'Archived Record');
        onSave(payload as MedicalRecord);
        dispatch({ type: 'ADD_TOAST', payload: { message: 'Record archived.', type: 'info' } });
    };

    const handleGenerateReferral = async () => {
        if (!formData.patientId || !formData.providerName || !formData.summary) {
            dispatch({ type: 'ADD_TOAST', payload: { message: 'Patient, Provider, and Summary are required to generate a referral.', type: 'warning' }});
            return;
        }
        setIsGenerating(true);
        try {
            const patient = state.patients.find(p => p.id === formData.patientId);
            if (!patient) throw new Error("Patient not found");

            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `Write a formal referral letter from ${formData.providerName} to a specialist. The patient is ${patient.firstName} ${patient.lastName} (DOB: ${patient.dob}). The reason for the referral is: "${formData.summary}". The letter should be professional, concise, and ready to be sent. Include placeholders for the specialist's name and the clinic's contact information.`;

            // FIX: Use gemini-3-flash-preview for text generation tasks as per guidelines.
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
            });

            const referralLetter = response.text;
            setFormData(p => ({ ...p, summary: referralLetter }));
            dispatch({ type: 'ADD_TOAST', payload: { message: 'Referral letter generated by AI.', type: 'info' }});
        } catch (error) {
            console.error("Error generating referral:", error);
            dispatch({ type: 'ADD_TOAST', payload: { message: 'Failed to generate referral letter.', type: 'error' }});
        } finally {
            setIsGenerating(false);
        }
    };
    
    const userRole = 'RECEPTION' as 'RECEPTION' | 'Provider'; 
    
    const isReadOnly = formData.status === 'Signed' || formData.status === 'Archived';
    const isLocked = isReadOnly || (formData.status === 'Finalized' && (userRole as string) !== 'Provider');

    const canFinalize = formData.status === 'Draft';
    const canSign = formData.status === 'Finalized' && (userRole as string) === 'Provider';
    const isClinicalRecord = formData.recordType && !['Insurance Form', 'Miscellaneous'].includes(formData.recordType as RecordType);
    const disableFinalizeButton = userRole === 'RECEPTION' && isClinicalRecord;

    return (
        <aside className="w-1/3 bg-gray-50 border-l p-4 flex flex-col animate-slide-in-from-right">
            <h3 className="text-lg font-bold text-gray-800 mb-4">{isCreating ? 'New Medical Record' : 'Record Details'}</h3>
            <div className="flex-grow overflow-y-auto space-y-3 pr-2 text-sm">
                <select name="patientId" value={formData.patientId || ''} onChange={handleInputChange} className="input-field" disabled={!isCreating}><option value="">Select Patient...</option>{state.patients.map(p=><option key={p.id} value={p.id}>{p.lastName}, {p.firstName}</option>)}</select>
                <input name="recordDate" type="date" value={formData.recordDate || ''} onChange={handleInputChange} className="input-field" disabled={isLocked} />
                <select name="recordType" value={formData.recordType || ''} onChange={handleInputChange} className="input-field" disabled={isLocked || !isCreating}><option value="">Select Type...</option>{RECORD_TYPES.map(s=><option key={s} value={s}>{s}</option>)}</select>
                <select name="providerName" value={formData.providerName || ''} onChange={handleInputChange} className="input-field" disabled={isLocked}><option value="">Select Provider...</option>{PROVIDERS.map(s=><option key={s} value={s}>{s}</option>)}</select>
                <select name="department" value={formData.department || ''} onChange={handleInputChange} className="input-field" disabled={isLocked}><option value="">Select Department...</option>{DEPARTMENTS.map(s=><option key={s} value={s}>{s}</option>)}</select>
                <select name="status" value={formData.status || ''} onChange={handleInputChange} className="input-field" disabled={true}><option value="">Select Status...</option>{RECORD_STATUSES.map(s=><option key={s} value={s}>{s}</option>)}</select>
                
                <div className="relative">
                  <textarea name="summary" placeholder="Record Summary / Description" value={formData.summary || ''} onChange={handleInputChange} className="input-field h-24" disabled={isLocked} />
                  {formData.recordType === 'Referral' && !isLocked && (
                      <button onClick={handleGenerateReferral} disabled={isGenerating} className="absolute bottom-2 right-2 text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 disabled:bg-gray-200">
                          {isGenerating ? 'Generating...' : '✨ Gen. Referral w/ AI'}
                      </button>
                  )}
                </div>

                <textarea name="internalNotes" placeholder="Internal Notes (not for export)" value={formData.internalNotes || ''} onChange={handleInputChange} className="input-field h-16" disabled={isReadOnly} />
                <select name="relatedInsuranceVerificationId" value={formData.relatedInsuranceVerificationId || ''} onChange={handleInputChange} className="input-field" disabled={isLocked}><option value="">Link to Insurance Verification...</option>{state.verifications.map(v=><option key={v.id} value={v.id}>{state.patients.find(p=>p.id===v.patientId)?.lastName} - {v.insuranceName}</option>)}</select>
                <div className="flex items-center"><input type="checkbox" name="isConfidential" id="isConfidential" checked={formData.isConfidential || false} onChange={handleInputChange} className="h-4 w-4" disabled={isLocked} /><label htmlFor="isConfidential" className="ml-2">Confidential Record</label></div>
                
                <div>
                    <h4 className="font-semibold mb-2">Attachments</h4>
                    <div onDrop={(e) => { e.preventDefault(); dispatch({ type: 'ADD_TOAST', payload: { message: 'Simulated: File Uploaded', type: 'info' }}); }} onDragOver={(e) => e.preventDefault()} className="border-2 border-dashed rounded-lg p-4 text-center text-gray-500 text-xs">Drag & Drop files here or <button className="text-blue-600 underline" onClick={()=>dispatch({ type: 'ADD_TOAST', payload: { message: 'Simulated: Opening file dialog...', type: 'info' }})}>browse</button></div>
                </div>

                {formData.signature && <div className="p-2 bg-green-100 border-l-4 border-green-500 text-green-800">Signed by <strong>{formData.signature.signedBy}</strong> on {formatDateTime(formData.signature.signedOn)}</div>}
                
                <div>
                    <h4 className="font-semibold mb-2">Audit Log</h4>
                    <ul className="text-xs text-gray-500 space-y-2 bg-white border p-2 rounded-md max-h-40 overflow-y-auto">{formData.auditLog?.map((e,i)=><li key={i}><strong>{e.action}</strong> by {e.user} at {formatDateTime(e.timestamp)}</li>).reverse()}</ul>
                </div>
            </div>
            <div className="pt-4 border-t flex justify-between items-center">
                <button onClick={onClose} className="btn-secondary">Close</button>
                <div className="flex space-x-2">
                    {!isReadOnly && <button onClick={handleSaveDraft} className="btn-secondary" disabled={!formData.patientId} title={!formData.patientId ? "A patient must be selected." : ""}>Save Draft</button>}
                    {canFinalize && <button onClick={handleFinalize} className="btn-primary" disabled={disableFinalizeButton} title={disableFinalizeButton ? "Receptionists cannot finalize clinical records." : ""}>Finalize</button>}
                    {canSign && <button onClick={handleSign} className="btn-primary bg-green-600 hover:bg-green-700">Sign</button>}
                    {formData.status !== 'Archived' && !isCreating && <button onClick={handleArchive} className="btn-secondary bg-slate-500 hover:bg-slate-600">Archive</button>}
                </div>
            </div>
        </aside>
    );
};

export default MedicalRecords;
