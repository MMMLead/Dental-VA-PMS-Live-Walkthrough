
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSimulationContext } from '../../context/SimulationContext';
import { Patient, Insurance, FamilyRelationship, PatientStatus } from '../../types';

// --- Sub-components ---

const DeleteConfirmationModal: React.FC<{
    patientName: string;
    onConfirm: () => void;
    onCancel: () => void;
}> = ({ patientName, onConfirm, onCancel }) => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-[100] animate-fade-in-fast" onClick={onCancel}>
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 transform animate-scale-in border border-red-100" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-6 mx-auto">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            </div>
            <h3 className="text-xl font-black text-gray-800 text-center uppercase tracking-tight mb-2">Delete Record?</h3>
            <p className="text-gray-500 text-center text-sm font-medium leading-relaxed mb-8">
                Are you sure you want to delete <span className="font-bold text-gray-800">{patientName}</span>? This action will permanently remove all clinical history, ledger entries, and appointments.
            </p>
            <div className="flex flex-col gap-3">
                <button 
                    onClick={onConfirm}
                    className="w-full py-3 bg-red-600 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-lg hover:bg-red-700 transition-all active:scale-95"
                >
                    Yes, Delete Record
                </button>
                <button 
                    onClick={onCancel}
                    className="w-full py-3 bg-gray-100 text-gray-500 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-gray-200 transition-colors"
                >
                    Keep Record
                </button>
            </div>
        </div>
    </div>
);

