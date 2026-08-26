'use client';

import { useState, useTransition } from 'react';
import { Placement, Candidate, Client } from '@prisma/client';
import { markFeePaid } from '@/actions/finance';
import { DollarSign, CheckCircle2, Clock, Loader2, Send } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

type FullPlacement = Placement & { candidate: Candidate; client: Client };

export default function FinanceClientPage({ placements }: { placements: FullPlacement[] }) {
  const [isPending, startTransition] = useTransition();

  const pendingFees = placements.filter(p => !p.feePaid);
  const paidFees = placements.filter(p => p.feePaid);

  const totalExpectedRevenue = pendingFees.reduce((sum, p) => sum + p.placementFee, 0);
  const totalCollectedRevenue = paidFees.reduce((sum, p) => sum + p.placementFee, 0);

  const handlePayment = (placementId: string) => {
    startTransition(async () => {
      const result = await markFeePaid(placementId);
      if (result.success) {
        toast.success("Payment logged! The 6-Month Replacement Guarantee has now officially started.");
      } else {
        toast.error(result.error || "Failed to log payment.");
      }
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      
      {/* Header & Revenue KPIs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-4 border-b border-zinc-200">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Fees & Finance</h1>
          <p className="text-sm text-zinc-500 mt-1">Manage placement fees, collection pipelines, and invoice generation.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="bg-white p-4 rounded-lg border border-zinc-200 shadow-sm min-w-[180px] flex flex-col justify-between relative overflow-hidden">
            <div className="absolute left-0 top-0 w-1 h-full bg-amber-500"></div>
            <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1 pl-2">Pending Collection</p>
            <p className="text-2xl font-bold text-zinc-900 tracking-tight pl-2">₹{totalExpectedRevenue.toLocaleString()}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-zinc-200 shadow-sm min-w-[180px] flex flex-col justify-between relative overflow-hidden">
            <div className="absolute left-0 top-0 w-1 h-full bg-emerald-500"></div>
            <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1 pl-2">Collected Revenue</p>
            <p className="text-2xl font-bold text-zinc-900 tracking-tight pl-2">₹{totalCollectedRevenue.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Split View: Pending vs Paid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Pending Invoices */}
        <div className="bg-white rounded-lg border border-zinc-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 bg-zinc-50 border-b border-zinc-200 flex justify-between items-center">
            <h2 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" /> Pending Placements
            </h2>
            <span className="bg-white border border-zinc-200 text-zinc-600 text-[10px] font-bold px-2 py-0.5 rounded shadow-sm tracking-wide">
              {pendingFees.length} Pending
            </span>
          </div>
          <div className="p-5 space-y-3 flex-1 overflow-y-auto">
            {pendingFees.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center">
                <CheckCircle2 className="w-8 h-8 text-zinc-300 mb-3" />
                <p className="text-sm text-zinc-500 font-medium">All placement fees collected.</p>
              </div>
            ) : (
              pendingFees.map(placement => (
                <div key={placement.id} className="bg-white border border-zinc-200 rounded-md p-4 hover:border-zinc-300 transition-colors shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-zinc-900 text-sm">{placement.client.fullName}</h3>
                      <p className="text-xs text-zinc-500 mt-1">Placed: <span className="font-medium text-zinc-700">{placement.candidate.firstName}</span> ({placement.candidate.roleCategory})</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-amber-600">₹{placement.placementFee.toLocaleString()}</p>
                      <p className="text-[10px] text-zinc-400 uppercase font-semibold mt-0.5 tracking-wider">Placement Fee</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-3 pt-3 border-t border-zinc-100">
                    <button className="flex-1 bg-white border border-zinc-200 text-zinc-700 py-1.5 rounded-md text-xs font-semibold hover:bg-zinc-50 transition-colors flex items-center justify-center gap-1.5 shadow-sm">
                      <Send className="w-3.5 h-3.5 text-zinc-400" /> Send Link
                    </button>
                    <button 
                      onClick={() => handlePayment(placement.id)}
                      disabled={isPending}
                      className="flex-1 bg-zinc-900 text-white py-1.5 rounded-md text-xs font-semibold hover:bg-zinc-800 transition-colors flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                    >
                      {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Mark Paid"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Collected Invoices */}
        <div className="bg-white rounded-lg border border-zinc-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 bg-zinc-50 border-b border-zinc-200 flex justify-between items-center">
            <h2 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Collected & Active
            </h2>
          </div>
          <div className="p-5 space-y-3 flex-1 overflow-y-auto">
            {paidFees.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center">
                <DollarSign className="w-8 h-8 text-zinc-300 mb-3" />
                <p className="text-sm text-zinc-500 font-medium">No collected revenues yet.</p>
              </div>
            ) : (
              paidFees.map(placement => (
                <div key={placement.id} className="bg-white border border-emerald-200/60 rounded-md p-4 flex justify-between items-center shadow-sm">
                  <div>
                    <h3 className="font-semibold text-zinc-900 text-sm">{placement.client.fullName}</h3>
                    <p className="text-xs text-zinc-500 mt-1">Placed: <span className="font-medium text-zinc-700">{placement.candidate.firstName}</span></p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    <p className="font-semibold text-emerald-700">₹{placement.placementFee.toLocaleString()}</p>
                    <Link 
                      href={`/dashboard/finance/receipt/${placement.id}`} 
                      className="text-[10px] bg-white border border-zinc-200 text-zinc-700 px-2 py-1 rounded-sm hover:bg-zinc-50 transition-colors uppercase font-bold flex items-center gap-1 tracking-wider shadow-sm"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" /> View Receipt
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}