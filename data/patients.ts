
import { Patient, ToothStatus, Appointment, LedgerEntry } from '../types';
import { PROVIDER_COLORS } from '../constants';

const now = new Date();
const todayYear = now.getFullYear();
const todayMonth = now.getMonth();
const todayDate = now.getDate();

const getIsoDate = (year: number, month: number, day: number) => {
    return new Date(year, month - 1, day).toISOString().split('T')[0];
};

const BASE_PATIENTS: Patient[] = [
  {
    id: 1,
    firstName: 'Miguel',
    lastName: 'Torres',
    chartNumber: 'TO0001',
    dob: '1991-12-22',
    gender: 'Male',
    status: 'Active',
    familyRelationship: 'Head of Household',
    poaName: 'Ana Torres',
    poaPhone: '555-123-9988',
    poaRelationship: 'Sister',
    emergencyContactName: 'Ana Torres',
    emergencyContactPhone: '555-123-9988',
    emergencyContactRelationship: 'Sister',
    reminderMethod: 'SMS',
    automationActive: true,
    sendConfirmation14Days: false,
    sendReminder2Days: false,
    sendFollowUpOnCancel: false,
    address: '123 Main St, Anytown, USA 12345',
    phone: '555-123-4567',
    email: 'miguel.torres@example.com',
    familyMemberIds: [2, 3],
    medicalHistory: ['Hypertension'],
    medications: ['Lisinopril', 'Amlodipine'],
    surgicalHistory: ['Appendectomy (2010)'],
    socialHistory: ['Non-smoker', 'Occasional alcohol'],
    medicalAlerts: ['Penicillin allergy'],
    dentalHistory: ['Regular cleanings'],
    employer: 'Tech Solutions Inc.',
    firstVisitDate: '2022-03-15',
    lastVisitDate: '2025-10-01',
    primaryInsurance: {
      company: 'MetLife PPO',
      plan: 'Dental PPO Plan A',
      groupNumber: 'GRP-100',
      policyNumber: 'POL-12345',
      subscriberId: 'SUB-98765',
      relationship: 'Self',
      isActive: true,
      policyEffectiveDate: '2024-01-01',
      coverage: 2000,
      used: 220,
      deductible: 50,
      met: 50,
      coveragePercentage: 80,
    },
    ledger: [
      { id: 'l1', date: getIsoDate(todayYear, 9, 15), code: 'D0120', description: 'Periodic Oral Exam', charge: 95.00, payment: 0, writeOff: 0, balance: 95.00 },
      { id: 'l2', date: getIsoDate(todayYear, 9, 15), code: 'D1110', description: 'Adult Prophylaxis', charge: 125.00, payment: 0, writeOff: 0, balance: 220.00 },
    ],
    chart: [
      { toothNumber: 13, status: ToothStatus.TreatmentPlanned, procedure: 'RCT', fee: 900 },
      { toothNumber: 14, status: ToothStatus.TreatmentPlanned, procedure: 'Crown', fee: 1200 },
    ],
    documents: [],
  },
  { id: 2, firstName: 'Maria', lastName: 'Torres', chartNumber: 'TO0002', dob: '1993-05-10', gender: 'Female', status: 'Active', familyRelationship: 'Spouse', poaName: 'Miguel Torres', poaPhone: '555-123-4567', poaRelationship: 'Husband', emergencyContactName: 'Miguel Torres', emergencyContactPhone: '555-123-4567', emergencyContactRelationship: 'Husband', reminderMethod: 'Email', automationActive: true, sendConfirmation14Days: false, sendReminder2Days: false, sendFollowUpOnCancel: false, address: '123 Main St', phone: '555-123-4568', email: 'maria.t@example.com', familyMemberIds: [1, 3], medicalHistory: [], medications: [], surgicalHistory: [], socialHistory: [], medicalAlerts: [], dentalHistory: [], ledger: [{ id: 'l2-1', date: getIsoDate(todayYear, 8, 10), code: 'D0150', description: 'Comprehensive Exam', charge: 180.00, payment: 180.00, writeOff: 0, balance: 0 }], chart: [{ toothNumber: 2, status: ToothStatus.TreatmentPlanned, procedure: 'Crown', fee: 1200 }], documents: [], primaryInsurance: { company: 'Delta Dental', plan: 'PPO Plus', groupNumber: '99100', policyNumber: 'P-55221', subscriberId: 'ID-22910', relationship: 'Spouse', isActive: true, policyEffectiveDate: '2024-01-01', coverage: 1500, used: 180, deductible: 50, met: 50, coveragePercentage: 80 } },
  { id: 3, firstName: 'Sofia', lastName: 'Torres', chartNumber: 'TO0003', dob: '2018-08-01', gender: 'Female', status: 'Active', familyRelationship: 'Child', poaName: 'Miguel Torres', poaPhone: '555-123-4567', poaRelationship: 'Father', emergencyContactName: 'Ana Torres', emergencyContactPhone: '555-123-9988', emergencyContactRelationship: 'Aunt', reminderMethod: 'Call', automationActive: false, sendConfirmation14Days: false, sendReminder2Days: false, sendFollowUpOnCancel: false, address: '123 Main St', phone: '555-123-4567', email: 'miguel.t@example.com', familyMemberIds: [1, 2], medicalHistory: [], medications: [], surgicalHistory: [], socialHistory: [], medicalAlerts: [], dentalHistory: [], ledger: [{ id: 'l3-1', date: getIsoDate(todayYear, 10, 5), code: 'D1120', description: 'Child Prophylaxis', charge: 95.00, payment: 0, writeOff: 0, balance: 95.00 }], chart: [{ toothNumber: 3, status: ToothStatus.TreatmentPlanned, procedure: 'Sealant Check', fee: 50 }], documents: [], primaryInsurance: { company: 'Delta Dental', plan: 'PPO Plus', groupNumber: '99100', policyNumber: 'P-55221', subscriberId: 'ID-22910', relationship: 'Child', isActive: true, policyEffectiveDate: '2024-01-01', coverage: 1500, used: 95, deductible: 50, met: 50, coveragePercentage: 100 } },
  { id: 4, firstName: 'John', lastName: 'Smith', chartNumber: 'SM0004', dob: '1985-02-15', gender: 'Male', status: 'Active', familyRelationship: 'Head of Household', poaName: 'Jane Smith', poaPhone: '555-987-6543', poaRelationship: 'Spouse', emergencyContactName: 'Jane Smith', emergencyContactPhone: '555-987-6543', emergencyContactRelationship: 'Spouse', reminderMethod: 'SMS', automationActive: true, sendConfirmation14Days: false, sendReminder2Days: false, sendFollowUpOnCancel: false, address: '456 Oak Ave', phone: '555-987-6543', email: 'john.s@example.com', familyMemberIds: [5], medicalHistory: [], medications: [], surgicalHistory: [], socialHistory: [], medicalAlerts: [], dentalHistory: [], ledger: [{ id: 'l4-1', date: getIsoDate(todayYear, 7, 20), code: 'D2330', description: 'Composite Filling', charge: 200.00, payment: 150.00, writeOff: 0, balance: 50.00 }], chart: [{ toothNumber: 30, status: ToothStatus.TreatmentPlanned, procedure: 'Extraction', fee: 300 }], documents: [], primaryInsurance: { company: 'Cigna', plan: 'Advantage', groupNumber: 'GRP-100', policyNumber: 'POL-12345', subscriberId: 'SUB-98765', relationship: 'Self', isActive: true, policyEffectiveDate: '2024-01-01', coverage: 1200, used: 150, deductible: 50, met: 50, coveragePercentage: 80 } },
  { id: 5, firstName: 'Jane', lastName: 'Smith', chartNumber: 'SM0005', dob: '1988-11-20', gender: 'Female', status: 'Active', familyRelationship: 'Spouse', poaName: 'John Smith', poaPhone: '555-987-6543', poaRelationship: 'Spouse', emergencyContactName: 'John Smith', emergencyContactPhone: '555-987-6543', emergencyContactRelationship: 'Spouse', reminderMethod: 'Email', automationActive: true, sendConfirmation14Days: false, sendReminder2Days: false, sendFollowUpOnCancel: false, address: '456 Oak Ave', phone: '555-987-6543', email: 'jane.s@example.com', familyMemberIds: [4], medicalHistory: [], medications: [], surgicalHistory: [], socialHistory: [], medicalAlerts: [], dentalHistory: [], ledger: [{ id: 'l5-1', date: getIsoDate(todayYear, 9, 10), code: 'D1110', description: 'Adult Prophylaxis', charge: 125.00, payment: 125.00, writeOff: 0, balance: 0 }], chart: [{ toothNumber: 14, status: ToothStatus.TreatmentPlanned, procedure: 'Composite Filling', fee: 200 }], documents: [], primaryInsurance: { company: 'Cigna', plan: 'Advantage', groupNumber: 'GRP-100', policyNumber: 'POL-12345', subscriberId: 'SUB-98765', relationship: 'Spouse', isActive: true, policyEffectiveDate: '2024-01-01', coverage: 1200, used: 125, deductible: 50, met: 50, coveragePercentage: 100 } },
  { id: 6, firstName: 'Emily', lastName: 'White', chartNumber: 'WH0006', dob: '1970-07-30', gender: 'Female', status: 'Active', familyRelationship: 'Head of Household', poaName: 'Robert White', poaPhone: '555-555-1234', poaRelationship: 'Husband', emergencyContactName: 'Robert White', emergencyContactPhone: '555-555-1234', emergencyContactRelationship: 'Husband', reminderMethod: 'SMS', automationActive: true, sendConfirmation14Days: false, sendReminder2Days: false, sendFollowUpOnCancel: false, address: '789 Pine Ln', phone: '555-555-5555', email: 'emily.w@example.com', familyMemberIds: [], medicalHistory: [], medications: [], surgicalHistory: [], socialHistory: [], medicalAlerts: [], dentalHistory: [], ledger: [{ id: 'l6-1', date: getIsoDate(todayYear, 6, 12), code: 'D2740', description: 'Crown', charge: 1200.00, payment: 1000.00, writeOff: 0, balance: 200.00 }], chart: [{ toothNumber: 18, status: ToothStatus.TreatmentPlanned, procedure: 'RCT', fee: 900 }], documents: [], primaryInsurance: { company: 'Aetna', plan: 'Extend', groupNumber: 'GRP-100', policyNumber: 'POL-12345', subscriberId: 'SUB-98765', relationship: 'Self', isActive: true, policyEffectiveDate: '2024-01-01', coverage: 2500, used: 1200, deductible: 0, met: 0, coveragePercentage: 50 } },
];

