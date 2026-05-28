import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSimulationContext } from '../../context/SimulationContext';
import { ToothStatus, ToothState, LedgerEntry, MedicalRecord, Patient } from '../../types';
import { TREATMENTS, PROCEDURE_CODES } from '../../constants';

// --- Types & Helpers ---

const RESTORATIVE_PROCEDURES = [
    'Crown', 'Composite Filling', 'Amalgam Filling', 'Bridge Abutment', 'RCT'
];

const getStatusColor = (status: string) => {
    switch (status) {
        case 'Signed': return 'text-green-600 bg-green-50 border-green-200';
        case 'Draft': return 'text-orange-600 bg-orange-50 border-orange-200';
        case 'Finalized': return 'text-blue-600 bg-blue-50 border-blue-200';
        case 'Missing': return 'text-red-600 bg-red-50 border-red-200';
        default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
};

// --- Components ---

const CategorizedProcedureList: React.FC<{
    selectedProcedure?: string;
    onSelect: (code: string, description: string, fee: number) => void;
}> = ({ selectedProcedure, onSelect }) => {
    const categories = useMemo(() => {
        const uniqueCategories = Array.from(new Set(PROCEDURE_CODES.map(p => p.category)));
        const order = ['Diagnostic', 'Preventive', 'Restorative', 'Endodontics', 'Periodontics', 'Prostho remov', 'Maxillo Prosth', 'Implant Serv', 'Prostho fixed', 'Oral Surgery', 'Orthodontics', 'Adjunct Serv', 'Sleep Apnea', 'Conditions', 'Other', 'Multi-Codes', 'Dental Diagnostics'];
        return uniqueCategories.sort((a, b) => {
            const indexA = order.indexOf(a);
            const indexB = order.indexOf(b);
            return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
        });
    }, []);

    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

    return (
        <div className="border border-gray-300 rounded overflow-hidden bg-gray-100 font-sans text-xs">
            <div className="max-h-[250px] overflow-y-auto">
                {categories.map(cat => {
                    const isExpanded = expandedCategory === cat;
                    const items = PROCEDURE_CODES.filter(p => p.category === cat);
                    
                    return (
                        <div key={cat} className="border-b last:border-b-0 border-gray-200">
                            <button 
                                onClick={() => setExpandedCategory(isExpanded ? null : cat)}
                                className="w-full text-left px-2 py-1.5 flex items-center gap-2 hover:bg-gray-200 transition-colors font-black text-gray-800"
                            >
                                <span className="w-4 h-4 flex items-center justify-center border border-gray-400 bg-white text-[10px] leading-none">
                                    {isExpanded ? '−' : '+'}
                                </span>
                                {cat}
                            </button>
                            
                            {isExpanded && (
                                <div className="bg-white border-t border-gray-200">
                                    {items.map((item, idx) => (
                                        <div 
                                            key={item.adaCode}
                                            onClick={() => onSelect(item.adaCode, item.description, item.fee)}
                                            className={`grid grid-cols-[60px_1fr] border-b last:border-b-0 border-gray-100 cursor-pointer hover:bg-blue-50 transition-colors ${idx % 2 === 1 ? 'bg-gray-50/50' : ''} ${selectedProcedure === item.description ? 'bg-blue-100 font-black' : ''}`}
                                        >
                                            <div className="px-2 py-1.5 font-mono text-gray-500 border-r border-gray-100 text-[10px]">{item.adaCode}</div>
                                            <div className="px-2 py-1.5 truncate text-gray-700">{item.description}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const KPICard: React.FC<{ title: string; value: string | number; icon: string; color: 'blue' | 'green' | 'orange' | 'red' | 'indigo' }> = ({ title, value, icon, color }) => {
    const variants = {
        blue: 'border-blue-500 text-blue-700 bg-blue-50',
        green: 'border-green-500 text-green-700 bg-green-50',
        orange: 'border-orange-500 text-orange-700 bg-orange-50',
        red: 'border-red-500 text-red-700 bg-red-50',
        indigo: 'border-indigo-500 text-indigo-700 bg-indigo-50',
    };
    return (
        <div className={`p-4 rounded-xl border-l-4 shadow-sm bg-white ${variants[color]}`}>
            <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-70">{title}</span>
                <span className="text-xl">{icon}</span>
            </div>
            <div className="text-2xl font-black">{value}</div>
        </div>
    );
};

// --- Clinical Summary View ---

const ChartSummary: React.FC<{ onSelectPatient: (id: number) => void }> = ({ onSelectPatient }) => {
    const { state } = useSimulationContext();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'attention' | 'billing'>('all');

    const metrics = useMemo(() => {
        const pending = state.medicalRecords.filter(r => r.recordType === 'Progress Note' && r.status !== 'Signed').length;
        const signedOff = state.medicalRecords.filter(r => 
            r.status === 'Signed' && 
            new Date(r.signature?.signedOn || '').toDateString() === new Date().toDateString()
        ).length;
        const seenTodayIds = new Set(state.appointments
            .filter(a => new Date(a.startTime).toDateString() === new Date().toDateString() && !a.isBlock)
            .map(a => a.patientId));
        const noteForTodayIds = new Set(state.medicalRecords
            .filter(r => new Date(r.recordDate).toDateString() === new Date().toDateString())
            .map(r => r.patientId));
        const missingNotesToday = Array.from(seenTodayIds).filter(id => !noteForTodayIds.has(id)).length;
        const alertPatients = state.patients.filter(p => p.medicalAlerts.length > 0 || (p.patientAlerts && p.patientAlerts.length > 0)).length;
        const attention = alertPatients + missingNotesToday;
        let readyToBillCount = 0;
        state.patients.forEach(p => {
            const completedProcs = p.chart.filter(t => t.status === ToothStatus.Completed).length;
            const ledgerProcs = p.ledger.filter(l => l.charge > 0).length;
            if (completedProcs > ledgerProcs) readyToBillCount++;
        });
        return { pending, signedOff, readyToBillCount, attention };
    }, [state.medicalRecords, state.patients, state.appointments]);

    const patientList = useMemo(() => {
        const list = state.patients.map(p => {
            const latestNote = state.medicalRecords
                .filter(r => r.patientId === p.id && r.recordType === 'Progress Note')
                .sort((a, b) => new Date(b.recordDate).getTime() - new Date(a.recordDate).getTime())[0];
            const completedCount = p.chart.filter(t => t.status === ToothStatus.Completed).length;
            const ledgerCount = p.ledger.filter(l => l.charge > 0).length;
            const billingStatus = completedCount > ledgerCount ? 'Ready to Bill' : 'Current';
            const wasSeenToday = state.appointments.some(a => a.patientId === p.id && new Date(a.startTime).toDateString() === new Date().toDateString());
            const missingNoteToday = wasSeenToday && !latestNote;
            return {
                id: p.id,
                name: `${p.lastName}, ${p.firstName}`,
                chartNumber: p.chartNumber || 'N/A',
                noteStatus: missingNoteToday ? 'Missing' : (latestNote?.status || 'None'),
                billingStatus,
                hasAlerts: p.medicalAlerts.length > 0 || (p.patientAlerts && p.patientAlerts.length > 0),
                lastService: latestNote?.recordDate || p.lastVisitDate || 'N/A',
                isAttention: (p.medicalAlerts.length > 0) || missingNoteToday
            };
        });
        return list.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.chartNumber.toLowerCase().includes(searchTerm.toLowerCase());
            if (!matchesSearch) return false;
            if (filterTab === 'pending') return p.noteStatus !== 'Signed' && p.noteStatus !== 'None';
            if (filterTab === 'attention') return p.isAttention;
            if (filterTab === 'billing') return p.billingStatus === 'Ready to Bill';
            return true;
        });
    }, [state.patients, state.medicalRecords, state.appointments, searchTerm, filterTab]);

    return (
        <div className="flex flex-col h-full bg-gray-100 p-4 space-y-4 overflow-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Clinical Worklist Summary</h2>
                    <p className="text-xs text-gray-500">Overview of provider documentation and billing readiness.</p>
                </div>
                <div className="flex gap-2">
                    <button className="px-3 py-1.5 bg-white border rounded text-xs font-bold hover:bg-gray-50 flex items-center gap-2">
                        <span>📊</span> Clinical Audit Report
                    </button>
                    <button className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-700 shadow-sm">
                        Batch Sign Records
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="cursor-pointer transition-transform hover:scale-105" onClick={() => setFilterTab('pending')}>
                    <KPICard title="Pending Signatures" value={metrics.pending} icon="✍️" color="orange" />
                </div>
                <div className="cursor-pointer transition-transform hover:scale-105" onClick={() => setFilterTab('all')}>
                    <KPICard title="Signed Off Today" value={metrics.signedOff} icon="✅" color="green" />
                </div>
                <div className="cursor-pointer transition-transform hover:scale-105" onClick={() => setFilterTab('billing')}>
                    <KPICard title="Ready to Bill" value={metrics.readyToBillCount} icon="💳" color="indigo" />
                </div>
                <div className="cursor-pointer transition-transform hover:scale-105" onClick={() => setFilterTab('attention')}>
                    <KPICard title="Needs Attention" value={metrics.attention} icon="🚨" color="red" />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-md border flex flex-col flex-grow min-h-0">
                <div className="p-4 border-b bg-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex gap-1 bg-gray-200 p-1 rounded-lg">
                        {(['all', 'pending', 'billing', 'attention'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setFilterTab(tab)}
                                className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase transition-all ${filterTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                    <div className="relative w-full md:w-80">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 text-xs">🔍</span>
                        <input 
                            type="text" 
                            placeholder="Filter clinical list..." 
                            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-auto flex-grow">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-3 text-left text-[10px] font-black text-gray-500 uppercase">Patient Name</th>
                                <th className="px-6 py-3 text-left text-[10px] font-black text-gray-500 uppercase">Chart #</th>
                                <th className="px-6 py-3 text-left text-[10px] font-black text-gray-500 uppercase">Last Encounter</th>
                                <th className="px-6 py-3 text-left text-[10px] font-black text-gray-500 uppercase">Note Status</th>
                                <th className="px-6 py-3 text-left text-[10px] font-black text-gray-500 uppercase">Billing Status</th>
                                <th className="px-6 py-3 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {patientList.map(p => (
                                <tr key={p.id} className="hover:bg-blue-50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {p.hasAlerts && <span title="Medical Alert" className="text-red-500 text-sm animate-pulse">⚠️</span>}
                                            <span className="font-bold text-gray-800">{p.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 font-mono uppercase">{p.chartNumber}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{p.lastService !== 'N/A' ? new Date(p.lastService + 'T12:00:00').toLocaleDateString() : 'N/A'}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${getStatusColor(p.noteStatus)}`}>
                                            {p.noteStatus === 'None' ? 'No Recent Note' : p.noteStatus}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-[10px] font-bold ${p.billingStatus === 'Ready to Bill' ? 'text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded' : 'text-gray-400'}`}>
                                            {p.billingStatus}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button 
                                            onClick={() => onSelectPatient(p.id)}
                                            className="text-[10px] bg-blue-600 text-white px-4 py-1.5 rounded-lg shadow-sm hover:bg-blue-700 font-bold transition-all transform group-hover:scale-105"
                                        >
                                            Open Chart
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// --- Detailed View Components ---

const ToothHoverInfo: React.FC<{
    toothData: ToothState,
    position: { x: number, y: number }
}> = ({ toothData, position }) => {
    const style: React.CSSProperties = {
        position: 'fixed',
        top: position.y + 15,
        left: position.x + 15,
        pointerEvents: 'none',
        zIndex: 50,
    };
    return (
        <div style={style} className="p-2 bg-gray-800 text-white text-xs rounded-md shadow-lg transition-opacity duration-200 border border-gray-600">
            <p><strong>Tooth:</strong> {toothData.toothNumber}</p>
            <p><strong>Status:</strong> {toothData.status}</p>
            {toothData.procedure && <p><strong>Procedure:</strong> {toothData.procedure}</p>}
            {toothData.notes && <p className="max-w-xs italic text-blue-200 mt-1 font-bold">Notes Found • Read Sidebar or History Panel</p>}
        </div>
    );
};

const Odontogram: React.FC<{
    chartData: ToothState[],
    onToothClick: (tooth: number, isMultiSelect: boolean) => void,
    selectedTeeth: number[],
    onToothMouseEnter: (e: React.MouseEvent, toothNumber: number) => void;
    onToothMouseLeave: () => void;
    onToothDragStart: (e: React.DragEvent, toothNumber: number) => void;
    onToothDragOver: (e: React.DragEvent, toothNumber: number) => void;
    onToothDrop: (e: React.DragEvent, toothNumber: number) => void;
    onToothDragEnd: () => void;
    dragOverTooth: number | null;
}> = ({ chartData, onToothClick, selectedTeeth, onToothMouseEnter, onToothMouseLeave, onToothDragStart, onToothDragOver, onToothDrop, onToothDragEnd, dragOverTooth }) => {
    const teethRows = [
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
        [32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17]
    ];
    
    const getToothState = (toothNumber: number) => chartData.find(t => t.toothNumber === toothNumber);

    const getToothColor = (toothState?: ToothState) => {
        if (!toothState) return 'bg-white';
        switch (toothState.status) {
            case ToothStatus.Completed: return 'bg-blue-500 text-white';
            case ToothStatus.TreatmentPlanned: return 'bg-red-500 text-white';
            case ToothStatus.Existing: return 'bg-gray-400 text-white';
            case ToothStatus.Restorative: return 'bg-green-500 text-white';
            case ToothStatus.Missing: return 'bg-gray-800 text-gray-500';
            default: return 'bg-white';
        }
    };
    
    return (
        <div className="bg-blue-50 p-6 rounded-2xl shadow-inner border-2 border-blue-100">
            <p className="text-center text-[10px] font-black uppercase text-blue-400 mb-4 tracking-widest">Odontogram Map • Click to edit</p>
            {teethRows.map((row, rowIndex) => (
                <div key={rowIndex} className={`flex ${rowIndex === 0 ? 'justify-start' : 'justify-end flex-row-reverse'} mb-4`}>
                    {row.map(toothNumber => {
                        const toothState = getToothState(toothNumber);
                        const isSelected = selectedTeeth.includes(toothNumber);
                        const hasNotes = toothState?.notes && toothState.notes.trim().length > 0;
                        const isDraggable = toothState?.status === ToothStatus.TreatmentPlanned;
                        const isDropTarget = dragOverTooth === toothNumber && toothState?.status !== ToothStatus.Missing;

                        return (
                             <div key={toothNumber} 
                                id={`tooth-${toothNumber}`}
                                onClick={(e) => onToothClick(toothNumber, e.ctrlKey || e.metaKey)}
                                onMouseEnter={(e) => onToothMouseEnter(e, toothNumber)}
                                onMouseLeave={onToothMouseLeave}
                                draggable={isDraggable}
                                onDragStart={(e) => onToothDragStart(e, toothNumber)}
                                onDragOver={(e) => onToothDragOver(e, toothNumber)}
                                onDrop={(e) => onToothDrop(e, toothNumber)}
                                onDragEnd={onToothDragEnd}
                                className={`w-11 h-11 border flex items-center justify-center font-bold text-sm transition-all relative rounded-sm
                                    ${getToothColor(toothState)} 
                                    ${isSelected ? 'ring-4 ring-yellow-400 z-10 scale-110 border-yellow-500 shadow-lg' : 'border-gray-200'}
                                    ${isDraggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}
                                    ${isDropTarget ? 'outline-2 outline-dashed outline-blue-600 outline-offset-2' : ''}
                                `}>
                                {toothNumber}
                                {hasNotes && (
                                    <div title="Tooth has clinical notes" className="absolute -top-1 -left-1 bg-yellow-200 border border-yellow-400 rounded-sm text-[8px] p-0.5 shadow-sm text-black flex items-center justify-center z-10">
                                        🗒️
                                    </div>
                                )}
                                {isSelected && <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-yellow-400 rounded-full border border-white shadow-sm"></div>}
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
};

const BulkToothEditSidebar: React.FC<{
    selectedTeeth: number[];
    onSave: (updates: Partial<ToothState>) => void;
    onCancel: () => void;
}> = ({ selectedTeeth, onSave, onCancel }) => {
    const [formData, setFormData] = useState<Partial<ToothState>>({
        status: undefined,
        procedure: undefined,
        fee: undefined,
        surface: undefined,
        notes: undefined
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement | HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === 'fee') {
             const numericValue = value === '' ? undefined : Number(value);
             setFormData(prev => ({ ...prev, fee: numericValue }));
        } else {
             setFormData(prev => ({ ...prev, [name]: value === '' ? undefined : value }));
        }
    };

    const handleStatusClick = (status: ToothStatus) => {
         setFormData(prev => ({ ...prev, status }));
    };

    const handleProcedureSelect = (code: string, description: string, fee: number) => {
        setFormData(prev => ({
            ...prev,
            procedure: description,
            fee: fee
        }));
    };

    return (
        <div className="flex flex-col h-full animate-slide-in-from-right space-y-6">
            <div className="bg-blue-600 p-4 -mx-4 -mt-4 text-white rounded-t shadow-md">
                <h3 className="font-black uppercase tracking-widest text-xs">Bulk Clinical Update</h3>
                <p className="text-[10px] opacity-80 mt-1">Applying to: {selectedTeeth.length} Teeth</p>
            </div>
            
            <div className="flex-grow overflow-y-auto space-y-4 pr-1 scrollbar-thin">
                <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">Update Status</label>
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
                        {Object.values(ToothStatus).map(status => (
                            <button key={status} onClick={() => handleStatusClick(status)}
                                className={`p-2 rounded border-2 transition-all ${formData.status === status ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white border-gray-100 text-gray-600 hover:border-blue-300'}`}>
                                {status}
                            </button>
                        ))}
                    </div>
                </div>
                
                <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block">Procedure Database</label>
                    <CategorizedProcedureList selectedProcedure={formData.procedure} onSelect={handleProcedureSelect} />
                </div>
                
                 <div>
                    <label htmlFor="notes" className="text-[10px] font-black uppercase text-gray-400 mb-1 block">Append Clinical Note</label>
                    <textarea id="notes" name="notes" value={formData.notes || ''} onChange={handleInputChange}
                        className="input-field h-24 text-xs bg-white border-blue-100"
                        placeholder="New notes will be appended to existing ones..."
                    />
                </div>
            </div>

             <div className="pt-4 border-t space-y-2">
                 <button onClick={() => onSave(formData)} className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-black uppercase shadow-md transition-all active:scale-95">
                    Execute Bulk Update
                </button>
                 <button onClick={onCancel} className="w-full py-2 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200 text-xs font-bold uppercase transition-colors">
                    Discard Selection
                </button>
            </div>
        </div>
    );
};

const ToothEditSidebar: React.FC<{
    tooth: ToothState;
    onSave: (toothData: ToothState) => void;
    onCancel: () => void;
}> = ({ tooth, onSave, onCancel }) => {
    const [formData, setFormData] = useState<ToothState>(tooth);
    const [isEditingExisting, setIsEditingExisting] = useState(false);

    useEffect(() => {
        setFormData(tooth);
        setIsEditingExisting(false);
    }, [tooth]);
    
    const handleInputChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement | HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === 'fee') {
             const numericValue = value === '' ? undefined : Number(value);
             setFormData(prev => ({ ...prev, fee: numericValue }));
        } else {
             setFormData(prev => ({...prev, [name]: value === '' ? undefined : value }));
        }
    };

    const handleProcedureSelect = (code: string, description: string, fee: number) => {
        setFormData(prev => ({
            ...prev,
            procedure: description,
            fee: fee
        }));
    };

    const handleStatusClick = (status: ToothStatus) => {
        setFormData(prev => ({ ...prev, status }));
    };

    const hasHistoricalNotes = tooth.notes && tooth.notes.trim().length > 0;

    return (
        <div className="flex flex-col h-full animate-slide-in-from-right space-y-4">
            <div className="bg-gray-800 p-4 -mx-4 -mt-4 text-white rounded-t shadow-md flex justify-between items-center text-xs">
                <h3 className="font-black uppercase tracking-widest">Tooth #{formData.toothNumber} Details</h3>
                <span className={`w-3 h-3 rounded-full ${formData.status === ToothStatus.Healthy ? 'bg-white border' : 'bg-blue-500'}`}></span>
            </div>

            <div className="flex-grow overflow-y-auto space-y-4 pr-1 scrollbar-thin">
                {hasHistoricalNotes && !isEditingExisting && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg shadow-sm relative group">
                        <div className="text-[9px] font-black text-yellow-600 uppercase tracking-widest mb-1 flex items-center gap-1">
                             <span>📜 Historical Notes</span>
                        </div>
                        <p className="text-xs text-gray-700 whitespace-pre-wrap font-medium italic">"{tooth.notes}"</p>
                        <button 
                            onClick={() => setIsEditingExisting(true)}
                            className="mt-2 text-[10px] font-black text-blue-600 uppercase hover:underline"
                        >
                            Modify Historical Note
                        </button>
                    </div>
                )}

                <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">Clinical Status</label>
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
                        {Object.values(ToothStatus).map(status => (
                            <button key={status} onClick={() => handleStatusClick(status)}
                                className={`p-2 rounded border-2 transition-all ${formData.status === status ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-600 border-gray-100 hover:border-blue-200'}`}>
                                {status}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block tracking-widest">Diagnostic & Treatment Codes</label>
                    <CategorizedProcedureList selectedProcedure={formData.procedure} onSelect={handleProcedureSelect} />
                </div>

                {formData.procedure && (
                    <div className="p-3 bg-green-50 border border-green-100 rounded">
                        <p className="text-[10px] font-black text-green-800 uppercase mb-1 tracking-tighter">Current Selection</p>
                        <p className="text-xs font-bold text-green-700">{formData.procedure}</p>
                    </div>
                )}

                <div>
                    <label htmlFor="notes" className="text-[10px] font-black uppercase text-gray-400 mb-1 block tracking-widest">
                        {isEditingExisting ? 'Edit Existing Note' : 'Add New Clinical Entry'}
                    </label>
                    <textarea 
                        id="notes" 
                        name="notes" 
                        value={formData.notes || ''} 
                        onChange={handleInputChange}
                        className={`input-field h-28 text-xs bg-white ${isEditingExisting ? 'ring-2 ring-yellow-400' : ''}`}
                        placeholder={isEditingExisting ? 'Editing original note...' : 'Document clinical findings, medications, or patient response...'}
                    />
                    {isEditingExisting && <p className="text-[9px] text-yellow-600 font-bold mt-1 uppercase">Warning: You are editing historical data.</p>}
                </div>
            </div>
            <div className="pt-4 border-t space-y-2">
                 <button onClick={() => onSave(formData)} className="w-full py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs font-black uppercase shadow-md transition-all active:scale-95">
                    Save to Chart
                </button>
                 <button onClick={onCancel} className="w-full py-2 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200 text-xs font-bold uppercase transition-colors">
                    Cancel
                </button>
            </div>
        </div>
    );
};

// --- History Table Component ---

const ClinicalHistoryList: React.FC<{
    chartData: ToothState[],
    selectedTeeth: number[],
    onEntryClick: (tooth: number) => void
}> = ({ chartData, selectedTeeth, onEntryClick }) => {
    const historyEntries = useMemo(() => {
        return chartData
            .filter(t => (t.notes && t.notes.trim().length > 0) || t.procedure)
            .map(t => ({
                tooth: t.toothNumber,
                status: t.status,
                procedure: t.procedure || 'General Note',
                notes: t.notes || '',
                isHighlighted: selectedTeeth.includes(t.toothNumber)
            }));
    }, [chartData, selectedTeeth]);

    return (
        <div className="bg-white rounded-xl shadow-xl border overflow-hidden">
            <div className="bg-gray-800 px-6 py-3 text-white flex justify-between items-center">
                <h3 className="text-xs font-black uppercase tracking-widest">Clinical History & Progress Notes</h3>
                <span className="text-[10px] font-bold text-gray-400">{historyEntries.length} Records Found</span>
            </div>
            <div className="max-h-60 overflow-y-auto scrollbar-thin">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b sticky top-0">
                        <tr className="text-[10px] font-black text-gray-400 uppercase">
                            <th className="px-4 py-3 w-16">Tooth</th>
                            <th className="px-4 py-3 w-32">Procedure</th>
                            <th className="px-4 py-3">Clinical Progress Notes</th>
                            <th className="px-4 py-3 w-28">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {historyEntries.length > 0 ? historyEntries.map((entry, idx) => (
                            <tr 
                                key={idx} 
                                onClick={() => onEntryClick(entry.tooth)}
                                className={`cursor-pointer transition-all ${entry.isHighlighted ? 'bg-blue-100 border-l-4 border-blue-600' : 'hover:bg-blue-50 border-l-4 border-transparent'}`}
                            >
                                <td className="px-4 py-3 font-black text-blue-600">#{entry.tooth}</td>
                                <td className="px-4 py-3 font-bold text-gray-700 text-xs truncate max-w-[150px]">{entry.procedure}</td>
                                <td className="px-4 py-3 text-xs text-gray-600 italic">
                                    {entry.notes ? `"${entry.notes}"` : 'No specific commentary recorded.'}
                                </td>
                                <td className="px-4 py-3">
                                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-gray-100 text-gray-500">{entry.status}</span>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-gray-400 italic text-sm">
                                    No clinical history or notes recorded for this patient.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- Main Chart Module ---

const Chart: React.FC = () => {
    const { state, dispatch } = useSimulationContext();
    const { patients, selectedPatientId } = state;
    const patient = patients.find(p => p.id === selectedPatientId);
    
    const [localView, setLocalView] = useState<'summary' | 'detail'>(selectedPatientId ? 'detail' : 'summary');
    const [selectedTeeth, setSelectedTeeth] = useState<number[]>([]);
    const [chargePromptData, setChargePromptData] = useState<{ description: string; code: string; fee: number; } | null>(null);
    const [hoveredToothInfo, setHoveredToothInfo] = useState<{ toothData: ToothState, position: { x: number, y: number } } | null>(null);
    const [dragOverTooth, setDragOverTooth] = useState<number | null>(null);
    const [goToToothNum, setGoToToothNum] = useState('');

    const handleSelectPatient = (id: number) => {
        dispatch({ type: 'SELECT_PATIENT', payload: id });
        setLocalView('detail');
    };

    const handleBackToSummary = () => {
        setLocalView('summary');
        dispatch({ type: 'SELECT_PATIENT', payload: null });
    };

    const handleToothClick = (toothNumber: number, isMultiSelect: boolean) => {
        setSelectedTeeth(prev => {
            if (isMultiSelect) {
                return prev.includes(toothNumber) ? prev.filter(t => t !== toothNumber) : [...prev, toothNumber];
            }
            return prev.length === 1 && prev[0] === toothNumber ? [] : [toothNumber];
        });
    };

    const handleSaveChanges = (updatedTooth: ToothState) => {
        if (!patient) return;
        dispatch({ type: 'UPDATE_CHART', payload: { patientId: patient.id, toothState: updatedTooth } });
        dispatch({ type: 'LOG_ACTION', payload: { type: 'update_chart', details: { tooth: updatedTooth.toothNumber } } });
        dispatch({ type: 'ADD_TOAST', payload: { message: `Tooth #${updatedTooth.toothNumber} clinical notes updated.`, type: 'success' } });
        setSelectedTeeth([]);
    };

    const handleBulkSave = (updates: Partial<ToothState>) => {
        if (!patient || selectedTeeth.length === 0) return;
        const toothUpdates: ToothState[] = selectedTeeth.map(toothNumber => {
            const base = patient.chart.find(t => t.toothNumber === toothNumber) || { toothNumber, status: ToothStatus.Healthy };
            const merged: ToothState = { ...base, toothNumber };
            if (updates.status) merged.status = updates.status;
            if (updates.procedure !== undefined) merged.procedure = updates.procedure;
            if (updates.notes) merged.notes = base.notes ? `${base.notes}\n${updates.notes}` : updates.notes;
            return merged;
        });
        dispatch({ type: 'BULK_UPDATE_CHART', payload: { patientId: patient.id, updates: toothUpdates } });
        dispatch({ type: 'ADD_TOAST', payload: { message: `Bulk updated ${selectedTeeth.length} teeth notes.`, type: 'success' }});
        setSelectedTeeth([]);
    };

    if (localView === 'summary' || !patient) {
        return <ChartSummary onSelectPatient={handleSelectPatient} />;
    }

    const singleSelectedToothData = selectedTeeth.length === 1
        ? patient.chart.find(t => t.toothNumber === selectedTeeth[0]) || { toothNumber: selectedTeeth[0], status: ToothStatus.Healthy }
        : null;

    return (
        <div className="bg-white h-full shadow-lg rounded-md overflow-hidden flex flex-col animate-slide-in-from-right">
            <div className="p-3 border-b bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={handleBackToSummary} className="p-2 hover:bg-gray-200 rounded-full text-gray-600 transition-colors">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </button>
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">Chart: {patient.lastName}, {patient.firstName}</h2>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <input 
                        type="number" 
                        min="1" max="32" 
                        value={goToToothNum} 
                        onChange={(e) => setGoToToothNum(e.target.value)} 
                        className="w-20 input-field-xs" 
                        placeholder="TOOTH #" 
                    />
                    <button 
                        onClick={() => {
                            const n = Number(goToToothNum);
                            if (n > 0 && n <= 32) setSelectedTeeth([n]);
                        }} 
                        className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-bold"
                    >GO</button>
                </div>
            </div>

            <div className="flex-grow flex overflow-hidden">
                <div className="flex-grow p-8 flex flex-col bg-gray-50 overflow-y-auto">
                    <div className="flex flex-col items-center">
                        <Odontogram 
                            chartData={patient.chart} 
                            onToothClick={handleToothClick} 
                            selectedTeeth={selectedTeeth}
                            onToothMouseEnter={(e, n) => {
                                const toothData = patient.chart.find(t => t.toothNumber === n);
                                if (toothData) setHoveredToothInfo({ toothData, position: { x: e.clientX, y: e.clientY } });
                            }}
                            onToothMouseLeave={() => setHoveredToothInfo(null)}
                            onToothDragStart={() => {}}
                            onToothDragOver={() => {}}
                            onToothDrop={() => {}}
                            onToothDragEnd={() => {}}
                            dragOverTooth={null}
                        />
                        <div className="mt-8 flex gap-4 text-[9px] font-black uppercase text-gray-400">
                            <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-blue-500 rounded-sm"></div> Completed</div>
                            <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-red-500 rounded-sm"></div> Treatment Plan</div>
                            <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-gray-400 rounded-sm"></div> Existing</div>
                            <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-green-500 rounded-sm"></div> Restorative</div>
                            <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 border rounded-sm flex items-center justify-center text-[7px] bg-yellow-100">🗒️</div> Has Notes</div>
                        </div>
                    </div>
                    
                    <div className="mt-8 max-w-5xl w-full mx-auto pb-12">
                        <ClinicalHistoryList 
                            chartData={patient.chart} 
                            selectedTeeth={selectedTeeth}
                            onEntryClick={(t) => setSelectedTeeth([t])}
                        />
                    </div>
                </div>

                <aside className="w-96 bg-white border-l p-4 flex-shrink-0 shadow-lg overflow-y-auto">
                    {selectedTeeth.length === 1 && singleSelectedToothData ? (
                        <ToothEditSidebar tooth={singleSelectedToothData} onSave={handleSaveChanges} onCancel={() => setSelectedTeeth([])} />
                    ) : selectedTeeth.length > 1 ? (
                        <BulkToothEditSidebar selectedTeeth={selectedTeeth} onSave={handleBulkSave} onCancel={() => setSelectedTeeth([])} />
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                            <div className="text-4xl">🦷</div>
                            <p className="text-xs font-bold text-gray-500">Select a tooth to view detailed history and clinical notes.</p>
                        </div>
                    )}
                </aside>
            </div>
            {hoveredToothInfo && <ToothHoverInfo {...hoveredToothInfo} />}
        </div>
    );
};

export default Chart;