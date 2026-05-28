
import React, { useState, useMemo } from 'react';
import { useSimulationContext } from '../../context/SimulationContext';
import { PatientDocument, Patient } from '../../types';

// --- Types & Constants ---

type SmartFolder = 'all' | 'recent' | 'starred' | 'inbox';
type DocCategory = PatientDocument['category'] | 'All';

const CATEGORY_COLORS: Record<string, string> = {
  'Consent Forms': 'bg-purple-100 text-purple-700 border-purple-200',
  'X-Rays': 'bg-blue-100 text-blue-700 border-blue-200',
  'Imaging (MRI/CT)': 'bg-indigo-100 text-indigo-700 border-indigo-200',
  'Lab Results': 'bg-cyan-100 text-cyan-700 border-cyan-200',
  'Medical Records': 'bg-teal-100 text-teal-700 border-teal-200',
  'Prescriptions': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Insurance': 'bg-green-100 text-green-700 border-green-200',
  'Identification': 'bg-amber-100 text-amber-700 border-amber-200',
  'Referral': 'bg-rose-100 text-rose-700 border-rose-200',
  'Miscellaneous': 'bg-slate-100 text-slate-700 border-slate-200',
};

// --- Sub-components ---

const AssignDocumentModal: React.FC<{
    document: PatientDocument;
    onClose: () => void;
}> = ({ document, onClose }) => {
    const { state, dispatch } = useSimulationContext();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [docName, setDocName] = useState(document.name);
    const [docCategory, setDocCategory] = useState<PatientDocument['category']>(document.category || 'Miscellaneous');
    const [docNotes, setDocNotes] = useState(document.notes || '');

    const filteredPatients = useMemo(() => {
        if (!searchTerm) return [];
        const term = searchTerm.toLowerCase();
        return state.patients.filter(p => 
            `${p.firstName} ${p.lastName}`.toLowerCase().includes(term) || 
            p.id.toString().includes(term)
        ).slice(0, 5);
    }, [searchTerm, state.patients]);

    const handleAssign = () => {
        if (!selectedPatient) return;

        const finalDoc: PatientDocument = {
            ...document,
            name: docName,
            category: docCategory,
            notes: docNotes,
            uploadDate: new Date().toISOString().split('T')[0],
        };

        dispatch({
            type: 'ASSIGN_DOCUMENT_TO_PATIENT',
            payload: {
                documentId: document.id,
                patientId: selectedPatient.id,
                finalDocument: finalDoc
            }
        });

        dispatch({ type: 'ADD_TOAST', payload: { message: `Document successfully linked to ${selectedPatient.lastName}'s chart.`, type: 'success' } });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden animate-slide-in-up flex flex-col md:flex-row">
                {/* Left: Preview Panel */}
                <div className="md:w-2/5 bg-slate-100 p-8 flex flex-col border-r border-slate-200">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Original Artifact</h3>
                    <div className="flex-grow flex items-center justify-center">
                        <img src={document.previewUrl} alt="Preview" className="max-w-full max-h-[400px] shadow-2xl rounded-sm border-4 border-white rotate-1" />
                    </div>
                    <div className="mt-8 p-4 bg-white/50 rounded-xl border border-slate-200 text-[10px] space-y-2">
                        <div className="flex justify-between font-bold text-slate-500 uppercase"><span>Source:</span> <span className="text-slate-800">{document.source || 'Manual Scan'}</span></div>
                        <div className="flex justify-between font-bold text-slate-500 uppercase"><span>Captured:</span> <span className="text-slate-800">{document.uploadDate}</span></div>
                    </div>
                </div>

                {/* Right: Metadata Panel */}
                <div className="md:w-3/5 p-10 space-y-8">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Assign to Patient Chart</h2>
                        <p className="text-sm text-slate-400 font-bold mt-1 uppercase tracking-widest">Metadata Registration</p>
                    </div>
                    
                    <div className="space-y-6">
                        {/* Step 1: Patient Link */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">1. Target Patient Account</label>
                            {selectedPatient ? (
                                <div className="p-4 bg-indigo-50 border-2 border-indigo-100 rounded-2xl flex justify-between items-center group animate-fade-in-fast">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black">{selectedPatient.lastName[0]}</div>
                                        <div>
                                            <p className="text-sm font-black text-indigo-900 leading-none">{selectedPatient.lastName}, {selectedPatient.firstName}</p>
                                            <p className="text-[10px] font-bold text-indigo-400 mt-1">CHART ID: {selectedPatient.chartNumber || selectedPatient.id}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setSelectedPatient(null)} className="text-[10px] font-black text-indigo-600 uppercase hover:underline opacity-0 group-hover:opacity-100 transition-opacity">Change</button>
                                </div>
                            ) : (
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        placeholder="Search by Patient Name or MRN..." 
                                        className="w-full p-4 border-2 border-slate-100 rounded-2xl text-sm focus:border-indigo-500 outline-none transition-all shadow-inner bg-slate-50 font-bold"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        autoFocus
                                    />
                                    {filteredPatients.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-20 overflow-hidden">
                                            {filteredPatients.map(p => (
                                                <button 
                                                    key={p.id} 
                                                    onClick={() => setSelectedPatient(p)}
                                                    className="w-full text-left p-4 hover:bg-slate-50 transition-colors border-b last:border-0 flex justify-between items-center"
                                                >
                                                    <span className="font-black text-slate-700 text-sm">{p.lastName}, {p.firstName}</span>
                                                    <span className="text-[10px] font-black text-slate-300 uppercase">ID: {p.id}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Step 2: Metadata */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">2. Record Name</label>
                                <input type="text" value={docName} onChange={e => setDocName(e.target.value)} className="w-full p-3 border-2 border-slate-100 rounded-xl text-sm font-bold focus:border-indigo-500 outline-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">3. Taxonomy Category</label>
                                <select value={docCategory} onChange={e => setDocCategory(e.target.value as any)} className="w-full p-3 border-2 border-slate-100 rounded-xl text-sm font-black focus:border-indigo-500 outline-none bg-white">
                                    <option>Consent Forms</option>
                                    <option>X-Rays</option>
                                    <option>Imaging (MRI/CT)</option>
                                    <option>Lab Results</option>
                                    <option>Medical Records</option>
                                    <option>Prescriptions</option>
                                    <option>Insurance</option>
                                    <option>Identification</option>
                                    <option>Referral</option>
                                    <option>Miscellaneous</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">4. Clinical Summary / Remarks</label>
                            <textarea value={docNotes} onChange={e => setDocNotes(e.target.value)} className="w-full p-3 border-2 border-slate-100 rounded-xl text-sm font-medium h-24 focus:border-indigo-500 outline-none resize-none" placeholder="Enter clinical context or findings..." />
                        </div>
                    </div>

                    <div className="pt-8 flex justify-between items-center border-t border-slate-100">
                        <button onClick={onClose} className="text-xs font-black text-slate-400 uppercase hover:text-slate-800 transition-colors tracking-[0.2em]">Abort Task</button>
                        <button 
                            onClick={handleAssign} 
                            disabled={!selectedPatient} 
                            className="px-12 py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all"
                        >
                            Finalize Linkage
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Main Module ---

const DocumentCenter: React.FC = () => {
    const { state, dispatch } = useSimulationContext();
    const { patients, selectedPatientId, unassignedDocuments } = state;
    const patient = patients.find(p => p.id === selectedPatientId);
    
    const [smartFolder, setSmartFolder] = useState<SmartFolder>(selectedPatientId ? 'all' : 'inbox');
    const [categoryFilter, setCategoryFilter] = useState<DocCategory>('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [assignmentDoc, setAssignmentDoc] = useState<PatientDocument | null>(null);

    const handleToggleSelection = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const handleUpload = () => {
        const isInbox = smartFolder === 'inbox';
        const timestamp = new Date().toISOString().slice(11, 19).replace(/:/g, '');
        const name = `${isInbox ? 'Incoming_FAX' : 'SCAN'}_${timestamp}.pdf`;
        
        const newDoc: Omit<PatientDocument, 'id'> = {
            name,
            category: 'Miscellaneous',
            uploadDate: new Date().toISOString().split('T')[0],
            previewUrl: `https://picsum.photos/seed/${Date.now()}/400/600`,
            source: isInbox ? 'Fax' : 'Scan',
        };

        if (isInbox) {
            dispatch({ type: 'ADD_UNASSIGNED_DOCUMENT', payload: newDoc });
            dispatch({ type: 'ADD_TOAST', payload: { message: 'New fax artifact received in Inbox.', type: 'info' } });
        } else if (patient) {
            dispatch({ type: 'ADD_DOCUMENT', payload: { patientId: patient.id, document: newDoc } });
            dispatch({ type: 'ADD_TOAST', payload: { message: 'Document archived to patient record.', type: 'success' } });
        }
    };

    const handleDeleteSelected = () => {
        if (!window.confirm(`Permanently purge ${selectedIds.size} selected documents?`)) return;
        
        if (smartFolder === 'inbox') {
            selectedIds.forEach(id => dispatch({ type: 'DELETE_UNASSIGNED_DOCUMENT', payload: id }));
        } else {
            // Bulk delete logic for patient docs could be added here
            dispatch({ type: 'ADD_TOAST', payload: { message: 'Patient records cannot be bulk deleted in this demo.', type: 'warning' } });
        }
        setSelectedIds(new Set());
    };

    const filteredDocs = useMemo(() => {
        let docs = smartFolder === 'inbox' ? unassignedDocuments : (patient?.documents || []);
        
        if (categoryFilter !== 'All') {
            docs = docs.filter(d => d.category === categoryFilter);
        }
        
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            docs = docs.filter(d => d.name.toLowerCase().includes(q) || d.notes?.toLowerCase().includes(q));
        }

        return docs;
    }, [smartFolder, patient, unassignedDocuments, categoryFilter, searchQuery]);

    const stats = useMemo(() => {
        const docs = smartFolder === 'inbox' ? unassignedDocuments : (patient?.documents || []);
        const counts: Record<string, number> = { All: docs.length };
        docs.forEach(d => {
            counts[d.category] = (counts[d.category] || 0) + 1;
        });
        return counts;
    }, [smartFolder, patient, unassignedDocuments]);

    const SidebarItem: React.FC<{ icon: string; label: string; active: boolean; onClick: () => void; count?: number }> = ({ icon, label, active, onClick, count }) => (
        <button 
            onClick={onClick}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 group ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}
        >
            <div className="flex items-center gap-3">
                <span className={`text-lg transition-transform group-hover:scale-110 ${active ? 'opacity-100' : 'opacity-60'}`}>{icon}</span>
                <span className="text-[11px] font-black uppercase tracking-widest">{label}</span>
            </div>
            {count !== undefined && count > 0 && (
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${active ? 'bg-white/20' : 'bg-slate-200 text-slate-500'}`}>{count}</span>
            )}
        </button>
    );

    return (
        <div className="bg-slate-50 h-full flex font-sans overflow-hidden">
            {/* Sidebar */}
            <aside className="w-72 border-r bg-white flex flex-col shrink-0">
                <div className="p-8 pb-4">
                    <h2 className="text-xl font-black text-slate-800 tracking-tighter uppercase mb-8 flex items-center gap-2">
                        <div className="w-2 h-6 bg-indigo-600 rounded-full"></div>
                        ARCHIVES
                    </h2>

                    <div className="space-y-1">
                        <h4 className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-3 ml-2">Smart Views</h4>
                        <SidebarItem icon="📂" label="Inbox (Unassigned)" active={smartFolder === 'inbox'} onClick={() => { setSmartFolder('inbox'); setCategoryFilter('All'); }} count={unassignedDocuments.length} />
                        <SidebarItem icon="👤" label="Active Patient" active={smartFolder === 'all'} onClick={() => { setSmartFolder('all'); setCategoryFilter('All'); }} count={patient?.documents.length} />
                        <SidebarItem icon="✨" label="Recently Added" active={smartFolder === 'recent'} onClick={() => setSmartFolder('recent')} />
                        <SidebarItem icon="⭐️" label="Starred Files" active={smartFolder === 'starred'} onClick={() => setSmartFolder('starred')} />
                    </div>

                    <div className="mt-12 space-y-1">
                        <h4 className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-3 ml-2">Categories</h4>
                        {([
                            'All', 
                            'X-Rays', 
                            'Imaging (MRI/CT)', 
                            'Lab Results', 
                            'Medical Records', 
                            'Prescriptions', 
                            'Consent Forms', 
                            'Insurance', 
                            'Identification', 
                            'Referral', 
                            'Miscellaneous'
                        ] as const).map(cat => {
                            let icon = '📦';
                            if (cat === 'X-Rays') icon = '🩻';
                            else if (cat === 'Imaging (MRI/CT)') icon = '🧠';
                            else if (cat === 'Lab Results') icon = '🧪';
                            else if (cat === 'Medical Records') icon = '🏥';
                            else if (cat === 'Prescriptions') icon = '💊';
                            else if (cat === 'Consent Forms') icon = '✍️';
                            else if (cat === 'Insurance') icon = '🛡️';
                            else if (cat === 'Identification') icon = '🪪';
                            else if (cat === 'Referral') icon = '🤝';
                            else if (cat === 'All') icon = '📑';
                            
                            return (
                                <SidebarItem 
                                    key={cat} 
                                    icon={icon} 
                                    label={cat} 
                                    active={categoryFilter === cat} 
                                    onClick={() => setCategoryFilter(cat)}
                                    count={stats[cat]}
                                />
                            );
                        })}
                    </div>
                </div>

                <div className="mt-auto p-8 border-t border-slate-50">
                    <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40 mb-1">Storage Usage</p>
                        <p className="text-sm font-black tracking-tight">8.2 GB / 50 GB</p>
                        <div className="w-full bg-white/10 h-1.5 rounded-full mt-4 overflow-hidden">
                            <div className="bg-indigo-400 h-full" style={{ width: '16%' }}></div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-grow flex flex-col min-w-0">
                {/* Top Toolbar */}
                <header className="bg-white border-b p-6 flex justify-between items-center shadow-sm z-10">
                    <div className="flex items-center gap-6 flex-grow">
                        <div>
                            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                                {smartFolder === 'inbox' ? 'Artifact Staging Inbox' : `Clinical Vault: ${patient?.lastName || 'No Patient'}`}
                            </h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                                {filteredDocs.length} Document{filteredDocs.length !== 1 ? 's' : ''} Identified
                            </p>
                        </div>
                        
                        <div className="relative w-full max-w-md ml-8">
                            <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </span>
                            <input 
                                type="text" 
                                placeholder="Global archive search..." 
                                className="w-full pl-12 pr-4 py-3 bg-slate-100 border-none rounded-2xl text-sm focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-medium"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button 
                            onClick={handleUpload} 
                            className="px-8 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-3"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                            {smartFolder === 'inbox' ? 'Inbound Sim' : 'Vault Upload'}
                        </button>
                    </div>
                </header>

                {/* Grid View */}
                <div className="flex-grow overflow-y-auto p-10 scrollbar-thin bg-slate-50">
                    {filteredDocs.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8 pb-32">
                            {filteredDocs.map(doc => {
                                const isSelected = selectedIds.has(doc.id);
                                return (
                                    <div 
                                        key={doc.id} 
                                        className={`group relative bg-white rounded-3xl border-2 transition-all duration-500 flex flex-col overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 ${isSelected ? 'border-indigo-500 ring-4 ring-indigo-500/10' : 'border-transparent hover:border-indigo-100'}`}
                                    >
                                        {/* Selection Checkbox */}
                                        <button 
                                            onClick={() => handleToggleSelection(doc.id)}
                                            className={`absolute top-4 left-4 z-20 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white scale-110 shadow-lg' : 'bg-white/40 backdrop-blur-md border-white/60 text-transparent opacity-0 group-hover:opacity-100'}`}
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                        </button>

                                        {/* Preview Area */}
                                        <div className="relative aspect-[3/4] overflow-hidden bg-slate-200">
                                            <img src={doc.previewUrl} alt={doc.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-5">
                                                <button className="w-full py-2.5 bg-white text-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-indigo-50 transition-colors">Quick View</button>
                                            </div>
                                            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[9px] font-black uppercase text-slate-800 shadow-sm flex items-center gap-1.5">
                                                {doc.source === 'Fax' ? '📠' : doc.source === 'Scan' ? '📄' : '☁️'} {doc.source || 'SCAN'}
                                            </div>
                                        </div>
                                        
                                        {/* Meta Area */}
                                        <div className="p-6 flex-grow flex flex-col">
                                            <h4 className="text-sm font-black text-slate-800 leading-tight line-clamp-2 mb-3 group-hover:text-indigo-600 transition-colors">{doc.name}</h4>
                                            
                                            <div className="flex flex-wrap items-center gap-2 mb-4">
                                                <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase border ${CATEGORY_COLORS[doc.category]}`}>
                                                    {doc.category}
                                                </span>
                                                <span className="text-[9px] font-bold text-slate-300">|</span>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{doc.uploadDate}</span>
                                            </div>

                                            {doc.notes && <p className="text-[10px] text-slate-400 font-medium line-clamp-2 italic leading-relaxed">"{doc.notes}"</p>}

                                            <div className="mt-auto pt-6 flex gap-2 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                                                {smartFolder === 'inbox' ? (
                                                    <button 
                                                        onClick={() => setAssignmentDoc(doc)}
                                                        className="flex-grow py-3 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-[0.15em] rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
                                                    >
                                                        Link Chart
                                                    </button>
                                                ) : (
                                                    <button className="flex-grow py-3 bg-slate-800 text-white text-[9px] font-black uppercase tracking-[0.15em] rounded-xl hover:bg-slate-900 transition-colors shadow-lg">
                                                        Download
                                                    </button>
                                                )}
                                                <button 
                                                    className="w-12 py-3 bg-slate-100 text-slate-400 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all flex items-center justify-center"
                                                    title="Purge artifact"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 text-center py-20 max-w-md mx-auto">
                            <div className="w-32 h-32 bg-white rounded-[3rem] shadow-xl flex items-center justify-center mb-8 border border-slate-100 group">
                                <span className="text-6xl group-hover:rotate-12 transition-transform duration-500">{smartFolder === 'inbox' ? '📠' : '📂'}</span>
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-4">No Documentation Identified</h3>
                            <p className="text-sm font-medium leading-relaxed text-gray-500">
                                This vault segment is currently empty. Adjust your sidebar filters or use the upload button to ingest new medical artifacts.
                            </p>
                            {smartFolder === 'inbox' && (
                                <button onClick={handleUpload} className="mt-8 px-8 py-3 border-2 border-indigo-100 text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 transition-all">
                                    Simulate Inbound Transmission
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Selection Action Bar (Floating) */}
                {selectedIds.size > 0 && (
                    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 animate-slide-in-up">
                        <div className="bg-slate-900 text-white rounded-[2rem] shadow-2xl px-8 py-5 flex items-center gap-10 border-4 border-indigo-600/30">
                            <div className="flex flex-col">
                                <span className="text-[11px] font-black uppercase tracking-widest text-indigo-400">Selected Artifacts</span>
                                <span className="text-2xl font-black tracking-tighter">{selectedIds.size} Items</span>
                            </div>
                            
                            <div className="h-10 w-px bg-white/10"></div>
                            
                            <div className="flex gap-4">
                                <button className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Move</button>
                                <button className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Merge</button>
                                <button 
                                    onClick={handleDeleteSelected}
                                    className="px-8 py-3 bg-red-600 hover:bg-red-700 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-500/20 transition-all active:scale-95"
                                >
                                    Purge Selected
                                </button>
                            </div>

                            <button 
                                onClick={() => setSelectedIds(new Set())}
                                className="ml-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                    </div>
                )}
            </main>

            {assignmentDoc && (
                <AssignDocumentModal 
                    document={assignmentDoc} 
                    onClose={() => setAssignmentDoc(null)} 
                />
            )}
        </div>
    );
};

export default DocumentCenter;