const generatedPatients: Patient[] = [
    { id: 12, firstName: 'Patricia', lastName: 'Abbott', phone: '(801)555-1580', dob: '1982-09-20', gender: 'Female', status: 'Active', familyRelationship: 'Head of Household' },
    { id: 13, firstName: 'Mark', lastName: 'Taylor', phone: '(801)555-1581', dob: '1968-01-15', gender: 'Male', status: 'Active', familyRelationship: 'Head of Household' },
    { id: 14, firstName: 'Adia', lastName: 'Johnson', phone: '(801)555-1582', dob: '1990-03-25', gender: 'Female', status: 'Active', familyRelationship: 'Head of Household' },
    { id: 15, firstName: 'Sheri', lastName: 'Taylor', phone: '(801)555-1583', dob: '1970-06-30', gender: 'Female', status: 'Active', familyRelationship: 'Spouse' },
    { id: 16, firstName: 'Kimberly', lastName: 'Edwards', phone: '(801)555-1584', dob: '1985-08-19', gender: 'Female', status: 'Active', familyRelationship: 'Spouse' },
    { id: 17, firstName: 'John', lastName: 'Edwards', phone: '(801)555-1585', dob: '1983-11-05', gender: 'Male', status: 'Active', familyRelationship: 'Head of Household' },
    { id: 18, firstName: 'Paul Y', lastName: 'Olsen', phone: '(801)555-1586', dob: '1979-02-28', gender: 'Male', status: 'Active', familyRelationship: 'Head of Household' },
    { id: 19, firstName: 'William', lastName: 'O\'Connell', phone: '(801)555-1587', dob: '1992-07-14', gender: 'Male', status: 'Active', familyRelationship: 'Head of Household' },
    { id: 20, firstName: 'Richey', lastName: 'Keller', phone: '(801)555-1588', dob: '2010-05-12', gender: 'Male', status: 'Active', familyRelationship: 'Child' },
    { id: 21, firstName: 'Lawrence P', lastName: 'Schow', phone: '(801)555-1589', dob: '1965-09-03', gender: 'Male', status: 'Active', familyRelationship: 'Head of Household' },
    { id: 22, firstName: 'Timothy', lastName: 'Abbott', phone: '(801)555-1590', dob: '1980-12-01', gender: 'Male', status: 'Active', familyRelationship: 'Spouse' },
    { id: 23, firstName: 'Meredith', lastName: 'Reeves', phone: '(801)555-1591', dob: '1988-04-22', gender: 'Female', status: 'Active', familyRelationship: 'Head of Household' },
    { id: 41, firstName: 'Jennifer', lastName: 'Gable', phone: '(801)555-1111', dob: '1980-05-05', gender: 'Female', status: 'Active', familyRelationship: 'Head of Household' },
    { id: 42, firstName: 'Olivia', lastName: 'Chen', phone: '(801)555-4242', dob: '1988-03-15', gender: 'Female', status: 'Active', familyRelationship: 'Head of Household' },
    { id: 43, firstName: 'Benjamin', lastName: 'Carter', phone: '(801)555-4343', dob: '1992-11-20', gender: 'Male', status: 'Active', familyRelationship: 'Head of Household' },
    { id: 44, firstName: 'Sophia', lastName: 'Rodriguez', phone: '(801)555-4444', dob: '1975-07-01', gender: 'Female', status: 'Active', familyRelationship: 'Head of Household' },
    { id: 45, firstName: 'Liam', lastName: 'Nguyen', phone: '(801)555-4545', dob: '2001-01-10', gender: 'Male', status: 'Active', familyRelationship: 'Head of Household' },
    { id: 46, firstName: 'Ava', lastName: 'Martinez', phone: '(801)555-4646', dob: '1995-09-05', gender: 'Female', status: 'Active', familyRelationship: 'Head of Household' },
    { id: 47, firstName: 'Noah', lastName: 'Kim', phone: '(801)555-4747', dob: '1983-05-25', gender: 'Male', status: 'Active', familyRelationship: 'Head of Household' },
    { id: 48, firstName: 'Isabella', lastName: 'Garcia', phone: '(801)555-4848', dob: '1999-12-30', gender: 'Female', status: 'Active', familyRelationship: 'Head of Household' },
    { id: 49, firstName: 'Lucas', lastName: 'Williams', phone: '(801)555-4949', dob: '1969-08-12', gender: 'Male', status: 'Active', familyRelationship: 'Head of Household' },
    { id: 50, firstName: 'Mia', lastName: 'Jones', phone: '(801)555-5050', dob: '2005-06-18', gender: 'Female', status: 'Active', familyRelationship: 'Head of Household' },
    { id: 51, firstName: 'Ethan', lastName: 'Brown', phone: '(801)555-5151', dob: '1994-02-14', gender: 'Male', status: 'Active', familyRelationship: 'Head of Household' },
    { id: 52, firstName: 'Amelia', lastName: 'Davis', phone: '(801)555-5252', dob: '1986-11-30', gender: 'Female', status: 'Active', familyRelationship: 'Head of Household' },
    { id: 53, firstName: 'James', lastName: 'Miller', phone: '(801)555-5353', dob: '1972-04-12', gender: 'Male', status: 'Active', familyRelationship: 'Head of Household' },
    { id: 54, firstName: 'Emma', lastName: 'Wilson', phone: '(801)555-5454', dob: '1998-09-21', gender: 'Female', status: 'Active', familyRelationship: 'Head of Household' },
    { id: 55, firstName: 'Logan', lastName: 'Moore', phone: '(801)555-5555', dob: '2003-01-05', gender: 'Male', status: 'Active', familyRelationship: 'Head of Household' },
    { id: 56, firstName: 'Zoe', lastName: 'Taylor', phone: '(801)555-5656', dob: '1995-06-10', gender: 'Female', status: 'Active', familyRelationship: 'Head of Household' },
    { id: 57, firstName: 'Alexander', lastName: 'Anderson', phone: '(801)555-5757', dob: '1981-08-25', gender: 'Male', status: 'Active', familyRelationship: 'Head of Household' },
    { id: 58, firstName: 'Charlotte', lastName: 'Thomas', phone: '(801)555-5858', dob: '1992-09-11', gender: 'Female', status: 'Active', familyRelationship: 'Head of Household' },
    { id: 59, firstName: 'Aiden', lastName: 'Jackson', phone: '(801)555-5959', dob: '1990-12-05', gender: 'Male', status: 'Active', familyRelationship: 'Head of Household' },
    { id: 60, firstName: 'Abigail', lastName: 'White', phone: '(801)555-6060', dob: '1991-02-14', gender: 'Female', status: 'Active', familyRelationship: 'Head of Household' },
    { id: 61, firstName: 'Mason', lastName: 'Harris', phone: '(801)555-6161', dob: '1992-05-18', gender: 'Male', status: 'Active', familyRelationship: 'Head of Household' },
    { id: 62, firstName: 'Harper', lastName: 'Martin', phone: '(801)555-6262', dob: '1989-03-24', gender: 'Female', status: 'Active', familyRelationship: 'Head of Household' },
    { id: 63, firstName: 'Elijah', lastName: 'Thompson', phone: '(801)555-6363', dob: '1977-11-02', gender: 'Male', status: 'Active', familyRelationship: 'Head of Household' },
    { id: 64, firstName: 'Evelyn', lastName: 'Garcia', phone: '(801)555-6464', dob: '1995-12-15', gender: 'Female', status: 'Active', familyRelationship: 'Head of Household' },
    { id: 65, firstName: 'Matthew', lastName: 'Walker', phone: '(801)555-6565', dob: '1990-08-27', gender: 'Male', status: 'Active', familyRelationship: 'Head of Household' },
    { id: 66, firstName: 'Scarlett', lastName: 'Allen', phone: '(801)555-6666', dob: '1987-10-10', gender: 'Female', status: 'Active', familyRelationship: 'Head of Household' },
    { id: 67, firstName: 'David', lastName: 'Young', phone: '(801)555-6767', dob: '1976-01-01', gender: 'Male', status: 'Active', familyRelationship: 'Head of Household' },
    { id: 68, firstName: 'Victoria', lastName: 'King', phone: '(801)555-6868', dob: '1994-07-07', gender: 'Female', status: 'Active', familyRelationship: 'Head of Household' },
    { id: 69, firstName: 'Daniel', lastName: 'Wright', phone: '(801)555-6969', dob: '1983-04-14', gender: 'Male', status: 'Active', familyRelationship: 'Head of Household' },
    { id: 70, firstName: 'Grace', lastName: 'Lopez', phone: '(801)555-7070', dob: '1991-09-02', gender: 'Female', status: 'Active', familyRelationship: 'Head of Household' },
    { id: 71, firstName: 'Samuel', lastName: 'Hill', phone: '(801)555-7171', dob: '1970-02-28', gender: 'Male', status: 'Active', familyRelationship: 'Head of Household' },
    { id: 72, firstName: 'Chloe', lastName: 'Scott', phone: '(801)555-7272', dob: '1996-06-18', gender: 'Female', status: 'Active', familyRelationship: 'Head of Household' },
    { id: 73, firstName: 'Jack', lastName: 'Green', phone: '(801)555-7373', dob: '2002-12-05', gender: 'Male', status: 'Active', familyRelationship: 'Head of Household' },
    { id: 74, firstName: 'Aria', lastName: 'Adams', phone: '(801)555-7474', dob: '1994-01-12', gender: 'Female', status: 'Active', familyRelationship: 'Head of Household' },
    { id: 75, firstName: 'Luke', lastName: 'Baker', phone: '(801)555-7575', dob: '1988-08-08', gender: 'Male', status: 'Active', familyRelationship: 'Head of Household' },
    { id: 76, firstName: 'Lily', lastName: 'Nelson', phone: '(801)555-7676', dob: '1993-05-30', gender: 'Female', status: 'Active', familyRelationship: 'Head of Household' },
    { id: 77, firstName: 'Isaac', lastName: 'Carter', phone: '(801)555-7777', dob: '1979-10-15', gender: 'Male', status: 'Active', familyRelationship: 'Head of Household' },
    { id: 78, firstName: 'Layla', lastName: 'Mitchell', phone: '(801)555-7878', dob: '1997-11-22', gender: 'Female', status: 'Active', familyRelationship: 'Head of Household' },
    { id: 79, firstName: 'Owen', lastName: 'Perez', phone: '(801)555-7979', dob: '1984-07-04', gender: 'Male', status: 'Active', familyRelationship: 'Head of Household' },
    { id: 80, firstName: 'Nora', lastName: 'Roberts', phone: '(801)555-8080', dob: '1990-12-12', gender: 'Female', status: 'Active', familyRelationship: 'Head of Household' },
].map(p => {
    const idNum = p.id as number;
    // Generate a simple ledger history for each patient
    const balanceSeed = (idNum * 13) % 400;
    const ledger: LedgerEntry[] = [
        { 
            id: `l-gen-${idNum}-1`, 
            date: getIsoDate(todayYear, todayMonth - 2, (idNum % 28) + 1), 
            code: 'D0120', 
            description: 'Periodic Oral Exam', 
            charge: 95.00, 
            payment: balanceSeed > 100 ? 0 : 95.00, 
            writeOff: 0, 
            balance: balanceSeed > 100 ? 95.00 : 0 
        },
        { 
            id: `l-gen-${idNum}-2`, 
            date: getIsoDate(todayYear, todayMonth - 2, (idNum % 28) + 1), 
            code: 'D1110', 
            description: 'Adult Prophylaxis', 
            charge: 125.00, 
            payment: balanceSeed > 200 ? 0 : 125.00, 
            writeOff: 0, 
            balance: (balanceSeed > 100 ? 95.00 : 0) + (balanceSeed > 200 ? 125.00 : 0) 
        }
    ];

    return {
        ...p,
        chartNumber: p.lastName.substring(0,2).toUpperCase() + idNum.toString().padStart(4, '0'),
        medicalHistory: [], 
        medications: [], 
        surgicalHistory: [], 
        socialHistory: [],
        medicalAlerts: [], 
        patientAlerts: [], 
        dentalHistory: [],
        familyMemberIds: [],
        poaName: `POA_${p.lastName}`,
        poaPhone: `(555) 000-${idNum.toString().padStart(4, '0')}`,
        poaRelationship: 'Spouse',
        emergencyContactName: `Emergency_${p.lastName}`,
        emergencyContactPhone: `(555) 999-${idNum.toString().padStart(4, '0')}`,
        emergencyContactRelationship: 'Spouse',
        reminderMethod: (idNum % 3 === 0) ? 'Email' : (idNum % 3 === 1 ? 'SMS' : 'Call'),
        automationActive: true,
        sendConfirmation14Days: false,
        sendReminder2Days: false,
        sendFollowUpOnCancel: false,
        primaryInsurance: {
            company: 'PPO Plan', relationship: 'Self', isActive: true, coverage: 1500, used: 100, deductible: 50, met: 50, coveragePercentage: 80,
            plan: 'Advantage', groupNumber: 'GRP-100', policyNumber: `POL-${10000 + idNum}`, subscriberId: `SUB-GEN-${idNum.toString().padStart(5, '0')}`, policyEffectiveDate: '2024-01-01'
        },
        ledger: ledger,
        documents: [],
        chart: [
            { toothNumber: (idNum % 32) + 1, status: ToothStatus.TreatmentPlanned, procedure: 'RCT', fee: 900 },
            { toothNumber: ((idNum + 5) % 32) + 1, status: ToothStatus.TreatmentPlanned, procedure: 'Crown', fee: 1200 }
        ]
    } as Patient;
});

