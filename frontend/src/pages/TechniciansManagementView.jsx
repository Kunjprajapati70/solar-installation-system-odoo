import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Wrench,
  UserCheck,
  Star,
  Clock,
  CheckCircle2,
  Phone,
  Mail,
  ShieldCheck,
  Plus,
  X
} from 'lucide-react';
import Pagination from '../components/ui/Pagination';

const TechniciansManagementView = () => {
  const { user } = useAuth();
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    specialization: 'Inverter Wiring, Testing & Commissioning'
  });

  const fetchTechnicians = async () => {
    try {
      setLoading(true);
      const res = await api.get('/technicians');
      if (res.success) {
        setTechnicians(res.data);
      }
    } catch (err) {
      console.error('Fetch technicians error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTechnicians();
  }, []);

  const handleAddTechnician = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/users', {
        name: form.name,
        email: form.email,
        phone: form.phone,
        role: 'technician',
        technicianDetails: {
          specialization: form.specialization.split(',').map(s => s.trim()),
          rating: 5.0,
          totalJobsCompleted: 0,
          certification: 'MNRE Certified Solar Technician'
        }
      });
      if (res.success) {
        alert('Technician added to team successfully!');
        setShowAddModal(false);
        fetchTechnicians();
      }
    } catch (err) {
      alert(`Failed to add: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl glass-card border border-solar-500/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-solar-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Wrench className="w-3.5 h-3.5" />
            <span>Field Workforce & Dispatch Hub</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Certified Solar <span className="gradient-solar-text">Technicians (15)</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            15 MNRE certified solar rooftop engineers with workload tracking, skill sets, and customer satisfaction ratings.
          </p>
        </div>

        {user?.role === 'admin' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-solar-500 hover:bg-solar-400 text-midnight-950 font-bold text-xs shadow-glow-solar"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Technician</span>
          </button>
        )}
      </div>

      {/* Technicians Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {technicians.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((tech) => (
          <div key={tech._id} className="p-4 rounded-2xl glass-card border border-slate-800 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center font-bold text-midnight-950">
                  {tech.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">{tech.name}</h3>
                  <p className="text-[10px] text-emerald-400 font-semibold">
                    {tech.technicianDetails?.certification || 'Certified Master Installer'}
                  </p>
                </div>
              </div>

              <span className="flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                <Star className="w-3 h-3 fill-current mr-1" />
                {tech.technicianDetails?.rating || 4.8}
              </span>
            </div>

            {/* Contact Details */}
            <div className="space-y-1 text-xs text-slate-400 font-mono">
              <p className="flex items-center">
                <Phone className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                {tech.phone}
              </p>
              <p className="flex items-center">
                <Mail className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                {tech.email}
              </p>
            </div>

            {/* Specialization Badges */}
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">Expertise:</span>
              <div className="flex flex-wrap gap-1">
                {(tech.technicianDetails?.specialization || ['Inverter Wiring', 'Mounting Structure', 'Earthing']).map((skill, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 text-[10px]">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Stats Row */}
            <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2 text-xs font-mono text-center">
              <div className="p-2 bg-slate-900 rounded-lg">
                <span className="text-[10px] text-slate-400 block uppercase">Completed</span>
                <span className="text-emerald-400 font-bold">{tech.completedInstallations || tech.technicianDetails?.totalJobsCompleted || 0} Jobs</span>
              </div>
              <div className="p-2 bg-slate-900 rounded-lg">
                <span className="text-[10px] text-slate-400 block uppercase">Active Workload</span>
                <span className="text-amber-400 font-bold">{tech.activeInstallations || 0} Active</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {technicians.length > pageSize && (
        <div className="p-3 border-t border-slate-800">
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(technicians.length / pageSize) || 1}
            onPageChange={(p) => setCurrentPage(p)}
            totalItems={technicians.length}
            pageSize={pageSize}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
            }}
          />
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card w-full max-w-md rounded-2xl border border-slate-700 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Plus className="w-5 h-5 text-solar-400" />
                <span>Onboard Certified Technician</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddTechnician} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Specializations (Comma-separated)</label>
                <input
                  type="text"
                  value={form.specialization}
                  onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-solar-500 hover:bg-solar-400 text-midnight-950 font-bold rounded-lg shadow-glow-solar"
                >
                  Add Technician
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TechniciansManagementView;
