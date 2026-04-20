"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Plus, Pencil, Trash2, Star } from 'lucide-react';

interface Address {
  id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

const EMPTY_FORM = { fullName: '', phone: '', addressLine1: '', addressLine2: '', city: '', state: '', pincode: '', isDefault: false };

const inputCls = "w-full bg-transparent border-b border-kallos-ivory/20 py-3 text-kallos-ivory placeholder:text-kallos-ivory/30 focus:outline-none focus:border-kallos-gold transition-colors text-sm";
const labelCls = "block text-[10px] tracking-[0.3em] text-kallos-ivory/60 uppercase mb-2";

export default function AddressesPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Address | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: addresses = [], isLoading } = useQuery<Address[]>({
    queryKey: ['addresses'],
    queryFn: () => api.get('/users/addresses'),
  });

  const addMutation = useMutation({
    mutationFn: () => api.post('/users/addresses', form),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['addresses'] }); setAdding(false); setForm(EMPTY_FORM); },
  });

  const updateMutation = useMutation({
    mutationFn: () => api.put(`/users/addresses/${editing!.id}`, form),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['addresses'] }); setEditing(null); setForm(EMPTY_FORM); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/users/addresses/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['addresses'] }),
  });

  const defaultMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/users/addresses/${id}/default`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['addresses'] }),
  });

  const openEdit = (addr: Address) => {
    setEditing(addr);
    setForm({ fullName: addr.fullName, phone: addr.phone, addressLine1: addr.addressLine1, addressLine2: addr.addressLine2 ?? '', city: addr.city, state: addr.state, pincode: addr.pincode, isDefault: addr.isDefault });
    setAdding(false);
  };

  const openAdd = () => { setAdding(true); setEditing(null); setForm(EMPTY_FORM); };
  const closeForm = () => { setAdding(false); setEditing(null); setForm(EMPTY_FORM); };

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [f]: f === 'isDefault' ? (e.target as HTMLInputElement).checked : e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    editing ? updateMutation.mutate() : addMutation.mutate();
  };

  const isPending = addMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <div className="flex items-center justify-between mb-10">
        <div>
          <p className="text-[10px] tracking-[0.4em] text-kallos-gold uppercase mb-2">Saved</p>
          <h1 className="font-editorial text-4xl text-kallos-ivory">Addresses</h1>
        </div>
        {!adding && !editing && (
          <button onClick={openAdd} className="flex items-center gap-2 px-5 py-3 border border-kallos-ivory/20 text-kallos-ivory text-xs tracking-[0.2em] uppercase hover:border-kallos-gold hover:text-kallos-gold transition-colors">
            <Plus className="w-3 h-3" /> Add New
          </button>
        )}
      </div>

      {/* Form */}
      {(adding || editing) && (
        <form onSubmit={handleSubmit} className="bg-kallos-charcoal p-6 mb-8 space-y-5">
          <h2 className="text-xs tracking-[0.3em] uppercase text-kallos-ivory/60 mb-2">
            {editing ? 'Edit Address' : 'New Address'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div><label className={labelCls}>Full Name</label><input className={inputCls} value={form.fullName} onChange={set('fullName')} required placeholder="As on ID" /></div>
            <div><label className={labelCls}>Phone</label><input className={inputCls} value={form.phone} onChange={set('phone')} required placeholder="10-digit mobile" /></div>
          </div>
          <div><label className={labelCls}>Address Line 1</label><input className={inputCls} value={form.addressLine1} onChange={set('addressLine1')} required placeholder="House / Flat / Building" /></div>
          <div><label className={labelCls}>Address Line 2 (optional)</label><input className={inputCls} value={form.addressLine2} onChange={set('addressLine2')} placeholder="Area / Landmark" /></div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div><label className={labelCls}>City</label><input className={inputCls} value={form.city} onChange={set('city')} required /></div>
            <div><label className={labelCls}>State</label><input className={inputCls} value={form.state} onChange={set('state')} required /></div>
            <div><label className={labelCls}>Pincode</label><input className={inputCls} value={form.pincode} onChange={set('pincode')} required placeholder="6 digits" maxLength={6} /></div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.isDefault} onChange={set('isDefault')} className="accent-kallos-gold" />
            <span className="text-xs text-kallos-ivory/60 tracking-wide">Set as default address</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={isPending} className="px-8 py-3 bg-kallos-ivory text-kallos-black text-xs tracking-[0.3em] uppercase hover:bg-kallos-gold transition-colors disabled:opacity-50">
              {isPending ? 'Saving...' : editing ? 'Update' : 'Save Address'}
            </button>
            <button type="button" onClick={closeForm} className="px-6 py-3 border border-kallos-ivory/20 text-kallos-ivory text-xs tracking-[0.2em] uppercase hover:border-kallos-ivory/40 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="space-y-4">{[...Array(2)].map((_, i) => <div key={i} className="h-28 bg-kallos-charcoal animate-pulse" />)}</div>
      ) : addresses.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-kallos-warm-grey">No addresses saved yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {addresses.map(addr => (
            <div key={addr.id} className={`bg-kallos-charcoal p-6 border-l-2 ${addr.isDefault ? 'border-kallos-gold' : 'border-transparent'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="text-sm space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-kallos-ivory font-medium">{addr.fullName}</p>
                    {addr.isDefault && <span className="text-[9px] tracking-[0.2em] uppercase text-kallos-gold">Default</span>}
                  </div>
                  <p className="text-kallos-warm-grey">{addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}</p>
                  <p className="text-kallos-warm-grey">{addr.city}, {addr.state} — {addr.pincode}</p>
                  <p className="text-kallos-warm-grey">{addr.phone}</p>
                </div>
                <div className="flex gap-3 flex-shrink-0">
                  {!addr.isDefault && (
                    <button onClick={() => defaultMutation.mutate(addr.id)} title="Set as default" className="text-kallos-warm-grey hover:text-kallos-gold transition-colors">
                      <Star className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => openEdit(addr)} className="text-kallos-warm-grey hover:text-kallos-ivory transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteMutation.mutate(addr.id)} disabled={deleteMutation.isPending} className="text-kallos-warm-grey hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