const recallPatients: Patient[] = [
    { id: 81, firstName: 'Julian', lastName: 'Rivera', phone: '(555) 123-8181', dob: '1995-04-12', gender: 'Male', status: 'Active', lastVisitDate: getIsoDate(todayYear - 1, todayMonth, todayDate) },
    { id: 82, firstName: 'Elena', lastName: 'Gilbert', phone: '(555) 123-8282', dob: '1998-06-22', gender: 'Female', status: 'Active', lastVisitDate: getIsoDate(todayYear, todayMonth - 7, todayDate) },
    { id: 83, firstName: 'Marcus', lastName: 'Thorne', phone: '(555) 123-8383', dob: '1984-01-10', gender: 'Male', status: 'Active', lastVisitDate: getIsoDate(todayYear - 2, todayMonth, todayDate) },
    { id: 84, firstName: 'Sienna', lastName: 'Miller', phone: '(555) 123-8484', dob: '2001-11-30', gender: 'Female', status: 'Active', lastVisitDate: getIsoDate(todayYear, todayMonth - 4, todayDate) },
    { id: 85, firstName: 'Tariq', lastName: 'Aziz', phone: '(555) 123-8585', dob: '1977-09-15', gender: 'Male', status: 'Active', lastVisitDate: getIsoDate(todayYear - 1, todayMonth - 3, todayDate) },
    { id: 86, firstName: 'Lila', lastName: 'Vance', phone: '(555) 123-8686', dob: '1992-03-05', gender: 'Female', status: 'Active', lastVisitDate: getIsoDate(todayYear, todayMonth - 10, todayDate) },
    { id: 87, firstName: 'Xavier', lastName: 'Knight', phone: '(555) 123-8787', dob: '1989-12-01', gender: 'Male', status: 'Active', lastVisitDate: getIsoDate(todayYear - 1, todayMonth + 2, todayDate) },
    { id: 88, firstName: 'Freya', lastName: 'Hansen', phone: '(555) 123-8888', dob: '1996-07-19', gender: 'Female', status: 'Active', lastVisitDate: getIsoDate(todayYear, todayMonth - 13, todayDate) },
    { id: 89, firstName: 'Silas', lastName: 'Wren', phone: '(555) 123-8989', dob: '1982-05-25', gender: 'Male', status: 'Active', lastVisitDate: getIsoDate(todayYear - 1, todayMonth - 6, todayDate) },
    { id: 90, firstName: 'Amara', lastName: 'Okoro', phone: '(555) 123-9090', dob: '1994-10-08', gender: 'Female', status: 'Active', lastVisitDate: getIsoDate(todayYear, todayMonth - 5, todayDate) },
].map(p => {
    const idNum = p.id as number;
    // Map specific recall codes to ensure they appear in "Recall Due List"
    const codes = ['D1110', 'D4910', 'D0274', 'D0120'];
    const assignedCode = codes[idNum % codes.length];
    
    return {
        ...p,
        chartNumber: p.lastName.substring(0,2).toUpperCase() + idNum.toString().padStart(4, '0'),
        medicalHistory: [], 
        medications: [], 
        surgicalHistory: [], 
        socialHistory: [],
        medicalAlerts: [], 
        patientAlerts: [], 
        dentalHistory: [],
        familyMemberIds: [],
        emergencyContactName: `Recall_Emerg_${p.lastName}`,
        emergencyContactPhone: `(555) 888-${idNum.toString().padStart(4, '0')}`,
        emergencyContactRelationship: 'Relative',
        reminderMethod: (idNum % 2 === 0) ? 'Email' : 'SMS',
        automationActive: true,
        sendConfirmation14Days: false,
        sendReminder2Days: false,
        sendFollowUpOnCancel: false,
        ledger: [
            { 
                id: `l-recall-${idNum}`, 
                date: p.lastVisitDate!, 
                code: assignedCode, 
                description: 'Historical Recall Service', 
                charge: 150.00, 
                payment: 150.00, 
                writeOff: 0, 
                balance: 0 
            }
        ],
        documents: [],
        chart: []
    } as Patient;
});

