import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import {
  Users,
  UserPlus,
  Shield,
  Key,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Copy,
  Check,
  Clock,
  Eye,
  RefreshCw,
  Building,
  Phone,
  Mail,
  UserCheck,
  Lock,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';

const UserManagementView = () => {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const isAdmin = currentUser?.role === 'admin';
  const isSales = currentUser?.role === 'sales';

  const [activeTab, setActiveTab] = useState('directory'); // 'directory' | 'pending_requests'
  const [users, setUsers] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [createdUserCredentials, setCreatedUserCredentials] = useState(null);
  const [copied, setCopied] = useState(false);
  const [selectedUserForDetail, setSelectedUserForDetail] = useState(null);

  // Approval / Rejection Modal for pending requests
  const [approvalModalState, setApprovalModalState] = useState({
    isOpen: false,
    request: null,
    action: 'approve', // 'approve' | 'reject'
    reviewNotes: '',
    rejectionReason: '',
    submitting: false
  });

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    userId: '',
    phone: '',
    role: 'sales',
    department: 'Sales & Marketing',
    password: '',
    autoGeneratePassword: true,
    mustChangePassword: true
  });
  const [submittingUser, setSubmittingUser] = useState(false);

  useEffect(() => {
    fetchUsers();
    if (isAdmin) {
      fetchPendingRequests();
    }
  }, [roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;

      const res = await api.get('/users', { params });
      if (res.success) {
        setUsers(res.data || []);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const res = await api.get('/approvals', {
        params: { requestType: 'user_creation', status: 'pending' }
      });
      if (res.success) {
        setPendingRequests(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load pending user requests:', err);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleOpenAddUser = () => {
    const defaultRole = isSales ? 'technician' : 'sales';
    const prefix = defaultRole === 'technician' ? 'TEC' : defaultRole === 'customer' ? 'CUST' : defaultRole === 'admin' ? 'ADM' : 'SALES';
    const randomId = `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
    const randomPass = `Solar@${Math.floor(1000 + Math.random() * 9000)}!`;

    const generatedPass = `SunPower@${Math.floor(1000 + Math.random() * 9000)}`;
    setFormData({
      name: '',
      email: '',
      userId: isAdmin ? randomId : '',
      phone: '',
      role: defaultRole,
      department: isSales ? 'Field Engineering' : 'Sales & Marketing',
      password: isAdmin ? randomPass : '',
      mustChangePassword: true
    });
    setIsAddUserModalOpen(true);
  };

  const handleCreateOrRequestUser = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      showToast('Name and email are required', 'warning');
      return;
    }
    if (isAdmin && (!formData.userId?.trim() || !formData.password?.trim())) {
      showToast('Admin must assign a User ID and password for this account', 'warning');
      return;
    }

    try {
      setSubmittingUser(true);
      const payload = {
        name: formData.name,
        email: formData.email,
        userId: formData.userId?.trim(),
        phone: formData.phone,
        role: formData.role,
        department: formData.department,
        password: formData.password,
        mustChangePassword: formData.mustChangePassword
      };

      const res = await api.post('/users', payload);

      if (res.success) {
        setIsAddUserModalOpen(false);
        if (isAdmin) {
          showToast('User created successfully with assigned User ID', 'success');
          setCreatedUserCredentials(res.data);
          fetchUsers();
        } else {
          showToast('User request submitted. Awaiting Administrator approval.', 'info');
          fetchUsers();
        }
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to process user creation', 'error');
    } finally {
      setSubmittingUser(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!createdUserCredentials) return;
    const credText = `SunPower Solutions Login Credentials:\nUser ID: ${createdUserCredentials.userId}\nEmail: ${createdUserCredentials.email}\nInitial Password: ${createdUserCredentials.temporaryPassword || formData.password}\nRole: ${createdUserCredentials.role.toUpperCase()}\nStatus: Password change required upon first login.`;
    navigator.clipboard.writeText(credText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    showToast('Credentials copied to clipboard!', 'success');
  };

  const handleToggleUserStatus = async (user) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await api.put(`/users/${user._id}/status`, { status: newStatus });
      if (res.success) {
        showToast(`User ${user.name} status updated to ${newStatus}`, 'success');
        fetchUsers();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update user status', 'error');
    }
  };

  const handleApproveRequest = async () => {
    const { request, reviewNotes } = approvalModalState;
    try {
      setApprovalModalState((prev) => ({ ...prev, submitting: true }));
      const res = await api.put(`/approvals/${request._id}/approve`, { reviewNotes });
      if (res.success) {
        showToast(`Request #${request.requestNumber} approved successfully!`, 'success');
        setApprovalModalState({ isOpen: false, request: null, action: 'approve', reviewNotes: '', rejectionReason: '', submitting: false });
        fetchPendingRequests();
        fetchUsers();
        if (res.data?.createdArtifact) {
          setCreatedUserCredentials(res.data.createdArtifact);
        }
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Approval failed', 'error');
      setApprovalModalState((prev) => ({ ...prev, submitting: false }));
    }
  };

  const handleRejectRequest = async () => {
    const { request, rejectionReason, reviewNotes } = approvalModalState;
    if (!rejectionReason.trim()) {
      showToast('Rejection reason is mandatory', 'warning');
      return;
    }
    try {
      setApprovalModalState((prev) => ({ ...prev, submitting: true }));
      const res = await api.put(`/approvals/${request._id}/reject`, { rejectionReason, reviewNotes });
      if (res.success) {
        showToast(`Request #${request.requestNumber} rejected`, 'info');
        setApprovalModalState({ isOpen: false, request: null, action: 'approve', reviewNotes: '', rejectionReason: '', submitting: false });
        fetchPendingRequests();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Rejection failed', 'error');
      setApprovalModalState((prev) => ({ ...prev, submitting: false }));
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="command-hub-banner flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 sm:px-6 sm:py-5 rounded-3xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="hub-kicker flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
            <span>Role-Based Access Control • Identity Management</span>
          </div>
          <h1 className="hub-title text-2xl sm:text-3xl font-extrabold tracking-tight">
            User <span className="gradient-solar-text">Management</span>
          </h1>
          <p className="hub-sub text-xs sm:text-sm mt-1.5 max-w-2xl leading-relaxed">
            Provision, monitor, and enforce access security across Administrators, Sales Executives, Field Technicians, and Customer accounts.
          </p>
        </div>

        <div className="relative z-10 flex items-center space-x-3">
          <Button
            variant="primary"
            size="md"
            icon={UserPlus}
            onClick={handleOpenAddUser}
          >
            {isAdmin ? 'Add New User' : 'Request User Account'}
          </Button>
        </div>
        <div className="hub-glow pointer-events-none" />
      </div>

      {/* 2. Navigation Tabs (Directory vs Pending Requests) */}
      <div className="flex border-b border-slate-800 space-x-6">
        <button
          onClick={() => setActiveTab('directory')}
          className={`pb-3 text-sm font-semibold flex items-center space-x-2 border-b-2 transition-colors ${activeTab === 'directory'
            ? 'border-solar-500 text-solar-400'
            : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
        >
          <Users className="w-4 h-4" />
          <span>User Directory ({users.length})</span>
        </button>

        {isAdmin && (
          <button
            onClick={() => setActiveTab('pending_requests')}
            className={`pb-3 text-sm font-semibold flex items-center space-x-2 border-b-2 transition-colors ${activeTab === 'pending_requests'
              ? 'border-solar-500 text-solar-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
          >
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Pending Approvals</span>
            {pendingRequests.length > 0 && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30">
                {pendingRequests.length}
              </span>
            )}
          </button>
        )}
      </div>

      {/* 3. TAB 1: User Directory */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          {/* Search & Filters */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 rounded-2xl glass-card border border-slate-800">
            <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center space-x-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by User ID, Name, Email, or Phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-solar-500"
                />
              </div>
              <Button variant="secondary" size="md" type="submit">
                Search
              </Button>
            </form>

            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="bg-transparent text-slate-300 focus:outline-none cursor-pointer"
                >
                  <option value="">All Roles</option>
                  <option value="admin">Administrator</option>
                  <option value="sales">Sales Executive</option>
                  <option value="technician">Field Technician</option>
                  <option value="customer">Customer</option>
                </select>
              </div>

              <div className="flex items-center space-x-2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent text-slate-300 focus:outline-none cursor-pointer"
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending_approval">Pending Approval</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <Button
                variant="outline"
                size="md"
                icon={RefreshCw}
                onClick={fetchUsers}
                title="Refresh user list"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl glass-card border border-slate-800 shadow-xl">
            <table className="w-full text-left text-xs sm:text-sm text-slate-300 min-w-[1100px] border-collapse">
              <thead className="bg-slate-900/90 uppercase text-[11px] font-bold tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-5 py-4 w-[230px]">User ID & Name</th>
                  <th className="px-5 py-4 w-[280px]">Contact Details</th>
                  <th className="px-5 py-4 w-[190px]">Role & Department</th>
                  <th className="px-5 py-4 w-[140px]">Account Status</th>
                  <th className="px-5 py-4 w-[220px]">Security / First Login</th>
                  <th className="px-5 py-4 w-[190px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-5 py-12 text-center text-slate-400">
                      <div className="flex items-center justify-center space-x-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-solar-500" />
                        <span>Loading user directory...</span>
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-5 py-12 text-center text-slate-400">
                      No users found matching current filters.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u._id} className="hover:bg-slate-800/40 transition-colors">
                      {/* User ID & Name */}
                      <td className="px-5 py-4 align-middle">
                        <p className="font-bold text-white text-sm truncate max-w-[210px]">{u.name}</p>
                        <p className="text-[11px] font-mono text-solar-400 mt-0.5 tracking-wider font-semibold">
                          {u.userId || `USR-${u._id.slice(-6).toUpperCase()}`}
                        </p>
                      </td>

                      {/* Contact Details */}
                      <td className="px-5 py-4 align-middle">
                        <p className="flex items-center gap-2 text-slate-300 text-xs">
                          <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="truncate max-w-[240px]" title={u.email}>{u.email}</span>
                        </p>
                        {u.phone && (
                          <p className="flex items-center gap-2 text-slate-400 text-xs mt-1">
                            <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span>{u.phone}</span>
                          </p>
                        )}
                      </td>

                      {/* Role & Department */}
                      <td className="px-5 py-4 align-middle">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold capitalize whitespace-nowrap ${
                            u.role === 'admin'
                              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                              : u.role === 'sales'
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                              : u.role === 'technician'
                              ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                              : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {u.role}
                        </span>
                        <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5 whitespace-nowrap">
                          <Building className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>{u.department || (u.role === 'technician' ? 'Field Engineering' : 'Operations')}</span>
                        </p>
                      </td>

                      {/* Account Status */}
                      <td className="px-5 py-4 align-middle whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            u.status === 'active' || (!u.status && u.isActive)
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : u.status === 'pending_approval'
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                              : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {u.status === 'active' || (!u.status && u.isActive) ? (
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          ) : (
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          )}
                          <span className="capitalize">{u.status || (u.isActive ? 'active' : 'inactive')}</span>
                        </span>
                      </td>

                      {/* Security / First Login */}
                      <td className="px-5 py-4 align-middle whitespace-nowrap">
                        {u.mustChangePassword ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-medium">
                            <Lock className="w-3.5 h-3.5 shrink-0" />
                            <span>First-Login Change Required</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium">
                            <Check className="w-3.5 h-3.5 shrink-0" />
                            <span>Password Verified</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 align-middle text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2 shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<Eye className="w-3.5 h-3.5" />}
                            onClick={() => setSelectedUserForDetail(u)}
                            className="whitespace-nowrap shrink-0"
                          >
                            Details
                          </Button>
                          {isAdmin && u.role !== 'admin' && (
                            <Button
                              variant={u.status === 'active' ? 'danger' : 'success'}
                              size="sm"
                              onClick={() => handleToggleUserStatus(u)}
                              className="whitespace-nowrap shrink-0"
                            >
                              {u.status === 'active' ? 'Deactivate' : 'Activate'}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. TAB 2: Pending User Requests (Admin Review & Approval) */}
      {activeTab === 'pending_requests' && isAdmin && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start space-x-3 text-amber-300 text-xs sm:text-sm">
            <Clock className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
            <div>
              <p className="font-bold">Sales-Submitted User Creation Gate</p>
              <p className="text-amber-300/80 mt-0.5">
                Sales Representatives submit candidate user accounts which require formal Administrator review. Upon approval, credentials and unique User IDs are generated in MongoDB.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl glass-card border border-slate-800">
            <table className="w-full text-left text-xs sm:text-sm text-slate-300">
              <thead className="bg-slate-900/80 uppercase text-[11px] font-bold tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3.5">Request #</th>
                  <th className="px-4 py-3.5">Proposed Candidate</th>
                  <th className="px-4 py-3.5">Requested Role & Dept</th>
                  <th className="px-4 py-3.5">Submitted By</th>
                  <th className="px-4 py-3.5">Date Submitted</th>
                  <th className="px-4 py-3.5 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {pendingRequests.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-slate-400">
                      No pending user creation requests awaiting approval.
                    </td>
                  </tr>
                ) : (
                  pendingRequests.map((req) => (
                    <tr key={req._id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3.5 font-mono font-bold text-solar-400">
                        {req.requestNumber}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-white">{req.payload?.name}</div>
                        <div className="text-slate-400 text-xs">{req.payload?.email}</div>
                        {req.payload?.phone && <div className="text-slate-500 text-xs">{req.payload?.phone}</div>}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/20 text-sky-400 border border-sky-500/30 uppercase">
                          {req.payload?.role}
                        </span>
                        <div className="text-xs text-slate-400 mt-1">{req.payload?.department}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="text-white font-medium">{req.requestedByName}</div>
                        <div className="text-[11px] text-slate-500 capitalize">{req.requestedByRole}</div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-400 font-mono text-xs">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3.5 text-right space-x-2">
                        <Button
                          variant="success"
                          size="sm"
                          icon={CheckCircle2}
                          onClick={() =>
                            setApprovalModalState({
                              isOpen: true,
                              request: req,
                              action: 'approve',
                              reviewNotes: 'Verified candidate credentials and onboarding details.',
                              rejectionReason: '',
                              submitting: false
                            })
                          }
                        >
                          Approve
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          icon={XCircle}
                          onClick={() =>
                            setApprovalModalState({
                              isOpen: true,
                              request: req,
                              action: 'reject',
                              reviewNotes: '',
                              rejectionReason: '',
                              submitting: false
                            })
                          }
                        >
                          Reject
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. ADD / REQUEST USER MODAL */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <UserPlus className="w-5 h-5 text-solar-400" />
                <h3 className="text-lg font-bold text-white">
                  {isAdmin ? 'Provision New User' : 'Request New User Account'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddUserModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOrRequestUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Patel"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-solar-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Login User ID *
                  </label>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        const prefix = formData.role === 'technician' ? 'TEC' : formData.role === 'customer' ? 'CUST' : formData.role === 'admin' ? 'ADM' : 'SALES';
                        setFormData({ ...formData, userId: `${prefix}-${Math.floor(1000 + Math.random() * 9000)}` });
                      }}
                      className="text-[11px] text-solar-400 hover:text-solar-300 font-semibold"
                    >
                      Auto Generate ID
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  required={isAdmin}
                  placeholder="e.g. TEC-7945 or CUST-4821"
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-solar-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  {isAdmin
                    ? 'Unique login identifier for the user (can sign in with this ID or email).'
                    : 'Optional suggestion. The administrator will assign the final User ID and password.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="user@sunpower.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-solar-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-solar-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Role *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => {
                      const newRole = e.target.value;
                      let newDept = 'Operations';
                      if (newRole === 'sales') newDept = 'Sales & Marketing';
                      if (newRole === 'technician') newDept = 'Field Engineering';
                      if (newRole === 'admin') newDept = 'Executive Administration';
                      if (newRole === 'customer') newDept = 'Customer Portal';

                      // If currently having a generated ID prefix, adapt it to the new role
                      let updatedUserId = formData.userId;
                      if (!updatedUserId || /^(TEC|CUST|SALES|ADM)-[0-9]{4}$/.test(updatedUserId)) {
                        const prefix = newRole === 'technician' ? 'TEC' : newRole === 'customer' ? 'CUST' : newRole === 'admin' ? 'ADM' : 'SALES';
                        updatedUserId = `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
                      }

                      setFormData({
                        ...formData,
                        role: newRole,
                        department: newDept,
                        userId: isAdmin ? updatedUserId : formData.userId
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-solar-500"
                  >
                    <option value="sales">Sales Executive</option>
                    <option value="technician">Field Technician</option>
                    <option value="customer">Customer Account</option>
                    {isAdmin && <option value="admin">Administrator</option>}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-solar-500"
                  />
                </div>
              </div>

              {/* Password Assignment (Admin direct or auto-generated) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Initial Password *
                  </label>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        const generatedPass = `Solar@${Math.floor(1000 + Math.random() * 9000)}!`;
                        setFormData({ ...formData, password: generatedPass });
                      }}
                      className="text-[11px] text-solar-400 hover:text-solar-300 font-semibold"
                    >
                      Auto Generate Password
                    </button>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    required={isAdmin}
                    placeholder="Enter or generate password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-solar-400 font-mono focus:outline-none focus:border-solar-500"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => {
                      const generatedPass = `Solar@${Math.floor(1000 + Math.random() * 9000)}!`;
                      setFormData({ ...formData, password: generatedPass });
                    }}
                  >
                    Regenerate
                  </Button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {isAdmin
                    ? 'Required. User will be required to change this temporary password upon first login.'
                    : 'A temporary password will be securely provisioned upon Admin approval.'}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-3">
                <Button
                  variant="outline"
                  size="md"
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  type="submit"
                  loading={submittingUser}
                >
                  {isAdmin ? 'Create User Account' : 'Submit User Request'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. CREDENTIALS POPUP (Admin viewing generated user details) */}
      {createdUserCredentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center space-x-3 text-emerald-400 pb-3 border-b border-slate-800">
              <CheckCircle2 className="w-6 h-6 shrink-0" />
              <div>
                <h3 className="text-base font-bold text-white">User Account Created</h3>
                <p className="text-xs text-slate-400">Unique credentials registered in MongoDB</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5 font-mono text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">User ID</span>
                <span className="text-solar-400 font-bold text-sm">
                  {createdUserCredentials.userId}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Full Name</span>
                <span className="text-white">{createdUserCredentials.name}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Email</span>
                <span className="text-white">{createdUserCredentials.email}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Temporary Password</span>
                <span className="text-emerald-400 font-bold text-sm">
                  {createdUserCredentials.temporaryPassword || formData.password}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Access Role</span>
                <span className="text-sky-400 uppercase font-bold">{createdUserCredentials.role}</span>
              </div>
              <div className="pt-2 text-[11px] text-amber-400 font-sans flex items-center space-x-1.5">
                <Lock className="w-3.5 h-3.5 shrink-0" />
                <span>First-login password change flag is enforced.</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                size="md"
                icon={copied ? Check : Copy}
                onClick={handleCopyCredentials}
              >
                {copied ? 'Copied!' : 'Copy Credentials'}
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => setCreatedUserCredentials(null)}
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 7. APPROVAL / REJECTION MODAL */}
      {approvalModalState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
              {approvalModalState.action === 'approve' ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              ) : (
                <XCircle className="w-6 h-6 text-rose-400" />
              )}
              <div>
                <h3 className="text-base font-bold text-white">
                  {approvalModalState.action === 'approve' ? 'Approve User Request' : 'Reject User Request'}
                </h3>
                <p className="text-xs text-slate-400">
                  Request #{approvalModalState.request?.requestNumber} • {approvalModalState.request?.payload?.name}
                </p>
              </div>
            </div>

            {approvalModalState.action === 'approve' ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-300">
                  Approving this request will immediately provision the user account in MongoDB, assign a unique User ID, and enforce first-login password reset.
                </p>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Review Notes (Optional)
                  </label>
                  <textarea
                    rows="3"
                    value={approvalModalState.reviewNotes}
                    onChange={(e) =>
                      setApprovalModalState({ ...approvalModalState, reviewNotes: e.target.value })
                    }
                    placeholder="Enter approval verification notes..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                  Rejection requires a documented reason. The requester will be notified and the request will be preserved in the audit log.
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Rejection Reason *
                  </label>
                  <textarea
                    rows="3"
                    required
                    value={approvalModalState.rejectionReason}
                    onChange={(e) =>
                      setApprovalModalState({ ...approvalModalState, rejectionReason: e.target.value })
                    }
                    placeholder="Provide specific reason for rejection..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
              <Button
                variant="outline"
                size="md"
                onClick={() =>
                  setApprovalModalState({ isOpen: false, request: null, action: 'approve', reviewNotes: '', rejectionReason: '', submitting: false })
                }
              >
                Cancel
              </Button>
              <Button
                variant={approvalModalState.action === 'approve' ? 'success' : 'danger'}
                size="md"
                loading={approvalModalState.submitting}
                onClick={approvalModalState.action === 'approve' ? handleApproveRequest : handleRejectRequest}
              >
                {approvalModalState.action === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 8. USER DETAIL MODAL */}
      {selectedUserForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <Shield className="w-5 h-5 text-solar-400" />
                <h3 className="text-base font-bold text-white">User Security Profile</h3>
              </div>
              <button
                onClick={() => setSelectedUserForDetail(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400">User ID</span>
                <span className="font-mono font-bold text-solar-400">{selectedUserForDetail.userId || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Full Name</span>
                <span className="font-semibold text-white">{selectedUserForDetail.name}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Email</span>
                <span className="text-slate-300">{selectedUserForDetail.email}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Role</span>
                <span className="uppercase font-bold text-sky-400">{selectedUserForDetail.role}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Department</span>
                <span className="text-slate-300">{selectedUserForDetail.department || 'Operations'}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Created Date</span>
                <span className="font-mono text-slate-300">{new Date(selectedUserForDetail.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Must Change Password</span>
                <span className={selectedUserForDetail.mustChangePassword ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                  {selectedUserForDetail.mustChangePassword ? 'YES (Pending first login)' : 'NO'}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                variant="primary"
                size="md"
                onClick={() => setSelectedUserForDetail(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementView;

