
import React, { createContext, useReducer, useContext, Dispatch, PropsWithChildren } from 'react';
import { Patient, Appointment, LoggedAction, LedgerEntry, ToothState, ToothStatus, PatientDocument, SimulationState, InsuranceVerification, AuditEntry, MedicalRecord, ToastMessage, Task, PortalMessage, PreAuthorization, InsuranceClaim, RecallType } from '../types';
import { PATIENTS_DATA, APPOINTMENTS_DATA } from '../data/patients';
import { VERIFICATIONS_DATA } from '../data/verifications';
import { MEDICAL_RECORDS_DATA } from '../data/medicalRecords';
import { SANDBOX_TASKS } from '../constants';

type Action =
  | { type: 'SELECT_PATIENT'; payload: number | null }
  | { type: 'ADD_PATIENT'; payload: Patient }
  | { type: 'UPDATE_PATIENT'; payload: Patient }
  | { type: 'DELETE_PATIENT'; payload: number }
  | { type: 'SCHEDULE_APPOINTMENTS'; payload: Appointment[] }
  | { type: 'UPDATE_APPOINTMENT'; payload: Appointment }
  | { type: 'DELETE_APPOINTMENT'; payload: string } 
  | { type: 'CANCEL_APPOINTMENT'; payload: string } 
  | { type: 'ADD_LEDGER_ENTRY'; payload: { patientId: number; entry: Omit<LedgerEntry, 'id' | 'balance'> } }
  | { type: 'UPDATE_CHART'; payload: { patientId: number; toothState: ToothState } }
  | { type: 'BULK_UPDATE_CHART'; payload: { patientId: number; updates: ToothState[] } }
  | { type: 'LOG_ACTION'; payload: { type: string; details: any } }
  | { type: 'ADD_FAMILY_MEMBER'; payload: { patientData: Patient; familyLinkToId: number } }
  | { type: 'ADD_DOCUMENT'; payload: { patientId: number; document: Omit<PatientDocument, 'id'> } }
  | { type: 'ADD_UNASSIGNED_DOCUMENT'; payload: Omit<PatientDocument, 'id'> }
  | { type: 'UPDATE_UNASSIGNED_DOCUMENT'; payload: PatientDocument }
  | { type: 'DELETE_UNASSIGNED_DOCUMENT'; payload: string }
  | { type: 'ASSIGN_DOCUMENT_TO_PATIENT'; payload: { documentId: string; patientId: number; finalDocument: PatientDocument } }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'PIN_APPOINTMENT'; payload: string } 
  | { type: 'WAITLIST_APPOINTMENT'; payload: string } 
  | { type: 'MOVE_APPOINTMENT'; payload: { appointmentId: string; newStartTime: Date; newOperatory: number; source: 'calendar' | 'pinboard' | 'waitlist' } }
  | { type: 'UPDATE_DAY_NOTE'; payload: { date: string; note: string } }
  | { type: 'ADD_VERIFICATION'; payload: InsuranceVerification }
  | { type: 'UPDATE_VERIFICATION'; payload: InsuranceVerification }
  | { type: 'BULK_UPDATE_VERIFICATIONS'; payload: { ids: string[]; changes: Partial<InsuranceVerification> } }
  | { type: 'ADD_MEDICAL_RECORD'; payload: MedicalRecord }
  | { type: 'UPDATE_MEDICAL_RECORD'; payload: MedicalRecord }
  | { type: 'ADD_TOAST'; payload: Omit<ToastMessage, 'id'> }
  | { type: 'REMOVE_TOAST'; payload: string }
  | { type: 'MOVE_PLANNED_TREATMENT'; payload: { patientId: number; sourceToothNumber: number; targetToothNumber: number } }
  | { type: 'TOGGLE_SANDBOX_STEP'; payload: { taskIndex: number; stepIndex: number } }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: { id: string; updates: Partial<Task> } }
  | { type: 'TOGGLE_TASK_COMPLETE'; payload: string }
  | { type: 'MARK_TASK_REMINDED'; payload: string }
  | { type: 'MARK_MESSAGE_READ'; payload: string }
  | { type: 'SEND_PORTAL_REPLY'; payload: { messageId: string; content: string } }
  | { type: 'ADD_PREAUTH'; payload: PreAuthorization }
  | { type: 'ADD_CLAIM'; payload: InsuranceClaim }
  | { type: 'UPDATE_CLAIM'; payload: InsuranceClaim }
  | { type: 'ADD_RECALL_TYPE'; payload: RecallType }
  | { type: 'UPDATE_RECALL_TYPE'; payload: RecallType };