const FamilyFile: React.FC = () => {
  const { state, dispatch } = useSimulationContext();
  const { patients, selectedPatientId } = state;
  const selectedPatient = patients.find(p => p.id === selectedPatientId) || null;

  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [formData, setFormData] = useState<Partial<Patient>>(selectedPatient || {});
  const [familyLinkToId, setFamilyLinkToId] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedPatient) {
      setFormData(selectedPatient);
      setIsCreatingNew(false);
      setFamilyLinkToId(null);
    }
  }, [selectedPatient]);

  const familyUnit = useMemo(() => {
    if (!selectedPatient) return [];
    const unitIds = new Set([selectedPatient.id, ...(selectedPatient.familyMemberIds || [])]);
    return patients.filter(p => unitIds.has(p.id)).sort((a, b) => a.id - b.id);
  }, [selectedPatient, patients]);

  const breadcrumbs = useMemo(() => {
    const crumbs = [
      { 
        label: 'Patient Search', 
        active: !selectedPatient && !isCreatingNew,
        onClick: () => { 
          dispatch({ type: 'SELECT_PATIENT', payload: null }); 
          setIsCreatingNew(false); 
          setFamilyLinkToId(null);
        } 
      }
    ];

    if (selectedPatient) {
      if (familyUnit.length > 1) {
        crumbs.push({ 
          label: `${selectedPatient.lastName} Family`, 
          active: false,
          onClick: () => handleSwitchPatient(familyUnit[0].id) 
        });
      }
      crumbs.push({ 
        label: `${selectedPatient.firstName} ${selectedPatient.lastName}`, 
        active: true,
        onClick: () => {} 
      });
    } else if (isCreatingNew) {
      crumbs.push({ 
        label: familyLinkToId ? 'Add Family Member' : 'New Patient', 
        active: true,
        onClick: () => {} 
      });
    }

    return crumbs;
  }, [selectedPatient, isCreatingNew, familyUnit, familyLinkToId, dispatch]);

  const handleSwitchPatient = (id: number) => {
    setIsCreatingNew(false);
    setFamilyLinkToId(null);
    dispatch({ type: 'SELECT_PATIENT', payload: id });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    const listFields = ['medicalAlerts', 'patientAlerts', 'medicalHistory', 'medications', 'surgicalHistory', 'socialHistory'];
    if (listFields.includes(name)) {
      const list = value.split(';').map(item => item.trim()).filter(Boolean);
      setFormData({ ...formData, [name]: list });
      return;
    }
    
    const processedValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

    if (name.includes('.')) {
      const [objectKey, fieldKey] = name.split('.') as ['primaryInsurance' | 'secondaryInsurance', keyof Insurance];
      setFormData(prev => ({
        ...prev,
        [objectKey]: {
          ...(prev[objectKey] || {}),
          [fieldKey]: processedValue,
        }
      }));
    } else {
      setFormData({ ...formData, [name]: processedValue });
    }
  };
  
  const handleSave = () => {
    if (isCreatingNew) {
      if (!formData.firstName || !formData.lastName || !formData.dob) {
        dispatch({ type: 'ADD_TOAST', payload: { message: 'First Name, Last Name, and DOB are required.', type: 'error' } });
        return;
      }
      
      const newPatientPayload: Patient = {
        id: -1,
        firstName: formData.firstName || '',
        lastName: formData.lastName || '',
        dob: formData.dob || '',
        gender: formData.gender || 'Other',
        status: formData.status || 'Active',
        statusNotes: formData.statusNotes || '',
        familyRelationship: formData.familyRelationship || 'Head of Household',
        poaName: formData.poaName || '',
        poaPhone: formData.poaPhone || '',
        poaRelationship: formData.poaRelationship || '',
        emergencyContactName: formData.emergencyContactName || '',
        emergencyContactPhone: formData.emergencyContactPhone || '',
        emergencyContactRelationship: formData.emergencyContactRelationship || '',
        reminderMethod: formData.reminderMethod || 'Email',
        automationActive: formData.automationActive ?? true,
        sendConfirmation14Days: formData.sendConfirmation14Days ?? false,
        sendReminder2Days: formData.sendReminder2Days ?? false,
        sendFollowUpOnCancel: formData.sendFollowUpOnCancel ?? false,
        address: formData.address || '',
        phone: formData.phone || '',
        email: formData.email || '',
        familyMemberIds: formData.familyMemberIds || [],
        medicalHistory: formData.medicalHistory || [],
        medications: formData.medications || [],
        surgicalHistory: formData.surgicalHistory || [],
        socialHistory: formData.socialHistory || [],
        medicalAlerts: formData.medicalAlerts || [],
        medicalAlertsNotes: formData.medicalAlertsNotes || '',
        patientAlerts: formData.patientAlerts || [],
        dentalHistory: formData.dentalHistory || [],
        lastPerioExamDate: formData.lastPerioExamDate || '',
        lastRadiographDate: formData.lastRadiographDate || '',
        primaryInsurance: formData.primaryInsurance,
        secondaryInsurance: formData.secondaryInsurance,
        ledger: formData.ledger || [],
        chart: formData.chart || [],
        documents: formData.documents || [],
        photoUrl: formData.photoUrl,
        referralSource: formData.referralSource,
        employer: formData.employer,
        firstVisitDate: formData.firstVisitDate || new Date().toISOString().split('T')[0],
        lastVisitDate: formData.lastVisitDate,
      };

      if (familyLinkToId) {
        dispatch({ 
          type: 'ADD_FAMILY_MEMBER', 
          payload: { patientData: newPatientPayload, familyLinkToId } 
        });
        dispatch({ type: 'ADD_TOAST', payload: { message: 'Family member created successfully!', type: 'success' } });
      } else {
        dispatch({ type: 'ADD_PATIENT', payload: newPatientPayload });
        dispatch({ type: 'ADD_TOAST', payload: { message: 'Patient created successfully!', type: 'success' } });
      }
      dispatch({ type: 'LOG_ACTION', payload: { type: 'create_patient', details: { name: `${formData.firstName} ${formData.lastName}` } } });
      
      setIsCreatingNew(false);
      setFamilyLinkToId(null);
    } else {
      if (!formData.id) return;
      dispatch({ type: 'UPDATE_PATIENT', payload: formData as Patient });
      dispatch({ type: 'LOG_ACTION', payload: { type: 'update_patient', details: { id: formData.id } } });
      dispatch({ type: 'ADD_TOAST', payload: { message: 'Patient information saved!', type: 'success' } });
    }
  };

  const handleConfirmDelete = () => {
    if (selectedPatient) {
      dispatch({ type: 'DELETE_PATIENT', payload: selectedPatient.id });
      dispatch({ type: 'LOG_ACTION', payload: { type: 'delete_patient', details: { id: selectedPatient.id } } });
      dispatch({ type: 'ADD_TOAST', payload: { message: 'Patient record successfully purged.', type: 'info' } });
      setIsDeleteModalOpen(false);
      setIsCreatingNew(false);
    }
  };

  const startNewPatient = () => {
    dispatch({ type: 'SELECT_PATIENT', payload: null });
    setIsCreatingNew(true);
    setFamilyLinkToId(null);
    setFormData({ 
        gender: 'Other', 
        familyRelationship: 'Head of Household', 
        status: 'Active', 
        automationActive: true, 
        reminderMethod: 'Email',
        sendConfirmation14Days: false,
        sendReminder2Days: false,
        sendFollowUpOnCancel: false
    });
  };
  
  const startNewFamilyMember = () => {
    if (!selectedPatient) return;
    const linkId = selectedPatient.id;
    setFamilyLinkToId(linkId);
    setIsCreatingNew(true);
    dispatch({ type: 'SELECT_PATIENT', payload: null });
    
    setFormData({
      lastName: selectedPatient.lastName,
      address: selectedPatient.address,
      phone: selectedPatient.phone,
      gender: 'Other',
      status: 'Active',
      familyRelationship: 'Child', 
      primaryInsurance: selectedPatient.primaryInsurance,
      secondaryInsurance: selectedPatient.secondaryInsurance,
      automationActive: true,
      reminderMethod: 'Email',
      sendConfirmation14Days: false,
      sendReminder2Days: false,
      sendFollowUpOnCancel: false
    });
  };

  const handleUploadPhoto = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const photoUrl = reader.result as string;
        setFormData(prev => ({ ...prev, photoUrl }));
        dispatch({ type: 'LOG_ACTION', payload: { type: 'upload_photo', details: { fileName: file.name } } });
        dispatch({ type: 'ADD_TOAST', payload: { message: 'Photo uploaded successfully!', type: 'success' } });
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerReminder = (type: string) => {
    const method = formData.reminderMethod || 'Email';
    let message = "";
    
    if (type === 'sendConfirmation14Days') {
      message = `Initial 14-day confirmation email reminder has been sent.`;
    } else if (type === 'sendReminder2Days') {
      message = `48-hour secondary email reminder has been sent.`;
    } else {
      message = `Cancellation follow-up email has been sent.`;
    }

    dispatch({ type: 'ADD_TOAST', payload: { message, type: 'success' } });
    dispatch({ type: 'LOG_ACTION', payload: { type: 'manual_reminder_send', details: { reminderType: type, method } } });
  };

  const renderBreadcrumbs = () => (
    <nav className="flex px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs font-medium" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-3">
        {breadcrumbs.map((crumb, index) => (
          <li key={index} className="inline-flex items-center">
            {index > 0 && (
              <svg className="w-4 h-4 text-gray-400 mx-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            )}
            <button
              onClick={crumb.onClick}
              className={`inline-flex items-center hover:text-blue-600 transition-colors ${crumb.active ? 'text-gray-700 cursor-default' : 'text-blue-500 cursor-pointer'}`}
              disabled={crumb.active}
            >
              {index === 0 && <span className="mr-2">🔍</span>}
              {crumb.label}
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );

  const getStatusClass = (status: PatientStatus) => {
    switch(status) {
      case 'Active': return 'bg-green-100 text-green-700 border-green-200';
      case 'Inactive': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'Archived': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Deceased': return 'bg-black text-white border-black';
      default: return 'bg-gray-50 text-gray-600';
    }
  };

  const renderPatientForm = () => (
    <div className="p-4 space-y-4 pb-20">
      {familyUnit.length > 1 && !isCreatingNew && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-6">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center text-gray-700 font-bold text-xs uppercase tracking-wider">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.124-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.124-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Family Group Members
            </div>
            <button 
              onClick={startNewFamilyMember}
              className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 font-bold transition-colors"
            >
              + Add Family Member
            </button>
          </div>
          <div className="p-3 flex flex-wrap gap-2">
            {familyUnit.map(member => {
              const relationship = member.familyRelationship || 'Member';
              const isInactive = member.status !== 'Active';
              return (
                <button
                  key={member.id}
                  onClick={() => handleSwitchPatient(member.id)}
                  className={`flex items-start px-4 py-2 rounded-md text-xs transition-all border ${
                    member.id === selectedPatientId
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-200'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                  } ${isInactive ? 'opacity-70 italic' : ''}`}
                >
                  <div className="flex flex-col">
                    <span className="font-bold flex items-center gap-1">
                        {member.firstName} {member.lastName}
                        {isInactive && <span className="text-[8px] bg-gray-200 text-gray-700 px-1 rounded not-italic">{member.status.toUpperCase()}</span>}
                    </span>
                    <span className={`text-[10px] text-left ${member.id === selectedPatientId ? 'text-blue-100' : 'text-gray-400'}`}>
                        {relationship}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <fieldset className="border border-gray-200 p-4 rounded-lg bg-white shadow-sm">
        <legend className="text-xs font-bold text-gray-500 uppercase tracking-widest px-2">Demographics</legend>
        <div className="flex flex-col md:flex-row gap-8 pt-2">
          <div className="flex-shrink-0 flex flex-col items-center space-y-4 md:w-48">
            <div className="relative group">
              {formData.photoUrl ? (
                <img src={formData.photoUrl} alt={`${formData.firstName || 'Patient'}'s photo`} className="w-40 h-40 rounded-lg object-cover shadow-lg border-2 border-white ring-1 ring-gray-200" />
              ) : (
                <div className="w-40 h-40 bg-gray-50 rounded-lg flex items-center justify-center text-gray-300 border-2 border-dashed border-gray-200 group-hover:border-blue-300 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex flex-col space-y-2 w-full">
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
              <button
                type="button"
                onClick={handleUploadPhoto}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md text-xs font-bold hover:bg-gray-200 transition-colors"
              >
                Upload Photo
              </button>
            </div>
          </div>
          <div className="flex-grow">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
              <InputField label="First Name" name="firstName" value={formData.firstName || ''} onChange={handleInputChange} />
              <InputField label="Last Name" name="lastName" value={formData.lastName || ''} onChange={handleInputChange} />
              <InputField label="Date of Birth" name="dob" type="date" value={formData.dob || ''} onChange={handleInputChange} />
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Gender</label>
                <select name="gender" value={formData.gender || 'Other'} onChange={handleInputChange} className="input-field">
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 tracking-widest">Account Status</label>
                <select 
                  name="status" 
                  value={formData.status || 'Active'} 
                  onChange={handleInputChange} 
                  className={`input-field font-black uppercase text-[10px] tracking-widest ${getStatusClass(formData.status as PatientStatus)}`}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Archived">Archived</option>
                  <option value="Deceased">Deceased</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Family Relationship</label>
                <select 
                    name="familyRelationship" 
                    value={formData.familyRelationship || 'Head of Household'} 
                    onChange={handleInputChange} 
                    className="input-field font-bold text-blue-700"
                >
                  <option value="Head of Household">Head of Household</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Child">Child</option>
                  <option value="Other Dependent">Other Dependent</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {formData.status !== 'Active' && (
                <div className="md:col-span-3 bg-gray-50 p-3 rounded border border-dashed border-gray-300 animate-fade-in-fast">
                   <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-widest">Explanation / Status Notes</label>
                   <textarea 
                     name="statusNotes" 
                     value={formData.statusNotes || ''} 
                     onChange={handleInputChange} 
                     className="w-full p-2 border border-gray-200 rounded text-sm bg-white" 
                     placeholder="e.g., moved to another state, passed away, patient transferred..."
                   />
                </div>
              )}

              <InputField label="Phone" name="phone" value={formData.phone || ''} onChange={handleInputChange} />
              <InputField label="Email" name="email" type="email" value={formData.email || ''} onChange={handleInputChange} />
              <InputField label="Address" name="address" value={formData.address || ''} onChange={handleInputChange} className="md:col-span-3"/>
              <InputField label="Employer" name="employer" value={formData.employer || ''} onChange={handleInputChange} />
              <InputField label="Referral Source" name="referralSource" value={formData.referralSource || ''} onChange={handleInputChange} />
              
              <div className="md:col-span-3 border-t border-gray-100 pt-4 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest">Power of Attorney (POA)</h4>
                  <div className="space-y-4">
                    <InputField label="POA Name" name="poaName" value={formData.poaName || ''} onChange={handleInputChange} placeholder="Full legal name of POA" />
                    <InputField label="Relationship to Patient" name="poaRelationship" value={formData.poaRelationship || ''} onChange={handleInputChange} placeholder="e.g. Spouse, Sibling" />
                    <InputField label="POA Contact Phone" name="poaPhone" value={formData.poaPhone || ''} onChange={handleInputChange} placeholder="Primary phone for POA" />
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest text-red-600">Emergency Contact</h4>
                  <div className="space-y-4">
                    <InputField label="Contact Name" name="emergencyContactName" value={formData.emergencyContactName || ''} onChange={handleInputChange} placeholder="Full name" />
                    <InputField label="Relationship to Patient" name="emergencyContactRelationship" value={formData.emergencyContactRelationship || ''} onChange={handleInputChange} placeholder="e.g. Sibling, Friend" />
                    <InputField label="Contact Number" name="emergencyContactPhone" value={formData.emergencyContactPhone || ''} onChange={handleInputChange} placeholder="Primary phone number" />
                  </div>
                </div>
              </div>

              <div className="md:col-span-3 space-y-4">
                  <InputField 
                    label="Medical Alerts (Semicolon separated)"
                    name="medicalAlerts"
                    value={Array.isArray(formData.medicalAlerts) ? formData.medicalAlerts.join('; ') : ''}
                    onChange={handleInputChange}
                    placeholder="Penicillin allergy; Hypertension"
                  />
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1 tracking-widest">Medical Alerts Notes</label>
                    <textarea 
                        name="medicalAlertsNotes" 
                        value={formData.medicalAlertsNotes || ''} 
                        onChange={handleInputChange} 
                        className="input-field h-24"
                        placeholder="Additional details on contraindications, reactions, or specific medical instructions..."
                    />
                  </div>
                  <InputField 
                    label="Patient Alerts (Semicolon separated)"
                    name="patientAlerts"
                    value={Array.isArray(formData.patientAlerts) ? formData.patientAlerts.join('; ') : ''}
                    onChange={handleInputChange}
                    placeholder="e.g. anxious patient; needs breaks"
                  />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 border-t border-gray-100 pt-6">
              <InputField label="First Visit" name="firstVisitDate" type="date" value={formData.firstVisitDate || ''} onChange={handleInputChange} />
              <InputField label="Last Visit" name="lastVisitDate" type="date" value={formData.lastVisitDate || ''} onChange={handleInputChange} />
            </div>
          </div>
        </div>
      </fieldset>

      <fieldset className="border-2 border-indigo-200 p-6 rounded-[2rem] bg-indigo-50/20 shadow-md mt-6">
        <legend className="text-[11px] font-black text-indigo-700 uppercase tracking-[0.2em] px-4">Automated Communications</legend>
        <div className="flex flex-col md:flex-row gap-8 pt-4">
            <div className="md:w-[32%] space-y-6">
                <div className="flex items-center justify-between bg-white p-5 rounded-[1.5rem] border border-indigo-100 shadow-sm transition-all hover:shadow-md">
                    <div>
                        <span className="text-[11px] font-black text-slate-700 block uppercase tracking-tight">System Reminders</span>
                        <span className="text-[10px] text-slate-400 font-bold">Automated Appt Logic</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                            type="checkbox" 
                            name="automationActive"
                            checked={formData.automationActive ?? true}
                            onChange={handleInputChange}
                            className="sr-only peer"
                        />
                        <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                </div>

                <div>
                    <label className="block text-[11px] font-black text-slate-500 uppercase mb-4 tracking-widest pl-1">Preferred Reminder Method</label>
                    <div className="grid grid-cols-1 gap-3">
                        {(['Email', 'SMS', 'Call'] as const).map(method => (
                            <label key={method} className={`flex items-center p-4 rounded-2xl border-2 transition-all cursor-pointer ${formData.reminderMethod === method ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-white text-slate-600 border-slate-100 hover:border-indigo-300'}`}>
                                <input 
                                    type="radio" 
                                    name="reminderMethod" 
                                    value={method} 
                                    checked={formData.reminderMethod === method}
                                    onChange={handleInputChange}
                                    className="sr-only"
                                />
                                <span className="text-[11px] font-black uppercase tracking-widest flex items-center gap-4">
                                    {method === 'Email' && <span className="text-sm">📧</span>}
                                    {method === 'SMS' && <span className="text-sm">📱</span>}
                                    {method === 'Call' && <span className="text-sm">📞</span>}
                                    {method === 'SMS' ? 'SMS / Text' : method === 'Call' ? 'Voicemail/Call' : method}
                                </span>
                                {formData.reminderMethod === method && <span className="ml-auto text-[9px] font-black uppercase bg-white/20 px-2 py-0.5 rounded tracking-tighter">Active</span>}
                            </label>
                        ))}
                    </div>
                </div>
            </div>

            <div className="md:w-[68%]">
                <div className="bg-white p-8 rounded-[2.5rem] border border-indigo-100 h-full flex flex-col shadow-sm">
                    <h4 className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.25em] mb-8 pl-2">Reminder Schedule Configuration</h4>
                    
                    <div className="space-y-5">
                        <ReminderTaskCard 
                            label="INITIAL CONFIRMATION" 
                            subtext="Triggered 14 days prior to appointment. Requests confirmation status."
                            name="sendConfirmation14Days"
                            checked={formData.sendConfirmation14Days ?? false}
                            onChange={(e) => {
                                handleInputChange(e);
                                if (e.target.checked) triggerReminder('sendConfirmation14Days');
                            }}
                            disabled={!formData.automationActive}
                        />

                        <ReminderTaskCard 
                            label="SECONDARY REMINDER" 
                            subtext="Triggered 48-24 hours before visit. Final nudge before chair time."
                            name="sendReminder2Days"
                            checked={formData.sendReminder2Days ?? false}
                            onChange={(e) => {
                                handleInputChange(e);
                                if (e.target.checked) triggerReminder('sendReminder2Days');
                            }}
                            disabled={!formData.automationActive}
                        />

                        <ReminderTaskCard 
                            label="CANCELLATION FOLLOW-UP" 
                            subtext="Automatically sent if status changes to Canceled or No-Show."
                            name="sendFollowUpOnCancel"
                            checked={formData.sendFollowUpOnCancel ?? false}
                            onChange={(e) => {
                                handleInputChange(e);
                                if (e.target.checked) triggerReminder('sendFollowUpOnCancel');
                            }}
                            disabled={!formData.automationActive}
                        />
                    </div>

                    <div className="mt-auto pt-8 flex items-center justify-between border-t border-indigo-50">
                        <div className="flex items-center gap-3 text-[10px] font-black text-indigo-400 uppercase tracking-[0.15em]">
                            <div className={`w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]`}></div>
                            <span>SYSTEM READY: QUEUE PROCESSING ACTIVE</span>
                        </div>
                        <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">EDI v4.2.1</span>
                    </div>
                </div>
            </div>
        </div>
      </fieldset>

      <fieldset className="border border-gray-200 p-4 rounded-lg bg-white shadow-sm mt-4">
        <legend className="text-xs font-bold text-gray-500 uppercase tracking-widest px-2">Clinical Profile</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-4">
                <div>
                    <label className="flex items-center text-xs font-bold text-gray-500 uppercase mb-1 tracking-wider">
                        <span className="mr-2">💊</span> Medication List (Semicolon separated)
                    </label>
                    <textarea 
                        name="medications" 
                        value={Array.isArray(formData.medications) ? formData.medications.join('; ') : ''} 
                        onChange={handleInputChange} 
                        className="input-field h-24"
                        placeholder="Aspirin; Metformin; Multivitamin..."
                    />
                </div>
                <div>
                    <label className="flex items-center text-xs font-bold text-gray-500 uppercase mb-1 tracking-wider">
                        <span className="mr-2">❤️</span> Past Medical History (Semicolon separated)
                    </label>
                    <textarea 
                        name="medicalHistory" 
                        value={Array.isArray(formData.medicalHistory) ? formData.medicalHistory.join('; ') : ''} 
                        onChange={handleInputChange} 
                        className="input-field h-24"
                        placeholder="Diabetes Type 2; Asthma; Gout..."
                    />
                </div>
            </div>
            <div className="space-y-4">
                <div>
                    <label className="flex items-center text-xs font-bold text-gray-500 uppercase mb-1 tracking-wider">
                        <span className="mr-2">🏥</span> Surgical History (Semicolon separated)
                    </label>
                    <textarea 
                        name="surgicalHistory" 
                        value={Array.isArray(formData.surgicalHistory) ? formData.surgicalHistory.join('; ') : ''} 
                        onChange={handleInputChange} 
                        className="input-field h-24"
                        placeholder="Knee replacement (2018); Gastric bypass..."
                    />
                </div>
                <div>
                    <label className="flex items-center text-xs font-bold text-gray-500 uppercase mb-1 tracking-wider">
                        <span className="mr-2">👥</span> Social History (Semicolon separated)
                    </label>
                    <textarea 
                        name="socialHistory" 
                        value={Array.isArray(formData.socialHistory) ? formData.socialHistory.join('; ') : ''} 
                        onChange={handleInputChange} 
                        className="input-field h-24"
                        placeholder="Smoker (1pk/day); Moderate alcohol; Active lifestyle..."
                    />
                </div>
            </div>
        </div>
      </fieldset>

      <fieldset className="border border-gray-200 p-4 rounded-lg bg-white shadow-sm mt-4">
        <legend className="text-xs font-bold text-gray-500 uppercase tracking-widest px-2">Dental History & Tracking</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <InputField 
                label="Last Periodontal Exam Date" 
                name="lastPerioExamDate" 
                type="date" 
                value={formData.lastPerioExamDate || ''} 
                onChange={handleInputChange} 
            />
            <InputField 
                label="Last Radiographs Taken Date" 
                name="lastRadiographDate" 
                type="date" 
                value={formData.lastRadiographDate || ''} 
                onChange={handleInputChange} 
            />
            <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 tracking-widest">Dental History (Semicolon separated)</label>
                <textarea 
                    name="dentalHistory" 
                    value={Array.isArray(formData.dentalHistory) ? formData.dentalHistory.join('; ') : ''} 
                    onChange={handleInputChange} 
                    className="input-field h-24"
                    placeholder="Regular cleanings; Bridge on #3-5 (2015)..."
                />
            </div>
        </div>
      </fieldset>

      <InsuranceFormSection title="Primary Insurance" data={formData.primaryInsurance || {}} onChange={handleInputChange} namePrefix="primaryInsurance" />
      <InsuranceFormSection title="Secondary Insurance" data={formData.secondaryInsurance || {}} onChange={handleInputChange} namePrefix="secondaryInsurance" />

      <div className="flex justify-between items-center pt-8">
        <div>
          {!isCreatingNew && selectedPatient && (
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              className="px-6 py-2 bg-white border border-red-200 text-red-600 rounded-md hover:bg-red-50 font-bold transition-colors"
            >
              Delete Patient Record
            </button>
          )}
        </div>
        <div className="flex justify-end space-x-3">
          <button 
            onClick={() => { dispatch({ type: 'SELECT_PATIENT', payload: null }); setIsCreatingNew(false); setFamilyLinkToId(null); }} 
            className="px-6 py-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 font-bold transition-colors"
          >
            Cancel
          </button>
          <button onClick={handleSave} className="px-8 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-bold shadow-md transition-colors">
            {isCreatingNew ? 'Create Patient Profile' : 'Save Changes'}
          </button>
        </div>
      </div>
      
      {isDeleteModalOpen && selectedPatient && (
          <DeleteConfirmationModal 
            patientName={`${selectedPatient.firstName} ${selectedPatient.lastName}`}
            onConfirm={handleConfirmDelete}
            onCancel={() => setIsDeleteModalOpen(false)}
          />
      )}
    </div>
  );

  return (
    <div className="bg-white h-full shadow-lg rounded-md overflow-hidden flex flex-col">
      <div className="p-3 border-b bg-gray-50 flex justify-between items-center">
        <h2 className="text-lg font-bold text-gray-800">Family File</h2>
        <div className="flex space-x-2">
          <button 
            onClick={startNewFamilyMember}
            disabled={!selectedPatient}
            className="px-4 py-1.5 bg-white border border-blue-200 text-blue-600 rounded-md text-xs font-bold hover:bg-blue-50 disabled:opacity-50 transition-colors"
          >
            + Add Family Member
          </button>
          <button onClick={startNewPatient} className="px-4 py-1.5 bg-green-600 text-white rounded-md text-xs font-bold hover:bg-green-700 shadow-sm transition-colors">
            + Create New Patient
          </button>
        </div>
      </div>
      
      {renderBreadcrumbs()}

      <div className="flex-grow overflow-auto bg-gray-50/30">
        { selectedPatient || isCreatingNew ? renderPatientForm() : <PatientSearch onSelect={() => setIsCreatingNew(false)} getStatusClass={getStatusClass} /> }
      </div>
    </div>
  );
};

interface ReminderTaskCardProps {
    label: string;
    subtext: string;
    name: string;
    checked: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    disabled?: boolean;
}

/**
 * Updated to match the specific rounded cards and styling from provided screenshots.
 */
const ReminderTaskCard: React.FC<ReminderTaskCardProps> = ({ label, subtext, name, checked, onChange, disabled }) => (
    <div 
        className={`flex items-center gap-10 p-7 rounded-[1.75rem] border transition-all duration-300 ${disabled ? 'opacity-30 grayscale pointer-events-none' : 'bg-white border-slate-100 hover:border-indigo-100 shadow-[0_4px_12px_rgba(0,0,0,0.02)]'}`}
    >
        <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input 
                type="checkbox" 
                name={name}
                checked={checked}
                onChange={onChange}
                className="sr-only peer"
                disabled={disabled}
            />
            <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[26px] peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-[22px] after:w-[22px] after:transition-all peer-checked:bg-blue-600"></div>
        </label>
        <div className="flex-grow">
            <p className="text-[13px] font-black text-slate-800 uppercase tracking-tight leading-none mb-2">{label}</p>
            <p className="text-[11px] text-slate-400 font-bold leading-normal">{subtext}</p>
        </div>
    </div>
);

interface InputFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  type?: string;
  className?: string;
  placeholder?: string;
}

const InputField: React.FC<InputFieldProps> = ({ label, name, value, onChange, type = 'text', className = '', placeholder }) => (
  <div className={className}>
    <label htmlFor={name} className="block text-xs font-bold text-gray-500 uppercase mb-1">{label}</label>
    <input type={type} name={name} id={name} value={value} onChange={onChange} placeholder={placeholder} className="input-field" />
  </div>
);

const InsuranceFormSection: React.FC<{
  title: string;
  data: Partial<Insurance>;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  namePrefix: string;
}> = ({ title, data, onChange, namePrefix }) => (
  <fieldset className="border border-gray-200 p-4 rounded-lg bg-white shadow-sm mt-4">
    <legend className="text-xs font-bold text-gray-500 uppercase tracking-widest px-2">{title}</legend>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-sm pt-2">
      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Company</label>
        <input type="text" name={`${namePrefix}.company`} value={data.company || ''} onChange={onChange} className="input-field" />
      </div>
      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Plan</label>
        <input type="text" name={`${namePrefix}.plan`} value={data.plan || ''} onChange={onChange} className="input-field" />
      </div>
      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Group #</label>
        <input type="text" name={`${namePrefix}.groupNumber`} value={data.groupNumber || ''} onChange={onChange} className="input-field" />
      </div>
      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Policy #</label>
        <input type="text" name={`${namePrefix}.policyNumber`} value={data.policyNumber || ''} onChange={onChange} className="input-field" />
      </div>
      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Subscriber ID</label>
        <input type="text" name={`${namePrefix}.subscriberId`} value={data.subscriberId || ''} onChange={onChange} className="input-field" />
      </div>
      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Relationship</label>
        <select name={`${namePrefix}.relationship`} value={data.relationship || ''} onChange={onChange} className="input-field">
          <option value="">Select...</option>
          <option>Self</option>
          <option>Spouse</option>
          <option>Child</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Effective Date</label>
        <input type="date" name={`${namePrefix}.policyEffectiveDate`} value={data.policyEffectiveDate || ''} onChange={onChange} className="input-field"/>
      </div>
       <div className="flex items-center pt-4">
        <input type="checkbox" name={`${namePrefix}.isActive`} checked={data.isActive || false} onChange={onChange} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
        <label className="ml-2 block text-xs font-bold text-gray-600 uppercase">Is Active</label>
      </div>
      <div className="md:col-span-2">
        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Coverage (Annual / Used)</label>
        <div className="flex items-center space-x-2">
          <input type="number" placeholder="Total" name={`${namePrefix}.coverage`} value={data.coverage ?? ''} onChange={onChange} className="input-field" />
          <span className="text-gray-500 font-bold">/</span>
          <input type="number" placeholder="Used" name={`${namePrefix}.used`} value={data.used ?? ''} onChange={onChange} className="input-field" />
        </div>
        {data.coverage != null && data.coverage > 0 && (
          <div className="mt-2 px-1">
            <div className="flex justify-between text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-tighter">
              <span>Remaining: ${(data.coverage - (data.used || 0)).toFixed(2)}</span>
              <span>{(((data.used || 0) / data.coverage) * 100).toFixed(0)}% Used</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div className="bg-blue-600 h-1.5 rounded-full shadow-sm" style={{ width: `${Math.min(((data.used || 0) / data.coverage) * 100, 100)}%` }}></div>
            </div>
          </div>
        )}
      </div>
      <div className="md:col-span-2">
        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Deductible (Total / Met)</label>
         <div className="flex items-center space-x-2">
          <input type="number" placeholder="Total" name={`${namePrefix}.deductible`} value={data.deductible ?? ''} onChange={onChange} className="input-field" />
          <span className="text-gray-500 font-bold">/</span>
          <input type="number" placeholder="Met" name={`${namePrefix}.met`} value={data.met ?? ''} onChange={onChange} className="input-field" />
        </div>
        {data.deductible != null && data.deductible > 0 && (
           <div className="mt-2 px-1">
            <div className="flex justify-between text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-tighter">
              <span>Remaining: ${(data.deductible - (data.met || 0)).toFixed(2)}</span>
              <span>{(((data.met || 0) / data.deductible) * 100).toFixed(0)}% Met</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div className="bg-green-600 h-1.5 rounded-full shadow-sm" style={{ width: `${Math.min(((data.met || 0) / data.deductible) * 100, 100)}%` }}></div>
            </div>
          </div>
        )}
      </div>
    </div>
  </fieldset>
);


const PatientSearch: React.FC<{ onSelect: (id: number) => void, getStatusClass: (status: PatientStatus) => string }> = ({ onSelect, getStatusClass }) => {
  const { state, dispatch } = useSimulationContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setSearchShowFilters] = useState(false);
  const [filterInsurance, setFilterInsurance] = useState('');
  const [filterLastVisit, setFilterLastVisit] = useState('');

  const filteredPatients = state.patients.filter(p => {
    const term = searchTerm.toLowerCase();
    const matchesTerm = !term || (
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(term) ||
      p.id.toString().includes(term) ||
      p.id.toString() === term ||
      p.dob.includes(term)
    );

    const matchesInsurance = !filterInsurance || (
       (p.primaryInsurance?.company.toLowerCase().includes(filterInsurance.toLowerCase()) ||
       p.secondaryInsurance?.company.toLowerCase().includes(filterInsurance.toLowerCase()))
    );

    const matchesLastVisit = !filterLastVisit || (p.lastVisitDate && p.lastVisitDate >= filterLastVisit);

    return matchesTerm && matchesInsurance && matchesLastVisit;
  });

  const handleSelect = (id: number) => {
    dispatch({ type: 'SELECT_PATIENT', payload: id });
    onSelect(id);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-800">Patient Directory</h3>
        <p className="text-sm text-gray-500 mt-1">Search the master database or create a new profile.</p>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex gap-3 items-center">
          <div className="relative flex-grow">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </span>
            <input 
              type="text"
              placeholder="Enter name, patient ID, or date of birth (YYYY-MM-DD)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
          </div>
          <button 
            onClick={() => setSearchShowFilters(!showFilters)} 
            className={`px-4 py-3 border rounded-lg text-gray-600 hover:bg-gray-100 transition-all ${showFilters ? 'bg-blue-50 border-blue-300 text-blue-600' : 'bg-white border-gray-300'}`}
            title="Advanced Filters"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 a2 2 0 110-4m0 4v2m0-6V4" /></svg>
          </button>
        </div>
        
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50/30 border-b border-gray-100 animate-fade-in-fast">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Insurance Carrier</label>
              <input 
                type="text" 
                placeholder="e.g. Delta Dental, MetLife"
                value={filterInsurance}
                onChange={(e) => setFilterInsurance(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Visited Since</label>
              <input 
                type="date" 
                value={filterLastVisit}
                onChange={(e) => setFilterLastVisit(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>
          </div>
        )}

        <ul className="max-h-[500px] overflow-y-auto divide-y divide-gray-100">
          {filteredPatients.map(p => (
            <li 
              key={p.id} 
              className="p-4 hover:bg-blue-50 cursor-pointer flex justify-between items-center transition-colors group"
              onClick={() => handleSelect(p.id)}
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-blue-100 group-hover:text-blue-500 transition-colors">
                  {p.photoUrl ? <img src={p.photoUrl} className="w-full h-full rounded-full object-cover" /> : <span className="font-bold text-lg">{p.lastName[0]}</span>}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-800 text-base">{p.lastName}, {p.firstName}</span>
                    {p.status !== 'Active' && (
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${getStatusClass(p.status)}`}>
                        {p.status}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center text-xs text-gray-400 space-x-2">
                    <span>ID: {p.id}</span>
                    <span>•</span>
                    <span>DOB: {p.dob}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Last Visit</div>
                <div className="text-sm font-medium text-gray-600">{p.lastVisitDate || 'Never'}</div>
              </div>
            </li>
          ))}
          {filteredPatients.length === 0 && (
            <li className="p-12 text-center">
              <div className="text-4xl mb-2">🤷‍♂️</div>
              <p className="text-gray-500 font-medium">No matching patients found.</p>
              <button 
                onClick={() => { setSearchTerm(''); setFilterInsurance(''); setFilterLastVisit(''); }} 
                className="mt-4 text-blue-600 font-bold hover:underline"
              >
                Clear all search criteria
              </button>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default FamilyFile;
