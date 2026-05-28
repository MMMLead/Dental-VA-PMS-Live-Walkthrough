
import React, { useState, useMemo, useEffect } from 'react';
import { useSimulationContext } from '../../context/SimulationContext';
import { ToothStatus, Patient, Module, LedgerEntry, ToothState } from '../../types';
import { TREATMENTS, PROCEDURE_CODES } from '../../constants';

// --- Sub-components ---

const TreatmentEstimateModal: React.FC<{
    patient: Patient;
    selectedProcedures: any[];
    customEstimates: Record<number, number>;
    insPercentage: number;
    onClose: () => void;
}> = ({ patient, selectedProcedures, customEstimates, insPercentage, onClose }) => {
    const totalFee = selectedProcedures.reduce((sum, p) => sum + (p.fee || 0), 0);
    
    const totalIns = selectedProcedures.reduce((sum, p) => {
        const manual = customEstimates[p.toothNumber];
        return sum + (manual !== undefined ? manual : (p.fee || 0) * (insPercentage / 100));
    }, 0);

    const totalPt = totalFee - totalIns;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
            <div className="bg-white shadow-2xl w-full max-w-4xl rounded-sm overflow-hidden animate-slide-in-up border border-gray-300">
                <div className="p-12 space-y-10">
                    {/* Estimate Header */}
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-black text-[#1e40af] uppercase tracking-tighter">TREATMENT ESTIMATE</h1>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">OFFICE ID: SIM-DENT-001</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">PREPARED FOR:</p>
                            <p className="text-lg font-black text-gray-800 leading-none">{patient.lastName}, {patient.firstName}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">Chart: {patient.chartNumber || 'N/A'}</p>
                        </div>
                    </div>

                    {/* Estimate Table */}
                    <div className="border border-gray-200 rounded-sm overflow-hidden">
                        <table className="w-full text-xs">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">
                                    <th className="px-6 py-4 text-left">TOOTH</th>
                                    <th className="px-6 py-4 text-left">ADA CODE</th>
                                    <th className="px-6 py-4 text-left">DESCRIPTION</th>
                                    <th className="px-6 py-4 text-right">FEE</th>
                                    <th className="px-6 py-4 text-right">INSURANCE EST.</th>
                                    <th className="px-6 py-4 text-right">PATIENT PORTION</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                                {selectedProcedures.map((p, idx) => {
                                    const fee = p.fee || 0;
                                    const manualEst = customEstimates[p.toothNumber];
                                    const estIns = manualEst !== undefined ? manualEst : fee * (insPercentage / 100);
                                    const ptPortion = fee - estIns;
                                    const adaCode = PROCEDURE_CODES.find(pc => pc.description === p.procedure)?.adaCode || 'D0000';
                                    
                                    return (
                                        <tr key={idx}>
                                            <td className="px-6 py-4 font-black">#{p.toothNumber}</td>
                                            <td className="px-6 py-4 font-mono text-blue-600 font-bold underline">{adaCode}</td>
                                            <td className="px-6 py-4">{p.procedure}</td>
                                            <td className="px-6 py-4 text-right font-bold text-gray-400 italic">${fee.toFixed(2)}</td>
                                            <td className="px-6 py-4 text-right font-bold text-green-600">${estIns.toFixed(2)}</td>
                                            <td className="px-6 py-4 text-right font-black text-slate-800">${ptPortion.toFixed(2)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot className="bg-[#1e293b] text-white font-black text-sm">
                                <tr>
                                    <td colSpan={3} className="px-6 py-5 uppercase tracking-[0.2em] text-center text-[11px] opacity-70">TOTAL PROJECT VALUE</td>
                                    <td className="px-6 py-5 text-right italic font-bold text-slate-400">${totalFee.toFixed(2)}</td>
                                    <td className="px-6 py-5 text-right text-green-400">${totalIns.toFixed(2)}</td>
                                    <td className="px-6 py-5 text-right text-lg">${totalPt.toFixed(2)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Bottom Sections */}
                    <div className="grid grid-cols-2 gap-16">
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b pb-1">INSURANCE NOTES</h3>
                            <p className="text-[11px] text-gray-500 font-medium leading-relaxed italic">
                                This is an estimate only based on your current insurance plan (PPO Plan). 
                                Actual coverage may vary once the claim is adjudicated by the payer. 
                                Pre-authorization is recommended for all major services.
                            </p>
                        </div>
                        <div className="space-y-8">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b pb-1">PATIENT SIGNATURE</h3>
                            <div className="pt-8 border-b border-gray-300 border-dashed"></div>
                            <p className="text-[10px] text-center font-bold text-gray-400 italic">I authorize the proposed treatment plan as outlined above.</p>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-10 border-t border-gray-100">
                        <button onClick={onClose} className="px-10 py-3 text-[11px] font-black uppercase text-gray-400 hover:text-gray-800 tracking-widest transition-colors">CLOSE</button>
                        <button onClick={() => window.print()} className="px-12 py-3 bg-blue-600 text-white rounded-lg text-[11px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition-all">PRINT FORM</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Refined Estimate Action Modals ---

const ItemizeProceduresModal: React.FC<{
    selectedProcedures: any[];
    currentEstimates: Record<number, number>;
    insPercentage: number;
    onSave: (estimates: Record<number, number>) => void;
    onClose: () => void;
}> = ({ selectedProcedures, currentEstimates, insPercentage, onSave, onClose }) => {
    const [tempEstimates, setTempEstimates] = useState<Record<number, string>>(
        selectedProcedures.reduce((acc, p) => {
            const val = currentEstimates[p.toothNumber] !== undefined 
                ? currentEstimates[p.toothNumber].toFixed(2)
                : ((p.fee || 0) * (insPercentage / 100)).toFixed(2);
            acc[p.toothNumber] = val;
            return acc;
        }, {} as Record<number, string>)
    );

    const handleSave = () => {
        const final: Record<number, number> = {};
        Object.entries(tempEstimates).forEach(([tooth, val]) => {
            final[Number(tooth)] = Number(val) || 0;
        });
        onSave(final);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[120] p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-in-up border border-indigo-100">
                <div className="bg-[#4f46e5] p-5 text-white flex justify-between items-center px-8">
                    <h3 className="text-sm font-black uppercase tracking-[0.1em]">ITEMIZE INS. ESTIMATES</h3>
                    <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4"><path d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="p-8 space-y-4 max-h-[50vh] overflow-y-auto custom-scrollbar">
                    {selectedProcedures.map((p, i) => (
                        <div key={i} className="flex items-center gap-6 bg-gray-50/50 p-4 rounded-2xl border border-gray-100 hover:bg-white hover:border-indigo-100 transition-all group">
                            <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex flex-col items-center justify-center shadow-lg shadow-indigo-200">
                                <span className="text-[8px] font-black uppercase opacity-60">Tooth</span>
                                <span className="text-sm font-black leading-none mt-0.5">#{p.toothNumber}</span>
                            </div>
                            <div className="flex-grow">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{p.procedure}</p>
                                <p className="text-xs font-bold text-gray-600 mt-0.5">Fee: <span className="font-mono text-gray-400">${(p.fee || 0).toFixed(2)}</span></p>
                            </div>
                            <div className="relative w-36">
                                <span className="absolute left-3.5 top-3 text-[10px] font-black text-indigo-300">$</span>
                                <input 
                                    type="number"
                                    className="w-full pl-7 pr-3 py-2.5 border-2 border-slate-100 focus:border-indigo-500 rounded-xl text-sm font-black outline-none transition-all font-mono"
                                    value={tempEstimates[p.toothNumber]}
                                    onChange={(e) => setTempEstimates({...tempEstimates, [p.toothNumber]: e.target.value})}
                                />
                            </div>
                        </div>
                    ))}
                    {selectedProcedures.length === 0 && (
                        <div className="py-12 text-center text-gray-400 font-bold italic">
                            No items selected for estimation.
                        </div>
                    )}
                </div>
                <div className="p-6 border-t bg-slate-50/50 flex justify-end items-center gap-10 px-10 pb-8">
                    <button onClick={onClose} className="text-[11px] font-black text-gray-400 hover:text-gray-800 uppercase tracking-[0.2em] transition-colors">CANCEL</button>
                    <button 
                        onClick={handleSave} 
                        className="px-10 py-4 bg-[#4f46e5] text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all active:scale-95"
                    >
                        UPDATE ESTIMATES
                    </button>
                </div>
            </div>
        </div>
    );
};

const TotalPayerPortionModal: React.FC<{
    currentPercentage: number;
    onSave: (percentage: number) => void;
    onClose: () => void;
}> = ({ currentPercentage, onSave, onClose }) => {
    const [percentage, setPercentage] = useState(currentPercentage.toString());

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[120] p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-slide-in-up border border-indigo-100">
                <div className="bg-[#4f46e5] p-5 text-white flex justify-between items-center px-8">
                    <h3 className="text-sm font-black uppercase tracking-[0.1em]">GLOBAL PAYER PORTION</h3>
                    <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4"><path d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="p-8 space-y-6">
                    <p className="text-[11px] text-gray-400 font-black uppercase leading-relaxed tracking-wider text-center">
                        Set a bulk coverage percentage for all items in the active plan presentation.
                    </p>
                    <div className="flex items-center gap-4">
                        <div className="relative flex-grow">
                            <input 
                                type="number" 
                                min="0" max="100"
                                className="w-full p-5 border-2 border-indigo-50 focus:border-indigo-500 rounded-3xl text-3xl font-black outline-none transition-all pr-12 text-center text-indigo-600 bg-gray-50/30"
                                value={percentage}
                                onChange={(e) => setPercentage(e.target.value)}
                            />
                            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-3xl font-black text-indigo-200">%</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                        {[0, 50, 80, 100].map(val => (
                            <button key={val} onClick={() => setPercentage(val.toString())} className={`py-3 rounded-xl text-xs font-black border-2 transition-all ${percentage === val.toString() ? 'bg-[#4f46e5] text-white border-[#4f46e5] shadow-lg shadow-indigo-100' : 'bg-white text-indigo-400 border-indigo-50 hover:border-indigo-200'}`}>
                                {val}%
                            </button>
                        ))}
                    </div>
                </div>
                <div className="p-6 border-t bg-slate-50/50 flex justify-end items-center gap-8 px-10 pb-8">
                    <button onClick={onClose} className="text-[11px] font-black text-gray-400 hover:text-gray-800 uppercase tracking-[0.2em] transition-colors">CANCEL</button>
                    <button onClick={() => onSave(Number(percentage))} className="px-10 py-4 bg-[#4f46e5] text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all active:scale-95">APPLY BULK %</button>
                </div>
            </div>
        </div>
    );
};

const BenefitOverridesModal: React.FC<{
    onClose: () => void;
}> = ({ onClose }) => (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[120] p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-slide-in-up border border-indigo-100">
            <div className="bg-[#4f46e5] p-5 text-white flex justify-between items-center px-8">
                <h3 className="text-sm font-black uppercase tracking-[0.1em]">BENEFIT OVERRIDES</h3>
                <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4"><path d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
            <div className="p-8 space-y-6">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 border-b pb-2">Toggle Processing Rules</p>
                <label className="flex items-center gap-4 group cursor-pointer p-3 bg-gray-50 rounded-2xl border border-transparent hover:border-indigo-100 hover:bg-white transition-all">
                    <input type="checkbox" defaultChecked className="h-6 w-6 rounded-lg border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                    <div>
                        <p className="text-xs font-black text-gray-700 uppercase tracking-tight">Apply Standard Deductible</p>
                        <p className="text-[9px] text-gray-400 font-bold leading-none mt-1">Include $50 per-patient deductible in math.</p>
                    </div>
                </label>
                <label className="flex items-center gap-4 group cursor-pointer p-3 bg-gray-50 rounded-2xl border border-transparent hover:border-indigo-100 hover:bg-white transition-all">
                    <input type="checkbox" className="h-6 w-6 rounded-lg border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                    <div>
                        <p className="text-xs font-black text-gray-700 uppercase tracking-tight">Override Downgrade Logic</p>
                        <p className="text-[9px] text-gray-400 font-bold leading-none mt-1">Ignore standard amalgam-to-composite downgrades.</p>
                    </div>
                </label>
                <label className="flex items-center gap-4 group cursor-pointer p-3 bg-gray-50 rounded-2xl border border-transparent hover:border-indigo-100 hover:bg-white transition-all">
                    <input type="checkbox" className="h-6 w-6 rounded-lg border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                    <div>
                        <p className="text-xs font-black text-gray-700 uppercase tracking-tight">Force OON Fee Schedule</p>
                        <p className="text-[9px] text-gray-400 font-bold leading-none mt-1">Estimate based on UCR instead of Payer Max.</p>
                    </div>
                </label>
            </div>
            <div className="p-6 border-t bg-slate-50/50 flex justify-end items-center px-10 pb-8">
                <button onClick={onClose} className="px-12 py-4 bg-[#4f46e5] text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all active:scale-95">SAVE RULES</button>
            </div>
        </div>
    </div>
);

// --- TreatmentPlannerSummary component ---

const TreatmentPlannerSummary: React.FC<{ onSelectPatient: (id: number) => void }> = ({ onSelectPatient }) => {
    const { state } = useSimulationContext();
    const [searchTerm, setSearchTerm] = useState('');

    const patientList = useMemo(() => {
        return state.patients.map(p => {
            const plannedItems = p.chart.filter(t => t.status === ToothStatus.TreatmentPlanned);
            const totalPlannedValue = plannedItems.reduce((sum, item) => sum + (item.fee || 0), 0);
            return {
                id: p.id,
                name: `${p.lastName}, ${p.firstName}`,
                chartNumber: p.chartNumber || 'N/A',
                plannedCount: plannedItems.length,
                totalValue: totalPlannedValue,
            };
        }).filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.chartNumber.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesSearch && p.plannedCount > 0;
        }).sort((a, b) => b.totalValue - a.totalValue);
    }, [state.patients, searchTerm]);

    return (
        <div className="flex flex-col h-full bg-gray-100 p-4 space-y-4 overflow-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Treatment Plan Worklist</h2>
                    <p className="text-xs text-gray-500">Manage proposed treatments and case presentations.</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-md border flex flex-col flex-grow min-h-0">
                <div className="p-4 border-b bg-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative w-full md:w-80">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 text-xs">🔍</span>
                        <input 
                            type="text" 
                            placeholder="Filter treatment plans..." 
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
                                <th className="px-6 py-3 text-center text-[10px] font-black text-gray-500 uppercase">Planned Items</th>
                                <th className="px-6 py-3 text-right text-[10px] font-black text-gray-500 uppercase">Total Case Value</th>
                                <th className="px-6 py-3 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {patientList.map(p => (
                                <tr key={p.id} className="hover:bg-blue-50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <span className="font-bold text-gray-800">{p.name}</span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 font-mono uppercase">{p.chartNumber}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                                            {p.plannedCount}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-black text-slate-800">
                                        ${p.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button 
                                            onClick={() => onSelectPatient(p.id)}
                                            className="text-[10px] bg-blue-600 text-white px-4 py-1.5 rounded-lg shadow-sm hover:bg-blue-700 font-bold transition-all transform group-hover:scale-105"
                                        >
                                            Review Plan
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {patientList.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center text-gray-400 italic">No patients with planned treatment found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// --- Main Module ---

const TreatmentPlanner: React.FC = () => {
    const { state, dispatch } = useSimulationContext();
    const { patients, selectedPatientId } = state;
    const [localView, setLocalView] = useState<'summary' | 'detail'>(selectedPatientId ? 'detail' : 'summary');
    
    // Workflow States
    const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
    const [isEstimateModalOpen, setIsEstimateModalOpen] = useState(false);
    const [isEnterEstimateOpen, setIsEnterEstimateOpen] = useState(false);

    // Advanced Estimation State
    const [customEstimates, setCustomEstimates] = useState<Record<number, number>>({});
    const [globalInsPercentage, setGlobalInsPercentage] = useState<number>(0);
    const [activeActionModal, setActiveActionModal] = useState<'itemize' | 'portion' | 'overrides' | null>(null);

    const patient = patients.find(p => p.id === selectedPatientId);

    // Sync global percentage with patient data initially
    useEffect(() => {
        if (patient) {
            setGlobalInsPercentage(patient.primaryInsurance?.coveragePercentage || 80);
            setCustomEstimates({}); // Reset when patient changes
        }
    }, [patient?.id]);

    if (localView === 'summary' || !patient) {
        return <TreatmentPlannerSummary onSelectPatient={(id) => { dispatch({ type: 'SELECT_PATIENT', payload: id }); setLocalView('detail'); }} />;
    }

    const plannedTreatments = patient.chart.filter(t => t.status === ToothStatus.TreatmentPlanned);

    const selectedProcedures = selectedIndices.map(idx => plannedTreatments[idx]);
    
    const totalFeeSelected = selectedProcedures.reduce((sum, p) => sum + (p.fee || 0), 0);
    
    const totalInsSelected = selectedProcedures.reduce((sum, p) => {
        const manual = customEstimates[p.toothNumber];
        return sum + (manual !== undefined ? manual : (p.fee || 0) * (globalInsPercentage / 100));
    }, 0);

    const totalPtSelected = totalFeeSelected - totalInsSelected;

    const handlePostToLedger = () => {
        if (selectedIndices.length === 0) {
            alert('Please select at least one procedure to post.');
            return;
        }

        const today = new Date().toISOString().split('T')[0];
        
        // 1. Post to Ledger
        selectedProcedures.forEach(t => {
            const entry: Omit<LedgerEntry, 'id' | 'balance'> = {
                date: today,
                code: PROCEDURE_CODES.find(pc => pc.description === t.procedure)?.adaCode || 'D0000',
                description: t.procedure || 'Procedure',
                charge: t.fee || 0,
                payment: 0,
                writeOff: 0
            };
            dispatch({ type: 'ADD_LEDGER_ENTRY', payload: { patientId: patient.id, entry } });
        });

        // 2. Mark as completed in Chart
        const chartUpdates: ToothState[] = selectedProcedures.map(t => ({
            toothNumber: t.toothNumber,
            status: ToothStatus.Completed,
            procedure: t.procedure,
            fee: t.fee,
            notes: t.notes ? `${t.notes}\n[Billed: ${today}]` : `[Billed: ${today}]`
        }));
        dispatch({ type: 'BULK_UPDATE_CHART', payload: { patientId: patient.id, updates: chartUpdates } });

        dispatch({ type: 'ADD_TOAST', payload: { message: `Transaction Processed: ${selectedIndices.length} items moved to patient ledger.`, type: 'success' } });
        dispatch({ type: 'LOG_ACTION', payload: { type: 'post_to_ledger', details: { count: selectedIndices.length } } });
        
        setSelectedIndices([]);
    };

    return (
        <div className="bg-white h-full shadow-lg rounded-md overflow-hidden flex flex-col animate-slide-in-from-right font-sans relative">
            {/* Header Toolbar */}
            <div className="p-4 border-b bg-white flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => { setLocalView('summary'); dispatch({ type: 'SELECT_PATIENT', payload: null }); }} 
                        className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </button>
                    <div>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight leading-none uppercase">Case Presentation: {patient.lastName}, {patient.firstName}</h2>
                        <div className="flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1.5">
                            <span>CHART: {patient.chartNumber || 'N/A'}</span>
                            <span className="text-gray-300">•</span>
                            <span>INS: {patient.primaryInsurance?.company || 'None'}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => { if(selectedIndices.length === 0) alert('Select items first'); else setIsEstimateModalOpen(true); }}
                        className="px-6 py-2.5 bg-[#1e293b] text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-[#334155] shadow-md transition-all active:scale-95"
                    >
                        CREATE ESTIMATE
                    </button>
                    <button 
                        onClick={handlePostToLedger}
                        className="px-6 py-2.5 bg-[#10b981] text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-[#059669] shadow-md transition-all active:scale-95"
                    >
                        POST TO LEDGER / BILL
                    </button>
                    <div className="relative">
                        <button 
                            onClick={() => setIsEnterEstimateOpen(!isEnterEstimateOpen)}
                            className="px-6 py-2.5 bg-[#4f46e5] text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-[#4338ca] shadow-md transition-all flex items-center gap-2 active:scale-95"
                        >
                            ENTER ESTIMATE
                            <svg className={`w-3 h-3 transition-transform ${isEnterEstimateOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M19 9l-7 7-7-7" /></svg>
                        </button>
                        {isEnterEstimateOpen && (
                            <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-2xl z-20 overflow-hidden animate-fade-in-fast">
                                <button 
                                    onClick={() => { setActiveActionModal('itemize'); setIsEnterEstimateOpen(false); }}
                                    className="w-full text-left px-5 py-3 text-[10px] font-black uppercase text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors border-b border-gray-100"
                                >
                                    Itemize by Procedure
                                </button>
                                <button 
                                    onClick={() => { setActiveActionModal('portion'); setIsEnterEstimateOpen(false); }}
                                    className="w-full text-left px-5 py-3 text-[10px] font-black uppercase text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors border-b border-gray-100"
                                >
                                    Total Payer Portion
                                </button>
                                <button 
                                    onClick={() => { setActiveActionModal('overrides'); setIsEnterEstimateOpen(false); }}
                                    className="w-full text-left px-5 py-3 text-[10px] font-black uppercase text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                                >
                                    Apply Benefit Overrides
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-grow p-8 bg-gray-50/50 overflow-auto">
                <div className="max-w-6xl mx-auto space-y-6">
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                        <div className="bg-[#1e293b] px-6 py-4 text-white flex justify-between items-center">
                            <h3 className="font-black text-xs uppercase tracking-widest">ACTIVE PLANNED PROCEDURES</h3>
                            <div className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-tighter">
                                {selectedIndices.length} Procedures Selected
                            </div>
                        </div>

                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 border-b border-gray-200">
                                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                                    <th className="px-6 py-4 text-center w-12">
                                        <input 
                                            type="checkbox" 
                                            className="h-5 w-5 rounded-md border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" 
                                            checked={selectedIndices.length === plannedTreatments.length && plannedTreatments.length > 0}
                                            onChange={(e) => setSelectedIndices(e.target.checked ? plannedTreatments.map((_, i) => i) : [])}
                                        />
                                    </th>
                                    <th className="px-6 py-4 text-left">TOOTH</th>
                                    <th className="px-6 py-4 text-left">DESCRIPTION</th>
                                    <th className="px-6 py-4 text-right">FEE</th>
                                    <th className="px-6 py-4 text-right text-green-600/60">INS EST.</th>
                                    <th className="px-6 py-4 text-right text-indigo-600/60">PT PORTION</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                {plannedTreatments.map((t, idx) => {
                                    const fee = t.fee || 0;
                                    const isSelected = selectedIndices.includes(idx);
                                    
                                    // Use custom override if available, otherwise global percentage logic
                                    const manualEst = customEstimates[t.toothNumber];
                                    const isOverridden = manualEst !== undefined;
                                    const estIns = isOverridden ? manualEst : fee * (globalInsPercentage / 100);
                                    const ptPortion = fee - estIns;

                                    return (
                                        <tr key={idx} className={`hover:bg-indigo-50 transition-colors ${isSelected ? 'bg-indigo-50/40' : ''}`}>
                                            <td className="px-6 py-5 text-center">
                                                <input 
                                                    type="checkbox" 
                                                    className="h-5 w-5 rounded-md border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer transition-all" 
                                                    checked={isSelected}
                                                    onChange={() => setSelectedIndices(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx])}
                                                />
                                            </td>
                                            <td className="px-6 py-5 font-black text-slate-800 text-base">#{t.toothNumber}</td>
                                            <td className="px-6 py-5 font-bold">{t.procedure}</td>
                                            <td className="px-6 py-5 text-right font-bold text-gray-400 italic">${fee.toFixed(2)}</td>
                                            <td className={`px-6 py-5 text-right font-bold text-green-600 transition-colors ${isOverridden ? 'bg-blue-50/60 ring-2 ring-inset ring-blue-100' : ''}`}>
                                                <div className="flex flex-col items-end">
                                                    <span>${estIns.toFixed(2)}</span>
                                                    {isOverridden && <span className="text-[8px] font-black uppercase text-blue-400 tracking-tighter">Manual Override</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right font-black text-indigo-800 text-lg">${ptPortion.toFixed(2)}</td>
                                        </tr>
                                    );
                                })}
                                {plannedTreatments.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="py-24 text-center">
                                            <div className="text-gray-300 text-6xl mb-4 opacity-20">📋</div>
                                            <p className="text-gray-400 font-black uppercase text-xs tracking-[0.2em]">No Active Planned Treatment</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            <tfoot className="bg-slate-50/50 border-t-2 border-gray-100">
                                <tr className="text-gray-900 font-black">
                                    <td colSpan={3} className="px-6 py-6 text-right uppercase text-[11px] text-gray-400 tracking-[0.2em]">TOTAL PLAN VALUE (SELECTED)</td>
                                    <td className="px-6 py-6 text-right text-sm font-bold text-gray-800">${totalFeeSelected.toFixed(2)}</td>
                                    <td className="px-6 py-6 text-right text-sm font-bold text-green-600">${totalInsSelected.toFixed(2)}</td>
                                    <td className="px-6 py-6 text-right text-xl text-indigo-900 tracking-tighter">${totalPtSelected.toFixed(2)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>

            {isEstimateModalOpen && (
                <TreatmentEstimateModal 
                    patient={patient} 
                    selectedProcedures={selectedProcedures} 
                    customEstimates={customEstimates}
                    insPercentage={globalInsPercentage}
                    onClose={() => setIsEstimateModalOpen(false)} 
                />
            )}

            {/* Workflow Action Modals */}
            {activeActionModal === 'itemize' && (
                <ItemizeProceduresModal 
                    selectedProcedures={plannedTreatments}
                    currentEstimates={customEstimates}
                    insPercentage={globalInsPercentage}
                    onSave={(e) => { setCustomEstimates(e); setActiveActionModal(null); dispatch({ type: 'ADD_TOAST', payload: { message: 'Itemized estimates updated for current presentation.', type: 'info' } }); }}
                    onClose={() => setActiveActionModal(null)}
                />
            )}

            {activeActionModal === 'portion' && (
                <TotalPayerPortionModal 
                    currentPercentage={globalInsPercentage}
                    onSave={(p) => { setGlobalInsPercentage(p); setCustomEstimates({}); setActiveActionModal(null); dispatch({ type: 'ADD_TOAST', payload: { message: `Bulk coverage updated to ${p}%. Manual overrides cleared.`, type: 'info' } }); }}
                    onClose={() => setActiveActionModal(null)}
                />
            )}

            {activeActionModal === 'overrides' && (
                <BenefitOverridesModal 
                    onClose={() => setActiveActionModal(null)}
                />
            )}
        </div>
    );
};

export default TreatmentPlanner;