const getPastDate = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
};

const initialState: SimulationState = {
  patients: PATIENTS_DATA,
  appointments: APPOINTMENTS_DATA,
  verifications: VERIFICATIONS_DATA,
  medicalRecords: MEDICAL_RECORDS_DATA,
  tasks: [
      { id: 't1', title: 'Verify benefits for J. Smith', dueDate: new Date(Date.now() + 1000 * 60 * 60).toISOString(), completed: false, reminded: false, priority: 'High' },
      { id: 't2', title: 'Call Lab regarding case #4422', dueDate: new Date(Date.now() + 1000 * 60 * 120).toISOString(), completed: false, reminded: false, priority: 'Medium' },
      { id: 't3', title: "Follow up on patient X's lab results", dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), completed: false, reminded: false, priority: 'High' },
  ],
  portalMessages: [
    { id: 'm1', patientId: 13, subject: 'Pain after SRP', content: 'Hi Dr. Jones, I am still having some lingering sensitivity after my scaling last week. Is this normal?', timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), status: 'Unread', category: 'Medical Question' },
    { id: 'm2', patientId: 41, subject: 'Insurance question', content: 'I received a statement but thought my insurance covered 100%. Can you double check?', timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), status: 'Unread', category: 'Billing' },
    { id: 'm3', patientId: 4, subject: 'Reschedule my extraction', content: 'Something came up for Thursday. Do you have anything next Monday morning instead?', timestamp: new Date(Date.now() - 1000 * 60 * 300).toISOString(), status: 'Unread', category: 'Appointment Request' },
    { id: 'm4', patientId: 6, subject: 'Antibiotic refill', content: 'My pharmacy says the prescription is out of refills. Can you send a new one?', timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(), status: 'Unread', category: 'Refill' },
    { id: 'm5', patientId: 1, subject: 'Thank you!', content: 'Just wanted to say the crown feels great. Thanks for the quick work!', timestamp: new Date(Date.now() - 1000 * 3600 * 24).toISOString(), status: 'Read', category: 'Other' },
  ],
  preAuthorizations: [
      { id: 'PA-1001', patientId: 1, dateSubmitted: getPastDate(15), status: 'Pending', payer: 'MetLife PPO', totalValue: 2100, items: [{ tooth: 13, procedure: 'RCT', fee: 900 }, { tooth: 14, procedure: 'Crown', fee: 1200 }] },
      { id: 'PA-1002', patientId: 4, dateSubmitted: getPastDate(45), status: 'More Info Required', payer: 'Cigna', totalValue: 300, items: [{ tooth: 30, procedure: 'Extraction', fee: 300 }] },
      { id: 'PA-1003', patientId: 6, dateSubmitted: getPastDate(5), status: 'Pending', payer: 'Aetna', totalValue: 900, items: [{ tooth: 18, procedure: 'RCT', fee: 900 }] },
      { id: 'PA-1004', patientId: 2, dateSubmitted: getPastDate(2), status: 'Approved', payer: 'Delta Dental', totalValue: 1200, items: [{ tooth: 2, procedure: 'Crown', fee: 1200 }] },
  ],
  recallTypes: [
    { id: 'r1', shortName: 'PRO', description: 'Adult Prophylaxis', intervalDays: 180, procedureCode: 'D1110' },
    { id: 'r2', shortName: 'PERIO', description: 'Periodontal Maintenance', intervalDays: 90, procedureCode: 'D4910' },
    { id: 'r3', shortName: 'BWX', description: 'Bite-Wings X-Ray', intervalDays: 365, procedureCode: 'D0274' },
    { id: 'r4', shortName: 'EXAM', description: 'Periodic Oral Exam', intervalDays: 180, procedureCode: 'D0120' },
  ],
  claims: [
      { 
        id: 'CLM-001', 
        patientId: 6, 
        dateCreated: getPastDate(5), 
        status: 'Sent', 
        carrier: 'Aetna', 
        totalAmount: 1200, 
        procedureIds: ['l6-1'], 
        diagnosticCodes: [],
        statusHistory: [{ date: getPastDate(5), status: 'Sent' }],
        attachments: { 
          images: [], 
          perioChartAttached: false, 
          photoAttached: false, 
          txPlanAttached: false 
        } 
      }
  ],
  selectedPatientId: 1,
  actions: [],
  history: {
    past: [],
    future: [],
  },
  pinboardAppointments: [],
  waitlistAppointments: [],
  unassignedDocuments: [
    { id: 'un1', name: 'MRI_Brain_Angio_Scan.jpg', category: 'Imaging (MRI/CT)', uploadDate: '2025-11-20', previewUrl: 'https://picsum.photos/seed/mri1/400/600', source: 'Scan', notes: 'MRI of head/neck for TMJ pathology assessment.' },
    { id: 'un2', name: 'Fax_Hospital_Discharge_Summary.pdf', category: 'Medical Records', uploadDate: '2025-11-21', previewUrl: 'https://picsum.photos/seed/hosp1/400/600', source: 'Fax', notes: 'Patient hospitalized for hypertensive crisis last week.' },
    { id: 'un3', name: 'Rx_Refill_Request_Amox_500.pdf', category: 'Prescriptions', uploadDate: '2025-11-21', previewUrl: 'https://picsum.photos/seed/rx1/400/600', source: 'Fax', notes: 'Pharmacy requesting refill for pre-medication.' },
    { id: 'un4', name: 'Lab_Results_Pathology_Biopsy.pdf', category: 'Lab Results', uploadDate: '2025-11-22', previewUrl: 'https://picsum.photos/seed/labres1/400/600', source: 'Upload', notes: 'Pathology report from incisional biopsy #14.' },
    { id: 'un5', name: 'CT_Scan_Mandible_Implant.jpg', category: 'Imaging (MRI/CT)', uploadDate: '2025-11-22', previewUrl: 'https://picsum.photos/seed/ct1/400/600', source: 'Scan', notes: 'Cone beam CT for implant site #30 planning.' },
    { id: 'un6', name: 'Medical_Clearance_Cardiac.pdf', category: 'Medical Records', uploadDate: '2025-11-23', previewUrl: 'https://picsum.photos/seed/clear1/400/600', source: 'Fax', notes: 'Clearance from cardiologist for sedation surgery.' },
    { id: 'un7', name: 'Lab_Blood_Panel_CBC.pdf', category: 'Lab Results', uploadDate: '2025-11-23', previewUrl: 'https://picsum.photos/seed/cbc1/400/600', source: 'Fax', notes: 'Routine CBC panel received for upcoming full mouth ext.' },
    { id: 'un8', name: 'Fax_Referral_Form_Endo.pdf', category: 'Referral', uploadDate: '2025-11-23', previewUrl: 'https://picsum.photos/seed/ref1/400/600', source: 'Fax', notes: 'Referral for root canal treatment on #19.' },
    { id: 'un9', name: 'Ins_Card_MetLife_Scanned.jpg', category: 'Insurance', uploadDate: '2025-11-24', previewUrl: 'https://picsum.photos/seed/ins1/400/300', source: 'Scan', notes: 'New insurance card provided at front desk.' },
    { id: 'un10', name: 'Consent_General_Anesthesia.pdf', category: 'Consent Forms', uploadDate: '2025-11-24', previewUrl: 'https://picsum.photos/seed/cons1/400/600', source: 'Scan', notes: 'Signed consent form for IV sedation.' },
    { id: 'un11', name: 'Rx_New_Lisinopril_10mg.pdf', category: 'Prescriptions', uploadDate: '2025-11-25', previewUrl: 'https://picsum.photos/seed/rx2/400/600', source: 'Upload', notes: 'Copy of new BP medication for medical history update.' },
    { id: 'un12', name: 'Hospital_ER_Report_Trauma.pdf', category: 'Medical Records', uploadDate: '2025-11-25', previewUrl: 'https://picsum.photos/seed/er1/400/600', source: 'Fax', notes: 'ER report following facial trauma incident.' },
    { id: 'un13', name: 'Lab_Path_Cytology_Brush.pdf', category: 'Lab Results', uploadDate: '2025-11-26', previewUrl: 'https://picsum.photos/seed/lab2/400/600', source: 'Upload', notes: 'Brush biopsy results for buccal mucosa lesion.' },
    { id: 'un14', name: 'MRI_TMJ_Closed_Mouth.jpg', category: 'Imaging (MRI/CT)', uploadDate: '2025-11-26', previewUrl: 'https://picsum.photos/seed/mri2/400/600', source: 'Scan', notes: 'MRI showing disc displacement with reduction.' },
    { id: 'un15', name: 'Fax_ID_License_Torres.jpg', category: 'Identification', uploadDate: '2025-11-27', previewUrl: 'https://picsum.photos/seed/id1/400/300', source: 'Fax', notes: 'Copy of driver license for verification.' },
  ],
  dayNotes: {},
  toasts: [],
  completedSandboxTasks: SANDBOX_TASKS.reduce((acc, task, index) => {
    acc[index] = Array(task.steps.length).fill(false);
    return acc;
  }, {} as Record<number, boolean[]>),
};

