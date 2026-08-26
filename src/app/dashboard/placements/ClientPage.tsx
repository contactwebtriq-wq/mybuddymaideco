'use client';

import { useState, useTransition } from 'react';
import { Placement, Candidate, Client, CandidateStatus } from '@prisma/client';
import { editPlacementDetails, terminatePlacement } from '@/actions/placement-mutations';
import { ShieldCheck, AlertTriangle, Calendar, Edit, XCircle, Loader2, Clock, Search, X } from 'lucide-react';
import { toast } from 'sonner';

type FullPlacement = Placement & { candidate: Candidate; client: Client };

export default function PlacementsClientPage({ initialPlacements }: { initialPlacements: FullPlacement[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [isPending, startTransition] = useTransition();

  // Modals
  const [editModal, setEditModal] = useState<{ isOpen: boolean, placement: FullPlacement | null }>({ isOpen: false, placement: null });
  const [terminateModal, setTerminateModal] = useState<{ isOpen: boolean, placement: FullPlacement | null }>({ isOpen: false, placement: null });

  const filteredPlacements = initialPlacements.filter(p => {
    const matchesSearch = p.client.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.candidate.firstName.toLowerCase().includes(searchTerm.toLowerCase());
    if (filterStatus === 'ALL') return matchesSearch;
    return matchesSearch && p.status === filterStatus;
  });

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editModal.placement) return;
    
    const formData = new FormData(e.currentTarget);
    const newSalary = parseInt(formData.get('agreedSalary') as string, 10);

    startTransition(async () => {
      const result = await editPlacementDetails(editModal.placement!.id, newSalary);
      if (result.success) {
        setEditModal({ isOpen: false, placement: null });
        toast.success("Placement agreement updated.");
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleTerminateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!terminateModal.placement) return;

    const formData = new FormData(e.currentTarget);
    const newWorkerStatus = formData.get('workerStatus') as CandidateStatus;
    const reopenRequirement = formData.get('reopenRequirement') === 'true';

    startTransition(async () => {
      const result = await terminatePlacement(
        terminateModal.placement!.id,
        terminateModal.placement!.candidateId,
        terminateModal.placement!.clientId,
        newWorkerStatus,
        reopenRequirement
      );

      if (result.success) {
        setTerminateModal({ isOpen: false, placement: null });
        toast.success(result.message);
      } else {
        toast.error(result.error);
      }
    });
  };

  const getDaysPassed = (date: Date) => {
    const diff = new Date().getTime() - new Date(date).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end pb-4 border-b border-zinc-200 gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Placement Operations</h1>
          <p className="text-sm text-zinc-500 mt-1">Manage active trials, modify agreements, and process lifecycle events.</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative group w-full max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-blue-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search by client or worker name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-9 pr-3 py-1.5 bg-white border border-zinc-300 rounded-md text-sm focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-colors shadow-sm"
          />
        </div>
        <select 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)}
          className="block w-full sm:w-48 px-3 py-1.5 bg-white border border-zinc-300 rounded-md text-sm text-zinc-700 focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-colors shadow-sm font-medium"
        >
          <option value="ALL">All Statuses</option>
          <option value="TRIAL">On Trial</option>
          <option value="ACTIVE">Active (Paid)</option>
          <option value="TERMINATED">Terminated / Replaced</option>
        </select>
      </div>

      {/* Data Grid */}
      <div className="bg-white rounded-lg border border-zinc-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Household (Client)</th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Worker (Candidate)</th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Agreement Terms</th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Lifecycle State</th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right">Operational Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-sm">
              {filteredPlacements.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-zinc-500 bg-white">
                    <p className="font-medium">No placements found.</p>
                  </td>
                </tr>
              ) : (
                filteredPlacements.map(placement => {
                  const daysPassed = getDaysPassed(placement.createdAt);
                  
                  let guaranteeMsg = <span className="text-zinc-500 text-xs font-medium flex items-center gap-1.5"><Clock className="w-3.5 h-3.5"/> Pending Payment</span>;
                  if (placement.status === 'TERMINATED') {
                     guaranteeMsg = <span className="text-zinc-500 text-xs font-medium flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5"/> Contract Ended</span>;
                  } else if (placement.guaranteeEnd) {
                    const diffTime = new Date(placement.guaranteeEnd).getTime() - new Date().getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    guaranteeMsg = diffDays > 0 
                      ? <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px] font-semibold flex items-center gap-1 w-max uppercase tracking-wide"><ShieldCheck className="w-3.5 h-3.5" /> {diffDays} Days Left</span>
                      : <span className="text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200 text-[11px] font-semibold flex items-center gap-1 w-max uppercase tracking-wide"><AlertTriangle className="w-3.5 h-3.5" /> Expired</span>;
                  }

                  return (
                    <tr key={placement.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-zinc-900">{placement.client.fullName}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">{placement.client.phone}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-zinc-900">{placement.candidate.firstName} {placement.candidate.lastName}</p>
                        <p className="text-[11px] bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded uppercase font-semibold w-max mt-1 text-zinc-600 tracking-wide">
                          {placement.candidate.workType.replace('_', ' ')} {placement.candidate.roleCategory}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-zinc-900">₹{placement.agreedSalary}<span className="text-xs text-zinc-500 font-normal">/mo</span></p>
                        <p className="text-xs text-zinc-500 font-medium flex items-center gap-1.5 mt-1">
                          <Calendar className="w-3 h-3" /> Started {new Date(placement.createdAt).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1.5">
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded w-max border uppercase tracking-wide ${
                            placement.status === 'ACTIVE' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' :
                            placement.status === 'TRIAL' ? 'text-amber-700 bg-amber-50 border-amber-200' :
                            'text-zinc-700 bg-zinc-100 border-zinc-200'
                          }`}>
                            {placement.status === 'TRIAL' ? `ON TRIAL (Day ${daysPassed})` : placement.status}
                          </span>
                          {guaranteeMsg}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {placement.status !== 'TERMINATED' && (
                          <div className="flex items-center justify-end gap-1.5">
                            <button 
                              onClick={() => setEditModal({ isOpen: true, placement })}
                              className="inline-flex items-center justify-center p-1.5 text-zinc-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                              title="Edit Details"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => setTerminateModal({ isOpen: true, placement })}
                              className="inline-flex items-center justify-center p-1.5 text-zinc-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                              title="Terminate Placement"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Agreement Modal */}
      {editModal.isOpen && editModal.placement && (
        <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full overflow-hidden border border-zinc-200">
            <div className="px-5 py-4 border-b border-zinc-200 flex justify-between items-center bg-zinc-50">
              <h2 className="text-lg font-semibold text-zinc-900 tracking-tight">Edit Agreement</h2>
              <button onClick={() => setEditModal({ isOpen: false, placement: null })} className="text-zinc-400 hover:text-zinc-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5">
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5 uppercase tracking-wide">Agreed Monthly Salary (₹)</label>
                  <input 
                    name="agreedSalary" 
                    defaultValue={editModal.placement.agreedSalary} 
                    required 
                    type="number" 
                    className="w-full bg-white border border-zinc-300 rounded-md px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-colors" 
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4 mt-2 border-t border-zinc-100">
                  <button type="button" onClick={() => setEditModal({ isOpen: false, placement: null })} className="px-4 py-2 border border-zinc-300 text-zinc-700 rounded-md text-sm font-medium hover:bg-zinc-50 transition-colors shadow-sm">
                    Cancel
                  </button>
                  <button type="submit" disabled={isPending} className="px-4 py-2 bg-zinc-900 text-white rounded-md text-sm font-medium hover:bg-zinc-800 flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50">
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Terminate Placement Modal */}
      {terminateModal.isOpen && terminateModal.placement && (
        <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full overflow-hidden border border-zinc-200">
             <div className="bg-red-50 p-5 border-b border-red-100 flex items-start gap-4">
              <div className="bg-red-100 text-red-600 p-2.5 rounded-md shrink-0 border border-red-200">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-red-900 tracking-tight">Terminate Placement</h2>
                <p className="text-red-700 text-sm mt-1 leading-relaxed">
                  You are terminating the contract between <strong>{terminateModal.placement.client.fullName}</strong> and <strong>{terminateModal.placement.candidate.firstName}</strong>.
                </p>
              </div>
            </div>
            
            <div className="p-5">
              <form onSubmit={handleTerminateSubmit} className="space-y-5">
                
                <div>
                  <label className="block text-xs font-semibold text-zinc-900 mb-2 uppercase tracking-wide">Worker Status Assignment</label>
                  <select name="workerStatus" className="w-full bg-zinc-50 border border-zinc-300 rounded-md px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600 font-medium">
                    <option value="AVAILABLE">Make AVAILABLE (Return to candidate pool)</option>
                    <option value="BLACKLISTED">BLACKLIST Worker (Do Not Use)</option>
                  </select>
                </div>

                <div className="bg-white p-4 rounded-md border border-zinc-200 shadow-sm">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="radio" name="reopenRequirement" value="true" defaultChecked className="mt-0.5 w-4 h-4 text-blue-600 border-zinc-300 focus:ring-blue-600" />
                    <div>
                      <span className="block text-sm font-semibold text-zinc-900">Client Needs a Replacement</span>
                      <span className="block text-xs text-zinc-500 mt-1">This will send the client back to the Match Engine so you can find them a new worker.</span>
                    </div>
                  </label>
                </div>

                <div className="bg-zinc-50 p-4 rounded-md border border-zinc-200 shadow-sm">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="radio" name="reopenRequirement" value="false" className="mt-0.5 w-4 h-4 text-zinc-600 border-zinc-300 focus:ring-zinc-600" />
                    <div>
                      <span className="block text-sm font-semibold text-zinc-900">Contract Ended (No Replacement)</span>
                      <span className="block text-xs text-zinc-500 mt-1">The contract is simply over or the client cancelled completely.</span>
                    </div>
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-4 mt-2 border-t border-zinc-200">
                  <button type="button" onClick={() => setTerminateModal({ isOpen: false, placement: null })} className="px-4 py-2 border border-zinc-300 text-zinc-700 rounded-md text-sm font-medium hover:bg-zinc-50 transition-colors shadow-sm">
                    Cancel
                  </button>
                  <button type="submit" disabled={isPending} className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50">
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Termination"}
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