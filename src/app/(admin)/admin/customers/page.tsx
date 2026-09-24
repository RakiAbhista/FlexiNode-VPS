"use client";

import React, { useState, useEffect } from "react";
import { Users, Search, Ban, CheckCircle2, X } from "lucide-react";
import { User } from "@/lib/data/types";
import { dataSource } from "@/lib/data";
import { formatRupiah } from "@/lib/utils";

export default function AdminCustomersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await dataSource.getAllUsers();
      setUsers(data.filter((u) => u.role === "CUSTOMER"));
      setLoading(false);
    }
    load();
  }, []);

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Manajemen Customer</h1>
          <p className="text-xs text-neutral-600">Daftar pelanggan terdaftar dan pemantauan saldo.</p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
          <input
            type="text"
            placeholder="Cari nama atau email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </div>

      {/* Customer Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-x-auto shadow-sm">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-navy-900 font-bold">
            <tr>
              <th className="p-4">Nama Pelanggan</th>
              <th className="p-4">Email</th>
              <th className="p-4">Saldo Wallet</th>
              <th className="p-4">Tanggal Daftar</th>
              <th className="p-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-neutral-700">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50">
                <td className="p-4 font-bold text-navy-900">{user.name}</td>
                <td className="p-4 font-mono">{user.email}</td>
                <td className="p-4 font-bold text-blue-600">{formatRupiah(user.balance)}</td>
                <td className="p-4">
                  {new Date(user.createdAt).toLocaleDateString("id-ID")}
                </td>
                <td className="p-4 text-center">
                  <button
                    onClick={() => setSelectedUser(user)}
                    className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-navy-900 font-bold rounded-lg transition-colors"
                  >
                    Detail
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Customer Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-navy-900">Detail Pelanggan</h3>
              <button onClick={() => setSelectedUser(null)} className="text-neutral-400 hover:text-navy-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-neutral-500">ID User:</span>
                <span className="font-mono font-bold text-navy-900">{selectedUser.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-neutral-500">Nama:</span>
                <span className="font-bold text-navy-900">{selectedUser.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-neutral-500">Email:</span>
                <span className="font-mono text-navy-900">{selectedUser.email}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-neutral-500">Saldo:</span>
                <span className="font-bold text-blue-600">{formatRupiah(selectedUser.balance)}</span>
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                onClick={() => {
                  alert(`User ${selectedUser.name} telah dibekukan (suspend).`);
                  setSelectedUser(null);
                }}
                className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl border border-red-200 flex items-center justify-center gap-1.5"
              >
                <Ban className="w-4 h-4 text-red-600" />
                <span>Suspend User Ini</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
