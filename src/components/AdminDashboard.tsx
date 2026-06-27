import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { X, Users, RefreshCw, ShieldCheck } from 'lucide-react';
import { getAllUsers, UserProfile } from '../services/firebaseService';

interface AdminDashboardProps {
  onClose: () => void;
}

export default function AdminDashboard({ onClose }: AdminDashboardProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    const data = await getAllUsers();
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-peacock/80 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="w-full max-w-4xl max-h-[85vh] glass rounded-3xl flex flex-col shadow-2xl overflow-hidden border border-marigold/30"
      >
        {/* Header */}
        <div className="p-6 border-b border-marigold/20 flex flex-row items-center justify-between bg-peacock/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-marigold/20 flex items-center justify-center text-marigold">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 className="text-xl font-serif font-bold text-marigold">Admin Dashboard</h2>
              <p className="text-xs text-cream/60">Overview of all registered users</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchUsers}
              className="p-2 rounded-full hover:bg-cream/10 text-cream/70 transition-colors"
              title="Refresh"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-terracotta/20 text-cream/70 hover:text-terracotta transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {loading ? (
            <div className="flex justify-center items-center py-20 text-marigold">
              <RefreshCw className="animate-spin" size={32} />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-sm text-cream/70">
                <Users size={16} />
                <span>Total Users: <strong className="text-cream">{users.length}</strong></span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-cream/80">
                  <thead className="text-xs uppercase bg-peacock/60 text-marigold border-b border-marigold/20">
                    <tr>
                      <th className="px-4 py-3 rounded-tl-lg">Profile</th>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">UID</th>
                      <th className="px-4 py-3 rounded-tr-lg">Last Login</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.uid} className="border-b border-marigold/10 hover:bg-cream/5 transition-colors">
                        <td className="px-4 py-3">
                          <img 
                            src={u.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.displayName || 'User')}&background=random`} 
                            alt={u.displayName || 'User'} 
                            className="w-8 h-8 rounded-full border border-marigold/30"
                            referrerPolicy="no-referrer"
                          />
                        </td>
                        <td className="px-4 py-3 font-medium text-cream">{u.displayName || 'Unknown'}</td>
                        <td className="px-4 py-3 text-cream/70">{u.email || 'N/A'}</td>
                        <td className="px-4 py-3 text-xs font-mono text-cream/50">{u.uid}</td>
                        <td className="px-4 py-3 text-xs">
                          {u.lastLogin && u.lastLogin.toDate ? (
                            new Date(u.lastLogin.toDate()).toLocaleString()
                          ) : 'Recent'}
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-cream/50 italic">
                          No users found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
