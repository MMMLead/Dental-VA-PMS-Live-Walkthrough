
import React, { useState, useMemo, useEffect } from 'react';
import { useSimulationContext } from '../../context/SimulationContext';
import { LedgerEntry, Patient, Module, ToothStatus, PreAuthorization, InsuranceClaim } from '../../types';
import { TREATMENTS, PROCEDURE_CODES } from '../../constants';

// --- Components ---

const SortableHeader: React.FC<{
    label: string;
    columnKey: string;
    sortConfig: { key: string; direction: 'ascending' | 'descending' };
    onSort: (key: any) => void;
    className?: string;
    align?: 'left' | 'right';
}> = ({ label, columnKey, sortConfig, onSort, className = '', align = 'left' }) => {
    const getSortIcon = () => {
        if (sortConfig.key !== columnKey) {
            return <span className="text-gray-300 opacity-0 group-hover:opacity-50 transition-opacity">↕</span>;
        }
        return sortConfig.direction === 'ascending' ? '▲' : '▼';
    };

    const alignClass = align === 'right' ? 'text-right' : 'text-left';
    const justifyClass = align === 'right' ? 'justify-end' : 'justify-start';

    return (
        <th 
            className={`px-4 py-3 ${alignClass} text-[10px] font-black text-gray-500 uppercase tracking-widest cursor-pointer hover:bg-gray-100 group ${className}`}
            onClick={() => onSort(columnKey)}
        >
            <div className={`flex items-center ${justifyClass} gap-1`}>
                <span>{label}</span>
                <span className="w-3 text-center">{getSortIcon()}</span>
            </div>
        </th>
    );
};

// --- Office Summary View ---

