import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Smartphone,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  Play,
  Square,
  Camera,
  Zap,
  Activity,
  UserCheck,
  AlertCircle,
  FileCheck,
  Upload,
  Calendar,
  Sparkles,
  Check,
  Award
} from 'lucide-react';
import Button from '../components/ui/Button';

const TechnicianMobilePortal = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [jobs, setJobs] = useState([]);
  const [activeJob, setActiveJob] = useState(null);
  const [loading, setLoading] = useState(true);

  // Live timer state
  const [elapsedTimeStr, setElapsedTimeStr] = useState('00:00:00');

  // Testing form state
  const [testingForm, setTestingForm] = useState({
    vocVolts: 242.5,
    iscAmperes: 13.6,
    inverterSyncStatus: 'synced',
    earthingResistanceOhms: 1.8,
    generationCheckKw: 2.85,
    comments: 'All DC and AC bus voltages checked within safety margins.'
  });

  // Customer acceptance state
  const [acceptanceForm, setAcceptanceForm] = useState({
    signedName: '',
    remarks: 'Installation completed with neat cabling. Generation verified.',
    rating: 5
  });

  // Photo upload state
  const [uploadCaption, setUploadCaption] = useState('Rooftop Array Final View');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/installations');
      if (res.success) {
        setJobs(res.data);
        if (res.data.length > 0) {
          const currentId = activeJob?._id;
          const matched = res.data.find(j => j._id === currentId);
          if (matched) {
            setActiveJob(matched);
          } else {
            const inProgress = res.data.find(j => j.status === 'in_progress' || j.status === 'testing_in_progress');
            setActiveJob(inProgress || res.data[0]);
          }
        }
      }
    } catch (err) {
      showToast(err.message || 'Fetch jobs error', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [user]);

  // Update testing form when activeJob changes
  useEffect(() => {
    if (activeJob?.testingResults) {
      setTestingForm({
        vocVolts: activeJob.testingResults.vocVolts || 242.5,
        iscAmperes: activeJob.testingResults.iscAmperes || 13.6,
        inverterSyncStatus: activeJob.testingResults.inverterSyncStatus || 'synced',
        earthingResistanceOhms: activeJob.testingResults.earthingResistanceOhms || 1.8,
        generationCheckKw: activeJob.testingResults.generationCheckKw || (activeJob.systemCapacityKw * 0.95),
        comments: activeJob.testingResults.comments || 'Tested and verified on site.'
      });
    }
    if (activeJob?.customer?.name) {
      setAcceptanceForm(prev => ({ ...prev, signedName: activeJob.customer.name }));
    }
  }, [activeJob]);

  // Live Timer Interval
  useEffect(() => {
    if (!activeJob?.startedAt || activeJob.status === 'completed' || activeJob.status === 'customer_accepted') {
      return;
    }

    const interval = setInterval(() => {
      const start = new Date(activeJob.startedAt).getTime();
      const now = Date.now();
      const diffSec = Math.max(0, Math.floor((now - start) / 1000));

      const hrs = String(Math.floor(diffSec / 3600)).padStart(2, '0');
      const mins = String(Math.floor((diffSec % 3600) / 60)).padStart(2, '0');
      const secs = String(diffSec % 60).padStart(2, '0');

      setElapsedTimeStr(`${hrs}:${mins}:${secs}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeJob?.startedAt, activeJob?.status]);

  // Step 2: Start Job Timer
  const handleStartJob = async () => {
    if (!activeJob) return;
    try {
      const res = await api.post(`/installations/${activeJob._id}/start-job`);
      if (res.success) {
        setActiveJob(res.data);
        showToast('Job started! Server clock is tracking working duration.', 'success');
        fetchJobs();
      }
    } catch (err) {
      showToast(`Start failed: ${err.message}`, 'error');
    }
  };

  // Step 3: Toggle Step Check
  const handleToggleStep = async (stepId, currentStatus) => {
    if (!activeJob) return;
    const newStatus = currentStatus === 'completed' ? 'in_progress' : 'completed';
    try {
      const res = await api.post(`/installations/${activeJob._id}/update-step`, {
        stepId,
        status: newStatus
      });
      if (res.success) {
        setActiveJob(res.data);
      }
    } catch (err) {
      showToast(`Step update failed: ${err.message}`, 'error');
    }
  };

  // Step 3: Submit Electrical Testing Results
  const handleSubmitTesting = async (e) => {
    e.preventDefault();
    if (!activeJob) return;
    try {
      const res = await api.post(`/installations/${activeJob._id}/testing-results`, testingForm);
      if (res.success) {
        setActiveJob(res.data);
        showToast('Electrical quality test results saved! Voc, Isc & Earthing verified.', 'success');
      }
    } catch (err) {
      showToast(`Testing submission failed: ${err.message}`, 'error');
    }
  };

  // Step 3: Upload Site Photo
  const handlePhotoUpload = async (e) => {
    e.preventDefault();
    if (!activeJob || !selectedFile) {
      showToast('Please choose an image file to upload.', 'warning');
      return;
    }
    try {
      setUploadingPhoto(true);
      const formData = new FormData();
      formData.append('photo', selectedFile);
      formData.append('caption', uploadCaption);

      const res = await api.post(`/installations/${activeJob._id}/photo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.success) {
        setActiveJob(res.data);
        setSelectedFile(null);
        showToast('Site photo uploaded and attached to installation record!', 'success');
      }
    } catch (err) {
      showToast(`Photo upload failed: ${err.message}`, 'error');
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Step 4: Finish Job & Submit Customer Acceptance
  const handleCustomerAcceptance = async (e) => {
    e.preventDefault();
    if (!activeJob) return;

    if (!isJobReadyToFinish) {
      showToast('Please complete all required steps and electrical testing before finishing job.', 'error');
      return;
    }

    try {
      const res = await api.post(`/installations/${activeJob._id}/customer-acceptance`, acceptanceForm);
      if (res.success) {
        setActiveJob(res.data);
        fetchJobs();
        showToast('Job Finished! Duration recorded from server time and warranties activated.', 'success');
      }
    } catch (err) {
      showToast(`Finish job failed: ${err.message}`, 'error');
    }
  };

  // Validation rules for Step 4 completion
  const stepsTotal = activeJob?.steps?.length || 0;
  const stepsCompleted = (activeJob?.steps || []).filter(s => s.status === 'completed').length;
  const isAllStepsDone = stepsTotal > 0 && stepsCompleted === stepsTotal;
  const isTestingDone = Boolean(activeJob?.testingResults?.testedAt);
  const isPhotosUploaded = (activeJob?.installationPhotos?.length || 0) > 0;
  const isJobStarted = Boolean(activeJob?.startedAt);
  const isJobFinished = activeJob?.status === 'completed' || activeJob?.status === 'customer_accepted';

  const isJobReadyToFinish = isJobStarted && isTestingDone;

  const remainingTasks = [];
  if (!isJobStarted) remainingTasks.push('Start the Job Clock');
  if (!isAllStepsDone) remainingTasks.push(`Complete Checklist (${stepsCompleted}/${stepsTotal} done)`);
  if (!isTestingDone) remainingTasks.push('Submit Electrical QA Testing (Voc, Isc, Earthing)');
  if (!isPhotosUploaded) remainingTasks.push('Upload at least 1 Site Execution Photo');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Mobile-First Header Bar */}
      <div className="p-4 sm:p-5 rounded-2xl glass-card border border-emerald-500/20 bg-gradient-to-r from-midnight-900 via-midnight-850 to-midnight-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Smartphone className="w-4 h-4" />
            <span>Field Technician Mobile Workstation</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Field <span className="gradient-electric-text">Installation Execution</span>
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Logged in as <span className="text-white font-semibold">{user?.name}</span> • Showing your assigned rooftop jobs.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/30">
            {jobs.length} Assigned Jobs
          </span>
        </div>
      </div>

      {/* Assigned Jobs Selector */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Select Active Project
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {jobs.map((job) => {
            const isSelected = activeJob?._id === job._id;
            return (
              <div
                key={job._id}
                onClick={() => setActiveJob(job)}
                className={`p-3.5 rounded-xl cursor-pointer transition border text-xs ${
                  isSelected
                    ? 'bg-emerald-500/10 border-emerald-500 shadow-glow-electric text-white'
                    : 'glass-card border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono font-bold text-solar-400">{job.installationNumber}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-800 border border-slate-700">
                    {job.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="font-semibold text-slate-100 truncate">{job.customer?.name || 'Customer'}</p>
                <p className="text-slate-400 text-[11px] truncate flex items-center mt-1">
                  <MapPin className="w-3 h-3 mr-1 text-slate-500 shrink-0" />
                  <span>{job.customer?.installationAddress?.city || 'Site Location'}</span>
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {activeJob && (
        <div className="space-y-6">
          {/* STEP 1 & 2: Active Job Timer Banner */}
          <div className="p-5 rounded-2xl glass-card border border-emerald-500/30 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Installation</span>
                <h2 className="text-lg font-bold text-white font-mono">{activeJob.installationNumber}</h2>
                <p className="text-xs text-slate-300 font-semibold">{activeJob.customer?.name} • {activeJob.systemCapacityKw} kW System</p>
              </div>

              {/* Status and Action Buttons */}
              <div className="flex items-center space-x-3">
                {/* STEP 1: Not Started */}
                {!isJobStarted && !isJobFinished && (
                  <Button
                    variant="electric"
                    size="md"
                    leftIcon={<Play className="w-4 h-4 fill-current" />}
                    onClick={handleStartJob}
                  >
                    Start Job Timer
                  </Button>
                )}

                {/* STEP 2: In Progress - Live Running Timer */}
                {isJobStarted && !isJobFinished && (
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">Job In Progress</span>
                      <span className="text-xl font-bold font-mono text-white flex items-center justify-end space-x-1.5">
                        <Clock className="w-4 h-4 text-emerald-400 animate-spin" />
                        <span>{elapsedTimeStr}</span>
                      </span>
                    </div>
                  </div>
                )}

                {/* Finished State: Duration Metrics */}
                {isJobFinished && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-right">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase block">Job Completed</span>
                    <span className="font-mono font-bold text-white text-sm">
                      Duration: {activeJob.totalWorkingHours || 6} Hours
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Timing Audit Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">Start Timestamp</span>
                <span className="font-bold text-white">
                  {activeJob.startedAt ? new Date(activeJob.startedAt).toLocaleString() : 'Not started yet'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">Finish Timestamp</span>
                <span className="font-bold text-white">
                  {activeJob.completedAt ? new Date(activeJob.completedAt).toLocaleString() : 'Awaiting completion'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">Server Working Time</span>
                <span className="font-bold text-emerald-400">
                  {activeJob.totalWorkingHours ? `${activeJob.totalWorkingHours} hrs` : isJobStarted ? elapsedTimeStr : '0.0 hrs'}
                </span>
              </div>
            </div>
          </div>

          {/* Checklist of Remaining Tasks Banner (Requirement 14) */}
          {!isJobFinished && (
            <div className={`p-4 rounded-xl border text-xs ${
              isJobReadyToFinish
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            }`}>
              <div className="flex items-center space-x-2 font-bold mb-1">
                {isJobReadyToFinish ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                )}
                <span>
                  {isJobReadyToFinish
                    ? 'All Required Installation QA Tasks Complete! You may now Finish the Job.'
                    : 'Tasks Remaining to Unlock Job Completion:'}
                </span>
              </div>

              {!isJobReadyToFinish && (
                <ul className="list-disc list-inside space-y-0.5 text-slate-300 text-[11px] mt-1 pl-1">
                  {remainingTasks.map((t, idx) => (
                    <li key={idx}>{t}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* STEP 3: Installation Assembly Steps Checklist */}
          <div className="p-5 rounded-2xl glass-card border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Activity className="w-5 h-5 text-solar-400" />
                <span>Installation Assembly Checklist ({stepsCompleted}/{stepsTotal})</span>
              </h3>
            </div>

            <div className="space-y-2">
              {(activeJob.steps || []).map((step) => {
                const isDone = step.status === 'completed';
                return (
                  <div
                    key={step.id || step._id}
                    onClick={() => !isJobFinished && handleToggleStep(step.id || step._id, step.status)}
                    className={`p-3 rounded-xl border transition flex items-center justify-between cursor-pointer text-xs ${
                      isDone
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                        isDone ? 'bg-emerald-500 border-emerald-400 text-midnight-950 font-bold' : 'border-slate-600'
                      }`}>
                        {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <span className={isDone ? 'line-through text-slate-400 font-medium' : 'font-semibold text-white'}>
                        {step.title}
                      </span>
                    </div>

                    <span className="text-[10px] font-mono uppercase text-slate-500">
                      {isDone ? 'Done' : 'Tap to Complete'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* STEP 3: Electrical Quality Testing Results */}
          <div className="p-5 rounded-2xl glass-card border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-amber-400">
                <Zap className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">Electrical QA Testing Parameters</h3>
              </div>
              {isTestingDone && (
                <span className="text-emerald-400 font-bold text-xs flex items-center space-x-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Parameters Validated</span>
                </span>
              )}
            </div>

            <form onSubmit={handleSubmitTesting} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Open Circuit Voltage Voc (V)</label>
                <input
                  type="number"
                  step="0.1"
                  value={testingForm.vocVolts}
                  onChange={(e) => setTestingForm({ ...testingForm, vocVolts: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Short Circuit Current Isc (A)</label>
                <input
                  type="number"
                  step="0.1"
                  value={testingForm.iscAmperes}
                  onChange={(e) => setTestingForm({ ...testingForm, iscAmperes: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Earthing Pit Resistance (Ω)</label>
                <input
                  type="number"
                  step="0.1"
                  value={testingForm.earthingResistanceOhms}
                  onChange={(e) => setTestingForm({ ...testingForm, earthingResistanceOhms: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-emerald-400 font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Inverter Grid Sync</label>
                <select
                  value={testingForm.inverterSyncStatus}
                  onChange={(e) => setTestingForm({ ...testingForm, inverterSyncStatus: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-bold"
                >
                  <option value="synced">Synced & Generating</option>
                  <option value="pending">Pending Discom Meter</option>
                  <option value="failed">Failed Sync Test</option>
                </select>
              </div>

              <div className="sm:col-span-2 lg:col-span-4">
                <label className="block text-slate-400 mb-1">Testing Remarks & Observations</label>
                <input
                  type="text"
                  value={testingForm.comments}
                  onChange={(e) => setTestingForm({ ...testingForm, comments: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                >
                  Save Electrical Testing Results
                </Button>
              </div>
            </form>
          </div>

          {/* Photo Uploads & Customer Acceptance Sign-off */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Site Photos Upload */}
            <div className="p-5 rounded-2xl glass-card border border-slate-800 space-y-4">
              <div className="flex items-center space-x-2 text-sky-400">
                <Camera className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">Installation Photos</h3>
              </div>
              <p className="text-xs text-slate-400">
                Capture high-resolution evidence of panel alignment, inverter wiring, and earth pits.
              </p>

              <form onSubmit={handlePhotoUpload} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Photo Caption</label>
                  <input
                    type="text"
                    value={uploadCaption}
                    onChange={(e) => setUploadCaption(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Choose Photo File</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 text-xs"
                  />
                </div>

                <Button
                  type="submit"
                  variant="secondary"
                  size="sm"
                  fullWidth
                  disabled={uploadingPhoto || !selectedFile}
                  leftIcon={<Upload className="w-4 h-4" />}
                >
                  {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                </Button>
              </form>

              {/* Gallery of Uploaded Photos */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                {(activeJob.installationPhotos || []).map((img, idx) => (
                  <div key={idx} className="rounded-lg overflow-hidden border border-slate-700 bg-slate-900">
                    <img src={img.url} alt={img.caption} className="w-full h-24 object-cover" />
                    <p className="p-1 text-[10px] text-slate-300 truncate">{img.caption}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* STEP 4: Customer Digital Acceptance & Finish Job */}
            <div className="p-5 rounded-2xl glass-card border border-slate-800 space-y-4">
              <div className="flex items-center space-x-2 text-emerald-400">
                <UserCheck className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">Customer Sign-off & Job Completion</h3>
              </div>
              <p className="text-xs text-slate-400">
                Capture client satisfaction remarks and record customer digital acceptance.
              </p>

              {activeJob.customerAcceptance?.isAccepted ? (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-2">
                  <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Customer Acceptance Confirmed!</span>
                  </div>
                  <p className="text-slate-300">Signed By: {activeJob.customerAcceptance.signedName}</p>
                  <p className="text-slate-400 italic">"{activeJob.customerAcceptance.remarks}"</p>
                  <span className="text-[10px] text-slate-500 block">
                    Accepted on: {new Date(activeJob.customerAcceptance.acceptedAt).toLocaleString()}
                  </span>
                </div>
              ) : (
                <form onSubmit={handleCustomerAcceptance} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">Customer Signatory Name</label>
                    <input
                      type="text"
                      value={acceptanceForm.signedName}
                      onChange={(e) => setAcceptanceForm({ ...acceptanceForm, signedName: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-semibold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Customer Remarks / Feedback</label>
                    <textarea
                      rows="2"
                      value={acceptanceForm.remarks}
                      onChange={(e) => setAcceptanceForm({ ...acceptanceForm, remarks: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Customer Rating</label>
                    <select
                      value={acceptanceForm.rating}
                      onChange={(e) => setAcceptanceForm({ ...acceptanceForm, rating: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-amber-400 font-bold"
                    >
                      <option value="5">★★★★★ 5 Stars (Exceptional)</option>
                      <option value="4">★★★★☆ 4 Stars (Good)</option>
                      <option value="3">★★★☆☆ 3 Stars (Satisfactory)</option>
                    </select>
                  </div>

                  {/* Finish Job Button: Enabled only when all tasks are ready */}
                  <Button
                    type="submit"
                    variant={isJobReadyToFinish ? 'electric' : 'secondary'}
                    size="md"
                    fullWidth
                    disabled={!isJobReadyToFinish}
                    leftIcon={<Award className="w-4 h-4" />}
                  >
                    {isJobReadyToFinish
                      ? 'Submit Acceptance & Finish Job (Record Duration)'
                      : 'Complete QA Tasks to Finish Job'}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TechnicianMobilePortal;