function simulationReducer(state: SimulationState, action: Action): SimulationState {
  const isUndoableAction = action.type === 'UPDATE_PATIENT' || action.type === 'UPDATE_CHART' || action.type === 'BULK_UPDATE_CHART';
  
  if (isUndoableAction) {
    const newPast = [...state.history.past, state.patients];
    let newPatients: Patient[];

    switch (action.type) {
      case 'UPDATE_PATIENT':
        newPatients = state.patients.map(p => p.id === action.payload.id ? action.payload : p);
        break;
      
      case 'UPDATE_CHART': {
        const { patientId, toothState } = action.payload;
        newPatients = state.patients.map(p => {
            if (p.id === patientId) {
                const chart = [...p.chart];
                const toothIndex = chart.findIndex(t => t.toothNumber === toothState.toothNumber);
                const isToothEffectivelyHealthy = toothState.status === ToothStatus.Healthy && !toothState.notes && !toothState.procedure;
                if (toothIndex > -1) {
                    if (isToothEffectivelyHealthy) chart.splice(toothIndex, 1);
                    else chart[toothIndex] = toothState;
                } else if (!isToothEffectivelyHealthy) {
                    chart.push(toothState);
                }
                return { ...p, chart };
            }
            return p;
        });
        break;
      }
      case 'BULK_UPDATE_CHART': {
        const { patientId, updates } = action.payload;
        newPatients = state.patients.map(p => {
            if (p.id === patientId) {
                let chart = [...p.chart];
                updates.forEach(toothState => {
                    const toothIndex = chart.findIndex(t => t.toothNumber === toothState.toothNumber);
                    const isToothEffectivelyHealthy = toothState.status === ToothStatus.Healthy && !toothState.notes && !toothState.procedure;
                    if (toothIndex > -1) {
                        if (isToothEffectivelyHealthy) chart.splice(toothIndex, 1);
                        else chart[toothIndex] = toothState;
                    } else if (!isToothEffectivelyHealthy) {
                        chart.push(toothState);
                    }
                });
                chart = chart.filter(t => !(t.status === ToothStatus.Healthy && !t.notes && !t.procedure));
                return { ...p, chart };
            }
            return p;
        });
        break;
      }
    }
    return { ...state, patients: newPatients!, history: { past: newPast, future: [] } };
  }

  switch (action.type) {
    case 'UNDO': {
      if (state.history.past.length === 0) return state;
      const previousPatients = state.history.past[state.history.past.length - 1];
      const newPast = state.history.past.slice(0, state.history.past.length - 1);
      return { ...state, patients: previousPatients, history: { past: newPast, future: [state.patients, ...state.history.future] } };
    }
    case 'REDO': {
      if (state.history.future.length === 0) return state;
      const nextPatients = state.history.future[0];
      const newFuture = state.history.future.slice(1);
      return { ...state, patients: nextPatients, history: { past: [...state.history.past, state.patients], future: newFuture } };
    }
    case 'SELECT_PATIENT':
      return { ...state, selectedPatientId: action.payload };
    case 'ADD_PATIENT': {
      const nextId = Math.max(...state.patients.map(p => p.id), 0) + 1;
      const newPatient = { ...action.payload, id: nextId };
      return { ...state, patients: [...state.patients, newPatient], selectedPatientId: newPatient.id, history: { past: [], future: [] } };
    }
    case 'ADD_FAMILY_MEMBER': {
      const { patientData, familyLinkToId } = action.payload;
      const nextId = Math.max(...state.patients.map(p => p.id), 0) + 1;
      
      const linkingPerson = state.patients.find(p => p.id === familyLinkToId);
      const existingFamilyIds = linkingPerson ? linkingPerson.familyMemberIds || [] : [];
      
      const fullExistingFamilySet = new Set([...existingFamilyIds, familyLinkToId]);
      const newMemberFamilyList = Array.from(fullExistingFamilySet);

      const newPatient: Patient = { 
        ...patientData, 
        id: nextId, 
        familyMemberIds: newMemberFamilyList 
      };

      const updatedPatients = state.patients.map(p => {
        if (fullExistingFamilySet.has(p.id)) {
            return { 
                ...p, 
                familyMemberIds: Array.from(new Set([...(p.familyMemberIds || []), nextId]))
            };
        }
        return p;
      });

      return { 
        ...state, 
        patients: [...updatedPatients, newPatient], 
        selectedPatientId: nextId, 
        history: { past: [], future: [] } 
      };
    }
    case 'DELETE_PATIENT': {
        const patientIdToDelete = action.payload;
        const updatedPatients = state.patients.filter(p => p.id !== patientIdToDelete);
        const finalPatients = updatedPatients.map(p => p.familyMemberIds.includes(patientIdToDelete) ? { ...p, familyMemberIds: p.familyMemberIds.filter(id => id !== patientIdToDelete) } : p);
        return { ...state, patients: finalPatients, appointments: state.appointments.filter(a => a.patientId !== patientIdToDelete), pinboardAppointments: state.pinboardAppointments.filter(a => a.patientId !== patientIdToDelete), waitlistAppointments: state.waitlistAppointments.filter(a => a.patientId !== patientIdToDelete), selectedPatientId: null, history: { past: [], future: [] } };
    }
    case 'SCHEDULE_APPOINTMENTS':
      return { ...state, appointments: [...state.appointments, ...action.payload] };
    case 'UPDATE_APPOINTMENT':
      return { ...state, appointments: state.appointments.map(apt => apt.id === action.payload.id ? action.payload : apt) };
    case 'DELETE_APPOINTMENT':
      return { ...state, appointments: state.appointments.filter(apt => apt.id !== action.payload), pinboardAppointments: state.pinboardAppointments.filter(apt => apt.id !== action.payload), waitlistAppointments: state.waitlistAppointments.filter(apt => apt.id !== action.payload) };
    case 'CANCEL_APPOINTMENT':
      return { ...state, appointments: state.appointments.filter(apt => apt.id !== action.payload), pinboardAppointments: state.pinboardAppointments.filter(apt => apt.id !== action.payload), waitlistAppointments: state.waitlistAppointments.filter(apt => apt.id !== action.payload), actions: [...state.actions, { type: 'cancel_appointment', timestamp: new Date(), details: { id: action.payload } }] };
    case 'ADD_LEDGER_ENTRY': {
        const { patientId, entry } = action.payload;
        const newPatients = state.patients.map(p => {
            if (p.id === patientId) {
                const newEntryWithId: LedgerEntry = { ...entry, id: `l${p.ledger.length + 1}-${Date.now()}`, balance: 0 };
                const sortedLedger = [...p.ledger, newEntryWithId].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                let runningBalance = 0;
                const finalLedgerWithBalance = sortedLedger.map(e => {
                    runningBalance += e.charge - e.payment - e.writeOff;
                    return { ...e, balance: runningBalance };
                });
                return { ...p, ledger: finalLedgerWithBalance };
            }
            return p;
        });
        return { ...state, patients: newPatients, history: { past: [], future: [] } };
    }
    case 'ADD_DOCUMENT': {
        const { patientId, document } = action.payload;
        const newPatients = state.patients.map(p => p.id === patientId ? { ...p, documents: [{ ...document, id: `d${p.documents.length + 1}-${Date.now()}` }, ...p.documents] } : p);
        return { ...state, patients: newPatients, history: { past: [], future: [] } };
    }
    case 'ADD_UNASSIGNED_DOCUMENT':
        return { ...state, unassignedDocuments: [{ ...action.payload, id: `un${Date.now()}` }, ...state.unassignedDocuments] };
    case 'UPDATE_UNASSIGNED_DOCUMENT':
        return { ...state, unassignedDocuments: state.unassignedDocuments.map(d => d.id === action.payload.id ? action.payload : d) };
    case 'DELETE_UNASSIGNED_DOCUMENT':
        return { ...state, unassignedDocuments: state.unassignedDocuments.filter(d => d.id !== action.payload) };
    case 'ASSIGN_DOCUMENT_TO_PATIENT': {
        const { documentId, patientId, finalDocument } = action.payload;
        const newPatients = state.patients.map(p => p.id === patientId ? { ...p, documents: [finalDocument, ...p.documents] } : p);
        return { ...state, patients: newPatients, unassignedDocuments: state.unassignedDocuments.filter(d => d.id !== documentId) };
    }
    case 'PIN_APPOINTMENT': {
      const appointmentToPin = state.appointments.find(a => a.id === action.payload);
      if (!appointmentToPin || state.pinboardAppointments.some(a => a.id === action.payload)) return state;
      return { ...state, appointments: state.appointments.filter(a => a.id !== action.payload), pinboardAppointments: [...state.pinboardAppointments, appointmentToPin] };
    }
    case 'WAITLIST_APPOINTMENT': {
      const appointmentToWaitlist = state.appointments.find(a => a.id === action.payload);
      if (!appointmentToWaitlist || state.waitlistAppointments.some(a => a.id === action.payload)) return state;
      return { ...state, appointments: state.appointments.filter(a => a.id !== action.payload), waitlistAppointments: [...state.waitlistAppointments, appointmentToWaitlist] };
    }
    case 'MOVE_APPOINTMENT': {
      const { appointmentId, newStartTime, newOperatory: newOperatory, source } = action.payload;
      if (source === 'calendar') {
        return { ...state, appointments: state.appointments.map(a => a.id === appointmentId ? { ...a, startTime: newStartTime, operatory: newOperatory } : a) };
      } else if (source === 'pinboard') {
        const appointmentToMove = state.pinboardAppointments.find(a => a.id === appointmentId);
        if (!appointmentToMove) return state;
        return { ...state, appointments: [...state.appointments, { ...appointmentToMove, startTime: newStartTime, operatory: newOperatory }], pinboardAppointments: state.pinboardAppointments.filter(a => a.id !== appointmentId) };
      } else {
        const appointmentToMove = state.waitlistAppointments.find(a => a.id === appointmentId);
        if (!appointmentToMove) return state;
        return { ...state, appointments: [...state.appointments, { ...appointmentToMove, startTime: newStartTime, operatory: newOperatory }], waitlistAppointments: state.waitlistAppointments.filter(a => a.id !== appointmentId) };
      }
    }
    case 'MOVE_PLANNED_TREATMENT': {
        const { patientId, sourceToothNumber, targetToothNumber } = action.payload;
        const newPatients = state.patients.map(p => {
            if (p.id === patientId) {
                const sourceTooth = p.chart.find(t => t.toothNumber === sourceToothNumber);
                if (!sourceTooth || sourceTooth.status !== ToothStatus.TreatmentPlanned) return p;
                const chartWithoutSourceAndTarget = p.chart.filter(t => t.toothNumber !== sourceToothNumber && t.toothNumber !== targetToothNumber);
                const updatedChart = [...chartWithoutSourceAndTarget, { ...sourceTooth, toothNumber: targetToothNumber }];
                return { ...p, chart: updatedChart };
            }
            return p;
        });
        return { ...state, patients: newPatients, history: { past: [], future: [] } };
    }
    case 'UPDATE_DAY_NOTE': {
      const { date, note } = action.payload;
      const newDayNotes = { ...state.dayNotes };
      if (note.trim()) newDayNotes[date] = note;
      else delete newDayNotes[date];
      return { ...state, dayNotes: newDayNotes };
    }
    case 'ADD_VERIFICATION':
        return { ...state, verifications: [...state.verifications, action.payload] };
    case 'UPDATE_VERIFICATION':
        return { ...state, verifications: state.verifications.map(v => v.id === action.payload.id ? action.payload : v) };
    case 'BULK_UPDATE_VERIFICATIONS': {
        const { ids, changes } = action.payload;
        const idSet = new Set(ids);
        return { ...state, verifications: state.verifications.map(v => idSet.has(v.id) ? { ...v, ...changes } : v) };
    }
    case 'ADD_MEDICAL_RECORD':
        return { ...state, medicalRecords: [action.payload, ...state.medicalRecords] };
    case 'UPDATE_MEDICAL_RECORD':
        return { ...state, medicalRecords: state.medicalRecords.map(r => r.id === action.payload.id ? action.payload : r) };
    case 'LOG_ACTION':
      return { ...state, actions: [...state.actions, { ...action.payload, timestamp: new Date() }] };
    case 'ADD_TOAST':
      return { ...state, toasts: [...state.toasts, { ...action.payload, id: `toast-${Date.now()}` }] };
    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter(t => t.id !== action.payload) };
    case 'TOGGLE_SANDBOX_STEP': {
        const { taskIndex, stepIndex } = action.payload;
        const newCompletedTasks = { ...state.completedSandboxTasks };
        const taskSteps = [...(newCompletedTasks[taskIndex] || [])];
        taskSteps[stepIndex] = !taskSteps[stepIndex];
        newCompletedTasks[taskIndex] = taskSteps;
        return { ...state, completedSandboxTasks: newCompletedTasks };
    }
    case 'ADD_TASK':
        return { ...state, tasks: [...state.tasks, action.payload] };
    case 'UPDATE_TASK':
        return { ...state, tasks: state.tasks.map(t => t.id === action.payload.id ? { ...t, ...action.payload.updates } : t) };
    case 'TOGGLE_TASK_COMPLETE':
        return { ...state, tasks: state.tasks.map(t => t.id === action.payload ? { ...t, completed: !t.completed } : t) };
    case 'MARK_TASK_REMINDED':
        return { ...state, tasks: state.tasks.map(t => t.id === action.payload ? { ...t, reminded: true } : t) };
    case 'MARK_MESSAGE_READ':
        return { ...state, portalMessages: state.portalMessages.map(m => m.id === action.payload ? { ...m, status: 'Read' } : m) };
    case 'SEND_PORTAL_REPLY': {
        const { messageId, content } = action.payload;
        return {
            ...state,
            portalMessages: state.portalMessages.map(m => m.id === messageId ? { ...m, status: 'Processed', replyContent: content, replyTimestamp: new Date().toISOString() } : m)
        };
    }
    case 'ADD_PREAUTH':
        return { ...state, preAuthorizations: [...state.preAuthorizations, action.payload] };
    case 'ADD_CLAIM': {
        const { procedureIds, id } = action.payload;
        const updatedPatients = state.patients.map(p => {
            if (p.id === action.payload.patientId) {
                const newLedger = p.ledger.map(entry => 
                    procedureIds.includes(entry.id) ? { ...entry, claimId: id } : entry
                );
                return { ...p, ledger: newLedger };
            }
            return p;
        });
        return { ...state, claims: [...state.claims, action.payload], patients: updatedPatients };
    }
    case 'UPDATE_CLAIM':
        return { ...state, claims: state.claims.map(c => c.id === action.payload.id ? action.payload : c) };
    case 'ADD_RECALL_TYPE':
        return { ...state, recallTypes: [...state.recallTypes, action.payload] };
    case 'UPDATE_RECALL_TYPE':
        return { ...state, recallTypes: state.recallTypes.map(r => r.id === action.payload.id ? action.payload : r) };
    default:
      return state;
  }
}

export const SimulationContext = createContext<{ state: SimulationState; dispatch: Dispatch<Action> } | undefined>(undefined);

export const SimulationProvider = ({ children }: PropsWithChildren<{}>) => {
  const [state, dispatch] = useReducer(simulationReducer, initialState);
  return <SimulationContext.Provider value={{ state, dispatch }}>{children}</SimulationContext.Provider>;
};

export const useSimulationContext = () => {
  const context = useContext(SimulationContext);
  if (context === undefined) throw new Error('useSimulationContext must be used within a SimulationProvider');
  return context;
};
