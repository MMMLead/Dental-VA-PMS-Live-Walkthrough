import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useSimulationContext } from '../../context/SimulationContext';
import { InsuranceVerification, Patient, VerificationStatus, PlanType, RelationshipToSubscriber, PrimaryOrSecondary, VerificationMethod, AuditEntry, VerificationAttachment } from '../../types';
import { VERIFICATION_STATUSES, PLAN_TYPES, ASSIGNED_USERS } from '../../constants';

// --- Helper Functions & Components ---

const StatusChip: React.FC<{ status: VerificationStatus }> = ({ status }) => {
    const colors: Record<VerificationStatus, string> = {
        'To Verify': 'bg-gray-200 text-gray-800',
        'In Progress': 'bg-blue-200 text-blue-800',
        'Approved': 'bg-green-200 text-green-800',
        'Denied': 'bg-red-200 text-red-800',
        'Needs Follow-up': 'bg-yellow-200 text-yellow-800',
        'Awaiting Docs': 'bg-purple-200 text-purple-800',
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

const getChanges = (original: InsuranceVerification, updated: Partial<InsuranceVerification>, patients: Patient[]): string => {
    const changes: string[] = [];

    const fieldLabels: Record<string, string> = {
        patientId: 'Patient', insuranceName: 'Insurance Name', planType: 'Plan Type',
        primaryOrSecondary: 'Primary/Secondary', memberId: 'Member ID', groupId: 'Group ID',
        subscriberName: 'Subscriber Name', relationshipToSubscriber: 'Relationship', status: 'Status',
        dueDate: 'Due Date', assignedTo: 'Assigned To', internalNotes: 'Internal Notes',
        verificationDateTime: 'Verification Date/Time', nextFollowUpDate: 'Next Follow-up Date',
        lastAttempt: 'Last Attempt', verificationMethod: 'Verification Method'
    };

    for (const key in fieldLabels) {
        if (Object.prototype.hasOwnProperty.call(fieldLabels, key)) {
            const originalValue = original[key as keyof InsuranceVerification];
            const updatedValue = updated[key as keyof InsuranceVerification];

            if (key === 'verificationMethod') {
                const oldArr = (originalValue as string[] || []).slice().sort().join(', ');
                const newArr = (updatedValue as string[] || []).slice().sort().join(', ');
                
                if (oldArr !== newArr) {
                     changes.push(`${fieldLabels[key]} changed from '${oldArr || 'None'}' to '${newArr || 'None'}'`);
                }
                continue;
            }

            if (originalValue !== updatedValue && (originalValue || updatedValue)) {
                let from = `'${originalValue || 'empty'}'`;
                let to = `'${updatedValue || 'empty'}'`;

                if (key === 'patientId') {
                    const originalPatient = patients.find(p => p.id === Number(originalValue));
                    const updatedPatient = patients.find(p => p.id === Number(updatedValue));
                    from = `'${originalPatient ? `${originalPatient.lastName}, ${originalPatient.firstName}` : 'N/A'}'`;
                    to = `'${updatedPatient ? `${updatedPatient.lastName}, ${updatedPatient.firstName}` : 'N/A'}'`;
                }
                 if (key === 'dueDate' || key === 'nextFollowUpDate') {
                    from = `'${originalValue ? formatDate(originalValue as string) : 'empty'}'`;
                    to = `'${updatedValue ? formatDate(updatedValue as string) : 'empty'}'`;
                }
                 if (key === 'verificationDateTime' || key === 'lastAttempt') {
                    from = `'${originalValue ? formatDateTime(originalValue as string) : 'empty'}'`;
                    to = `'${updatedValue ? formatDateTime(updatedValue as string) : 'empty'}'`;
                }

                changes.push(`${fieldLabels[key]} changed from ${from} to ${to}`);
            }
        }
    }
    return changes.join('; ');
};


const exportToCSV = (data: (InsuranceVerification & { patientName?: string })[], patients: Patient[]) => {
    const patientMap = new Map(patients.map(p => [p.id, `${p.lastName}, ${p.firstName}`]));
    const headers = ['Patient Name', 'Insurance Name', 'Primary/Secondary', 'Status', 'Assigned To', 'Due Date', 'Last Attempt', 'Notes'];
    const rows = data.map(v => [
        patientMap.get(v.patientId) || 'Unknown',
        v.insuranceName,
        v.primaryOrSecondary,
        v.status,
        v.assignedTo,
        formatDate(v.dueDate),
        formatDateTime(v.lastAttempt),
        v.internalNotes || '',
    ].map(field => `"${field.replace(/"/g, '""')}"`).join(','));

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "insurance_verifications.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};


// --- Main Component ---

const InsuranceVerifications: React.FC = () => {
    const { state, dispatch } = useSimulationContext();
    const { verifications, patients } = state;

    const [filters, setFilters] = useState({
        search: '',
        status: 'All',
        primaryOrSecondary: 'All',
        assignedTo: 'All',
        dueDate: 'All',
        planType: 'All',
    });

    const [sortConfig, setSortConfig] = useState<{ key: keyof InsuranceVerification | 'patientName'; direction: 'asc' | 'desc' }>({ key: 'dueDate', direction: 'asc' });
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [activeRecord, setActiveRecord] = useState<InsuranceVerification | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    
    const [bulkStatus, setBulkStatus] = useState<VerificationStatus | ''>('');
    const [bulkAssignee, setBulkAssignee] = useState<string>('');
    const [bulkDueDate, setBulkDueDate] = useState<string>('');


    const patientMap = useMemo(() => new Map(patients.map(p => [p.id, `${p.lastName}, ${p.firstName}`])), [patients]);

    const filteredVerifications = useMemo(() => {
        return verifications.filter(v => {
            const patientName = patientMap.get(v.patientId)?.toLowerCase() || '';
            const searchLower = filters.search.toLowerCase();

            if (filters.search && !(
                patientName.includes(searchLower) ||
                v.insuranceName.toLowerCase().includes(searchLower) ||
                v.memberId.toLowerCase().includes(searchLower) ||
                v.internalNotes?.toLowerCase().includes(searchLower)
            )) return false;
            
            if (filters.status !== 'All' && v.status !== filters.status) return false;
            if (filters.primaryOrSecondary !== 'All' && v.primaryOrSecondary !== filters.primaryOrSecondary) return false;
            if (filters.assignedTo !== 'All' && v.assignedTo !== filters.assignedTo) return false;
            if (filters.planType !== 'All' && v.planType !== filters.planType) return false;

            if (filters.dueDate !== 'All') {
                const todayStart = new Date();
                todayStart.setHours(0,0,0,0);
                const dueDate = new Date(v.dueDate + 'T12:00:00');
                
                if (filters.dueDate === 'Overdue') {
                    if (dueDate.getTime() >= todayStart.getTime()) return false;
                } else if (filters.dueDate === 'This Week') {
                    const dayOfWeek = todayStart.getDay(); 
                    const startOfWeek = new Date(todayStart);
                    startOfWeek.setDate(todayStart.getDate() - dayOfWeek);
                    
                    const endOfWeek = new Date(startOfWeek);
                    endOfWeek.setDate(startOfWeek.getDate() + 6);
                    endOfWeek.setHours(23,59,59,999);

                    if (dueDate < startOfWeek || dueDate > endOfWeek) return false;

                } else if (filters.dueDate === 'Next 7 Days') {
                    const sevenDaysLater = new Date(todayStart);
                    sevenDaysLater.setDate(todayStart.getDate() + 7);
                    
                    if (dueDate < todayStart || dueDate >= sevenDaysLater) return false;
                }
            }
            return true;
        });
    }, [verifications, filters, patientMap]);

    const sortedVerifications = useMemo(() => {
        return [...filteredVerifications].sort((a, b) => {
            const { key, direction } = sortConfig;
            let valA: any, valB: any;

            if (key === 'patientName') {
                valA = patientMap.get(a.patientId) || '';
                valB = patientMap.get(b.patientId) || '';
            } else {
                valA = a[key as keyof InsuranceVerification];
                valB = b[key as keyof InsuranceVerification];
            }

            let comparison = 0;
            if (valA > valB) comparison = 1;
            else if (valA < valB) comparison = -1;

            return direction === 'asc' ? comparison : -comparison;
        });
    }, [filteredVerifications, sortConfig, patientMap]);

    const handleSort = (key: keyof InsuranceVerification | 'patientName') => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };
    
    const handleFilterChange = (key: string, value: string) => {
         setFilters(f => ({ ...f, [key]: value }));
         dispatch({ type: 'LOG_ACTION', payload: { type: 'filter_verifications', details: { [key]: value } } });
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(new Set(sortedVerifications.map(v => v.id)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleSelectRow = (id: string) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    };

    const handleAddNew = () => {
        setIsCreating(true);
        setActiveRecord(null); 
    };

    const closeDrawer = () => {
        setActiveRecord(null);
        setIsCreating(false);
    };

    const handleSave = (record: InsuranceVerification) => {
        const actionType = isCreating ? 'ADD_VERIFICATION' : 'UPDATE_VERIFICATION';
        dispatch({ type: actionType, payload: record });
        dispatch({type: 'LOG_ACTION', payload: { type: isCreating ? 'add_verification' : 'update_verification', details: { id: record.id } }});
        closeDrawer();
    };
    
    const handleBulkUpdate = () => {
        if (selectedIds.size === 0) return;
        
        const changes: Partial<InsuranceVerification> = {};
        if (bulkStatus) changes.status = bulkStatus;
        if (bulkAssignee) changes.assignedTo = bulkAssignee;
        if (bulkDueDate) changes.dueDate = bulkDueDate;
        
        if(Object.keys(changes).length === 0) {
            alert("Please select a value to update.");
            return;
        }

        dispatch({ type: 'BULK_UPDATE_VERIFICATIONS', payload: { ids: Array.from(selectedIds), changes }});
        dispatch({ type: 'LOG_ACTION', payload: { type: 'bulk_update_verifications', details: { count: selectedIds.size, changes } }});
        
        setSelectedIds(new Set());
        setBulkStatus('');
        setBulkAssignee('');
        setBulkDueDate('');
    }
    
    const showBulkActions = selectedIds.size > 0;

    return (
        <div className="bg-white h-full shadow-lg rounded-md overflow-hidden flex">
            <div className="flex-grow flex flex-col">
                <div className="p-2 border-b">
                    <h2 className="text-lg font-bold text-gray-700">Insurance Verifications</h2>
                </div>
                <div className="p-2 bg-gray-50 border-b space-y-2">
                    <div className="flex justify-between items-center">
                        <input
                            type="text"
                            placeholder="Search Patient, Insurance, Member ID..."
                            className="input-field w-1/3"
                            value={filters.search}
                            onChange={e => handleFilterChange('search', e.target.value)}
                        />
                         <div className="flex items-center space-x-2">
                            {showBulkActions ? (
                                <>
                                    <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value as VerificationStatus)} className="select-field-xs">
                                        <option value="">Change Status...</option>
                                        {VERIFICATION_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                    <select value={bulkAssignee} onChange={e => setBulkAssignee(e.target.value)} className="select-field-xs">
                                        <option value="">Assign To...</option>
                                        {ASSIGNED_USERS.map(u => <option key={u} value={u}>{u}</option>)}
                                    </select>
                                    <input type="date" value={bulkDueDate} onChange={e => setBulkDueDate(e.target.value)} className="input-field-xs" />
                                    <button onClick={handleBulkUpdate} className="btn-primary-xs">Apply ({selectedIds.size})</button>
                                </>
                            ) : (
                                <>
                                    <button onClick={() => exportToCSV(sortedVerifications, patients)} className="btn-secondary-xs">Export CSV</button>
                                    <button onClick={handleAddNew} className="btn-primary-xs">Add Verification</button>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center space-x-2 text-xs">
                        <span className="font-semibold text-gray-600">Filters:</span>
                         <select value={filters.status} onChange={e => handleFilterChange('status', e.target.value)} className="select-field-xs">
                            <option value="All">All Statuses</option>
                            {VERIFICATION_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <select value={filters.primaryOrSecondary} onChange={e => handleFilterChange('primaryOrSecondary', e.target.value)} className="select-field-xs">
                            <option value="All">All Types</option>
                            <option value="Primary">Primary</option>
                            <option value="Secondary">Secondary</option>
                        </select>
                        <select value={filters.assignedTo} onChange={e => handleFilterChange('assignedTo', e.target.value)} className="select-field-xs">
                            <option value="All">All Users</option>
                            {ASSIGNED_USERS.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                        <select value={filters.dueDate} onChange={e => handleFilterChange('dueDate', e.target.value)} className="select-field-xs">
                            <option value="All">All Due Dates</option>
                            <option value="Overdue">Overdue</option>
                            <option value="This Week">This Week</option>
                            <option value="Next 7 Days">Next 7 Days</option>
                        </select>
                        <select value={filters.planType} onChange={e => handleFilterChange('planType', e.target.value)} className="select-field-xs">
                            <option value="All">All Plan Types</option>
                            {PLAN_TYPES.map(pt => <option key={pt} value={pt}>{pt}</option>)}
                        </select>
                    </div>
                </div>

                <div className="flex-grow overflow-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-xs">
                        <thead className="bg-gray-100 sticky top-0">
                            <tr>
                                <th className="px-4 py-2"><input type="checkbox" onChange={handleSelectAll} checked={selectedIds.size === sortedVerifications.length && sortedVerifications.length > 0} /></th>
                                <SortableHeader label="Patient Name" onSort={() => handleSort('patientName')} sortConfig={sortConfig} columnKey="patientName" />
                                <SortableHeader label="Insurance" onSort={() => handleSort('insuranceName')} sortConfig={sortConfig} columnKey="insuranceName" />
                                <SortableHeader label="Type" onSort={() => handleSort('primaryOrSecondary')} sortConfig={sortConfig} columnKey="primaryOrSecondary" />
                                <SortableHeader label="Status" onSort={() => handleSort('status')} sortConfig={sortConfig} columnKey="status" />
                                <SortableHeader label="Assigned To" onSort={() => handleSort('assignedTo')} sortConfig={sortConfig} columnKey="assignedTo" />
                                <SortableHeader label="Due Date" onSort={() => handleSort('dueDate')} sortConfig={sortConfig} columnKey="dueDate" />
                                <SortableHeader label="Last Attempt" onSort={() => handleSort('lastAttempt')} sortConfig={sortConfig} columnKey="lastAttempt" />
                                <th className="th-header">Notes</th>
                                <th className="th-header"></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                           {sortedVerifications.map(v => {
                               const todayStart = new Date();
                               todayStart.setHours(0,0,0,0);
                               const isOverdue = new Date(v.dueDate + 'T12:00:00').getTime() < todayStart.getTime();
                               return (
                                <tr key={v.id} className={`hover:bg-blue-50 ${selectedIds.has(v.id) ? 'bg-blue-100' : (isOverdue ? 'bg-red-50' : '')}`}>
                                    <td className="px-4 py-2"><input type="checkbox" checked={selectedIds.has(v.id)} onChange={() => handleSelectRow(v.id)} /></td>
                                    <td className="td-cell font-semibold">{patientMap.get(v.patientId) || 'Unknown Patient'}</td>
                                    <td className="td-cell">{v.insuranceName}</td>
                                    <td className="td-cell">{v.primaryOrSecondary}</td>
                                    <td className="td-cell"><StatusChip status={v.status} /></td>
                                    <td className="td-cell">{v.assignedTo}</td>
                                    <td className="td-cell">{formatDate(v.dueDate)}</td>
                                    <td className="td-cell">{formatDateTime(v.lastAttempt)}</td>
                                    <td className="td-cell max-w-xs truncate">{v.internalNotes}</td>
                                    <td className="td-cell">
                                        <button onClick={() => setActiveRecord(v)} className="text-blue-600 hover:text-blue-800 p-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                                        </button>
                                    </td>
                                </tr>
                               )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
            {(activeRecord || isCreating) && (
                <VerificationDetailsDrawer 
                    record={activeRecord} 
                    isCreating={isCreating}
                    onClose={closeDrawer}
                    onSave={handleSave}
                />
            )}
        </div>
    );
};

const SortableHeader: React.FC<{ label: string, onSort: () => void, sortConfig: {key: string, direction: string}, columnKey: string}> = ({ label, onSort, sortConfig, columnKey }) => (
    <th className="th-header cursor-pointer" onClick={onSort}>
        <div className="flex items-center">
            {label}
            {sortConfig.key === columnKey && <span className="ml-1">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>}
        </div>
    </th>
);

const VerificationDetailsDrawer: React.FC<{
    record: InsuranceVerification | null,
    isCreating: boolean,
    onClose: () => void,
    onSave: (record: InsuranceVerification) => void
}> = ({ record, isCreating, onClose, onSave }) => {
    const { state } = useSimulationContext();
    const emptyRecord: Omit<InsuranceVerification, 'id'> = {
        patientId: 0,
        insuranceName: '',
        planType: 'PPO',
        primaryOrSecondary: 'Primary',
        memberId: '',
        subscriberName: '',
        relationshipToSubscriber: 'Self',
        status: 'To Verify',
        dueDate: new Date().toISOString().split('T')[0],
        assignedTo: 'Unassigned',
        auditTrail: [],
        attachments: [],
        verificationMethod: [],
    };
    
    const [formData, setFormData] = useState<Partial<InsuranceVerification>>(isCreating ? emptyRecord : record);
    const methodOptions: VerificationMethod[] = ['Portal', 'Call', 'Fax', 'EDI'];
    
    const createAuditEntry = (action: string, changes?: string): AuditEntry => ({
        action,
        user: 'RECEPTION',
        timestamp: new Date().toISOString(),
        changes
    });

    const handleSave = () => {
        if (!formData.patientId || !formData.insuranceName || !formData.primaryOrSecondary || !formData.status) {
            alert('Patient, Insurance Name, Type, and Status are required.');
            return;
        }
        if ((formData.status === 'Approved' || formData.status === 'Denied') && !formData.verificationDateTime) {
            alert('Verification Date/Time is required for Approved/Denied status.');
            return;
        }
        
        if (isCreating) {
            const finalRecord: InsuranceVerification = { ...emptyRecord, ...formData, id: `v${Date.now()}`, auditTrail: [createAuditEntry('Created')] } as InsuranceVerification;
            onSave(finalRecord);
        } else {
            const changesString = getChanges(record!, formData, state.patients);
            const auditTrail = changesString
                ? [...(record?.auditTrail || []), createAuditEntry('Modified', changesString)]
                : record?.auditTrail || [];
            
            const finalRecord: InsuranceVerification = { ...record!, ...formData, auditTrail };
            onSave(finalRecord);
        }
    };

     const handleSaveAttempt = () => {
        if (isCreating) {
            alert("Please save the new verification record first before saving an attempt.");
            return;
        }
        const formDataWithAttempt = { ...formData, lastAttempt: new Date().toISOString() };
        const changesString = getChanges(record!, formDataWithAttempt, state.patients);
        const finalRecord: InsuranceVerification = {
            ...record!,
            ...formDataWithAttempt,
            auditTrail: [...(record!.auditTrail || []), createAuditEntry('Saved Attempt', changesString)]
        };
        onSave(finalRecord);
        alert('Attempt logged and record saved.');
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === 'patientId') {
            setFormData(prev => ({ ...prev, [name]: Number(value) }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleMethodToggle = (method: VerificationMethod) => {
        setFormData(prev => {
            const currentMethods = prev.verificationMethod || [];
            if (currentMethods.includes(method)) {
                return { ...prev, verificationMethod: currentMethods.filter(m => m !== method) };
            } else {
                return { ...prev, verificationMethod: [...currentMethods, method] };
            }
        });
    };

    const handleFileDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const newFiles: VerificationAttachment[] = [];
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
             Array.from(e.dataTransfer.files).forEach((file: File) => {
                 newFiles.push({
                     name: file.name,
                     url: URL.createObjectURL(file)
                 });
             });
        }
        setFormData(prev => ({
            ...prev,
            attachments: [...(prev.attachments || []), ...newFiles]
        }));
    };
    
    const handleBrowseClick = () => {
        const mockFile = { name: `EOB_Scan_${Date.now().toString().slice(-4)}.pdf`, url: '#' };
        setFormData(prev => ({
            ...prev,
            attachments: [...(prev.attachments || []), mockFile]
        }));
    };

    const handleRemoveAttachment = (index: number) => {
        setFormData(prev => ({
            ...prev,
            attachments: (prev.attachments || []).filter((_, i) => i !== index)
        }));
    };

    return (
        <aside className="w-1/3 bg-gray-50 border-l p-4 flex flex-col">
            <h3 className="text-lg font-bold text-gray-800 mb-4">{isCreating ? 'New Verification' : 'Edit Verification'}</h3>
            <div className="flex-grow overflow-y-auto space-y-4 pr-2 text-sm">
                <select name="patientId" value={formData.patientId || ''} onChange={handleInputChange} className="input-field">
                    <option value="">Select Patient...</option>
                    {state.patients.map(p => <option key={p.id} value={p.id}>{p.lastName}, {p.firstName}</option>)}
                </select>
                <input name="insuranceName" placeholder="Insurance Name" value={formData.insuranceName || ''} onChange={handleInputChange} className="input-field" />
                 <select name="status" value={formData.status || ''} onChange={handleInputChange} className="input-field">
                    {VERIFICATION_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>

                {(formData.status === 'Approved' || formData.status === 'Denied') && (
                     <input name="verificationDateTime" type="datetime-local" value={formData.verificationDateTime || ''} onChange={handleInputChange} className="input-field" />
                )}

                <input name="dueDate" type="date" value={formData.dueDate || ''} onChange={handleInputChange} className="input-field" />
                 <select name="assignedTo" value={formData.assignedTo || ''} onChange={handleInputChange} className="input-field">
                    {ASSIGNED_USERS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
                
                <div className="bg-white p-2 rounded border border-gray-300">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Verification Method(s)</label>
                    <div className="flex flex-wrap gap-3">
                        {methodOptions.map(method => (
                            <label key={method} className="flex items-center space-x-1 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={formData.verificationMethod?.includes(method) || false} 
                                    onChange={() => handleMethodToggle(method)}
                                    className="h-3 w-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="text-xs text-gray-600">{method}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <textarea name="internalNotes" placeholder="Internal Notes" value={formData.internalNotes || ''} onChange={handleInputChange} className="input-field h-24" />
                
                <div>
                    <h4 className="font-semibold mb-2">Attachments</h4>
                    {(formData.attachments && formData.attachments.length > 0) && (
                        <ul className="mb-2 space-y-1">
                            {formData.attachments.map((att, index) => (
                                <li key={index} className="flex justify-between items-center bg-white p-2 border rounded text-xs">
                                    <a href={att.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline truncate max-w-[150px]" onClick={(e)=>e.preventDefault()}>{att.name}</a>
                                    <button onClick={() => handleRemoveAttachment(index)} className="text-red-500 hover:text-red-700 ml-2 font-bold">×</button>
                                </li>
                            ))}
                        </ul>
                    )}
                    <div 
                        onDrop={handleFileDrop} 
                        onDragOver={(e) => e.preventDefault()} 
                        className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-500 text-xs hover:bg-white hover:border-blue-400 transition-colors cursor-pointer"
                    >
                        Drag & Drop files here or <button type="button" className="text-blue-600 underline" onClick={handleBrowseClick}>browse</button>
                    </div>
                </div>

                 <div>
                    <h4 className="font-semibold mb-2">Audit Trail</h4>
                    <ul className="text-xs text-gray-500 space-y-2 bg-white border p-2 rounded-md max-h-40 overflow-y-auto">
                        {formData.auditTrail?.map((entry, i) => (
                          <li key={i}>
                            <div className="flex justify-between">
                                <span><strong>{entry.action}</strong> by {entry.user}</span>
                                <span className="text-gray-400">{formatDateTime(entry.timestamp)}</span>
                            </div>
                            {entry.changes && <p className="pl-2 mt-1 text-gray-600 text-[11px] italic border-l-2 ml-1 pl-1"> → {entry.changes}</p>}
                          </li>
                        )).reverse()}
                    </ul>
                </div>
            </div>
            <div className="pt-4 border-t flex justify-between">
                <button onClick={onClose} className="btn-secondary">Cancel</button>
                <div>
                    <button onClick={handleSaveAttempt} className="btn-secondary mr-2">Save Attempt</button>
                    <button onClick={handleSave} className="btn-primary">Save & Close</button>
                </div>
            </div>
        </aside>
    );
};

export default InsuranceVerifications;