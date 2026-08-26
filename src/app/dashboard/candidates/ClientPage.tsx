'use client';

import { useState, useTransition, useRef, useCallback } from 'react';
import { Candidate, Placement, Client, CandidateStatus, RoleCategory, WorkType } from '@prisma/client';
import { createCandidate } from '@/actions/candidate';
import { verifyCandidateDocument } from '@/actions/verification';
import { deleteCandidates, updateCandidateProfile } from '@/actions/candidate-mutations';
import { CheckCircle2, XCircle, Search, Plus, Loader2, UploadCloud, FileText, AlertCircle, Trash2, Edit, UserCircle, Phone, X } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

type CandidateWithPlacements = Candidate & { 
  placements: (Placement & { client: Client })[] 
};

export default function CandidatesClientPage({ initialCandidates }: { initialCandidates: CandidateWithPlacements[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editModal, setEditModal] = useState<{ isOpen: boolean, candidate: CandidateWithPlacements | null }>({ isOpen: false, candidate: null });
  const [verifyModal, setVerifyModal] = useState<{ isOpen: boolean, candidateId: string | null, docType: 'AADHAAR' | 'POLICE_CHECK' | null }>({
    isOpen: false, candidateId: null, docType: null
  });

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [isPending, startTransition] = useTransition();
  const [uploadProgress, setUploadProgress] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);

  const filteredCandidates = initialCandidates.filter(c => 
    c.firstName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedIds(new Set(filteredCandidates.map(c => c.id)));
    else setSelectedIds(new Set());
  };

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  async function handleAdd(formData: FormData) {
    startTransition(async () => {
      const result = await createCandidate(formData);
      if (result.success) {
        setIsAddModalOpen(false);
        formRef.current?.reset();
      } else {
        alert(result.error);
      }
    });
  }

  async function handleEdit(formData: FormData) {
    if (!editModal.candidate) return;
    startTransition(async () => {
      const data = {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        phone: formData.get('phone'),
        roleCategory: formData.get('roleCategory'),
        workType: formData.get('workType'),
        salaryExpected: formData.get('salaryExpected'),
        status: formData.get('status'),
      };
      
      const result = await updateCandidateProfile(editModal.candidate!.id, data);
      if (result.success) {
        setEditModal({ isOpen: false, candidate: null });
      } else {
        alert(result.error);
      }
    });
  }

  const handleDelete = (ids: string[]) => {
    if (!confirm(`Are you sure you want to delete ${ids.length} candidate(s)? Any active placements will be automatically removed.`)) return;
    
    startTransition(async () => {
      const result = await deleteCandidates(ids);
      if (result.success) {
        setSelectedIds(new Set());
      } else {
        alert(result.error);
      }
    });
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0 || !verifyModal.candidateId || !verifyModal.docType) return;
    
    setUploadProgress(10);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 20;
      });
    }, 200);

    startTransition(async () => {
      const result = await verifyCandidateDocument(verifyModal.candidateId!, verifyModal.docType!);
      clearInterval(interval);
      setUploadProgress(100);
      
      setTimeout(() => {
        if (result.success) {
          setVerifyModal({ isOpen: false, candidateId: null, docType: null });
          setUploadProgress(0);
        } else {
          alert(result.error || "Failed to verify document.");
          setUploadProgress(0);
        }
      }, 500);
    });
  }, [verifyModal]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png'], 'application/pdf': ['.pdf'] },
    maxFiles: 1
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end pb-4 border-b border-zinc-200 gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Candidates CRM</h1>
          <p className="text-sm text-zinc-500 mt-1">Manage profiles, documentation, and placement statuses.</p>
        </div>
        <div className="flex flex-wrap sm:flex-nowrap gap-2">
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 bg-zinc-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-zinc-800 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2"
          >
            <Plus className="w-4 h-4" /> Add Candidate
          </button>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative group w-full max-w-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-zinc-400 group-focus-within:text-blue-500 transition-colors" />
          </div>
          <input 
            type="text" 
            placeholder="Search by name or phone..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-9 pr-3 py-2 bg-white border border-zinc-300 rounded-md text-sm focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-colors shadow-sm"
          />
        </div>

        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 bg-zinc-50 px-3 py-1.5 rounded-md border border-zinc-200 animate-in fade-in">
            <span className="text-xs font-semibold text-zinc-700">{selectedIds.size} Selected</span>
            <button 
              onClick={() => handleDelete(Array.from(selectedIds))}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 bg-white border border-zinc-200 text-red-600 px-2.5 py-1 rounded text-xs font-medium hover:bg-red-50 hover:border-red-200 transition-colors shadow-sm disabled:opacity-50"
            >
              {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />} Delete
            </button>
          </div>
        )}
      </div>

      {/* Data Grid */}
      <div className="bg-white rounded-lg border border-zinc-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input 
                    type="checkbox" 
                    onChange={handleSelectAll} 
                    checked={filteredCandidates.length > 0 && selectedIds.size === filteredCandidates.length}
                    className="w-3.5 h-3.5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Profile</th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Service Details</th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Verification</th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Current Assignment</th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-sm">
              {filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-zinc-500 bg-white">
                    <UserCircle className="w-8 h-8 text-zinc-300 mx-auto mb-3" />
                    <p className="font-medium">No candidates found.</p>
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((candidate) => (
                  <tr key={candidate.id} className={`transition-colors ${selectedIds.has(candidate.id) ? 'bg-zinc-50' : 'hover:bg-zinc-50/50'}`}>
                    <td className="px-4 py-3">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.has(candidate.id)}
                        onChange={() => toggleSelection(candidate.id)}
                        className="w-3.5 h-3.5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-zinc-900">{candidate.firstName} {candidate.lastName}</p>
                      <p className="text-xs text-zinc-500 font-medium flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" /> {candidate.phone}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className="bg-zinc-100 text-zinc-800 border border-zinc-200 px-2 py-0.5 rounded text-[11px] font-semibold w-max uppercase tracking-wide">
                          {candidate.workType.replace('_', ' ')} {candidate.roleCategory}
                        </span>
                        <span className="text-xs font-semibold text-emerald-700">₹{candidate.salaryExpected}/mo</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-2">
                        {/* Aadhaar Status */}
                        <div className="flex items-center justify-between w-48">
                          <span className="text-xs font-semibold text-zinc-500">Aadhaar:</span>
                          {candidate.isVerified ? (
                            <span className="flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 tracking-wide"><CheckCircle2 className="w-3 h-3 mr-1" /> VERIFIED</span>
                          ) : (
                            <button onClick={() => setVerifyModal({ isOpen: true, candidateId: candidate.id, docType: 'AADHAAR' })} className="text-[10px] font-bold text-blue-700 bg-white hover:bg-blue-50 px-2 py-0.5 rounded border border-blue-200 transition-colors shadow-sm tracking-wide">UPLOAD ID</button>
                          )}
                        </div>
                        {/* Police Status */}
                        <div className="flex items-center justify-between w-48">
                          <span className="text-xs font-semibold text-zinc-500">Police Check:</span>
                          {candidate.policeVerified ? (
                            <span className="flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 tracking-wide"><CheckCircle2 className="w-3 h-3 mr-1" /> CLEARED</span>
                          ) : (
                            <button onClick={() => setVerifyModal({ isOpen: true, candidateId: candidate.id, docType: 'POLICE_CHECK' })} className="text-[10px] font-bold text-amber-700 bg-white hover:bg-amber-50 px-2 py-0.5 rounded border border-amber-200 transition-colors shadow-sm tracking-wide">VERIFY NOW</button>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {candidate.placements.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wide">Placed With:</span>
                          <span className="text-sm font-semibold text-zinc-900">{candidate.placements[0].client.fullName}</span>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded w-max border uppercase tracking-wide ${
                            candidate.status === 'AVAILABLE' ? 'text-blue-700 bg-blue-50 border-blue-200' :
                            candidate.status === 'BLACKLISTED' ? 'text-red-700 bg-red-50 border-red-200' :
                            'text-zinc-700 bg-zinc-100 border-zinc-200'
                          }`}>
                            {candidate.status.replace('_', ' ')}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button 
                          onClick={() => setEditModal({ isOpen: true, candidate })}
                          className="inline-flex items-center justify-center p-1.5 text-zinc-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="Edit Candidate"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete([candidate.id])}
                          disabled={isPending}
                          className="inline-flex items-center justify-center p-1.5 text-zinc-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                          title="Delete Candidate"
                        >
                          {isPending && selectedIds.has(candidate.id) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Candidate Modal */}
      {editModal.isOpen && editModal.candidate && (
        <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full overflow-hidden flex flex-col border border-zinc-200 max-h-[90vh]">
            <div className="px-5 py-4 border-b border-zinc-200 flex justify-between items-center bg-zinc-50">
              <h2 className="text-lg font-semibold text-zinc-900 tracking-tight">Edit Profile: {editModal.candidate.firstName}</h2>
              <button onClick={() => setEditModal({ isOpen: false, candidate: null })} className="text-zinc-400 hover:text-zinc-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto">
              <form action={handleEdit} className="space-y-5">
                <div className="bg-zinc-50 p-4 rounded-md border border-zinc-200 mb-2">
                  <label className="block text-xs font-bold text-zinc-700 mb-2 uppercase tracking-wide">Operational Status</label>
                  <select name="status" defaultValue={editModal.candidate.status} className="block w-full px-3 py-2 bg-white border border-zinc-300 rounded-md text-sm font-medium focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-colors shadow-sm">
                    <option value="AVAILABLE">AVAILABLE (Searching for Jobs)</option>
                    <option value="PENDING_VERIFICATION">PENDING VERIFICATION (Requires Docs)</option>
                    <option value="ON_TRIAL">ON TRIAL (Active with a client)</option>
                    <option value="PLACED">PLACED (Permanently placed)</option>
                    <option value="BLACKLISTED">BLACKLISTED (Fired / Do Not Use)</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1 uppercase tracking-wide">First Name</label>
                    <input name="firstName" defaultValue={editModal.candidate.firstName} required type="text" className="block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1 uppercase tracking-wide">Last Name</label>
                    <input name="lastName" defaultValue={editModal.candidate.lastName} required type="text" className="block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-zinc-700 mb-1 uppercase tracking-wide">Phone Number</label>
                    <input name="phone" defaultValue={editModal.candidate.phone} required type="tel" className="block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1 uppercase tracking-wide">Role</label>
                    <select name="roleCategory" defaultValue={editModal.candidate.roleCategory} className="block w-full px-3 py-2 bg-white border border-zinc-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600">
                      <option value="MAID">Maid</option>
                      <option value="COOK">Cook</option>
                      <option value="NANNY">Nanny</option>
                      <option value="CAREGIVER">Caregiver</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1 uppercase tracking-wide">Work Type</label>
                    <select name="workType" defaultValue={editModal.candidate.workType} className="block w-full px-3 py-2 bg-white border border-zinc-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600">
                      <option value="LIVE_IN">Live In</option>
                      <option value="TWELVE_HOUR">12 Hour</option>
                      <option value="EIGHT_HOUR">8 Hour</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-zinc-700 mb-1 uppercase tracking-wide">Monthly Salary Expected (₹)</label>
                    <input name="salaryExpected" defaultValue={editModal.candidate.salaryExpected} required type="number" className="block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600" />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 mt-2 border-t border-zinc-200">
                  <button type="button" onClick={() => setEditModal({ isOpen: false, candidate: null })} className="px-4 py-2 border border-zinc-300 text-zinc-700 rounded-md text-sm font-medium hover:bg-zinc-50 transition-colors shadow-sm">
                    Cancel
                  </button>
                  <button type="submit" disabled={isPending} className="px-4 py-2 bg-zinc-900 text-white rounded-md text-sm font-medium hover:bg-zinc-800 flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50">
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Profile"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Verification Dropzone Modal */}
      {verifyModal.isOpen && (
        <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6 text-center border border-zinc-200">
            <div className="w-12 h-12 bg-zinc-100 text-zinc-700 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-200 shadow-sm">
              {verifyModal.docType === 'AADHAAR' ? <FileText className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
            </div>
            <h2 className="text-lg font-semibold text-zinc-900 mb-1 tracking-tight">
              Upload {verifyModal.docType === 'AADHAAR' ? 'Aadhaar Card' : 'Police Clearance'}
            </h2>
            <p className="text-xs text-zinc-500 mb-6">
              Please upload a clear, legible PDF or image.
            </p>

            <div 
              {...getRootProps()} 
              className={`border border-dashed rounded-lg p-8 transition-colors cursor-pointer ${
                isDragActive ? 'border-blue-500 bg-blue-50' : 'border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50'
              } ${isPending ? 'pointer-events-none opacity-50' : ''}`}
            >
              <input {...getInputProps()} />
              <UploadCloud className={`w-8 h-8 mx-auto mb-3 ${isDragActive ? 'text-blue-500' : 'text-zinc-400'}`} />
              <p className="text-sm font-medium text-zinc-700">
                {isDragActive ? "Drop the file here..." : "Drag & drop file, or click"}
              </p>
            </div>

            {uploadProgress > 0 && (
              <div className="mt-6 text-left">
                <div className="flex justify-between text-xs font-semibold mb-1.5 text-zinc-600">
                  <span>Uploading securely...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-blue-600 h-1.5 rounded-full transition-all duration-200" 
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-zinc-200">
              <button 
                onClick={() => setVerifyModal({ isOpen: false, candidateId: null, docType: null })}
                disabled={isPending}
                className="text-zinc-500 hover:text-zinc-900 font-medium text-sm transition-colors"
              >
                Cancel Upload
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Candidate Modal */}
      {isAddModalOpen && (
         <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full overflow-hidden flex flex-col border border-zinc-200 max-h-[90vh]">
            <div className="px-5 py-4 border-b border-zinc-200 flex justify-between items-center bg-zinc-50">
              <h2 className="text-lg font-semibold text-zinc-900 tracking-tight">Add New Candidate</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto">
              <form action={handleAdd} ref={formRef} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1 uppercase tracking-wide">First Name</label>
                    <input name="firstName" required type="text" className="block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1 uppercase tracking-wide">Last Name</label>
                    <input name="lastName" required type="text" className="block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-zinc-700 mb-1 uppercase tracking-wide">Phone Number</label>
                    <input name="phone" required type="tel" className="block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1 uppercase tracking-wide">Role</label>
                    <select name="roleCategory" className="block w-full px-3 py-2 bg-white border border-zinc-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600">
                      <option value="MAID">Maid</option>
                      <option value="COOK">Cook</option>
                      <option value="NANNY">Nanny</option>
                      <option value="CAREGIVER">Caregiver</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1 uppercase tracking-wide">Work Type</label>
                    <select name="workType" className="block w-full px-3 py-2 bg-white border border-zinc-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600">
                      <option value="LIVE_IN">Live In</option>
                      <option value="TWELVE_HOUR">12 Hour</option>
                      <option value="EIGHT_HOUR">8 Hour</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-zinc-700 mb-1 uppercase tracking-wide">Monthly Salary Expected (₹)</label>
                    <input name="salaryExpected" required type="number" className="block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600" />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 mt-2 border-t border-zinc-200">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 border border-zinc-300 text-zinc-700 rounded-md text-sm font-medium hover:bg-zinc-50 transition-colors shadow-sm">
                    Cancel
                  </button>
                  <button type="submit" disabled={isPending} className="px-4 py-2 bg-zinc-900 text-white rounded-md text-sm font-medium hover:bg-zinc-800 flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50">
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Profile"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}