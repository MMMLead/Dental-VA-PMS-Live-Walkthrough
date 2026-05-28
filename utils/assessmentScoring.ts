
import { SimulationState, ToothStatus } from '../types';
import { SANDBOX_TASKS } from '../constants';

export interface StepResult {
  completed: boolean;
  feedback?: string;
}

export interface ModuleResult {
  title: string;
  steps: StepResult[];
  score: number;
  totalSteps: number;
}

export interface AssessmentResult {
  modules: ModuleResult[];
  totalScore: number;
  totalSteps: number;
  passed: boolean;
}

export const calculateAssessmentScore = (state: SimulationState): AssessmentResult => {
  const results: ModuleResult[] = [];

  // --- Module 1: Advanced Record & Task Mgmt ---
  const m1Steps: StepResult[] = [
    // 1. Task Creation: Call Dr. Jones
    { completed: state.tasks.some(t => t.title.toLowerCase().includes('dr. jones') && t.title.toLowerCase().includes('refill')) },
    // 2. Task Priority/Due: High priority OR due today
    { completed: state.tasks.some(t => (t.priority === 'High' || new Date(t.dueDate).getDate() === new Date().getDate()) && t.title.toLowerCase().includes('dr. jones')) },
    // 3. Search & Verify: Find 'White, Emily' (ID 6)
    { completed: state.selectedPatientId === 6 },
    // 4. Verify Insurance: Secondary Active
    { completed: state.patients.find(p => p.id === 6)?.secondaryInsurance?.isActive === true },
    // 5. Medical Records Nav
    { completed: state.actions.some(a => a.type === 'navigate_module' && a.details?.module === 'Medical Records' && state.selectedPatientId === 6) },
    // 6. Filter Data: 'Finalized'
    { completed: state.actions.some(a => a.type === 'filter_medical_records' && a.details?.status === 'Finalized') },
    // 7. Switch Patient: 'Brown, Michael' (ID 7)
    { completed: state.selectedPatientId === 7 },
    // 8. Ledger Nav
    { completed: state.actions.some(a => a.type === 'navigate_module' && a.details?.module === 'Ledger' && state.selectedPatientId === 7) },
    // 9. Filter Ledger: 'Payments'
    { completed: state.actions.some(a => a.type === 'filter_ledger' && a.details?.type === 'payments') },
    // 10. Switch Patient: 'Miller, David' (ID 9)
    { completed: state.selectedPatientId === 9 },
    // 11. Insurance Workflow Nav
    { completed: state.actions.some(a => a.type === 'navigate_module' && a.details?.module === 'Insurance Verifications') },
    // 12. Filter Worklist: 'Awaiting Docs'
    { completed: state.actions.some(a => a.type === 'filter_verifications' && a.details?.status === 'Awaiting Docs') },
    // 13. Chart Nav
    { completed: state.actions.some(a => a.type === 'navigate_module' && a.details?.module === 'Chart' && state.selectedPatientId === 9) },
    // 14. Clinical Check: Chart tooth #9 missing
    { completed: state.patients.find(p => p.id === 9)?.chart.some(t => t.toothNumber === 9 && t.status === ToothStatus.Missing) || false },
    // 15. Document Access
    { completed: state.actions.some(a => a.type === 'view_document') && state.selectedPatientId === 9 },
  ];

  // --- Module 2: Intake & Profile Mastery ---
  const emily = state.patients.find(p => p.firstName === 'Emily' && p.lastName === 'Rose');
  const jack = state.patients.find(p => p.firstName === 'Jack' && p.lastName === 'Rose');
  
  const m2Steps: StepResult[] = [
    // 1. Create 'Emily Rose'
    { completed: !!emily },
    // 2. Demographics
    { completed: !!emily && emily.dob === '1990-02-15' && emily.gender === 'Female' && emily.phone === '555-0101' },
    // 3. Address
    { completed: !!emily && emily.address.includes('101 Flower') },
    // 4. Referral Source: Google Search
    { completed: !!emily && emily.referralSource === 'Google Search' },
    // 5. Employer: Tech Corp
    { completed: !!emily && emily.employer === 'Tech Corp' },
    // 6. Primary Ins: MetLife...
    { completed: !!emily && emily.primaryInsurance?.company.includes('MetLife') && emily.primaryInsurance?.policyNumber === 'POL-9988' },
    // 7. Ins Details
    { completed: !!emily && Number(emily.primaryInsurance?.coverage) === 2000 && Number(emily.primaryInsurance?.deductible) === 50 },
    // 8. Medical History
    { completed: !!emily && emily.medicalHistory.some(h => h.toLowerCase().includes('asthma')) },
    // 9. Medical Alert
    { completed: !!emily && emily.medicalAlerts.some(a => a.toLowerCase().includes('inhaler')) },
    // 10. Photo
    { completed: !!emily && !!emily.photoUrl },
    // 11. Add Spouse Jack
    { completed: !!jack },
    // 12. Address Link
    { completed: !!jack && jack.address === emily?.address },
    // 13. Jack Ins
    { completed: !!jack && !!jack.primaryInsurance },
    // 14. Select Emily
    { completed: state.selectedPatientId === emily?.id },
    // 15. Alert Check (Implicit if selected)
    { completed: state.selectedPatientId === emily?.id && emily.medicalAlerts.length > 0 },
  ];

  // --- Module 3: Advanced Scheduling ---
  const m3Steps: StepResult[] = [
    // 1. Navigate Appointment Book
    { completed: state.actions.some(a => a.type === 'navigate_module' && a.details?.module === 'Appointment Book') },
    // 2. Book Garcia Recurring: Check for recurring ID or multiple appts
    { completed: state.appointments.filter(a => a.patientId === 48 && a.operatory === 1 && a.startTime.getUTCHours() === 8).length > 1 || state.appointments.some(a => a.patientId === 48 && !!a.recurringId) },
    // 3. Book Sofia
    { completed: state.appointments.some(a => a.patientId === 3 && a.operatory === 5 && a.startTime.getUTCHours() === 9) },
    // 4. Book John
    { completed: state.appointments.some(a => a.patientId === 4 && a.operatory === 7 && a.startTime.getUTCHours() === 11) },
    // 5. John Type Emergency
    { completed: state.appointments.some(a => a.patientId === 4 && a.appointmentType === 'Emergency') },
    // 6. John Status FIRM
    { completed: state.appointments.some(a => a.patientId === 4 && a.status === 'FIRM') },
    // 7. John Note Pain
    { completed: state.appointments.some(a => a.patientId === 4 && a.notes?.toLowerCase().includes('pain')) },
    // 8. Book Overlap Lucas
    { completed: state.appointments.some(a => a.patientId === 49 && a.operatory === 7 && a.startTime.getUTCHours() === 14) },
    // 9. Reschedule Amelia (ID 52) to 2026-03-25
    { completed: state.appointments.some(a => a.patientId === 52 && a.startTime.getFullYear() === 2026 && a.startTime.getMonth() === 2 && a.startTime.getDate() === 25) },
    // 10. Pinboard Patricia
    { completed: state.actions.some(a => a.type === 'pin_appointment') || state.pinboardAppointments.some(a => a.patientId === 12) },
    // 11. Place Patricia 4pm OP-2
    { completed: state.appointments.some(a => a.patientId === 12 && a.operatory === 2 && a.startTime.getUTCHours() === 16) },
    // 12. Book Emily 4pm OP-3
    { completed: state.appointments.some(a => a.patientId === 6 && a.operatory === 3 && a.startTime.getUTCHours() === 16) },
    // 13. Multi-Provider Michael
    { completed: state.appointments.some(a => a.patientId === 7 && a.additionalProvider === 'Hygienist A') },
    // 14. Delete Appointment
    { completed: state.actions.some(a => a.type === 'delete_appointment') },
    // 15. Verify (Freebie if others done)
    { completed: true },
  ];

  // --- Module 4: Financials & Clinical ---
  const m4Steps: StepResult[] = [
    // 1. Select Jennifer
    { completed: state.selectedPatientId === 41 },
    // 2. Nav Ledger
    { completed: state.actions.some(a => a.type === 'navigate_module' && a.details?.module === 'Ledger' && state.selectedPatientId === 41) },
    // 3. Post Payment $100
    { completed: state.patients.find(p => p.id === 41)?.ledger.some(l => l.payment === 100) || false },
    // 4. Add Charge Nitrous
    { completed: state.patients.find(p => p.id === 41)?.ledger.some(l => l.description.includes('Nitrous') || l.charge === 50) || false },
    // 5. Write-off $10
    { completed: state.patients.find(p => p.id === 41)?.ledger.some(l => l.writeOff === 10) || false },
    // 6. Create Claim (Action Log)
    { completed: state.actions.some(a => a.type === 'send_insurance_claim' && a.details?.patientId === 41) },
    // 7. Attachments (Action Log check)
    { completed: state.actions.some(a => a.type === 'send_insurance_claim' && a.details?.patientId === 41 && a.details?.attachments?.xray && a.details?.attachments?.narrative) },
    // 8. Send Electronically
    { completed: state.actions.some(a => a.type === 'send_insurance_claim' && a.details?.patientId === 41 && a.details?.method === 'Send Electronically') },
    // 9. Select Robert
    { completed: state.selectedPatientId === 72 },
    // 10. Nav Chart
    { completed: state.actions.some(a => a.type === 'navigate_module' && a.details?.module === 'Chart' && state.selectedPatientId === 72) },
    // 11. Single Edit #4
    { completed: !!state.patients.find(p => p.id === 72)?.chart.some(t => t.toothNumber === 4 && t.status === 'Existing') },
    // 12. Note #4
    { completed: !!state.patients.find(p => p.id === 72)?.chart.some(t => t.toothNumber === 4 && t.notes?.toLowerCase().includes('cracks')) },
    // 13. Multi-Select / Bulk Edit (Log or State)
    { completed: state.actions.some(a => a.type === 'bulk_update_chart' && a.details?.patientId === 72) },
    // 14. Teeth 8 & 9 updated
    { completed: state.patients.find(p => p.id === 72)?.chart.filter(t => (t.toothNumber === 8 || t.toothNumber === 9) && t.status === 'Treatment Planned').length === 2 },
    // 15. David Miller Insurance
    { completed: state.verifications.some(v => v.patientId === 9 && v.status === 'In Progress') },
  ];

  results.push({ title: SANDBOX_TASKS[0].title, steps: m1Steps, score: m1Steps.filter(s => s.completed).length, totalSteps: 15 });
  results.push({ title: SANDBOX_TASKS[1].title, steps: m2Steps, score: m2Steps.filter(s => s.completed).length, totalSteps: 15 });
  results.push({ title: SANDBOX_TASKS[2].title, steps: m3Steps, score: m3Steps.filter(s => s.completed).length, totalSteps: 15 });
  results.push({ title: SANDBOX_TASKS[3].title, steps: m4Steps, score: m4Steps.filter(s => s.completed).length, totalSteps: 15 });

  const totalScore = results.reduce((acc, r) => acc + r.score, 0);
  const totalSteps = results.reduce((acc, r) => acc + r.totalSteps, 0);
  
  return {
    modules: results,
    totalScore,
    totalSteps,
    passed: (totalScore / totalSteps) >= 0.8
  };
};