export const PATIENTS_DATA: Patient[] = [...BASE_PATIENTS, ...generatedPatients, ...recallPatients];

export const APPOINTMENTS_DATA: Appointment[] = (() => {
    const appts: Appointment[] = [];
    const patients = PATIENTS_DATA;
    
    const providers = ['Dr. Smith', 'Dr. Jones', 'Dr. Taylor', 'Dr. Ortho', 'Dr. Peters', 'Dr. Peri', 'Hygienist A', 'Hygienist B'];
    const operatories = [1, 2, 3, 4, 5, 6, 7, 8];
    
    // Tracking end times per operatory for the 15-minute gap policy
    const opEndTimes: Record<number, number> = {};
    operatories.forEach(op => opEndTimes[op] = new Date(todayYear, todayMonth, todayDate, 8, 0).getTime());

    for (let i = 0; i < 48; i++) {
        const op = operatories[i % operatories.length];
        const provider = providers[i % providers.length];
        const patient = patients[i % patients.length];
        const colorClass = PROVIDER_COLORS[provider] || PROVIDER_COLORS['default'];
        
        let startTimeMs = opEndTimes[op];
        
        // Apply staggering for hygienists if they are starting "fresh" at the same time as others
        if (provider === 'Hygienist A') startTimeMs += 10 * 60000;
        if (provider === 'Hygienist B') startTimeMs += 20 * 60000;

        const apptDate = new Date(startTimeMs);
        const duration = 60;

        appts.push({
            id: `gen-apt-${i}`,
            patientId: patient.id,
            startTime: apptDate,
            duration: duration,
            operatory: op,
            provider: provider,
            treatment: 'Clinical Evaluation',
            color: colorClass,
            status: 'FIRM',
            appointmentType: 'General',
            hasNote: i % 5 === 0
        });

        // Update op end time: current end + 15 min buffer
        opEndTimes[op] = startTimeMs + (duration + 15) * 60000;
    }
    return appts;
})();