const LedgerSummary: React.FC<{ onSelectPatient: (id: number) => void }> = ({ onSelectPatient }) => {
    const { state } = useSimulationContext();
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' }>({ key: 'balance', direction: 'descending' });

    // Aggregate Office Data
    const metrics = useMemo(() => {
        let totalAR = 0;
        let totalProduction = 0;
        let totalCollections = 0;
        let totalAdjustments = 0;
        let openAccounts = 0;
        let zeroBalanceAccounts = 0;

        state.patients.forEach(p => {
            const balance = p.ledger.length > 0 ? p.ledger[p.ledger.length - 1].balance : 0;
            totalAR += balance;
            if (balance > 0) openAccounts++;
            else if (balance === 0) zeroBalanceAccounts++;

            p.ledger.forEach(entry => {
                totalProduction += entry.charge;
                totalCollections += entry.payment;
                totalAdjustments += entry.writeOff;
            });
        });

        return { totalAR, totalProduction, totalCollections, totalAdjustments, openAccounts, zeroBalanceAccounts };
    }, [state.patients]);

    const patientBalances = useMemo(() => {
        const list = state.patients.map(p => {
            const balance = p.ledger.length > 0 ? p.ledger[p.ledger.length - 1].balance : 0;
            const lastActivity = p.ledger.length > 0 ? p.ledger[p.ledger.length - 1].date : 'Never';
            return {
                id: p.id,
                name: `${p.lastName}, ${p.firstName}`,
                chartNumber: p.chartNumber || `PT${p.id.toString().padStart(4, '0')}`,
                balance,
                lastActivity
            };
        });

        return list.filter(p => 
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            p.chartNumber.toLowerCase().includes(searchTerm.toLowerCase())
        ).sort((a, b) => {
            const valA = (a as any)[sortConfig.key];
            const valB = (b as any)[sortConfig.key];
            let res = 0;
            if (typeof valA === 'string') res = valA.localeCompare(valB);
            else res = valA - valB;
            return sortConfig.direction === 'ascending' ? res : -res;
        });
    }, [state.patients, searchTerm, sortConfig]);

    return (
        <div className="flex flex-col h-full bg-gray-100 space-y-4 p-4 overflow-auto">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">Office Financial Summary</h2>
                <span className="text-xs text-gray-500 font-medium italic">Last Ledger Update: {new Date().toLocaleDateString()}</span>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <KPICard title="Total A/R" value={`$${metrics.totalAR.toLocaleString()}`} color="blue" />
                <KPICard title="Total Production" value={`$${metrics.totalProduction.toLocaleString()}`} color="green" />
                <KPICard title="Total Collections" value={`$${metrics.totalCollections.toLocaleString()}`} color="yellow" />
                <KPICard title="Total Adjustments" value={`$${metrics.totalAdjustments.toLocaleString()}`} color="red" />
                <KPICard title="Open Accounts" value={metrics.openAccounts.toString()} color="indigo" />
                <KPICard title="Zero Balances" value={metrics.zeroBalanceAccounts.toString()} color="slate" />
            </div>

            {/* Account Search & Table */}
            <div className="bg-white rounded-lg shadow-md border flex flex-col flex-grow min-h-0">
                <div className="p-4 border-b bg-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative w-full md:w-96">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </span>
                        <input 
                            type="text" 
                            placeholder="Search by name or chart number..." 
                            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <button className="px-3 py-1.5 bg-white border border-gray-300 rounded-md text-xs font-bold hover:bg-gray-50 text-gray-700 transition-colors">Export CSV</button>
                        <button className="px-3 py-1.5 bg-white border border-gray-300 rounded-md text-xs font-bold hover:bg-gray-50 text-gray-700 transition-colors">Print Batch Statements</button>
                    </div>
                </div>

                <div className="overflow-auto flex-grow">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0 z-10">
                            <tr>
                                <SortableHeader label="Patient Account Name" columnKey="name" sortConfig={sortConfig} onSort={key => setSortConfig({ key, direction: sortConfig.direction === 'ascending' ? 'descending' : 'ascending'})} />
                                <SortableHeader label="Chart #" columnKey="chartNumber" sortConfig={sortConfig} onSort={key => setSortConfig({ key, direction: sortConfig.direction === 'ascending' ? 'descending' : 'ascending'})} />
                                <SortableHeader label="Last Activity" columnKey="lastActivity" sortConfig={sortConfig} onSort={key => setSortConfig({ key, direction: sortConfig.direction === 'ascending' ? 'descending' : 'ascending'})} />
                                <SortableHeader label="Outstanding Balance" columnKey="balance" sortConfig={sortConfig} onSort={key => setSortConfig({ key, direction: sortConfig.direction === 'ascending' ? 'descending' : 'ascending'})} align="right" />
                                <th className="px-4 py-2"></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {patientBalances.map(p => (
                                <tr key={p.id} className="hover:bg-blue-50 transition-colors group">
                                    <td className="px-4 py-3 text-sm font-bold text-gray-800">{p.name}</td>
                                    <td className="px-4 py-3 text-sm text-gray-500 font-mono">{p.chartNumber}</td>
                                    <td className="px-4 py-3 text-sm text-gray-500">{p.lastActivity !== 'Never' ? new Date(p.lastActivity + 'T12:00:00').toLocaleDateString() : 'N/A'}</td>
                                    <td className={`px-4 py-3 text-sm text-right font-black ${p.balance > 0 ? 'text-red-600' : p.balance < 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                                        ${p.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button 
                                            onClick={() => onSelectPatient(p.id)}
                                            className="text-[10px] bg-blue-600 text-white px-3 py-1 rounded shadow-sm hover:bg-blue-700 font-black uppercase tracking-widest transition-all transform group-hover:scale-105"
                                        >
                                            View Ledger
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

const KPICard: React.FC<{ title: string; value: string; color: string }> = ({ title, value, color }) => {
    const colors: Record<string, string> = {
        blue: 'border-blue-500 text-blue-700 bg-blue-50',
        green: 'border-green-500 text-green-700 bg-green-50',
        yellow: 'border-yellow-500 text-yellow-700 bg-yellow-50',
        red: 'border-red-500 text-red-700 bg-red-50',
        indigo: 'border-indigo-500 text-indigo-700 bg-indigo-50',
        slate: 'border-slate-500 text-slate-700 bg-slate-50',
    };
    return (
        <div className={`p-4 rounded-lg shadow-sm border-l-4 bg-white ${colors[color] || ''}`}>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{title}</p>
            <p className="text-xl font-black">{value}</p>
        </div>
    );
};

// --- Claim Detail Modal ---

const ClaimDetailModal: React.FC<{ claimId: string; onClose: () => void }> = ({ claimId, onClose }) => {
    const { state, dispatch } = useSimulationContext();
    const claim = state.claims.find(c => c.id === claimId);
    const patient = state.patients.find(p => p.id === claim?.patientId);
    
    const claimProcedures = useMemo(() => {
        if (!claim || !patient) return [];
        return patient.ledger.filter(entry => claim.procedureIds.includes(entry.id));
    }, [claim, patient]);

    if (!claim || !patient) return null;

    const totalBilled = claimProcedures.reduce((s, p) => s + p.charge, 0);

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-[110]">
            <div className="bg-white shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-y-auto font-sans border-2 border-blue-600 rounded-sm">
                
                {/* Status Warning Banner */}
                {claim.status !== 'Paid' && (
                    <div className="bg-red-50 border-b border-red-200 p-3 flex justify-between items-center text-red-800">
                        <div className="flex items-center gap-3">
                            <span className="w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center font-bold">!</span>
                            <p className="text-xs font-bold">This claim has issues that need your review before submitting. Review issues to see all required and recommended fixes.</p>
                        </div>
                        <button className="bg-white border border-gray-300 px-3 py-1 rounded text-[10px] font-black uppercase tracking-tight text-gray-700 hover:bg-gray-50 shadow-sm">Review Issues</button>
                    </div>
                )}

                {/* Claim Header Grid */}
                <div className="grid grid-cols-1 md:grid-cols-5 border-b divide-x divide-gray-200">
                    <div className="col-span-4 p-4 space-y-4">
                        <div className="grid grid-cols-5 gap-4">
                            <div className="col-span-1">
                                <p className="text-[10px] font-black text-gray-500 uppercase">Subscriber</p>
                                <p className="text-xs font-bold text-gray-800 truncate">{patient.lastName}, {patient.firstName}</p>
                            </div>
                            <div className="col-span-1">
                                <p className="text-[10px] font-black text-gray-500 uppercase">Employer</p>
                                <p className="text-xs font-bold text-gray-800 truncate">{patient.employer || 'N/A'}</p>
                            </div>
                            <div className="col-span-1">
                                <p className="text-[10px] font-black text-gray-500 uppercase">Carrier</p>
                                <p className="text-xs font-bold text-gray-800 truncate">{claim.carrier}</p>
                            </div>
                            <div className="col-span-1">
                                <p className="text-[10px] font-black text-gray-500 uppercase">Group Plan</p>
                                <p className="text-xs font-bold text-gray-800 truncate">{patient.primaryInsurance?.plan || 'PPO Plan'}</p>
                            </div>
                            <div className="col-span-1">
                                <p className="text-[10px] font-black text-gray-500 uppercase">Payor ID</p>
                                <p className="text-xs font-bold text-gray-800">62308</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-4 border-t pt-4">
                            <div>
                                <p className="text-[10px] font-black text-gray-500 uppercase">Billing Provider</p>
                                <p className="text-xs font-bold text-gray-800">Smith, Dennis</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-500 uppercase">Rendering Provider</p>
                                <p className="text-xs font-bold text-gray-800">Smith, Dennis</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-500 uppercase">Pay-To-Provider</p>
                                <p className="text-xs font-bold text-gray-800">Smith, Dennis</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-500 uppercase">Claim Information</p>
                                <p className="text-xs font-bold text-gray-800">Non-Standard</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-gray-50 space-y-3">
                         <div className="flex items-center gap-2 text-[10px] font-bold text-gray-700">
                             <div className="w-4 h-4 rounded-full bg-green-500 text-white flex items-center justify-center text-[10px]">✓</div>
                             <span>Release of Info</span>
                         </div>
                         <div className="flex items-center gap-2 text-[10px] font-bold text-gray-700">
                             <div className="w-4 h-4 rounded-full bg-green-500 text-white flex items-center justify-center text-[10px]">✓</div>
                             <span>Assignment of Benefits</span>
                         </div>
                         <button onClick={onClose} className="w-full py-2 bg-gray-200 hover:bg-gray-300 text-[10px] font-black uppercase tracking-widest rounded-sm border border-gray-400">Close Detail</button>
                    </div>
                </div>

                {/* Procedures Grid */}
                <div className="border-b">
                    <div className="bg-gray-100 px-4 py-1 text-[11px] font-black text-gray-600 uppercase border-b">Procedures</div>
                    <table className="w-full text-xs">
                        <thead className="bg-gray-50 border-b">
                            <tr className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">
                                <th className="px-4 py-2 text-left">Tooth</th>
                                <th className="px-4 py-2 text-left">Surface</th>
                                <th className="px-4 py-2 text-left">Description</th>
                                <th className="px-4 py-2 text-left">Procedure Date</th>
                                <th className="px-4 py-2 text-left">Code</th>
                                <th className="px-4 py-2 text-right">Fee</th>
                                <th className="px-4 py-2 text-right">Ins. Paid</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {claimProcedures.map((p, idx) => (
                                <tr key={p.id} className={idx % 2 === 1 ? 'bg-gray-50/30' : ''}>
                                    <td className="px-4 py-2"></td>
                                    <td className="px-4 py-2"></td>
                                    <td className="px-4 py-2 font-medium text-gray-700">{p.description}</td>
                                    <td className="px-4 py-2">{new Date(p.date + 'T12:00:00').toLocaleDateString()}</td>
                                    <td className="px-4 py-2 font-mono text-blue-600 font-bold">{p.code || 'D0000'}</td>
                                    <td className="px-4 py-2 text-right font-black">${p.charge.toFixed(2)}</td>
                                    <td className="px-4 py-2 text-right font-black text-green-700">${(0).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Bottom Multi-Panel Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 divide-x divide-gray-200 bg-gray-50/10">
                    <div className="divide-y divide-gray-200">
                        {/* Attachments Section */}
                        <div>
                            <div className="bg-gray-100 px-4 py-1 text-[11px] font-black text-gray-600 uppercase border-b">Attachments</div>
                            <div className="p-4 space-y-2">
                                <div className="grid grid-cols-2 text-[10px] font-black text-gray-400 uppercase mb-2">
                                    <span>Type</span>
                                    <span>Description</span>
                                </div>
                                <div className="flex justify-between items-center text-xs p-2 bg-gray-50 rounded border border-gray-200">
                                    <span className="font-bold">Radiology Films</span>
                                    <span className="text-gray-500 italic">Imaging Attachment</span>
                                </div>
                            </div>
                        </div>

                        {/* Payments Section */}
                        <div>
                            <div className="bg-gray-100 px-4 py-1 text-[11px] font-black text-gray-600 uppercase border-b">Payments</div>
                            <div className="p-12 text-center text-gray-400 text-xs font-bold italic">When a payment is made, it will appear here.</div>
                        </div>

                        {/* Adjustments Section */}
                        <div>
                            <div className="bg-gray-100 px-4 py-1 text-[11px] font-black text-gray-600 uppercase border-b">Adjustments</div>
                            <div className="p-12 text-center text-gray-400 text-xs font-bold italic">When an adjustment is made, it will appear here.</div>
                        </div>

                         {/* Claim Status Section */}
                         <div>
                            <div className="bg-gray-100 px-4 py-1 text-[11px] font-black text-gray-600 uppercase border-b">Claim Status</div>
                            <div className="p-4">
                                <div className="grid grid-cols-3 text-[10px] font-black text-gray-400 uppercase mb-4">
                                    <div>Created<p className="text-xs text-gray-800 font-bold mt-1">{claim.dateCreated}</p></div>
                                    <div>Sent<p className="text-xs text-gray-800 font-bold mt-1">—</p></div>
                                    <div>Partial Payment<p className="text-xs text-gray-800 font-bold mt-1">—</p></div>
                                </div>
                                <table className="w-full text-xs">
                                    <thead className="text-[9px] font-black text-gray-400 uppercase tracking-tighter border-b">
                                        <tr><th className="text-left pb-1">Date</th><th className="text-left pb-1">Claim Status</th></tr>
                                    </thead>
                                    <tbody>
                                        <tr><td className="py-2">{claim.dateCreated}</td><td className="py-2"><span className="px-2 py-0.5 bg-gray-200 rounded text-[9px] font-black uppercase">Created</span></td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="divide-y divide-gray-200">
                        {/* Diagnostic Codes Section */}
                        <div>
                            <div className="bg-gray-100 px-4 py-1 text-[11px] font-black text-gray-600 uppercase border-b">Diagnostic Codes</div>
                            <div className="p-8 text-center text-gray-400 text-xs italic">When a diagnostic code is added, it will appear here.</div>
                        </div>

                        {/* Claim Financial Summary */}
                        <div>
                            <div className="bg-gray-100 px-4 py-1 text-[11px] font-black text-gray-600 uppercase border-b">Claim Financial Summary</div>
                            <div className="p-4 space-y-1 text-xs">
                                <div className="flex justify-between font-bold"><span className="text-gray-500">Total Billed</span><span>${totalBilled.toFixed(2)}</span></div>
                                <div className="flex justify-between font-bold"><span className="text-gray-500">Est. Ins. Portion</span><span>${totalBilled.toFixed(2)}</span></div>
                                <div className="flex justify-between font-bold"><span className="text-gray-500">Itemized Total</span><span>$0.00</span></div>
                                <div className="flex justify-between font-bold"><span className="text-gray-500">Total Paid</span><span>$0.00</span></div>
                                <div className="flex justify-between font-bold"><span className="text-gray-500">Total Credit Adj.</span><span>$0.00</span></div>
                                <div className="flex justify-between font-bold"><span className="text-gray-500">Total Charge Adj.</span><span>$0.00</span></div>
                                <div className="flex justify-between font-bold border-t pt-1 mt-1"><span className="text-gray-500">Ded S/P/O:</span><span>0/0/0</span></div>
                            </div>
                        </div>

                        {/* Plan Notes */}
                        <div>
                            <div className="bg-gray-100 px-4 py-1 text-[11px] font-black text-gray-600 uppercase border-b">Insurance Plan Note</div>
                            <div className="p-8 text-center text-gray-400 text-xs font-bold italic cursor-pointer hover:bg-gray-50">Click to add a note.</div>
                        </div>

                        {/* Remarks */}
                        <div>
                            <div className="bg-gray-100 px-4 py-1 text-[11px] font-black text-gray-600 uppercase border-b">Remarks For Unusual Services</div>
                            <div className="p-8 text-center text-gray-400 text-xs font-bold italic cursor-pointer hover:bg-gray-50">Click to add a remark.</div>
                        </div>
                    </div>
                </div>

                {/* Footer buttons matching screenshot style */}
                <div className="p-4 bg-white border-t flex justify-end gap-3">
                    <button className="px-4 py-1.5 bg-white border border-gray-300 rounded shadow-sm text-xs font-bold text-gray-700 hover:bg-gray-50">Print ADA Form</button>
                    <button className="px-4 py-1.5 bg-blue-600 text-white rounded shadow-md text-xs font-bold hover:bg-blue-700">Submit Electronically</button>
                </div>
            </div>
        </div>
    );
};

// --- Patient Ledger View ---

const Ledger: React.FC = () => {
    const { state, dispatch } = useSimulationContext();
    const { patients, selectedPatientId, claims } = state;
    
    const [localView, setLocalView] = useState<'summary' | 'detail'>(selectedPatientId ? 'detail' : 'summary');
    const [modal, setModal] = useState<'payment' | 'charge' | 'writeoff' | 'claim' | 'refund' | 'preauth' | 'claim_detail' | 'ins_payment' | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: keyof LedgerEntry | 'balance'; direction: 'ascending' | 'descending' }>({ key: 'date', direction: 'ascending' });
    const [filters, setFilters] = useState({ startDate: '', endDate: '', type: 'all' });
    const [selectedEntryIds, setSelectedEntryIds] = useState<Set<string>>(new Set());
    const [activeClaimId, setActiveClaimId] = useState<string | null>(null);

    const patient = patients.find(p => p.id === selectedPatientId);

    const handleSelectPatient = (id: number) => {
        dispatch({ type: 'SELECT_PATIENT', payload: id });
        setLocalView('detail');
        setSelectedEntryIds(new Set());
    };

    const handleBackToSummary = () => {
        setLocalView('summary');
        dispatch({ type: 'SELECT_PATIENT', payload: null });
        setSelectedEntryIds(new Set());
    };

    const handleRowClick = (id: string, e: React.MouseEvent) => {
        if (e.ctrlKey || e.metaKey) {
            setSelectedEntryIds(prev => {
                const newSet = new Set(prev);
                if (newSet.has(id)) newSet.delete(id);
                else newSet.add(id);
                return newSet;
            });
        } else {
            setSelectedEntryIds(new Set([id]));
        }
    };

    const handleRowDoubleClick = (entry: LedgerEntry) => {
        if (entry.claimId) {
            setActiveClaimId(entry.claimId);
            setModal('claim_detail');
        }
    };

    const sortedAndFilteredLedger = useMemo(() => {
        if (!patient) return [];
        let items = [...patient.ledger];

        if (filters.startDate) items = items.filter(item => new Date(item.date) >= new Date(filters.startDate));
        if (filters.endDate) items = items.filter(item => new Date(item.date) <= new Date(filters.endDate));
        if (filters.type !== 'all') {
            items = items.filter(item => {
                if (filters.type === 'charges') return item.charge > 0;
                if (filters.type === 'payments') return item.payment > 0 || (item.description.toLowerCase().includes('refund') && item.payment < 0);
                if (filters.type === 'writeoffs') return item.writeOff > 0;
                return true;
            });
        }

        items.sort((a, b) => {
            const { key, direction } = sortConfig;
            let valA = a[key as keyof LedgerEntry];
            let valB = b[key as keyof LedgerEntry];
            
            if (key === 'date') {
                valA = new Date(a.date).getTime();
                valB = new Date(b.date).getTime();
            }

            if (valA! < valB!) return direction === 'ascending' ? -1 : 1;
            if (valA! > valB!) return direction === 'ascending' ? 1 : -1;
            return 0;
        });
        
        return items;
    }, [patient, filters, sortConfig]);

    const hasBillableSelected = useMemo(() => {
        if (!patient) return false;
        return patient.ledger.some(entry => entry.charge > 0 && selectedEntryIds.has(entry.id));
    }, [patient, selectedEntryIds]);

    if (localView === 'summary' || !patient) {
        return <LedgerSummary onSelectPatient={handleSelectPatient} />;
    }

    const calculateAging = (ledger: LedgerEntry[]) => {
        const aging = { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };
        const today = new Date();
        ledger.filter(e => e.balance > 0).forEach(e => {
            const days = Math.floor((today.getTime() - new Date(e.date).getTime()) / (1000 * 60 * 60 * 24));
            if (days <= 30) aging['0-30'] += e.charge - e.payment;
            else if (days <= 60) aging['31-60'] += e.charge - e.payment;
            else if (days <= 90) aging['61-90'] += e.charge - e.payment;
            else aging['90+'] += e.charge - e.payment;
        });
        return aging;
    };

    const aging = calculateAging(patient.ledger);
    const currentBalance = patient.ledger.length > 0 ? patient.ledger[patient.ledger.length - 1].balance : 0;

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

    return (
        <div className="bg-white h-full shadow-lg rounded-md overflow-hidden flex flex-col animate-slide-in-from-right font-sans">
            {/* Extended Patient Header matching screenshot style */}
            <div className="px-6 py-4 bg-white border-b flex flex-wrap items-center gap-x-8 gap-y-2">
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-slate-800">{patient.lastName}, {patient.firstName}</h2>
                    <span className="text-gray-400 font-bold uppercase text-xs tracking-tighter">ID: {patient.id}</span>
                </div>
                <div className="flex items-center gap-8 text-[11px] font-bold text-slate-500 uppercase tracking-tight">
                    <div>DOB: <span className="text-slate-800 font-black">{new Date(patient.dob).toLocaleDateString()} ({calculateAge(patient.dob)}y)</span></div>
                    <div>Gender: <span className="text-slate-800 font-black">{patient.gender}</span></div>
                    <div>Phone: <span className="text-slate-800 font-black">{patient.phone}</span></div>
                </div>
                {patient.medicalAlerts.length > 0 && (
                    <div className="ml-auto bg-red-50 border border-red-200 text-red-600 px-4 py-1.5 rounded-lg flex items-center gap-2 animate-pulse">
                        <span className="text-xs font-black uppercase tracking-widest">Medical Alert:</span>
                        <span className="text-sm font-bold">{patient.medicalAlerts.join('; ')}</span>
                    </div>
                )}
            </div>

            <div className="p-3 border-b bg-gray-50 flex items-center justify-between shadow-sm sticky top-0 z-20">
                <div className="flex items-center gap-4">
                    <button onClick={handleBackToSummary} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-600" title="Back to Summary">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </button>
                    <div>
                        <h2 className="text-lg font-black text-slate-800 uppercase tracking-tighter">Ledger Detail</h2>
                        <div className="flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                            <span>CHART: {patient.chartNumber || 'N/A'}</span>
                            <span className="text-gray-300">•</span>
                            <span>INS: {patient.primaryInsurance?.company || 'None'}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center space-x-1">
                    <ActionButton icon="preauth" text="Pre-Auth" onClick={() => setModal('preauth')} />
                    <ActionButton icon="payment" text="Post Payment" onClick={() => setModal('payment')} />
                    <ActionButton icon="ins_payment" text="Ins Payment" onClick={() => setModal('ins_payment')} />
                    <ActionButton icon="refund" text="Refund" onClick={() => setModal('refund')} />
                    <ActionButton icon="charge" text="New Charge" onClick={() => setModal('charge')} />
                    <ActionButton icon="writeoff" text="Adjustment" onClick={() => setModal('writeoff')} />
                    <div className="w-px h-6 bg-gray-200 mx-2"></div>
                    <ActionButton icon="claim" text="Claim" onClick={() => setModal('claim')} active={hasBillableSelected} variant="emphasized" />
                </div>
            </div>

            <div className="flex-grow overflow-auto p-4 select-none bg-white">
                <div className="bg-blue-50/30 border border-blue-100 p-2.5 rounded-lg mb-4 flex items-center gap-3">
                    <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] italic">
                        Hold CTRL/CMD + Click to multi-select procedures. Double-click claimed items to review the insurance claim.
                    </p>
                </div>

                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50/50 sticky top-0 z-10">
                        <tr>
                            <SortableHeader label="Date ▲" columnKey="date" sortConfig={sortConfig} onSort={key => setSortConfig({ key, direction: sortConfig.direction === 'ascending' ? 'descending' : 'ascending' })} />
                            <SortableHeader label="Code" columnKey="code" sortConfig={sortConfig} onSort={key => setSortConfig({ key, direction: sortConfig.direction === 'ascending' ? 'descending' : 'ascending' })} />
                            <SortableHeader label="Description" columnKey="description" sortConfig={sortConfig} onSort={key => setSortConfig({ key, direction: sortConfig.direction === 'ascending' ? 'descending' : 'ascending' })} />
                            <SortableHeader label="Charge" columnKey="charge" sortConfig={sortConfig} onSort={key => setSortConfig({ key, direction: sortConfig.direction === 'ascending' ? 'descending' : 'ascending' })} align="right" />
                            <SortableHeader label="Payments" columnKey="payment" sortConfig={sortConfig} onSort={key => setSortConfig({ key, direction: sortConfig.direction === 'ascending' ? 'descending' : 'ascending' })} align="right" />
                            <SortableHeader label="Adj/W-O" columnKey="writeOff" sortConfig={sortConfig} onSort={key => setSortConfig({ key, direction: sortConfig.direction === 'ascending' ? 'descending' : 'ascending' })} align="right" />
                            <SortableHeader label="Running Bal" columnKey="balance" sortConfig={sortConfig} onSort={key => setSortConfig({ key, direction: sortConfig.direction === 'ascending' ? 'descending' : 'ascending' })} align="right" />
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {sortedAndFilteredLedger.map((entry) => (
                            <tr 
                                key={entry.id} 
                                onClick={(e) => handleRowClick(entry.id, e)}
                                onDoubleClick={() => handleRowDoubleClick(entry)}
                                className={`transition-all cursor-pointer border-l-4 ${selectedEntryIds.has(entry.id) ? 'bg-indigo-50 border-indigo-600' : 'hover:bg-slate-50 border-transparent'}`}
                            >
                                <td className="px-4 py-3 text-sm font-bold text-slate-600 whitespace-nowrap">{new Date(entry.date + 'T12:00:00').toLocaleDateString()}</td>
                                <td className="px-4 py-3 text-[11px] font-black text-gray-400 tracking-tighter uppercase">{entry.code || '---'}</td>
                                <td className="px-4 py-3 text-sm text-slate-800 flex items-center gap-2">
                                    <span className="font-bold">{entry.description}</span>
                                    {entry.claimId && (
                                        <span className="bg-blue-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-sm flex items-center gap-1 shadow-sm">
                                            Claimed
                                            <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z"/></svg>
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-sm text-right text-gray-900 font-bold">{entry.charge > 0 ? `$${entry.charge.toFixed(2)}` : ''}</td>
                                <td className={`px-4 py-3 text-sm text-right font-black ${entry.description.toLowerCase().includes('refund') ? 'text-orange-600' : 'text-green-600'}`}>
                                    {entry.payment !== 0 ? (entry.payment < 0 ? `-$${Math.abs(entry.payment).toFixed(2)}` : `$${entry.payment.toFixed(2)}`) : ''}
                                </td>
                                <td className="px-4 py-3 text-sm text-right text-red-500 font-bold">{entry.writeOff > 0 ? `$${entry.writeOff.toFixed(2)}` : ''}</td>
                                <td className={`px-4 py-3 text-sm text-right font-black tracking-tight ${entry.balance > 0 ? 'text-[#b91c1c]' : 'text-[#1e40af]'}`}>
                                    ${entry.balance.toFixed(2)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Account Aging Footer */}
            <div className="p-6 border-t bg-slate-50 flex flex-wrap justify-between items-center gap-8 shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
                <div className="flex gap-8">
                    <AgingBucket label="Current (0-30)" value={aging['0-30']} />
                    <AgingBucket label="31-60 Days" value={aging['31-60']} />
                    <AgingBucket label="61-90 Days" value={aging['61-90']} />
                    <AgingBucket label="90+ Days" value={aging['90+']} />
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Cumulative Outstanding Account Balance</span>
                    <span className={`text-4xl font-black tracking-tighter ${currentBalance > 0 ? 'text-red-600' : 'text-blue-700'}`}>
                        ${currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                </div>
            </div>

            {modal === 'payment' && <PaymentModal onSave={(entry) => { dispatch({ type: 'ADD_LEDGER_ENTRY', payload: { patientId: patient.id, entry }}); setModal(null); }} onClose={() => setModal(null)} />}
            {modal === 'refund' && <RefundModal onSave={(entry) => { dispatch({ type: 'ADD_LEDGER_ENTRY', payload: { patientId: patient.id, entry }}); setModal(null); }} onClose={() => setModal(null)} />}
            {modal === 'charge' && <ChargeModal onSave={(entry) => { dispatch({ type: 'ADD_LEDGER_ENTRY', payload: { patientId: patient.id, entry }}); setModal(null); }} onClose={() => setModal(null)} />}
            {modal === 'writeoff' && <WriteOffModal onSave={(entry) => { dispatch({ type: 'ADD_LEDGER_ENTRY', payload: { patientId: patient.id, entry }}); setModal(null); }} onClose={() => setModal(null)} />}
            {modal === 'claim' && <InsuranceClaimModal patient={patient} initialSelectedIds={selectedEntryIds} onClose={() => setModal(null)} />}
            {modal === 'preauth' && <PreAuthModal patient={patient} onClose={() => setModal(null)} />}
            {modal === 'claim_detail' && activeClaimId && <ClaimDetailModal claimId={activeClaimId} onClose={() => { setModal(null); setActiveClaimId(null); }} />}
            {modal === 'ins_payment' && <InsurancePaymentModal patient={patient} onClose={() => setModal(null)} />}
        </div>
    );
};

const AgingBucket: React.FC<{ label: string; value: number }> = ({ label, value }) => (
    <div className="flex flex-col border-r border-slate-200 pr-8 last:border-r-0">
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter mb-1">{label}</span>
        <span className={`text-lg font-black ${value > 0 ? 'text-slate-800' : 'text-slate-300'}`}>${value.toFixed(2)}</span>
    </div>
);

// --- ActionButton Component ---
const ActionButton: React.FC<{ icon: string; text: string; onClick: () => void; active?: boolean; variant?: 'default' | 'emphasized' }> = ({ icon, text, onClick, active = true, variant = 'default' }) => {
    const icons: Record<string, string> = {
        preauth: '📋',
        payment: '💰',
        ins_payment: '🏦',
        refund: '🔄',
        charge: '➕',
        writeoff: '📝',
        claim: '📄',
    };

    const baseStyles = "flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95";
    const variantStyles = variant === 'emphasized' 
        ? "bg-slate-800 text-white hover:bg-slate-900 border border-slate-700 disabled:bg-slate-200 disabled:text-slate-400"
        : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed";

    return (
        <button
            onClick={onClick}
            disabled={!active}
            className={`${baseStyles} ${variantStyles}`}
        >
            <span className="text-sm">{icons[icon]}</span>
            <span>{text}</span>
        </button>
    );
};

// --- Input Component ---
const Input: React.FC<{ label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; type?: string; placeholder?: string }> = ({ label, value, onChange, type = 'text', placeholder }) => (
    <div>
        <label className="block text-[10px] font-black text-[#94a3b8] uppercase mb-1.5 tracking-widest">{label}</label>
        <input 
            type={type} 
            value={value} 
            onChange={onChange} 
            placeholder={placeholder}
            className="w-full p-3 border-2 border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 outline-none font-bold bg-white transition-all" 
        />
    </div>
);

// --- Select Component ---
const Select: React.FC<{ label: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; options: string[] }> = ({ label, value, onChange, options }) => (
    <div>
        <label className="block text-[10px] font-black text-[#94a3b8] uppercase mb-1.5 tracking-widest">{label}</label>
        <select 
            value={value} 
            onChange={onChange} 
            className="w-full p-3 border-2 border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 outline-none font-black bg-white cursor-pointer transition-all appearance-none"
        >
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
    </div>
);

// --- ModalWrapper Component ---
const ModalWrapper: React.FC<{ 
    title: string; 
    children: React.ReactNode; 
    onClose: () => void; 
    onSave: () => void;
    saveLabel?: string;
    variant?: 'blue' | 'indigo';
}> = ({ title, children, onClose, onSave, saveLabel = "POST ENTRY", variant = 'indigo' }) => (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[4px] flex items-center justify-center z-[120]">
        <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-slide-in-up border border-slate-100">
            <div className={`${variant === 'blue' ? 'bg-[#1e40af]' : 'bg-[#1e293b]'} p-6 text-white flex justify-between items-center`}>
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-white/20 rounded-full"></div>
                    <h3 className="text-sm font-black uppercase tracking-[0.2em]">{title}</h3>
                </div>
                <button onClick={onClose} className="hover:rotate-90 transition-all duration-300 p-2 bg-white/10 rounded-full">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            <div className="p-10">
                {children}
            </div>
            <div className="p-6 border-t bg-slate-50 flex justify-end items-center gap-8 pr-10 pb-8">
                <button onClick={onClose} className="text-xs font-black text-slate-400 hover:text-slate-800 uppercase tracking-widest transition-colors">Discard</button>
                <button onClick={onSave} className="px-10 py-4 bg-[#2563eb] text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all active:scale-95">
                    {saveLabel}
                </button>
            </div>
        </div>
    </div>
);

// --- Insurance Payment Modal ---

const InsurancePaymentModal: React.FC<{ patient: Patient; onClose: () => void }> = ({ patient, onClose }) => {
    const { state, dispatch } = useSimulationContext();
    const [step, setStep] = useState<'claim_select' | 'payment_entry'>('claim_select');
    const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
    
    // Header Info
    const [header, setHeader] = useState({
        checkNumber: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        carrier: patient.primaryInsurance?.company || '',
        insType: 'Primary' as 'Primary' | 'Secondary'
    });

    // Auto-update carrier when insurance type changes
    useEffect(() => {
        if (header.insType === 'Primary') {
            setHeader(prev => ({ ...prev, carrier: patient.primaryInsurance?.company || '' }));
        } else {
            setHeader(prev => ({ ...prev, carrier: patient.secondaryInsurance?.company || '' }));
        }
    }, [header.insType, patient]);

    // Itemized Adjudication
    const selectedClaim = state.claims.find(c => c.id === selectedClaimId);
    const claimProcedures = useMemo(() => {
        if (!selectedClaim) return [];
        return patient.ledger.filter(entry => selectedClaim.procedureIds.includes(entry.id));
    }, [selectedClaim, patient]);

    const [lines, setLines] = useState<Record<string, { paid: number, deductible: number, writeoff: number, adjustment: number }>>({});

    useEffect(() => {
        if (claimProcedures.length > 0) {
            const initialLines: typeof lines = {};
            claimProcedures.forEach(p => {
                initialLines[p.id] = { paid: 0, deductible: 0, writeoff: 0, adjustment: 0 };
            });
            setLines(initialLines);
        }
    }, [claimProcedures]);

    const lineTotals: number = Object.values(lines).reduce<number>((sum: number, line: any) => sum + line.paid, 0);
    const balanceRemaining: number = Number(header.amount) - lineTotals;

    const handleLineChange = (id: string, field: keyof typeof lines[string], value: string) => {
        setLines(prev => ({
            ...prev,
            [id]: { ...prev[id], [field]: Number(value) || 0 }
        }));
    };

    const handleSave = () => {
        if (Math.abs(balanceRemaining) > 0.01) {
            alert(`Total distributed amount ($${lineTotals.toFixed(2)}) must equal Check Amount ($${header.amount}). Current variance: $${balanceRemaining.toFixed(2)}`);
            return;
        }

        // 1. Log individual procedure payments
        claimProcedures.forEach(p => {
            const line = lines[p.id];
            if (line.paid > 0) {
                dispatch({ 
                    type: 'ADD_LEDGER_ENTRY', 
                    payload: { 
                        patientId: patient.id, 
                        entry: {
                            date: header.date,
                            code: p.code,
                            description: `Ins Payment (Check #${header.checkNumber}) - ${p.description}`,
                            charge: 0,
                            payment: line.paid,
                            writeOff: line.writeoff + line.adjustment,
                            paymentType: 'Check'
                        }
                    } 
                });
            } else if (line.writeoff > 0 || line.adjustment > 0) {
                dispatch({ 
                    type: 'ADD_LEDGER_ENTRY', 
                    payload: { 
                        patientId: patient.id, 
                        entry: {
                            date: header.date,
                            code: p.code,
                            description: `Ins Adjustment (Check #${header.checkNumber}) - ${p.description}`,
                            charge: 0,
                            payment: 0,
                            writeOff: line.writeoff + line.adjustment
                        }
                    } 
                });
            }
        });

        dispatch({ type: 'ADD_TOAST', payload: { message: `Insurance payment of $${header.amount} applied from ${header.carrier}.`, type: 'success' } });
        dispatch({ type: 'LOG_ACTION', payload: { type: 'post_insurance_payment', details: { claimId: selectedClaimId, check: header.checkNumber, amount: header.amount, type: header.insType } } });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110]">
            <div className={`bg-white rounded-2xl shadow-2xl w-full transition-all duration-300 overflow-hidden animate-slide-in-up ${step === 'claim_select' ? 'max-w-xl' : 'max-w-6xl'}`}>
                <div className="bg-[#1e40af] p-6 text-white flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">🏦</span>
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tight">Post Insurance Payment</h2>
                            <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">
                                {step === 'claim_select' ? 'Select Active Claim' : `Adjudicating Check #${header.checkNumber} • ${header.carrier}`}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="p-8">
                    {step === 'claim_select' ? (
                        <div className="space-y-6">
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-4">
                                <span className="text-blue-600 text-xl">💡</span>
                                <p className="text-xs text-blue-700 font-medium leading-relaxed">
                                    Choose the insurance claim associated with the current EOB/Check to distribute payments per procedure line.
                                </p>
                            </div>
                            
                            <div className="border rounded-xl divide-y max-h-60 overflow-y-auto bg-gray-50/50">
                                {state.claims.filter(c => c.patientId === patient.id).length > 0 ? (
                                    state.claims.filter(c => c.patientId === patient.id).map(c => (
                                        <label key={c.id} className={`flex items-center p-4 cursor-pointer hover:bg-white transition-all group ${selectedClaimId === c.id ? 'bg-white ring-2 ring-inset ring-blue-600' : ''}`}>
                                            <input 
                                                type="radio" 
                                                name="claim" 
                                                className="sr-only" 
                                                onChange={() => setSelectedClaimId(c.id)} 
                                            />
                                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-4 group-hover:bg-blue-100 transition-colors">
                                                <span className="text-sm font-black text-gray-400 group-hover:text-blue-600">EDI</span>
                                            </div>
                                            <div className="flex-grow">
                                                <div className="flex justify-between">
                                                    <span className="text-sm font-black text-gray-800">{c.id} • {c.carrier}</span>
                                                    <span className="text-sm font-black text-blue-700">${c.totalAmount.toFixed(2)}</span>
                                                </div>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Submitted: {c.dateCreated} • Lines: {c.procedureIds.length}</p>
                                            </div>
                                        </label>
                                    ))
                                ) : (
                                    <div className="p-10 text-center text-gray-400 italic font-medium">No active claims found for this patient.</div>
                                )}
                            </div>

                            <div className="flex justify-end pt-4">
                                <button 
                                    onClick={() => setStep('payment_entry')}
                                    disabled={!selectedClaimId}
                                    className="px-8 py-3 bg-blue-600 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-lg hover:bg-blue-700 disabled:bg-gray-200 transition-all active:scale-95"
                                >
                                    Select Claim
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8 animate-fade-in-fast">
                            {/* Improved Payment Header Form */}
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 bg-gray-50 p-6 rounded-2xl border border-gray-100 shadow-inner">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-widest">Amount</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-gray-400 font-bold">$</span>
                                        <input 
                                            type="number" 
                                            className="pl-7 pr-3 py-2.5 w-full border-2 border-blue-200 focus:border-blue-600 rounded-xl text-lg font-black outline-none transition-all shadow-sm"
                                            value={header.amount}
                                            onChange={e => setHeader({...header, amount: e.target.value})}
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                                <Input label="Check #" value={header.checkNumber} onChange={e => setHeader({...header, checkNumber: e.target.value})} placeholder="Check or EFT ID" />
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-widest">Insurance Type</label>
                                    <select 
                                        className="w-full p-2.5 border border-gray-300 rounded-lg text-sm font-bold bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={header.insType}
                                        onChange={e => setHeader({...header, insType: e.target.value as any})}
                                    >
                                        <option value="Primary">Primary</option>
                                        <option value="Secondary">Secondary</option>
                                    </select>
                                </div>
                                <Input label="Carrier Name" value={header.carrier} onChange={e => setHeader({...header, carrier: e.target.value})} />
                                <Input label="Payment Date" type="date" value={header.date} onChange={e => setHeader({...header, date: e.target.value})} />
                            </div>

                            {/* Procedure Table */}
                            <div className="bg-white border rounded-2xl overflow-hidden shadow-xl">
                                <table className="w-full text-xs">
                                    <thead className="bg-gray-800 text-white uppercase text-[9px] font-black tracking-widest">
                                        <tr>
                                            <th className="px-4 py-4 text-left">Service (Code)</th>
                                            <th className="px-4 py-4 text-right">Billed Amount</th>
                                            <th className="px-4 py-4 text-center w-32 bg-blue-900/50">Ins Paid</th>
                                            <th className="px-4 py-4 text-center w-32">Deductible</th>
                                            <th className="px-4 py-4 text-center w-32">Write-Off</th>
                                            <th className="px-4 py-4 text-center w-32">Adjustment</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y font-medium text-gray-700">
                                        {claimProcedures.map(p => (
                                            <tr key={p.id} className="hover:bg-blue-50/30 transition-colors group">
                                                <td className="px-4 py-3">
                                                    <p className="font-black text-gray-800">{p.description}</p>
                                                    <p className="text-[10px] text-gray-400 font-bold font-mono">CODE: {p.code} • DATE: {p.date}</p>
                                                </td>
                                                <td className="px-4 py-3 text-right font-black text-gray-400 italic">${p.charge.toFixed(2)}</td>
                                                <td className="px-4 py-3 bg-blue-50/50">
                                                    <input 
                                                        type="number" 
                                                        className="w-full bg-white border border-blue-200 rounded p-2 text-right font-black text-blue-700 focus:ring-2 focus:ring-blue-500 outline-none"
                                                        value={lines[p.id]?.paid || ''}
                                                        onChange={e => handleLineChange(p.id, 'paid', e.target.value)}
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <input 
                                                        type="number" 
                                                        className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-right focus:bg-white transition-colors outline-none"
                                                        value={lines[p.id]?.deductible || ''}
                                                        onChange={e => handleLineChange(p.id, 'deductible', e.target.value)}
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <input 
                                                        type="number" 
                                                        className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-right focus:bg-white transition-colors outline-none"
                                                        value={lines[p.id]?.writeoff || ''}
                                                        onChange={e => handleLineChange(p.id, 'writeoff', e.target.value)}
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <input 
                                                        type="number" 
                                                        className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-right focus:bg-white transition-colors outline-none"
                                                        value={lines[p.id]?.adjustment || ''}
                                                        onChange={e => handleLineChange(p.id, 'adjustment', e.target.value)}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-gray-100 font-black border-t-2">
                                        <tr>
                                            <td className="px-4 py-4 uppercase text-[10px] text-gray-500">Subtotals</td>
                                            <td className="px-4 py-4 text-right">${claimProcedures.reduce<number>((s: number, p) => s + p.charge, 0).toFixed(2)}</td>
                                            <td className="px-4 py-4 text-right text-blue-700 bg-blue-50">${(lineTotals as number).toFixed(2)}</td>
                                            <td className="px-4 py-4 text-right">${Object.values(lines).reduce<number>((s: number, l: any) => s + l.deductible, 0).toFixed(2)}</td>
                                            <td className="px-4 py-4 text-right">${Object.values(lines).reduce<number>((s: number, l: any) => s + l.writeoff, 0).toFixed(2)}</td>
                                            <td className="px-4 py-4 text-right">${Object.values(lines).reduce<number>((s: number, l: any) => s + l.adjustment, 0).toFixed(2)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            {/* Validation Footer */}
                            <div className="flex justify-between items-center bg-gray-900 text-white p-6 rounded-2xl shadow-2xl">
                                <div className="flex gap-12">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Total Distributed</span>
                                        <span className="text-2xl font-black">${lineTotals.toFixed(2)}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Target Check Amount</span>
                                        <span className="text-2xl font-black text-blue-400">${Number(header.amount).toFixed(2)}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Balance to Distribute</span>
                                        <span className={`text-2xl font-black ${Math.abs(balanceRemaining) < 0.01 ? 'text-green-500' : 'text-red-500 animate-pulse'}`}>
                                            ${(balanceRemaining as number).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <button 
                                        onClick={() => setStep('claim_select')}
                                        className="px-6 py-3 bg-gray-800 text-gray-400 rounded-xl font-black uppercase text-xs tracking-widest hover:text-white transition-all"
                                    >
                                        Change Claim
                                    </button>
                                    <button 
                                        onClick={handleSave}
                                        disabled={Math.abs(balanceRemaining) > 0.01 || !header.checkNumber}
                                        className="px-10 py-3 bg-green-600 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-lg hover:bg-green-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
                                    >
                                        Finalize Posting
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Pre-Auth Modal ---

const PreAuthModal: React.FC<{ patient: Patient; onClose: () => void }> = ({ patient, onClose }) => {
    const { dispatch } = useSimulationContext();
    const plannedItems = patient.chart.filter(t => t.status === ToothStatus.TreatmentPlanned);
    const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
    const [attachments, setAttachments] = useState({ xray: true, notes: true, narrative: false });

    const handleSend = (method: 'Electronic' | 'Mail') => {
        if (selectedIndices.length === 0) {
            alert('Please select at least one treatment item.');
            return;
        }

        const selectedItems = selectedIndices.map(idx => ({
            tooth: plannedItems[idx].toothNumber,
            procedure: plannedItems[idx].procedure || 'Unknown',
            fee: plannedItems[idx].fee || 0
        }));

        const preAuth: PreAuthorization = {
            id: `PA-${Math.floor(1000 + Math.random() * 9000)}`,
            patientId: patient.id,
            dateSubmitted: new Date().toISOString().split('T')[0],
            status: 'Pending',
            payer: patient.primaryInsurance?.company || 'Direct',
            totalValue: selectedItems.reduce((s, i) => s + i.fee, 0),
            items: selectedItems
        };

        dispatch({ type: 'ADD_PREAUTH', payload: preAuth });
        dispatch({ type: 'ADD_TOAST', payload: { message: `Pre-Authorization submitted to ${patient.primaryInsurance?.company} via ${method}. tracking #${preAuth.id}`, type: 'success' } });
        dispatch({ type: 'LOG_ACTION', payload: { type: 'create_preauth', details: { patientId: patient.id, method, count: selectedIndices.length, id: preAuth.id } } });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-slide-in-up">
                <div className="bg-[#004b8d] p-4 text-white flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-black uppercase tracking-tight">Create Insurance Pre-Authorization</h2>
                        <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">Payer: {patient.primaryInsurance?.company || 'No Active Payer'}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Subscriber Info Section */}
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <h3 className="text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest">Subscriber & Plan Verification</h3>
                        <div className="grid grid-cols-2 gap-4 text-xs font-bold">
                            <div>
                                <span className="text-gray-500 uppercase text-[9px] block">Subscriber Name</span>
                                <span className="text-gray-800">{patient.firstName} {patient.lastName}</span>
                            </div>
                            <div>
                                <span className="text-gray-500 uppercase text-[9px] block">Policy / Member ID</span>
                                <span className="text-blue-700 font-mono">{patient.primaryInsurance?.subscriberId || 'N/A'}</span>
                            </div>
                            <div>
                                <span className="text-gray-500 uppercase text-[9px] block">Plan Group #</span>
                                <span className="text-gray-800">{patient.primaryInsurance?.groupNumber || '---'}</span>
                            </div>
                            <div>
                                <span className="text-gray-500 uppercase text-[9px] block">Relationship</span>
                                <span className="text-gray-800">{patient.primaryInsurance?.relationship || 'Self'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Treatment Picker */}
                    <div>
                        <h3 className="text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest">Select Planned Items for Approval</h3>
                        <div className="border rounded-xl divide-y max-h-48 overflow-y-auto bg-white">
                            {plannedItems.length > 0 ? plannedItems.map((item, idx) => (
                                <label key={idx} className="flex items-center p-3 hover:bg-blue-50 cursor-pointer transition-colors group">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedIndices.includes(idx)}
                                        onChange={() => setSelectedIndices(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx])}
                                        className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                    />
                                    <div className="ml-4 flex-grow">
                                        <div className="flex justify-between">
                                            <span className="text-xs font-black text-gray-800">#{item.toothNumber} • {item.procedure}</span>
                                            <span className="text-xs font-black text-blue-600">${(item.fee || 0).toFixed(2)}</span>
                                        </div>
                                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">Code: {PROCEDURE_CODES.find(p => p.description === item.procedure)?.adaCode || 'Manual'}</p>
                                    </div>
                                </label>
                            )) : (
                                <div className="p-10 text-center text-gray-400 italic text-sm">No treatment planned items found for this patient.</div>
                            )}
                        </div>
                    </div>

                    {/* Supporting Documents */}
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <h3 className="text-[10px] font-black text-blue-400 uppercase mb-3 tracking-widest">Supporting Clinical Attachments</h3>
                        <div className="flex flex-wrap gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={attachments.xray} onChange={e => setAttachments({...attachments, xray: e.target.checked})} className="rounded text-blue-600" />
                                <span className="text-[10px] font-black uppercase text-blue-700">X-Rays</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={attachments.notes} onChange={e => setAttachments({...attachments, notes: e.target.checked})} className="rounded text-blue-600" />
                                <span className="text-[10px] font-black uppercase text-blue-700">Clinical Notes</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={attachments.narrative} onChange={e => setAttachments({...attachments, narrative: e.target.checked})} className="rounded text-blue-600" />
                                <span className="text-[10px] font-black uppercase text-blue-700">Clinical Narrative</span>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t bg-gray-50 flex justify-between items-center">
                    <button onClick={onClose} className="text-xs font-black uppercase text-gray-400 hover:text-gray-600 tracking-widest">Cancel</button>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => handleSend('Mail')}
                            className="px-6 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 shadow-sm"
                        >
                            Print & Mail
                        </button>
                        <button 
                            onClick={() => handleSend('Electronic')}
                            className="px-8 py-2.5 bg-[#004b8d] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-[#003666] active:scale-95 transition-all"
                        >
                            Send Electronically
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Modals ---

interface ModalProps {
    onSave: (entry: Omit<LedgerEntry, 'id' | 'balance'>) => void;
    onClose: () => void;
}

const PaymentModal: React.FC<ModalProps> = ({ onSave, onClose }) => {
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [type, setType] = useState('Check');
    const [checkNum, setCheckNum] = useState('');

    const handleSave = () => {
        if (!amount || isNaN(Number(amount))) {
            alert("Please enter a valid amount.");
            return;
        }
        onSave({ 
            date, 
            code: '', 
            description: `Patient Payment - ${type}${type === 'Check' ? ` #${checkNum}` : ''}`, 
            charge: 0, 
            payment: Number(amount), 
            writeOff: 0, 
            paymentType: type as any
        });
    };
    
    return (
        <ModalWrapper title="Post Patient Payment" onClose={onClose} onSave={handleSave}>
            <div className="space-y-6">
                <Input label="Amount Received" type="number" value={amount} onChange={e => setAmount(e.target.value)} />
                <Input label="Transaction Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
                <Select label="Payment Method" value={type} onChange={e => setType(e.target.value)} options={['Check', 'Credit Card', 'Cash']} />
                {type === 'Check' && (
                    <div className="animate-fade-in-down">
                        <Input label="Check #" type="text" value={checkNum} onChange={e => setCheckNum(e.target.value)} placeholder="0000" />
                    </div>
                )}
            </div>
        </ModalWrapper>
    );
};

const RefundModal: React.FC<ModalProps> = ({ onSave, onClose }) => {
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [type, setType] = useState('Credit Card');

    const handleSave = () => {
        onSave({ 
            date, 
            code: '', 
            description: `Refund: Account Credit - ${type}`, 
            charge: 0, 
            payment: Number(amount), 
            writeOff: 0, 
            paymentType: type as any
        });
    };
    
    return (
        <ModalWrapper title="Process Patient Refund" onClose={onClose} onSave={handleSave} variant="blue">
            <div className="space-y-6">
                <div className="p-4 bg-blue-50 border-l-4 border-blue-600 rounded text-[11px] text-blue-800 font-bold leading-relaxed mb-4">
                    NOTE: Posting this refund will apply a credit reduction to the patient's record.
                </div>
                <Input label="Credit Amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} />
                <Input label="Process Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
                <Select label="Return Method" value={type} onChange={e => setType(e.target.value)} options={['Credit Card', 'Check', 'Cash']} />
            </div>
        </ModalWrapper>
    );
};

const ChargeModal: React.FC<ModalProps> = ({ onSave, onClose }) => {
    const [treatment, setTreatment] = useState(TREATMENTS[0].name);
    const [fee, setFee] = useState(TREATMENTS[0].fee.toString());
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const handleTreatmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedTreatment = TREATMENTS.find(t => t.name === e.target.value);
        if (selectedTreatment) {
            setTreatment(selectedTreatment.name);
            setFee(selectedTreatment.fee.toString());
        }
    };
    
    const handleSave = () => {
        const selectedTreatment = TREATMENTS.find(t => t.name === treatment);
        onSave({ date, code: selectedTreatment?.code || '', description: treatment, charge: Number(fee), payment: 0, writeOff: 0 });
    };

    return (
        <ModalWrapper title="Add Procedure Charge" onClose={onClose} onSave={handleSave}>
            <div className="space-y-6">
                <Input label="Service Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
                <Select label="Procedure Name" value={treatment} onChange={handleTreatmentChange} options={TREATMENTS.map(t => t.name)} />
                <Input label="Calculated Fee" type="number" value={fee} onChange={e => setFee(e.target.value)} />
            </div>
        </ModalWrapper>
    );
};

const WriteOffModal: React.FC<ModalProps> = ({ onSave, onClose }) => {
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [reason, setReason] = useState('Insurance Adjustment');
    
    const handleSave = () => {
        onSave({ date, code: '', description: `Adjustment: ${reason}`, charge: 0, payment: 0, writeOff: Number(amount) });
    };

    return (
        <ModalWrapper title="Financial Adjustment" onClose={onClose} onSave={handleSave} variant="blue">
            <div className="space-y-6">
                <Input label="Deduction Amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} />
                <Input label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
                <Select label="Reason for Adjustment" value={reason} onChange={e => setReason(e.target.value)} options={['Insurance Adjustment', 'Professional Courtesy', 'Credit Balance', 'Collection Loss']} />
            </div>
        </ModalWrapper>
    );
};

const InsuranceClaimModal: React.FC<{ 
    patient: Patient; 
    initialSelectedIds: Set<string>;
    onClose: () => void; 
}> = ({ patient, initialSelectedIds, onClose }) => {
    const { dispatch } = useSimulationContext();
    
    const selectedProcedures = useMemo(() => {
        return patient.ledger.filter(entry => entry.charge > 0 && initialSelectedIds.has(entry.id));
    }, [patient, initialSelectedIds]);

    const totalClaimValue = selectedProcedures.reduce((sum, p) => sum + p.charge, 0);

    const handleFinalize = (method: 'Electronic' | 'Paper') => {
        if (selectedProcedures.length === 0) {
            alert("No billable procedures selected. Please select at least one charge line to claim.");
            return;
        }

        const claimId = `CLM-${Math.floor(1000 + Math.random() * 9000)}`;
        const newClaim: InsuranceClaim = {
            id: claimId,
            patientId: patient.id,
            dateCreated: new Date().toISOString().split('T')[0],
            status: 'Sent',
            carrier: patient.primaryInsurance?.company || 'Direct',
            totalAmount: totalClaimValue,
            procedureIds: selectedProcedures.map(p => p.id),
            diagnosticCodes: [],
            statusHistory: [{ date: new Date().toISOString().split('T')[0], status: 'Created' }],
            attachments: { 
                images: [], 
                perioChartAttached: false, 
                photoAttached: false, 
                txPlanAttached: false 
            }
        };

        dispatch({ type: 'ADD_CLAIM', payload: newClaim });
        dispatch({ type: 'ADD_TOAST', payload: { message: `Claim ${claimId} generated and ${method === 'Electronic' ? 'transmitted' : 'prepared for printing'}.`, type: 'success' } });
        dispatch({ type: 'LOG_ACTION', payload: { type: 'send_insurance_claim', details: { patientId: patient.id, claimId, method, value: totalClaimValue } } });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-[110]">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden animate-slide-in-up border border-white">
                <div className="bg-red-700 p-8 text-white flex justify-between items-center">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-1.5 h-6 bg-white/30 rounded-full"></div>
                            <h2 className="text-xl font-black uppercase tracking-tight">Generate Dental Claim</h2>
                        </div>
                        <p className="text-[11px] font-bold text-red-100 uppercase tracking-widest">Payer Connection: {patient.primaryInsurance?.company || 'Direct Payer'}</p>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-full transition-all duration-300">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="p-10 space-y-8">
                    <div className="bg-red-50 p-6 rounded-3xl border border-red-100 flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-black text-red-400 uppercase tracking-widest mb-1">Batch Billable Value</p>
                            <p className="text-4xl font-black text-red-700 tracking-tighter">${totalClaimValue.toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1">Items</p>
                            <p className="text-2xl font-black text-gray-800">{selectedProcedures.length}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest border-b pb-2">Electronic Transaction Breakdown</h4>
                        <div className="max-h-40 overflow-y-auto space-y-2 pr-4 custom-scrollbar">
                            {selectedProcedures.map(p => (
                                <div key={p.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-2xl border border-gray-100 group transition-all hover:bg-white hover:border-red-100">
                                    <div>
                                        <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight">{p.description}</p>
                                        <p className="text-[9px] text-gray-400 font-bold uppercase mt-0.5">{p.date} • Code: {p.code}</p>
                                    </div>
                                    <span className="font-black text-slate-700 text-sm">${p.charge.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-8 border-t bg-slate-50 flex justify-between items-center">
                    <button onClick={onClose} className="text-xs font-black uppercase text-slate-400 hover:text-slate-600 tracking-widest">Discard</button>
                    <div className="flex gap-4">
                        <button 
                            onClick={() => handleFinalize('Paper')}
                            className="px-8 py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-red-200 hover:text-red-700 shadow-sm transition-all"
                        >
                            Print Claim
                        </button>
                        <button 
                            onClick={() => handleFinalize('Electronic')}
                            className="px-10 py-4 bg-red-700 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-red-500/20 hover:bg-red-800 active:scale-95 transition-all"
                        >
                            Transmit Now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Ledger;
