"use client";

import { useState, useTransition } from "react";
import { Search, MapPin, DollarSign, CheckCircle2, Loader2, Briefcase, MessageCircle } from "lucide-react";
import { Candidate, Requirement, Client } from "@prisma/client";
import { triggerPlacement } from "@/actions/placement";
import { useRouter } from "next/navigation";
import { toast } from 'sonner';

type ReqWithClient = Requirement & { client: Client };

export default function ClientMatchPage({ openRequirements }: { openRequirements: ReqWithClient[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [matches, setMatches] = useState<Candidate[]>([]);
  const [selectedReq, setSelectedReq] = useState<ReqWithClient | null>(null);
  
  const [formData, setFormData] = useState({
    roleCategory: "MAID",
    workType: "LIVE_IN",
    maxBudget: "",
  });

  const handleSelectLead = (req: ReqWithClient) => {
    setSelectedReq(req);
    setFormData({
      roleCategory: req.requestedRole,
      workType: req.requestedType,
      maxBudget: req.budgetMax.toString(),
    });
  };

  const handleMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      
      if (data && Array.isArray(data.matches)) {
        setMatches(data.matches);
      } else {
        setMatches([]);
      }
    } catch (error) {
      console.error("Match failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlacement = (candidateId: string) => {
    if (!selectedReq) {
      toast.error("Please select a Client Lead first so we know who to place them with.");
      return;
    }

    startTransition(async () => {
      const result = await triggerPlacement(candidateId, selectedReq.clientId);
      if (result.success) {
        toast.success("Placement successfully created! Candidate status updated to ON TRIAL.");
        router.push('/dashboard/placements');
      } else {
        toast.error(result.error || "Placement failed");
      }
    });
  };

  const handleWhatsAppShare = (candidate: Candidate) => {
    if (!selectedReq) {
      toast.error("Please select a Client Lead first so we can format the message correctly.");
      return;
    }

    const message = `Hello ${selectedReq.client.fullName},

We found an excellent match for your ${selectedReq.requestedRole.toLowerCase()} requirement!

*Candidate Profile:*
Name: ${candidate.firstName} ${candidate.lastName}
Role: ${candidate.roleCategory} (${candidate.workType.replace('_', ' ')})
Expected Salary: ₹${candidate.salaryExpected}/month
Verification: ${candidate.isVerified ? '✅ Aadhaar Verified' : 'Pending'}

Let us know if you would like to proceed with a trial placement for this candidate.
- MyBuddyMaid OS`;

    const encodedMessage = encodeURIComponent(message);
    const cleanPhone = selectedReq.client.phone.replace(/[^a-zA-Z0-9]/g, '');
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex justify-between items-end pb-4 border-b border-zinc-200">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Smart Match Engine</h1>
          <p className="text-sm text-zinc-500 mt-1">Select an active lead to query the database and trigger placements.</p>
        </div>
      </div>

      {/* Active Leads Strip - Enterprise Styling */}
      <div className="bg-zinc-50 p-4 rounded-lg border border-zinc-200 shadow-sm">
        <h2 className="text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Briefcase className="w-3.5 h-3.5" /> Active Client Leads
        </h2>
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
          {openRequirements.length === 0 ? (
            <p className="text-sm text-zinc-500 font-medium">No active leads available. Sync from website or log manually.</p>
          ) : (
            openRequirements.map(req => (
              <button 
                key={req.id}
                onClick={() => handleSelectLead(req)}
                className={`flex-shrink-0 text-left px-4 py-3 rounded-md border transition-all min-w-[240px] ${
                  selectedReq?.id === req.id 
                  ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm' 
                  : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <p className="font-semibold text-sm truncate pr-4">
                    {req.client.fullName}
                  </p>
                  {selectedReq?.id === req.id && <CheckCircle2 className="w-4 h-4 text-white shrink-0" />}
                </div>
                <p className={`text-xs mt-1.5 font-medium ${selectedReq?.id === req.id ? 'text-zinc-300' : 'text-zinc-500'}`}>
                  {req.requestedType.replace('_', ' ')} {req.requestedRole} <span className="opacity-75">•</span> ₹{req.budgetMax}
                </p>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Requirement Intake Form / Filters */}
        <div className="col-span-1 bg-white p-5 rounded-lg border border-zinc-200 shadow-sm h-fit">
          <h2 className="text-sm font-semibold text-zinc-900 border-b border-zinc-100 pb-3 mb-4">Query Parameters</h2>
          <form onSubmit={handleMatch} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5 uppercase tracking-wide">Required Role</label>
              <select 
                className="w-full bg-white border border-zinc-300 rounded-md px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-colors"
                value={formData.roleCategory}
                onChange={(e) => setFormData({...formData, roleCategory: e.target.value})}
              >
                <option value="MAID">Maid</option>
                <option value="COOK">Cook</option>
                <option value="NANNY">Nanny</option>
                <option value="CAREGIVER">Elderly Caregiver</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5 uppercase tracking-wide">Work Type</label>
              <select 
                className="w-full bg-white border border-zinc-300 rounded-md px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-colors"
                value={formData.workType}
                onChange={(e) => setFormData({...formData, workType: e.target.value})}
              >
                <option value="LIVE_IN">Live-in (24/7)</option>
                <option value="TWELVE_HOUR">12-Hour Shift</option>
                <option value="EIGHT_HOUR">8-Hour Shift</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5 uppercase tracking-wide">Max Budget (₹)</label>
              <div className="relative">
                <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input 
                  type="number" 
                  placeholder="e.g. 15000" 
                  className="w-full pl-8 pr-3 py-2 bg-white border border-zinc-300 rounded-md text-sm text-zinc-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-colors"
                  value={formData.maxBudget}
                  onChange={(e) => setFormData({...formData, maxBudget: e.target.value})}
                />
              </div>
            </div>

            <div className="pt-2">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-zinc-900 text-white text-sm font-medium py-2.5 rounded-md hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2 shadow-sm disabled:bg-zinc-300"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Search className="w-4 h-4" /> Run Query</>}
              </button>
            </div>
          </form>
        </div>

        {/* Results Panel */}
        <div className="col-span-1 lg:col-span-3">
          <div className="bg-white rounded-lg border border-zinc-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-200 bg-zinc-50 flex justify-between items-center">
              <h2 className="text-sm font-semibold text-zinc-900">Query Results</h2>
              <span className="text-xs font-medium text-zinc-500">{matches.length} verified candidates found</span>
            </div>
            
            <div className="divide-y divide-zinc-100">
              {matches.length === 0 && !loading ? (
                <div className="p-12 text-center flex flex-col items-center">
                  <div className="w-12 h-12 bg-zinc-100 text-zinc-400 rounded-full flex items-center justify-center mb-4">
                    <Search className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-medium text-zinc-900">No matches found.</p>
                  <p className="text-xs text-zinc-500 mt-1">Select a lead and run the query to see candidates.</p>
                </div>
              ) : (
                matches.map((candidate) => (
                  <div key={candidate.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 hover:bg-zinc-50/50 transition-colors gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-zinc-100 rounded-md border border-zinc-200 flex items-center justify-center text-zinc-700 font-bold text-sm shrink-0">
                        {candidate.firstName.charAt(0)}
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-zinc-900 text-sm">{candidate.firstName} {candidate.lastName}</h3>
                          <span className="bg-green-50 text-green-700 text-[10px] font-semibold px-2 py-0.5 rounded border border-green-200 flex items-center gap-1 uppercase tracking-wide">
                            <CheckCircle2 className="w-3 h-3" /> Verified
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 font-medium flex items-center gap-2">
                          <span>{candidate.workType.replace('_', ' ')} {candidate.roleCategory}</span>
                          <span className="w-1 h-1 rounded-full bg-zinc-300"></span>
                          <span className="text-zinc-700 font-semibold">₹{candidate.salaryExpected}/mo</span>
                        </p>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
                      <button 
                        onClick={() => handleWhatsAppShare(candidate)}
                        disabled={!selectedReq}
                        title="Share Profile via WhatsApp"
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-white border border-[#25D366]/30 text-[#25D366] px-3 py-2 rounded-md text-xs font-semibold hover:bg-[#25D366]/5 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span className="sm:hidden">Share</span>
                      </button>
                      <button 
                        onClick={() => handlePlacement(candidate.id)}
                        disabled={isPending || !selectedReq}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-zinc-900 text-white px-4 py-2 rounded-md text-xs font-semibold hover:bg-zinc-800 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Select for Trial"}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}