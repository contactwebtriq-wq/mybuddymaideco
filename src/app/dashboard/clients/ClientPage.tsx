'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { Client, Requirement } from '@prisma/client';
import { createClientLead } from '@/actions/client';
import { deleteClients, updateClientLead } from '@/actions/client-mutations';
import { syncWebsiteLeads } from '@/actions/sync';
import { Search, Plus, Loader2, MapPin, Phone, Briefcase, Calendar, Trash2, Edit, Download, RefreshCw, X } from 'lucide-react';

type ClientWithReqs = Client & { requirements: Requirement[] };

export default function ClientsClientPage({ initialClients }: { initialClients: ClientWithReqs[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editModal, setEditModal] = useState<{ isOpen: boolean, client: ClientWithReqs | null }>({ isOpen: false, client: null });
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    syncWebsiteLeads().catch(() => {});
  }, []);

  const filteredClients = initialClients.filter(c => {
    const matchesSearch = c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.phone.includes(searchTerm) ||
                          c.city.toLowerCase().includes(searchTerm.toLowerCase());
    if (roleFilter === 'ALL') return matchesSearch;
    return matchesSearch && c.requirements.some(r => r.requestedRole === roleFilter);
  });

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedIds(new Set(filteredClients.map(c => c.id)));
    else setSelectedIds(new Set());
  };

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  async function handleAddLead(formData: FormData) {
    startTransition(async () => {
      const result = await createClientLead(formData);
      if (result.success) {
        setIsModalOpen(false);
        formRef.current?.reset();
      } else {
        alert(result.error);
      }
    });
  }

  async function handleEditLead(formData: FormData) {
    if (!editModal.client) return;
    startTransition(async () => {
      const data = {
        fullName: formData.get('fullName'),
        phone: formData.get('phone'),
        city: formData.get('city'),
        address: formData.get('address'),
        budgetMax: formData.get('budgetMax'),
        notes: formData.get('notes'),
        requirementId: editModal.client?.requirements[0]?.id
      };
      const updateExternal = formData.get('updateExternal') === 'on';
      const result = await updateClientLead(editModal.client!.id, data, updateExternal);
      if (result.success) {
        alert(result.message);
        setEditModal({ isOpen: false, client: null });
      } else {
        alert(result.error);
      }
    });
  }

  const handleDelete = (ids: string[]) => {
    if (!confirm(`Are you sure you want to delete ${ids.length} lead(s)?`)) return;
    const deleteFromExternal = confirm("Also permanently delete from the source website database? (Cancel to only hide from OS)");
    startTransition(async () => {
      const result = await deleteClients(ids, deleteFromExternal);
      if (result.success) {
        alert(result.message);
        setSelectedIds(new Set());
      } else {
        alert(result.error);
      }
    });
  };

  async function handleSync() {
    setIsSyncing(true);
    try {
      const result = await syncWebsiteLeads();
      alert(result.message || result.error);
    } finally {
      setIsSyncing(false);
    }
  }

  const handleExportCSV = () => {
    const headers = ['Name', 'Phone', 'Email', 'City', 'Service Required', 'Budget (INR)', 'Date Captured'];
    const rows = filteredClients.map(c => {
      const services = c.requirements.map(r => `${r.requestedType.replace('_', ' ')} ${r.requestedRole}`).join(' | ');
      const budgets = c.requirements.map(r => r.budgetMax).join(' | ');
      return [
        `"${c.fullName}"`,
        `"${c.phone}"`,
        `"${c.email || ''}"`,
        `"${c.city}"`,
        `"${services}"`,
        `"${budgets}"`,
        `"${new Date(c.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}"`
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `leads_export_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (dateString: Date) => {
    return new Date(dateString).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end pb-4 border-b border-zinc-200 gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Client Leads CRM</h1>
          <p className="text-sm text-zinc-500 mt-1">Manage households, track requirements, and sync securely with source data.</p>
        </div>
        <div className="flex flex-wrap sm:flex-nowrap gap-2">
          <button 
            onClick={handleExportCSV}
            className="inline-flex items-center justify-center gap-2 bg-white border border-zinc-200 text-zinc-700 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-zinc-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Download CSV"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
          <button 
            onClick={handleSync}
            disabled={isSyncing}
            className="inline-flex items-center justify-center gap-2 bg-white border border-zinc-200 text-zinc-700 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-zinc-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-blue-600' : ''}`} />
            <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Force Sync'}</span>
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 bg-zinc-900 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-zinc-800 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2"
          >
            <Plus className="w-4 h-4" /> Log Lead
          </button>
        </div>
      </div>

      {/* Filters & Bulk Actions */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-1">
          <div className="relative group max-w-sm w-full">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Search leads..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-9 pr-3 py-1.5 bg-white border border-zinc-300 rounded-md text-sm focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-colors shadow-sm"
            />
          </div>
          <select 
            value={roleFilter} 
            onChange={(e) => setRoleFilter(e.target.value)}
            className="block w-full sm:w-48 px-3 py-1.5 bg-white border border-zinc-300 rounded-md text-sm text-zinc-700 focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-colors shadow-sm font-medium"
          >
            <option value="ALL">All Services</option>
            <option value="MAID">Maid</option>
            <option value="COOK">Cook</option>
            <option value="NANNY">Nanny</option>
            <option value="CAREGIVER">Elderly Care</option>
          </select>
        </div>

        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 bg-zinc-50 px-3 py-1.5 rounded-md border border-zinc-200">
            <span className="text-xs font-semibold text-zinc-700">{selectedIds.size} Selected</span>
            <button 
              onClick={() => handleDelete(Array.from(selectedIds))}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 bg-white border border-zinc-200 text-red-600 px-2.5 py-1 rounded text-xs font-medium hover:bg-red-50 hover:border-red-200 transition-colors shadow-sm disabled:opacity-50"
            >
              {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />} Delete All
            </button>
          </div>
        )}
      </div>

      {/* Data Grid - High Density Enterprise Table */}
      <div className="bg-white rounded-lg border border-zinc-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input 
                    type="checkbox" 
                    onChange={handleSelectAll} 
                    checked={filteredClients.length > 0 && selectedIds.size === filteredClients.length}
                    className="w-3.5 h-3.5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Client Info</th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Service Required</th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Time & Date</th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-sm">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-zinc-500 bg-white">
                    <Briefcase className="w-6 h-6 text-zinc-300 mx-auto mb-2" />
                    <p className="font-medium">No leads found in this view.</p>
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => (
                  <tr key={client.id} className={`transition-colors ${selectedIds.has(client.id) ? 'bg-zinc-50' : 'hover:bg-zinc-50/50'}`}>
                    <td className="px-4 py-3">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.has(client.id)}
                        onChange={() => toggleSelection(client.id)}
                        className="w-3.5 h-3.5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-zinc-900">{client.fullName}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-zinc-500">
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {client.phone}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {client.city}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {client.requirements.map(req => (
                        <div key={req.id} className="flex flex-col gap-0.5 mb-1 last:mb-0">
                          <span className="bg-zinc-100 text-zinc-800 border border-zinc-200 px-2 py-0.5 rounded text-[11px] font-semibold w-max uppercase tracking-wide">
                            {req.requestedType.replace('_', ' ')} {req.requestedRole}
                          </span>
                          <span className="text-xs font-medium text-zinc-500">Budget: ₹{req.budgetMax}</span>
                        </div>
                      ))}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-xs text-zinc-600 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                        {formatDate(client.createdAt)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button 
                          onClick={() => setEditModal({ isOpen: true, client })}
                          className="inline-flex items-center justify-center p-1.5 text-zinc-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="Edit Lead"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete([client.id])}
                          disabled={isPending}
                          className="inline-flex items-center justify-center p-1.5 text-zinc-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                          title="Delete Lead"
                        >
                          {isPending && selectedIds.has(client.id) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
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

      {/* Edit Lead Modal */}
      {editModal.isOpen && editModal.client && (
        <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full overflow-hidden flex flex-col border border-zinc-200">
            <div className="px-5 py-4 border-b border-zinc-200 flex justify-between items-center bg-zinc-50">
              <h2 className="text-lg font-semibold text-zinc-900 tracking-tight">Edit Lead: {editModal.client.fullName}</h2>
              <button onClick={() => setEditModal({ isOpen: false, client: null })} className="text-zinc-400 hover:text-zinc-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto">
              <form action={handleEditLead} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1 uppercase tracking-wide">Full Name</label>
                    <input name="fullName" defaultValue={editModal.client.fullName} required type="text" className="block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1 uppercase tracking-wide">Phone Number</label>
                    <input name="phone" defaultValue={editModal.client.phone} required type="text" className="block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1 uppercase tracking-wide">City</label>
                    <input name="city" defaultValue={editModal.client.city} required type="text" className="block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1 uppercase tracking-wide">Budget (₹)</label>
                    <input name="budgetMax" defaultValue={editModal.client.requirements[0]?.budgetMax} required type="number" className="block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-zinc-700 mb-1 uppercase tracking-wide">Notes</label>
                    <textarea name="notes" defaultValue={editModal.client.requirements[0]?.notes || ''} rows={3} className="block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"></textarea>
                  </div>
                </div>

                <div className="bg-zinc-50 p-4 rounded-md border border-zinc-200 flex items-start gap-3 mt-2">
                  <input type="checkbox" name="updateExternal" id="updateExternal" className="mt-0.5 w-4 h-4 text-blue-600 border-zinc-300 rounded focus:ring-blue-600" />
                  <label htmlFor="updateExternal" className="text-sm font-medium text-zinc-900 cursor-pointer">
                    Sync edit to external database
                    <span className="block text-xs font-normal text-zinc-500 mt-0.5">Applies this change to the source webhook database.</span>
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-4 mt-2 border-t border-zinc-200">
                  <button type="button" onClick={() => setEditModal({ isOpen: false, client: null })} className="px-4 py-2 border border-zinc-300 text-zinc-700 rounded-md text-sm font-medium hover:bg-zinc-50 transition-colors shadow-sm">
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

      {/* Add Lead Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full overflow-hidden flex flex-col border border-zinc-200 max-h-[90vh]">
            <div className="px-5 py-4 border-b border-zinc-200 flex justify-between items-center bg-zinc-50">
              <h2 className="text-lg font-semibold text-zinc-900 tracking-tight">Log New Lead</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto">
              <form action={handleAddLead} ref={formRef} className="space-y-5">
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-100 pb-1">Household Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1 uppercase tracking-wide">Full Name</label>
                      <input name="fullName" required type="text" className="block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1 uppercase tracking-wide">Phone</label>
                      <input name="phone" required type="tel" className="block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1 uppercase tracking-wide">Email</label>
                      <input name="email" type="email" className="block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1 uppercase tracking-wide">City</label>
                      <input name="city" required type="text" className="block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-zinc-700 mb-1 uppercase tracking-wide">Address</label>
                      <input name="address" required type="text" className="block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-100 pb-1 pt-2">Requirements</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1 uppercase tracking-wide">Role</label>
                      <select name="requestedRole" className="block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 bg-white">
                        <option value="MAID">Maid</option>
                        <option value="COOK">Cook</option>
                        <option value="NANNY">Nanny</option>
                        <option value="CAREGIVER">Caregiver</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1 uppercase tracking-wide">Shift</label>
                      <select name="requestedType" className="block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 bg-white">
                        <option value="LIVE_IN">Live In (24/7)</option>
                        <option value="TWELVE_HOUR">12 Hour Shift</option>
                        <option value="EIGHT_HOUR">8 Hour Shift</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-zinc-700 mb-1 uppercase tracking-wide">Max Budget (₹)</label>
                      <input name="budgetMax" required type="number" className="block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-zinc-700 mb-1 uppercase tracking-wide">Notes</label>
                      <textarea name="notes" rows={3} className="block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"></textarea>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 mt-2 border-t border-zinc-200">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-zinc-300 text-zinc-700 rounded-md text-sm font-medium hover:bg-zinc-50 transition-colors shadow-sm">
                    Cancel
                  </button>
                  <button type="submit" disabled={isPending} className="px-4 py-2 bg-zinc-900 text-white rounded-md text-sm font-medium hover:bg-zinc-800 flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50">
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Lead"}
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