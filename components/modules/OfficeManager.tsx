
import React, { useState, useMemo } from 'react';
import { useSimulationContext } from '../../context/SimulationContext';
import { Appointment, LedgerEntry, Patient, PreAuthorization, InsuranceClaim, RecallType } from '../../types';
import { TREATMENTS, PROVIDERS, PROCEDURE_CODES, PROVIDER_COLORS } from '../../constants';

interface ProviderProduction {
  total: number;
  procedures: (Appointment & { fee: number; category: string; adaCode: string })[];
}

const isSameDay = (d1: Date, d2: Date) => 
  d1.getFullYear() === d2.getFullYear() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getDate() === d2.getDate();

const useReportData = (date: Date) => {
  const { state } = useSimulationContext();

  const appointmentsForDate = state.appointments.filter(
    (apt) => isSameDay(apt.startTime, date)
  );

  const paymentsForDate = state.patients.flatMap(p =>
    p.ledger.filter(entry => isSameDay(new Date(entry.date + 'T12:00:00'), date) && entry.payment > 0)
      .map(entry => {
          const desc = entry.description.toLowerCase();
          const isIns = desc.includes('ins') || desc.includes('insurance');
          const checkMatch = entry.description.match(/(?:#|Check\s*)(\d+)/i);
          
          return { 
              ...entry, 
              patientName: `${p.lastName}, ${p.firstName}`,
              source: (isIns ? 'Insurance' : 'Patient') as 'Patient' | 'Insurance',
              extractedCheckNum: checkMatch ? checkMatch[1] : undefined
          };
      })
  );

  const totalPayments = paymentsForDate.reduce((sum, entry) => sum + entry.payment, 0);

  const productionByProvider = appointmentsForDate.reduce<Record<string, ProviderProduction>>((acc, apt) => {
    let fee = apt.fee || 0;
    let category = 'Uncategorized';
    let adaCode = apt.procedureCode || '---';

    const procLookup = PROCEDURE_CODES.find(p => p.adaCode === apt.procedureCode);
    if (procLookup) {
        if (fee === 0) fee = procLookup.fee;
        category = procLookup.category;
    } else {
        const treatment = TREATMENTS.find(t => t.name === apt.treatment);
        if (treatment) {
            if (fee === 0) fee = treatment.fee;
            adaCode = treatment.code;
            const catLookup = PROCEDURE_CODES.find(p => p.adaCode === treatment.code);
            if (catLookup) category = catLookup.category;
        }
    }
    
    if (fee === 0) fee = 100; 

    if (!acc[apt.provider]) {
      acc[apt.provider] = { total: 0, procedures: [] };
    }
    acc[apt.provider].total += fee;
    acc[apt.provider].procedures.push({ ...apt, fee, category, adaCode });
    return acc;
  }, {});

  const totalProduction = (Object.values(productionByProvider) as ProviderProduction[]).reduce((sum, providerData) => sum + providerData.total, 0);

  return { state, appointmentsForDate, totalProduction, paymentsForDate, totalPayments, productionByProvider };
};

const DaySheetContent: React.FC<{ date: Date }> = ({ date }) => {
  const { state, appointmentsForDate, totalProduction, totalPayments } = useReportData(date);
  const { dispatch } = useSimulationContext();

  const getPatientName = (id: number) => {
    const p = state.patients.find(p => p.id === id);
    return p ? `${p.lastName}, ${p.firstName}` : 'Unknown';
  };
  
  const handlePatientSelect = (patientId: number) => {
      dispatch({ type: 'SELECT_PATIENT', payload: patientId });
      dispatch({ type: 'ADD_TOAST', payload: { message: `Patient ${getPatientName(patientId)} selected.`, type: 'info' } });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-bold text-gray-800">Summary</h3>
        <div className="grid grid-cols-3 gap-4 mt-2 text-center">
          <div className="bg-blue-100 p-3 rounded-lg"><div className="text-2xl font-bold">{appointmentsForDate.length}</div><div className="text-xs">Appointments</div></div>
          <div className="bg-green-100 p-3 rounded-lg"><div className="text-2xl font-bold">${totalProduction.toFixed(2)}</div><div className="text-xs">Total Production</div></div>
          <div className="bg-yellow-100 p-3 rounded-lg"><div className="text-2xl font-bold">${totalPayments.toFixed(2)}</div><div className="text-xs">Total Collections</div></div>
        </div>
      </div>
      <div>
        <h3 className="font-bold text-gray-800">Appointments Schedule</h3>
        <table className="w-full mt-2 text-xs">
          <thead className="bg-gray-200"><tr><th className="th-header">Time</th><th className="th-header">Patient</th><th className="th-header">Provider</th><th className="th-header">Treatment</th></tr></thead>
          <tbody>
            {appointmentsForDate.sort((a, b) => a.startTime.getTime() - b.startTime.getTime()).map(apt => (
              <tr key={apt.id} className="border-b"><td className="td-cell">{apt.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td><td className="td-cell"><button onClick={() => handlePatientSelect(apt.patientId)} className="text-blue-600 hover:underline">{getPatientName(apt.patientId)}</button></td><td className="td-cell">{apt.provider}</td><td className="td-cell">{apt.treatment}</td></tr>
            ))}
            {appointmentsForDate.length === 0 && <tr><td colSpan={4} className="text-center p-4 text-gray-500">No appointments scheduled for this date.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const DepositSlipContent: React.FC<{ date: Date }> = ({ date }) => {
  const { paymentsForDate, totalPayments } = useReportData(date);

  const breakdown = useMemo(() => {
    const data = {
        cash: { total: 0, items: [] as any[] },
        check: { total: 0, items: [] as any[] },
        electronic: { total: 0, items: [] as any[] }
    };

    paymentsForDate.forEach(p => {
        const type = (p.paymentType || 'Other').toLowerCase();
        if (type === 'cash') {
            data.cash.total += p.payment;
            data.cash.items.push(p);
        } else if (type === 'check') {
            data.check.total += p.payment;
            data.check.items.push(p);
        } else {
            data.electronic.total += p.payment;
            data.electronic.items.push(p);
        }
    });

    return data;
  }, [paymentsForDate]);

  return (
    <div className="space-y-8 animate-fade-in-fast pb-20">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <DepositStatCard title="Total Deposit" value={totalPayments} color="emerald" icon="💰" />
        <DepositStatCard title="Cash Receipts" value={breakdown.cash.total} color="blue" icon="💵" />
        <DepositStatCard title="Check Portfolio" value={breakdown.check.total} color="indigo" icon="✍️" />
        <DepositStatCard title="Credit/EFT Total" value={breakdown.electronic.total} color="purple" icon="💳" />
      </div>

      <div className="bg-white rounded-2xl shadow-xl border overflow-hidden">
        <div className="bg-emerald-600 px-6 py-4 text-white flex justify-between items-center">
            <div>
                <h3 className="text-xl font-black uppercase tracking-tight">Bank Deposit Registry</h3>
                <p className="text-[10px] font-bold text-emerald-100 uppercase tracking-widest">Office Verification Document • {date.toLocaleDateString()}</p>
            </div>
            <button onClick={() => window.print()} className="px-4 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-2 border border-white/30">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                Print Slip
            </button>
        </div>

        <div className="p-6 space-y-10">
            <div>
                <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    Personal & Insurance Checks ({breakdown.check.items.length})
                </h4>
                <table className="w-full text-xs border rounded-xl overflow-hidden">
                    <thead className="bg-gray-50 border-b">
                        <tr className="text-[10px] font-black text-gray-500 uppercase">
                            <th className="px-4 py-3 text-left">Payer / Source</th>
                            <th className="px-4 py-3 text-left">Patient Account</th>
                            <th className="px-4 py-3 text-left">Check #</th>
                            <th className="px-4 py-3 text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y font-medium text-gray-700">
                        {breakdown.check.items.map((item, i) => (
                            <tr key={i} className="hover:bg-indigo-50 transition-colors">
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${item.source === 'Insurance' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                                        {item.source}
                                    </span>
                                </td>
                                <td className="px-4 py-3 font-bold text-gray-800">{item.patientName}</td>
                                <td className="px-4 py-3 font-mono text-indigo-600">{item.extractedCheckNum || '---'}</td>
                                <td className="px-4 py-3 text-right font-black">${item.payment.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-gray-50 font-black border-t">
                        <tr>
                            <td colSpan={3} className="px-4 py-3 text-right text-gray-500 uppercase text-[10px]">Check Subtotal</td>
                            <td className="px-4 py-3 text-right text-indigo-700 font-black text-sm">${breakdown.check.total.toFixed(2)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
};

const DepositStatCard: React.FC<{ title: string; value: number; color: 'emerald' | 'blue' | 'indigo' | 'purple'; icon: string }> = ({ title, value, color, icon }) => {
    const colors = {
        emerald: 'border-emerald-500 bg-emerald-50 text-emerald-700',
        blue: 'border-blue-500 bg-blue-50 text-blue-700',
        indigo: 'border-indigo-500 bg-indigo-50 text-indigo-700',
        purple: 'border-purple-500 bg-purple-50 text-purple-700'
    };
    return (
        <div className={`p-5 rounded-2xl border-l-8 shadow-md bg-white ${colors[color]} transition-all hover:scale-[1.02]`}>
            <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{title}</span>
                <span className="text-xl drop-shadow-sm">{icon}</span>
            </div>
            <div className="text-2xl font-black">${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
        </div>
    );
};

const ProductionSummaryContent: React.FC<{ date: Date }> = ({ date }) => {
  const { productionByProvider, totalProduction, appointmentsForDate } = useReportData(date);

  return (
    <div className="space-y-8 animate-fade-in-fast pb-20">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <ProductionStatCard title="Gross Production" value={totalProduction} icon="📈" color="indigo" />
        <ProductionStatCard title="Procedure Volume" value={appointmentsForDate.length} icon="🦷" color="blue" isCurrency={false} />
      </div>
    </div>
  );
};

const ProductionStatCard: React.FC<{ title: string; value: number; icon: string; color: string; isCurrency?: boolean }> = ({ title, value, icon, color, isCurrency = true }) => {
    const colors: Record<string, string> = {
        indigo: 'border-indigo-500 bg-indigo-50 text-indigo-700',
        blue: 'border-blue-500 bg-blue-50 text-blue-700',
        emerald: 'border-emerald-500 bg-emerald-50 text-emerald-700'
    };
    return (
        <div className={`p-5 rounded-2xl border-l-8 shadow-md bg-white ${colors[color]} transition-all hover:scale-[1.02]`}>
            <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{title}</span>
                <span className="text-xl drop-shadow-sm">{icon}</span>
            </div>
            <div className="text-2xl font-black">
                {isCurrency ? `$${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : value}
            </div>
        </div>
    );
};

// --- AGING REPORT CONTENT (Overhauled to match screenshots) ---

const AgingReportContent: React.FC<{ initialDate: Date }> = ({ initialDate }) => {
    const { state } = useSimulationContext();
    const [isGenerated, setIsGenerated] = useState(false);
    const [reportParams, setReportParams] = useState({
        refDate: initialDate.toISOString().split('T')[0],
        provider: 'All Providers',
        printResponsibleOnly: true,
        showFamilyTogether: true
    });

    const agingData = useMemo(() => {
        if (!isGenerated) return null;
        
        const reference = new Date(reportParams.refDate + 'T23:59:59');
        const buckets = {
            current: 0,
            '31-60': 0,
            '61-90': 0,
            '91-120': 0,
            '120+': 0,
            total: 0
        };

        const patientSummaries = state.patients.map(p => {
            const pBuckets = { current: 0, '31-60': 0, '61-90': 0, '91-120': 0, '120+': 0, total: 0 };
            
            // Only consider ledger entries on or before reference date
            p.ledger.forEach(entry => {
                const entryDate = new Date(entry.date + 'T12:00:00');
                if (entryDate > reference) return;

                const diffTime = reference.getTime() - entryDate.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const balance = entry.charge - entry.payment - entry.writeOff;

                if (balance !== 0) {
                    if (diffDays <= 30) pBuckets.current += balance;
                    else if (diffDays <= 60) pBuckets['31-60'] += balance;
                    else if (diffDays <= 90) pBuckets['61-90'] += balance;
                    else if (diffDays <= 120) pBuckets['91-120'] += balance;
                    else pBuckets['120+'] += balance;
                    pBuckets.total += balance;
                }
            });

            // Add to global buckets
            buckets.current += pBuckets.current;
            buckets['31-60'] += pBuckets['31-60'];
            buckets['61-90'] += pBuckets['61-90'];
            buckets['91-120'] += pBuckets['91-120'];
            buckets['120+'] += pBuckets['120+'];
            buckets.total += pBuckets.total;

            return {
                name: `${p.lastName}, ${p.firstName}`,
                id: p.chartNumber || `PT${p.id.toString().padStart(5, '0')}`,
                ...pBuckets
            };
        }).filter(p => p.total !== 0);

        return { summaries: patientSummaries, totals: buckets };
    }, [isGenerated, reportParams.refDate, state.patients]);

    const handleGenerate = () => {
        setIsGenerated(true);
    };

    const handleReset = () => {
        setIsGenerated(false);
    };

    if (!isGenerated) {
        return (
            <div className="flex flex-col items-center justify-center pt-20">
                <div className="bg-white rounded-3xl shadow-2xl p-12 w-full max-w-2xl border border-gray-100 animate-fade-in-up">
                    <div className="mb-10">
                        <h2 className="text-2xl font-black text-[#1e293b] uppercase tracking-tight">Aging Report Options</h2>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Configure parameters for receivable analysis</p>
                    </div>

                    <div className="grid grid-cols-2 gap-8 mb-10">
                        <div>
                            <label className="block text-[9px] font-black text-gray-400 uppercase mb-2 tracking-widest">Report Reference Date</label>
                            <input 
                                type="date" 
                                className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-black outline-none focus:border-blue-500 transition-all"
                                value={reportParams.refDate}
                                onChange={e => setReportParams({...reportParams, refDate: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-[9px] font-black text-gray-400 uppercase mb-2 tracking-widest">Filter by Provider</label>
                            <select 
                                className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-black outline-none focus:border-blue-500 transition-all appearance-none"
                                value={reportParams.provider}
                                onChange={e => setReportParams({...reportParams, provider: e.target.value})}
                            >
                                <option>All Providers</option>
                                {PROVIDERS.map(p => <option key={p}>{p}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-4 mb-12">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input 
                                type="checkbox" 
                                className="w-5 h-5 rounded border-2 border-blue-200 text-blue-600 focus:ring-blue-500"
                                checked={reportParams.printResponsibleOnly}
                                onChange={e => setReportParams({...reportParams, printResponsibleOnly: e.target.checked})}
                            />
                            <span className="text-xs font-black text-gray-700 uppercase tracking-tight group-hover:text-blue-600 transition-colors">Print responsible party totals only</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input 
                                type="checkbox" 
                                className="w-5 h-5 rounded border-2 border-blue-200 text-blue-600 focus:ring-blue-500"
                                checked={reportParams.showFamilyTogether}
                                onChange={e => setReportParams({...reportParams, showFamilyTogether: e.target.checked})}
                            />
                            <span className="text-xs font-black text-gray-700 uppercase tracking-tight group-hover:text-blue-600 transition-colors">Show family balances together (Head of Household)</span>
                        </label>
                    </div>

                    <div className="flex justify-end items-center gap-10">
                        <button onClick={handleReset} className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] hover:text-gray-800 transition-colors">Reset</button>
                        <button 
                            onClick={handleGenerate}
                            className="px-12 py-4 bg-[#2563eb] text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-500/30 hover:bg-blue-700 transition-all active:scale-95"
                        >
                            Generate Report
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-fade-in-fast pb-20">
            {/* Header Info Bar */}
            <div className="flex justify-between items-center bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                <div className="flex gap-6 text-[10px] font-black uppercase tracking-widest text-[#1e40af]">
                    <div className="flex gap-2"><span>Date:</span> <span className="text-gray-600 font-bold">{reportParams.refDate}</span></div>
                    <div className="flex gap-2"><span>Filter:</span> <span className="text-gray-600 font-bold">{reportParams.provider}</span></div>
                </div>
                <div className="flex gap-4">
                    <button onClick={handleReset} className="px-4 py-2 bg-white border border-blue-200 rounded-xl text-[9px] font-black uppercase tracking-widest text-[#1e40af] hover:bg-blue-50 shadow-sm transition-all">Reconfigure</button>
                </div>
            </div>

            {/* Bucket Summary Row */}
            <div className="grid grid-cols-5 gap-6">
                <AgingSummaryCard label="CURRENT (0-30)" value={agingData?.totals.current || 0} color="border-blue-600" />
                <AgingSummaryCard label="31-60 DAYS" value={agingData?.totals['31-60'] || 0} color="border-sky-400" />
                <AgingSummaryCard label="61-90 DAYS" value={agingData?.totals['61-90'] || 0} color="border-indigo-800" />
                <AgingSummaryCard label="91-120 DAYS" value={agingData?.totals['91-120'] || 0} color="border-orange-500" />
                <AgingSummaryCard label="120+ DAYS" value={agingData?.totals['120+'] || 0} color="border-red-600" />
            </div>

            {/* Main Data Table */}
            <div className="bg-white rounded-3xl shadow-2xl border overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-[#1e293b] text-white uppercase text-[9px] font-black tracking-widest">
                        <tr>
                            <th className="px-8 py-5 text-left">Patient (Chart #)</th>
                            <th className="px-8 py-5 text-right">Current</th>
                            <th className="px-8 py-5 text-right">31-60</th>
                            <th className="px-8 py-5 text-right">61-90</th>
                            <th className="px-8 py-5 text-right">91-120</th>
                            <th className="px-8 py-5 text-right">120+</th>
                            <th className="px-8 py-5 text-right bg-slate-700/50">Total Bal.</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y font-medium text-gray-700">
                        {agingData?.summaries.map((p, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                                <td className="px-8 py-6">
                                    <p className="text-sm font-black text-gray-800 uppercase tracking-tight group-hover:text-blue-600 transition-colors">{p.name}</p>
                                    <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-tighter">ID: {p.id}</p>
                                </td>
                                <td className={`px-8 py-6 text-right font-black ${p.current === 0 ? 'text-blue-400 opacity-40' : 'text-gray-800'}`}>${p.current.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                <td className={`px-8 py-6 text-right font-black ${p['31-60'] === 0 ? 'text-blue-400 opacity-40' : 'text-blue-600'}`}>${p['31-60'].toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                <td className={`px-8 py-6 text-right font-black ${p['61-90'] === 0 ? 'text-blue-400 opacity-40' : 'text-indigo-600'}`}>${p['61-90'].toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                <td className={`px-8 py-6 text-right font-black ${p['91-120'] === 0 ? 'text-blue-400 opacity-40' : 'text-orange-600'}`}>${p['91-120'].toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                <td className={`px-8 py-6 text-right font-black ${p['120+'] === 0 ? 'text-blue-400 opacity-40' : 'text-red-600'}`}>${p['120+'].toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                <td className="px-8 py-6 text-right font-black text-gray-900 bg-slate-50/50 text-base">${p.total.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const AgingSummaryCard: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
    <div className={`bg-white rounded-2xl p-6 border-l-[6px] ${color} shadow-xl transform transition-transform hover:-translate-y-1`}>
        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">{label}</p>
        <p className="text-2xl font-black text-gray-800">${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
    </div>
);

// --- RECALL MANAGEMENT CONTENT ---

const RecallTypeModal: React.FC<{ 
  recall?: RecallType; 
  onClose: () => void; 
  onSave: (recall: RecallType) => void; 
}> = ({ recall, onClose, onSave }) => {
  const [formData, setFormData] = useState<RecallType>(recall || {
    id: `r${Date.now()}`,
    shortName: '',
    description: '',
    intervalDays: 180,
    procedureCode: ''
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-[120]">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-in-up">
            <div className="bg-[#1e293b] p-5 text-white flex justify-between items-center">
                <h3 className="text-sm font-black uppercase tracking-widest">{recall ? 'Edit Recall Type' : 'New Recall Type'}</h3>
                <button onClick={onClose} className="hover:opacity-70 transition-opacity p-1">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
            <div className="p-8 space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-[#94a3b8] uppercase mb-1.5 tracking-widest">Short Name (Code)</label>
                  <input type="text" className="w-full p-2.5 border border-gray-300 rounded-lg text-sm font-bold outline-none uppercase" value={formData.shortName} onChange={e => setFormData({...formData, shortName: e.target.value.toUpperCase()})} placeholder="e.g. FLUOR" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-[#94a3b8] uppercase mb-1.5 tracking-widest">Description</label>
                  <input type="text" className="w-full p-2.5 border border-gray-300 rounded-lg text-sm font-bold outline-none" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="e.g. Fluoride Application" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-[#94a3b8] uppercase mb-1.5 tracking-widest">Interval (Days)</label>
                    <input type="number" className="w-full p-2.5 border border-gray-300 rounded-lg text-sm font-black outline-none" value={formData.intervalDays} onChange={e => setFormData({...formData, intervalDays: Number(e.target.value)})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-[#94a3b8] uppercase mb-1.5 tracking-widest">Procedure Code</label>
                    <input type="text" className="w-full p-2.5 border border-gray-300 rounded-lg text-sm font-bold outline-none uppercase" value={formData.procedureCode} onChange={e => setFormData({...formData, procedureCode: e.target.value.toUpperCase()})} placeholder="e.g. D1208" />
                  </div>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-[10px] font-bold text-blue-700">
                  Tip: {formData.intervalDays} days is approximately {Math.round(formData.intervalDays / 30)} months.
                </div>
            </div>
            <div className="p-4 border-t bg-white flex justify-end items-center gap-6 pr-8 pb-6">
                <button onClick={onClose} className="text-xs font-bold text-gray-500 hover:text-gray-800 uppercase tracking-widest">Cancel</button>
                <button onClick={() => onSave(formData)} className="px-8 py-3 bg-[#2563eb] text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-blue-700 shadow-lg">OK</button>
            </div>
        </div>
    </div>
  );
};

const RecallManagementContent: React.FC = () => {
    const { state, dispatch } = useSimulationContext();
    const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Calculate Recall List: Patients due for their assigned/default recall types
    const recallDueList = useMemo(() => {
        const dueList: { patient: Patient; type: RecallType; lastDate: string; daysOverdue: number }[] = [];
        const today = new Date();

        state.patients.forEach(patient => {
            state.recallTypes.forEach(type => {
                // Find latest ledger entry for this patient matching the recall procedure code
                const lastProc = [...patient.ledger]
                    .filter(l => l.code === type.procedureCode)
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
                
                if (lastProc) {
                    const lastDate = new Date(lastProc.date + 'T12:00:00');
                    const diffTime = today.getTime() - lastDate.getTime();
                    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                    
                    if (diffDays >= type.intervalDays) {
                        dueList.push({
                            patient,
                            type,
                            lastDate: lastProc.date,
                            daysOverdue: diffDays - type.intervalDays
                        });
                    }
                } else if (patient.lastVisitDate) {
                    // Fallback to last visit if no specific code found
                    const lastVisit = new Date(patient.lastVisitDate + 'T12:00:00');
                    const diffDays = Math.floor((today.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24));
                    if (diffDays >= type.intervalDays) {
                        dueList.push({
                            patient,
                            type,
                            lastDate: patient.lastVisitDate,
                            daysOverdue: diffDays - type.intervalDays
                        });
                    }
                }
            });
        });

        return dueList.sort((a, b) => b.daysOverdue - a.daysOverdue);
    }, [state.patients, state.recallTypes]);

    const handleEdit = () => {
        if (!selectedTypeId) return;
        setIsModalOpen(true);
    };

    const handleNew = () => {
        setSelectedTypeId(null);
        setIsModalOpen(true);
    };

    const handleSaveRecall = (recall: RecallType) => {
        if (selectedTypeId) {
            dispatch({ type: 'UPDATE_RECALL_TYPE', payload: recall });
            dispatch({ type: 'ADD_TOAST', payload: { message: `Recall type ${recall.shortName} updated.`, type: 'success' } });
        } else {
            dispatch({ type: 'ADD_RECALL_TYPE', payload: recall });
            dispatch({ type: 'ADD_TOAST', payload: { message: `New recall type ${recall.shortName} added.`, type: 'success' } });
        }
        setIsModalOpen(false);
    };

    const editingRecall = state.recallTypes.find(r => r.id === selectedTypeId);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in-fast pb-20">
            {/* Recall Types Config */}
            <div className="bg-white rounded-2xl shadow-xl border overflow-hidden flex flex-col h-[600px]">
                <div className="bg-slate-800 px-6 py-4 text-white flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-black uppercase tracking-tight">Recall Types List</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Global Configuration</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleNew} className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-700">New</button>
                        <button onClick={handleEdit} disabled={!selectedTypeId} className="px-4 py-1.5 bg-white text-slate-800 border border-slate-300 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 disabled:opacity-50">Edit</button>
                    </div>
                </div>
                <div className="flex-grow overflow-auto">
                    <table className="w-full text-xs">
                        <thead className="bg-slate-50 border-b sticky top-0 z-10">
                            <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                <th className="px-6 py-4 text-left">Code</th>
                                <th className="px-6 py-4 text-left">Description</th>
                                <th className="px-6 py-4 text-center">Interval</th>
                                <th className="px-6 py-4 text-center">Proc Code</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y font-medium text-gray-700">
                            {state.recallTypes.map(type => (
                                <tr 
                                    key={type.id} 
                                    onClick={() => setSelectedTypeId(type.id)}
                                    className={`cursor-pointer transition-colors ${selectedTypeId === type.id ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                                >
                                    <td className="px-6 py-4 font-black text-blue-700">{type.shortName}</td>
                                    <td className="px-6 py-4 font-bold text-slate-900">{type.description}</td>
                                    <td className="px-6 py-4 text-center font-mono">{type.intervalDays}d</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded border border-slate-200 uppercase font-bold">{type.procedureCode}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Patients Added For Recall List */}
            <div className="bg-white rounded-2xl shadow-xl border overflow-hidden flex flex-col h-[600px]">
                <div className="bg-blue-900 px-6 py-4 text-white flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-black uppercase tracking-tight">Recall Due List</h3>
                        <p className="text-[10px] font-bold text-blue-300 uppercase tracking-widest mt-1">Patients Identified as Due</p>
                    </div>
                    <div className="bg-blue-800 px-3 py-1 rounded-lg">
                        <span className="text-xs font-black">{recallDueList.length} Found</span>
                    </div>
                </div>
                <div className="flex-grow overflow-auto">
                    <table className="w-full text-xs">
                        <thead className="bg-slate-50 border-b sticky top-0 z-10">
                            <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                <th className="px-6 py-4 text-left">Patient Name</th>
                                <th className="px-6 py-4 text-left">Recall Item</th>
                                <th className="px-6 py-4 text-center">Last Seen</th>
                                <th className="px-6 py-4 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y font-medium text-gray-700">
                            {recallDueList.map((item, idx) => (
                                <tr key={idx} className="hover:bg-blue-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-black text-slate-900">{item.patient.lastName}, {item.patient.firstName}</div>
                                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">#{item.patient.chartNumber}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-blue-800">{item.type.shortName}</div>
                                        <div className="text-[10px] text-gray-400 font-medium">{item.type.description}</div>
                                    </td>
                                    <td className="px-6 py-4 text-center whitespace-nowrap text-gray-500 font-bold">
                                        {new Date(item.lastDate + 'T12:00:00').toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${
                                            item.daysOverdue > 30 ? 'bg-red-50 text-red-600 border-red-100' : 'bg-orange-50 text-orange-600 border-orange-100'
                                        }`}>
                                            {item.daysOverdue > 30 ? 'Overdue' : 'Due Now'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {recallDueList.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="py-20 text-center text-gray-400 italic font-bold">No patients currently due for recall.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <RecallTypeModal recall={editingRecall} onClose={() => setIsModalOpen(false)} onSave={handleSaveRecall} />
            )}
        </div>
    );
};

// --- OFFICE MANAGER MAIN ---

const OfficeManager: React.FC = () => {
  const { dispatch } = useSimulationContext();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeReport, setActiveReport] = useState('Day Sheet');

  const handleReportSelect = (reportName: string) => {
    dispatch({ type: 'LOG_ACTION', payload: { type: 'run_report', details: { reportName } } });
    setActiveReport(reportName);
  };
  
  const reports = ['Day Sheet', 'Deposit Slip', 'Production Summary', 'Aging Report', 'Recall Management', 'End-of-Day'];

  const renderReportContent = () => {
    switch(activeReport) {
      case 'Day Sheet': return <DaySheetContent date={selectedDate} />;
      case 'Deposit Slip': return <DepositSlipContent date={selectedDate} />;
      case 'Production Summary': return <ProductionSummaryContent date={selectedDate} />;
      case 'Aging Report': return <AgingReportContent initialDate={selectedDate} />;
      case 'Recall Management': return <RecallManagementContent />;
      case 'End-of-Day': return <div className="space-y-8"><DaySheetContent date={selectedDate} /><hr /><ProductionSummaryContent date={selectedDate} /><hr /><DepositSlipContent date={selectedDate} /></div>;
      default: return null;
    }
  }

  return (
    <div className="bg-white h-full shadow-lg rounded-md overflow-hidden flex">
      <nav className="w-60 bg-gray-50 border-r p-4 flex flex-col space-y-4 shrink-0">
        <div>
          <label htmlFor="report-date" className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Reference Date</label>
          <input 
            type="date" 
            id="report-date"
            value={selectedDate.toLocaleDateString('en-CA')}
            onChange={e => setSelectedDate(new Date(e.target.value + 'T12:00:00'))}
            className="w-full p-2.5 border rounded-lg text-sm font-bold bg-white focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div className="border-t pt-4">
          <h3 className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Ledger Reports</h3>
          <div className="space-y-1">
            {reports.map(report => (
              <button 
                key={report}
                onClick={() => handleReportSelect(report)}
                className={`w-full text-left px-4 py-2.5 text-xs rounded-lg transition-all font-black uppercase tracking-tight ${activeReport === report ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-200'}`}
              >
                {report}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-auto bg-gray-800 rounded-xl p-4 text-white">
            <p className="text-[9px] font-black uppercase tracking-widest opacity-50 mb-1">Station ID</p>
            <p className="text-xs font-bold font-mono">OFFICE-MGR-01</p>
            <p className="text-[10px] mt-2 text-blue-300 font-bold">Secure Session Active</p>
        </div>
      </nav>
      <main className="flex-grow flex flex-col min-w-0">
        <header className="p-6 border-b bg-white flex justify-between items-end">
          <div>
            <div className="flex items-center gap-3">
                <h2 className="text-3xl font-black text-gray-800 tracking-tighter uppercase leading-none">{activeReport}</h2>
                <div className="flex gap-1.5 ml-4">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                </div>
            </div>
            <p className="text-xs text-gray-500 font-bold mt-2 uppercase tracking-widest opacity-70">
              {activeReport.includes('Aging') ? 'Cumulative Receivable Portfolio Analysis' : 
               activeReport === 'Recall Management' ? 'Clinical Recall Protocol Configuration' :
               `Period ending ${selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}
            </p>
          </div>
          <div className="flex flex-col items-end">
             <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Practice Performance</p>
             <div className="flex gap-1.5 mt-1 opacity-50">
                 <div className="w-2 h-2 rounded-full bg-green-500"></div>
                 <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                 <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
             </div>
          </div>
        </header>
        <div className="flex-grow overflow-y-auto p-8 bg-gray-50/50">
          {renderReportContent()}
        </div>
      </main>
    </div>
  );
};

export default OfficeManager;
