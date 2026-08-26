import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { Printer, ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default async function ReceiptPage({ params }: { params: { id: string } }) {
  const placement = await prisma.placement.findUnique({
    where: { id: params.id },
    include: { client: true, candidate: true }
  });

  if (!placement) {
    notFound();
  }

  // Generate a mock invoice number
  const invoiceNumber = `INV-${placement.createdAt.getFullYear()}${(placement.createdAt.getMonth()+1).toString().padStart(2, '0')}-${placement.id.substring(0,6).toUpperCase()}`;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      
      {/* Action Bar (Hidden when printing) */}
      <div className="flex justify-between items-center print:hidden bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <Link href="/dashboard/finance" className="text-gray-500 hover:text-gray-800 flex items-center gap-2 font-medium transition">
          <ArrowLeft className="w-4 h-4" /> Back to Finance
        </Link>
        <button 
          className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2 shadow-sm transition"
        >
          <Printer className="w-4 h-4" /> Print Receipt
        </button>
      </div>

      {/* The Printable Invoice Document */}
      <div className="bg-white p-12 rounded-2xl border border-gray-200 shadow-lg print:shadow-none print:border-none print:p-0">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b border-gray-200 pb-8 mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight text-blue-600">MyBuddyMaid</h1>
            <p className="text-sm text-gray-500 mt-1">Official Placement Agency</p>
            <p className="text-sm text-gray-500">123 Business Towers, Mumbai, India</p>
            <p className="text-sm text-gray-500">support@mybuddymaid.com | +91 999 888 7777</p>
          </div>
          <div className="text-right">
            <h2 className="text-4xl font-bold text-gray-200 uppercase tracking-widest mb-2">Receipt</h2>
            <p className="text-sm font-bold text-gray-800">Invoice No: <span className="font-normal text-gray-600">{invoiceNumber}</span></p>
            <p className="text-sm font-bold text-gray-800">Date Issued: <span className="font-normal text-gray-600">{new Date().toLocaleDateString()}</span></p>
            {placement.feePaid ? (
              <div className="inline-flex items-center gap-1.5 mt-3 bg-green-50 text-green-700 px-3 py-1 rounded-md border border-green-200 font-bold text-sm">
                <ShieldCheck className="w-4 h-4" /> PAID IN FULL
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 mt-3 bg-amber-50 text-amber-700 px-3 py-1 rounded-md border border-amber-200 font-bold text-sm">
                PAYMENT PENDING
              </div>
            )}
          </div>
        </div>

        {/* Client & Candidate Info */}
        <div className="grid grid-cols-2 gap-12 mb-12">
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Billed To</h3>
            <p className="font-bold text-gray-900 text-lg">{placement.client.fullName}</p>
            <p className="text-sm text-gray-600 mt-1">{placement.client.address}</p>
            <p className="text-sm text-gray-600">{placement.client.city}</p>
            <p className="text-sm text-gray-600 mt-2 font-medium">{placement.client.phone}</p>
            <p className="text-sm text-gray-600">{placement.client.email || 'No email provided'}</p>
          </div>
          
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Placement Details</h3>
            <p className="text-sm text-slate-700"><span className="font-semibold">Worker:</span> {placement.candidate.firstName} {placement.candidate.lastName}</p>
            <p className="text-sm text-slate-700 mt-1"><span className="font-semibold">Role:</span> {placement.candidate.roleCategory.replace('_', ' ')}</p>
            <p className="text-sm text-slate-700 mt-1"><span className="font-semibold">Work Type:</span> {placement.candidate.workType.replace('_', ' ')}</p>
            <p className="text-sm text-slate-700 mt-1"><span className="font-semibold">Agreed Salary:</span> ₹{placement.agreedSalary}/mo</p>
            <p className="text-sm text-slate-700 mt-1"><span className="font-semibold">Guarantee Expiry:</span> {placement.guaranteeEnd ? placement.guaranteeEnd.toLocaleDateString() : 'N/A'}</p>
          </div>
        </div>

        {/* Line Items */}
        <table className="w-full text-left mb-12">
          <thead className="bg-slate-900 text-white">
            <tr>
              <th className="px-4 py-3 font-semibold text-sm rounded-tl-lg">Description</th>
              <th className="px-4 py-3 font-semibold text-sm text-right rounded-tr-lg">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr>
              <td className="px-4 py-6">
                <p className="font-bold text-gray-900">Agency Placement Fee</p>
                <p className="text-sm text-gray-500 mt-1">One-time sourcing and verification fee for domestic help placement. Includes 6-month free replacement guarantee.</p>
              </td>
              <td className="px-4 py-6 text-right font-bold text-gray-900">
                ₹{placement.placementFee}
              </td>
            </tr>
            {/* Taxes could go here */}
            <tr>
              <td className="px-4 py-4 text-right font-bold text-gray-600">Subtotal:</td>
              <td className="px-4 py-4 text-right font-semibold text-gray-600">₹{placement.placementFee}</td>
            </tr>
            <tr>
              <td className="px-4 py-4 text-right font-black text-gray-900 text-xl border-t-2 border-slate-900">Total:</td>
              <td className="px-4 py-4 text-right font-black text-blue-600 text-2xl border-t-2 border-slate-900">₹{placement.placementFee}</td>
            </tr>
          </tbody>
        </table>

        {/* Footer Notes */}
        <div className="text-center text-sm text-gray-500 pt-8 border-t border-gray-200">
          <p className="font-medium text-gray-700 mb-1">Thank you for choosing MyBuddyMaid!</p>
          <p>This is a computer-generated receipt and does not require a physical signature.</p>
        </div>

      </div>

      {/* Print script injection */}
      <script dangerouslySetInnerHTML={{
        __html: `
          document.querySelector('button')?.addEventListener('click', () => {
            window.print();
          });
        `
      }} />
    </div>
  );
}