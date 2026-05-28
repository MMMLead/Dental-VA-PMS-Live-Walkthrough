
export enum Module {
  Dashboard = "Dashboard",
  AppointmentBook = "Appointment Book",
  FamilyFile = "Family File",
  Ledger = "Ledger",
  OfficeManager = "Office Manager",
  Chart = "Chart",
  TreatmentPlanner = "Treatment Planner",
  DocumentCenter = "Document Center",
  InsuranceVerifications = "Insurance Verifications",
  MedicalRecords = "Medical Records",
  Portal = "Patient Portal",
  InsurancePortal = "Insurance Portal"
}

export interface Insurance {
  company: string;
  plan: string;
  groupNumber: string;
  policyNumber: string;
  subscriberId: string;
  relationship: 'Self' | 'Spouse' | 'Child';
  isActive: boolean;
  policyEffectiveDate: string;
  coverage: number; 
  used: number; 
  deductible: number;
  met: number; 
  coveragePercentage?: number; 
}

export interface LedgerEntry {
  id: string;
  date: string;
  code: string;
  description: string;
  charge: number;
  payment: number;
  writeOff: number;
  balance: number;
  paymentType?: 'Credit Card' | 'Check' | 'Cash';
  claimId?: string; // Link to an InsuranceClaim
}

export enum ToothStatus {
  Healthy = 'Healthy',
  Completed = 'Completed',
  TreatmentPlanned = 'Treatment Planned',
  Existing = 'Existing',
  Restorative = 'Restorative',
  Missing = 'Missing'
}

export interface ToothState {
  toothNumber: number;
  status: ToothStatus;
  surface?: string;
  notes?: string;
  procedure?: 'Crown' | 'Composite Filling' | 'Amalgam Filling' | 'Bridge Abutment' | string;
  fee?: number;
}

export interface PatientDocument {
  id: string;
  name: string;
  category: 'Consent Forms' | 'X-Rays' | 'Imaging (MRI/CT)' | 'Lab Results' | 'Medical Records' | 'Prescriptions' | 'Insurance' | 'Identification' | 'Referral' | 'Miscellaneous';
  uploadDate: string;
  previewUrl: string;
  source?: 'Scan' | 'Fax' | 'Upload';
  notes?: string;
}

export interface Appointment {
  id:string;
  patientId: number;
  startTime: Date;
  duration: number; 
  operatory: number;
  provider: string;
  treatment: string;
  procedureCode?: string;
  providerCode?: string;
  statusText?: string;
  color: string;
  notes?: string;
  hasNote?: boolean;
  insuranceEligibility?: 'verified' | 'pending' | 'issue';
  primaryInsuranceId?: string; 
  secondaryInsuranceId?: string; 
  labCase?: 'sent' | 'received';
  isNewPatient?: boolean;
  additionalProvider?: string;
  appointmentType?: string; 
  scheduleType?: string; 
  status?: 'FIRM' | string;
  fee?: number;
  recurringId?: string;
  isBlock?: boolean;
  blockReason?: string;
}

export type FamilyRelationship = 'Head of Household' | 'Spouse' | 'Child' | 'Other Dependent' | 'Other';

export type PatientStatus = 'Active' | 'Inactive' | 'Archived' | 'Deceased';

export interface PreAuthorization {
  id: string;
  patientId: number;
  dateSubmitted: string;
  status: 'Pending' | 'Approved' | 'Denied' | 'More Info Required';
  payer: string;
  totalValue: number;
  items: { tooth: number; procedure: string; fee: number }[];
}

export interface ClaimStatusEntry {
  date: string;
  status: string;
}

export interface InsuranceClaim {
  id: string;
  patientId: number;
  dateCreated: string;
  status: 'Pending' | 'Sent' | 'Paid' | 'Rejected' | 'Partially Paid';
  carrier: string;
  totalAmount: number;
  procedureIds: string[];
  submissionMethod?: 'Electronic' | 'Paper';
  renderingProvider?: string;
  billingProvider?: string;
  payToProvider?: string;
  subscriber?: string;
  employer?: string;
  groupPlan?: string;
  payorId?: string;
  claimInformation?: string;
  diagnosticCodes: string[];
  statusHistory: ClaimStatusEntry[];
  attachments: {
    images: { name: string; type: string; url: string }[];
    narrative?: string;
    perioChartAttached: boolean;
    photoAttached: boolean;
    txPlanAttached: boolean;
  };
}

export interface RecallType {
  id: string;
  shortName: string;
  description: string;
  intervalDays: number;
  procedureCode: string;
}

export interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  middleInitial?: string;
  nickname?: string;
  dob: string;
  gender: 'Male' | 'Female' | 'Other';
  status: PatientStatus;
  statusNotes?: string;
  address: string;
  phone: string;
  workPhone?: string;
  email: string;
  familyMemberIds: number[];
  familyRelationship?: FamilyRelationship;
  poaName?: string;
  poaPhone?: string;
  poaRelationship?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  reminderMethod: 'Email' | 'SMS' | 'Call' | 'None';
  automationActive: boolean;
  sendConfirmation14Days: boolean;
  sendReminder2Days: boolean;
  sendFollowUpOnCancel: boolean;
  medicalHistory: string[];
  medications: string[];
  surgicalHistory: string[];
  socialHistory: string[];
  medicalAlerts: string[];
  medicalAlertsNotes?: string;
  patientAlerts?: string[];
  dentalHistory: string[];
  lastPerioExamDate?: string;
  lastRadiographDate?: string;
  primaryInsurance?: Insurance;
  secondaryInsurance?: Insurance;
  ledger: LedgerEntry[];
  chart: ToothState[];
  documents: PatientDocument[];
  photoUrl?: string;
  referralSource?: string;
  employer?: string;
  firstVisitDate?: string;
  lastVisitDate?: string;
  chartNumber?: string;
  eligibilityStatus?: string;
  eligibilityExpiration?: string;
  referredBy?: string;
}

export type LoggedAction = {
  type: string;
  timestamp: Date;
  details: any;
};

export type VerificationStatus = 'To Verify' | 'In Progress' | 'Approved' | 'Denied' | 'Needs Follow-up' | 'Awaiting Docs';
export type PlanType = 'PPO' | 'HMO' | 'EPO' | 'Indemnity' | 'Medicaid' | 'Medicare' | 'Other';
export type PrimaryOrSecondary = 'Primary' | 'Secondary';
export type RelationshipToSubscriber = 'Self' | 'Spouse' | 'Child' | 'Other';
export type VerificationMethod = 'Portal' | 'Call' | 'Fax' | 'EDI';

export interface AuditEntry {
  action: string;
  user: string;
  timestamp: string;
  changes?: string;
}

export interface VerificationAttachment {
  name: string;
  url: string;
}

export interface InsuranceVerification {
  id: string;
  patientId: number;
  mrn?: string;
  insuranceName: string;
  planType: PlanType;
  primaryOrSecondary: PrimaryOrSecondary;
  memberId: string;
  groupId?: string;
  subscriberName: string;
  relationshipToSubscriber: RelationshipToSubscriber;
  payerPhone?: string;
  payerPortalUrl?: string;
  employer?: string;
  status: VerificationStatus;
  coverageSnapshot?: string;
  verificationMethod: VerificationMethod[];
  verificationDateTime?: string;
  lastAttempt?: string;
  nextFollowUpDate?: string;
  dueDate: string;
  assignedTo: string;
  internalNotes?: string;
  attachments: VerificationAttachment[];
  auditTrail: AuditEntry[];
}

export type RecordType = 'Progress Note' | 'Lab Result' | 'Imaging Report' | 'Referral' | 'Discharge Summary' | 'Insurance Form' | 'Miscellaneous';
export type RecordStatus = 'Draft' | 'Finalized' | 'Signed' | 'Archived';

export interface MedicalRecordAttachment {
  id: string;
  name: string;
  url: string; 
  fileType: string;
  size: number; 
}

export interface MedicalRecordSignature {
  signedBy: string; 
  signedOn: string; 
}

export interface MedicalRecordAuditEntry {
  action: string;
  user: string;
  timestamp: string;
  details?: string;
}

export interface MedicalRecord {
  id: string;
  patientId: number;
  mrn?: string; 
  recordType: RecordType;
  recordDate: string; 
  providerName: string;
  department?: string;
  status: RecordStatus;
  isConfidential: boolean;
  summary: string;
  encounterId?: string;
  attachments: MedicalRecordAttachment[];
  relatedInsuranceVerificationId?: string;
  verifiedBy?: string;
  lastUpdated: string; 
  lastUpdatedBy: string;
  signature?: MedicalRecordSignature;
  internalNotes?: string;
  auditLog: MedicalRecordAuditEntry[];
}

export interface ProviderSchedule {
  workStart: string; 
  workEnd: string;   
  breaks: { start: string; end: string; label: string }[]; 
  maxAppointmentsPerDay?: number;
}

export interface Task {
  id: string;
  title: string;
  dueDate: string; 
  completed: boolean;
  reminded: boolean; 
  priority: 'Low' | 'Medium' | 'High';
}

export interface PortalMessage {
  id: string;
  patientId: number;
  subject: string;
  content: string;
  timestamp: string;
  status: 'Unread' | 'Read' | 'Processed';
  category: 'Medical Question' | 'Billing' | 'Appointment Request' | 'Refill' | 'Other';
  replyContent?: string;
  replyTimestamp?: string;
}

export type ToastType = 'success' | 'info' | 'error' | 'warning';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

export interface SimulationState {
  patients: Patient[];
  appointments: Appointment[];
  verifications: InsuranceVerification[];
  medicalRecords: MedicalRecord[];
  tasks: Task[];
  portalMessages: PortalMessage[];
  preAuthorizations: PreAuthorization[];
  claims: InsuranceClaim[];
  recallTypes: RecallType[];
  selectedPatientId: number | null;
  actions: LoggedAction[];
  history: {
    past: Patient[][];
    future: Patient[][];
  };
  pinboardAppointments: Appointment[];
  waitlistAppointments: Appointment[];
  unassignedDocuments: PatientDocument[];
  dayNotes: Record<string, string>; 
  toasts: ToastMessage[];
  completedSandboxTasks: Record<number, boolean[]>;
}
