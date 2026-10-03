'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Plus,
  Filter,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Eye,
  Shield,
  X,
  AlertTriangle,
  BarChart2,
  Award,
  Target,
  TrendingUp,
  BookOpen,
  GraduationCap,
  ShieldCheck,
  ShieldAlert,
  ExternalLink,
} from 'lucide-react';
import { useToast } from '@/components/Toast';
import { ConfirmDialog } from '@/components/ConfirmDialog';

export default function AdminStudentsPage() {
  const { success, error } = useToast();
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [studentDetails, setStudentDetails] = useState<any>(null);
  const [studentAnalytics, setStudentAnalytics] = useState<any>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [activeAnalyticsTab, setActiveAnalyticsTab] = useState<'overview' | 'attempts' | 'proctoring'>('overview');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    studentId: '',
    course: 'Senior Division Army Wing',
    unit: '1 Delhi Composite Battalion',
    status: 'ACTIVE',
  });

  const loadStudents = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = new URL('/api/admin/students', window.location.origin);
      if (search) url.searchParams.set('search', search);
      if (statusFilter !== 'ALL') url.searchParams.set('status', statusFilter);

      const res = await fetch(url.toString());
      const data = await res.json();
      setStudents(data.students || []);
    } catch {
      error('Failed to load students');
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, error]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      success('Cadet enrolled successfully');
      setIsAddModalOpen(false);
      loadStudents();
      setFormData({
        name: '',
        email: '',
        username: '',
        password: '',
        studentId: '',
        course: 'Senior Division Army Wing',
        unit: '1 Delhi Composite Battalion',
        status: 'ACTIVE',
      });
    } catch (err: any) {
      error(err.message || 'Failed to create student');
    }
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/admin/students/${selectedStudent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      success('Cadet profile updated');
      setIsEditModalOpen(false);
      loadStudents();
    } catch (err: any) {
      error(err.message || 'Failed to update student');
    }
  };

  const handleDeleteStudent = async () => {
    try {
      const res = await fetch(`/api/admin/students/${selectedStudent.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Deletion failed');

      success('Student record deleted');
      setIsDeleteDialogOpen(false);
      loadStudents();
    } catch (err: any) {
      error(err.message || 'Failed to delete student');
    }
  };

  const viewDetails = async (student: any) => {
    setIsLoadingDetails(true);
    setIsDetailsModalOpen(true);
    setStudentDetails(null);
    setStudentAnalytics(null);
    setActiveAnalyticsTab('overview');
    try {
      const res = await fetch(`/api/admin/students/${student.id}`);
      const data = await res.json();
      setStudentDetails(data.student);
      setStudentAnalytics(data.analytics);
    } catch {
      error('Failed to load student analytics');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const openEdit = (student: any) => {
    setSelectedStudent(student);
    setFormData({
      name: student.name,
      email: student.email,
      username: student.username,
      password: '',
      studentId: student.studentId !== 'N/A' ? student.studentId : '',
      course: student.course,
      unit: student.unit,
      status: student.status,
    });
    setIsEditModalOpen(true);
  };

  const toggleStatus = async (student: any) => {
    const nextStatus = student.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await fetch(`/api/admin/students/${student.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');

      success(`Student is now ${nextStatus.toLowerCase()}`);
      loadStudents();
    } catch (err: any) {
      error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Cadet & Student Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Enrolled cadets, regimental credentials, exam attempt history, and status.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Enroll New Cadet</span>
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, roll no..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Deactivated Only</option>
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 animate-pulse">Loading cadets...</div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            No cadets found matching your search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Cadet Name</th>
                  <th className="px-6 py-3.5">Regimental ID</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Exams Attempted</th>
                  <th className="px-6 py-3.5">Avg Score</th>
                  <th className="px-6 py-3.5">Enrolled Date</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-4">
                      <button
                        onClick={() => viewDetails(student)}
                        className="group text-left focus:outline-none transition block"
                        title="Click to view complete performance analytics"
                      >
                        <div className="font-semibold text-slate-900 group-hover:text-[#133E87] group-hover:underline flex items-center gap-1.5 transition-colors">
                          <span>{student.name}</span>
                          <BarChart2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#133E87] transition-colors" />
                        </div>
                        <div className="text-xs text-slate-400">{student.email}</div>
                      </button>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-700">
                      {student.studentId}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleStatus(student)}
                        title="Click to toggle status"
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition ${
                          student.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                        }`}
                      >
                        {student.status === 'ACTIVE' ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Inactive</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800">
                      {student.attemptsCount}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800">
                      {student.averageScore}%
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(student.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => viewDetails(student)}
                          title="View Cadet Performance Analytics"
                          className="p-1.5 text-slate-500 hover:text-[#133E87] hover:bg-slate-100 rounded-lg transition"
                        >
                          <BarChart2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEdit(student)}
                          title="Edit Profile"
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedStudent(student);
                            setIsDeleteDialogOpen(true);
                          }}
                          title="Delete Cadet"
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Cadet Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Enroll New Cadet</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Regimental ID
                  </label>
                  <input
                    type="text"
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    placeholder="NCC-SD-2026-..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs"
                >
                  Create Cadet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Cadet Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Edit Cadet Profile</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStudent} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Regimental ID
                  </label>
                  <input
                    type="text"
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    New Password (Optional)
                  </label>
                  <input
                    type="password"
                    placeholder="Leave blank to keep current"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cadet Performance & Analytics Modal */}
      {isDetailsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
            {/* Modal Header with NCC Tri-Service Styling */}
            <div className="relative overflow-hidden bg-gradient-to-r from-[#07182E] via-[#0B2545] to-[#133E87] text-white p-6 sm:p-7 shrink-0">
              <div className="absolute top-0 left-0 right-0 h-1.5 ncc-tri-stripe" />
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/35 flex items-center justify-center text-[#D4AF37] shrink-0 shadow-inner">
                    <Shield className="w-7 h-7 sm:w-8 sm:h-8" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded border border-[#D4AF37]/25">
                        Cadet Performance Analytics
                      </span>
                      {studentDetails && (
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                            studentDetails.status === 'ACTIVE'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
                          }`}
                        >
                          {studentDetails.status === 'ACTIVE' ? 'Active Cadet' : 'Inactive'}
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
                      {studentDetails ? studentDetails.name : 'Loading Cadet Profile...'}
                    </h2>
                    <p className="text-xs text-slate-300 font-mono mt-0.5">
                      Regimental No:{' '}
                      <span className="font-bold text-[#D4AF37]">
                        {studentDetails?.studentProfile?.studentId || 'N/A'}
                      </span>
                      {studentDetails?.studentProfile?.unit && (
                        <span> • {studentDetails.studentProfile.unit}</span>
                      )}
                      {studentDetails?.studentProfile?.course && (
                        <span> • {studentDetails.studentProfile.course}</span>
                      )}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsDetailsModalOpen(false)}
                  className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition shrink-0"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Tabs inside Header */}
              <div className="flex gap-2 mt-6 pt-4 border-t border-white/10 text-xs font-bold overflow-x-auto">
                <button
                  onClick={() => setActiveAnalyticsTab('overview')}
                  className={`px-3.5 py-1.5 rounded-xl transition whitespace-nowrap ${
                    activeAnalyticsTab === 'overview'
                      ? 'bg-white text-[#0B2545] shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Parameters & Competency
                </button>
                <button
                  onClick={() => setActiveAnalyticsTab('attempts')}
                  className={`px-3.5 py-1.5 rounded-xl transition whitespace-nowrap ${
                    activeAnalyticsTab === 'attempts'
                      ? 'bg-white text-[#0B2545] shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Exam Scorecards ({studentDetails?.attempts?.length || 0})
                </button>
                <button
                  onClick={() => setActiveAnalyticsTab('proctoring')}
                  className={`px-3.5 py-1.5 rounded-xl transition whitespace-nowrap ${
                    activeAnalyticsTab === 'proctoring'
                      ? 'bg-white text-[#0B2545] shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Proctoring & Discipline Audit
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {isLoadingDetails ? (
                <div className="py-12 text-center text-slate-400 space-y-3">
                  <div className="w-10 h-10 border-4 border-[#133E87]/30 border-t-[#133E87] rounded-full animate-spin mx-auto" />
                  <p className="text-sm font-medium">Aggregating cadet metrics across all parameters...</p>
                </div>
              ) : !studentDetails ? (
                <div className="py-12 text-center text-slate-400">
                  Failed to load cadet data.
                </div>
              ) : (
                <>
                  {/* Top Parameter KPI Cards (5 Core Parameters) */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {/* Parameter 1: Exams Attempted */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <div className="flex items-center justify-between text-slate-400 mb-1">
                        <span className="text-[10px] uppercase font-bold tracking-wider">Attempts</span>
                        <Target className="w-3.5 h-3.5 text-[#133E87]" />
                      </div>
                      <div className="text-xl font-black text-slate-900">
                        {studentAnalytics?.completedAttempts || 0}
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {studentAnalytics?.totalAttempts || 0} total session{studentAnalytics?.totalAttempts === 1 ? '' : 's'}
                      </span>
                    </div>

                    {/* Parameter 2: Average Score */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <div className="flex items-center justify-between text-slate-400 mb-1">
                        <span className="text-[10px] uppercase font-bold tracking-wider">Avg Score</span>
                        <TrendingUp className="w-3.5 h-3.5 text-[#4A90E2]" />
                      </div>
                      <div className="text-xl font-black text-[#133E87]">
                        {studentAnalytics?.avgPercentage || 0}%
                      </div>
                      <span className="text-[10px] text-slate-500">
                        Across all exams
                      </span>
                    </div>

                    {/* Parameter 3: Pass Rate */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <div className="flex items-center justify-between text-slate-400 mb-1">
                        <span className="text-[10px] uppercase font-bold tracking-wider">Pass Rate</span>
                        <Award className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      <div className="text-xl font-black text-emerald-600">
                        {studentAnalytics?.passRate || 0}%
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {studentAnalytics?.passedCount || 0} passed / {studentAnalytics?.failedCount || 0} failed
                      </span>
                    </div>

                    {/* Parameter 4: Marks Accrued */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <div className="flex items-center justify-between text-slate-400 mb-1">
                        <span className="text-[10px] uppercase font-bold tracking-wider">Total Marks</span>
                        <GraduationCap className="w-3.5 h-3.5 text-[#D4AF37]" />
                      </div>
                      <div className="text-xl font-black text-slate-900">
                        {studentAnalytics?.totalMarksEarned || 0}
                      </div>
                      <span className="text-[10px] text-slate-500">
                        out of {studentAnalytics?.totalMarksPossible || 0} max
                      </span>
                    </div>

                    {/* Parameter 5: Proctoring & Integrity */}
                    <div className={`p-3.5 rounded-2xl border col-span-2 sm:col-span-1 ${
                      studentAnalytics?.disciplineScore >= 90
                        ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                        : studentAnalytics?.disciplineScore >= 70
                        ? 'bg-amber-50/50 border-amber-200 text-amber-900'
                        : 'bg-rose-50/50 border-rose-200 text-rose-900'
                    }`}>
                      <div className="flex items-center justify-between text-slate-400 mb-1">
                        <span className="text-[10px] uppercase font-bold tracking-wider">Integrity</span>
                        {studentAnalytics?.disciplineScore >= 90 ? (
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                        )}
                      </div>
                      <div className={`text-xl font-black ${
                        studentAnalytics?.disciplineScore >= 90
                          ? 'text-emerald-700'
                          : studentAnalytics?.disciplineScore >= 70
                          ? 'text-amber-700'
                          : 'text-rose-700'
                      }`}>
                        {studentAnalytics?.disciplineScore ?? 100}%
                      </div>
                      <span className="text-[10px] font-bold block">
                        {studentAnalytics?.disciplineStatus || 'Exemplary'}
                      </span>
                    </div>
                  </div>

                  {/* TAB 1: OVERVIEW & COMPETENCY */}
                  {activeAnalyticsTab === 'overview' && (
                    <div className="space-y-6">
                      {/* Best & Lowest Score Highlight */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-200/80">
                          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2">
                            <Award className="w-4 h-4 text-emerald-600" />
                            <span>Peak Performance Exam</span>
                          </div>
                          {studentAnalytics?.bestScore ? (
                            <div>
                              <div className="text-base font-extrabold text-slate-900">
                                {studentAnalytics.bestScore.examTitle}
                              </div>
                              <div className="text-xs text-slate-500 mt-1 font-mono">
                                Code: {studentAnalytics.bestScore.examCode} • Score: {studentAnalytics.bestScore.score} Marks ({studentAnalytics.bestScore.percentage}%)
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-500">No scored attempts recorded yet.</p>
                          )}
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                            <BookOpen className="w-4 h-4 text-[#133E87]" />
                            <span>Cadet Regimental Parameters</span>
                          </div>
                          <div className="text-xs space-y-1 text-slate-600">
                            <div><span className="font-semibold text-slate-800">Email:</span> {studentDetails.email}</div>
                            <div><span className="font-semibold text-slate-800">Username:</span> {studentDetails.username}</div>
                            <div><span className="font-semibold text-slate-800">Phone:</span> {studentDetails.studentProfile?.phone || 'Not recorded'}</div>
                            <div><span className="font-semibold text-slate-800">Batch:</span> {studentDetails.studentProfile?.batch || '2025-2026'}</div>
                          </div>
                        </div>
                      </div>

                      {/* Subject Competency Breakdown */}
                      <div className="space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                          <BarChart2 className="w-4 h-4 text-[#133E87]" />
                          <span>Subject Competency & Mastery Breakdown</span>
                        </h3>

                        {(!studentAnalytics?.subjectBreakdown || studentAnalytics.subjectBreakdown.length === 0) ? (
                          <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-200/60 text-xs">
                            No subject-level assessment data recorded for this cadet yet.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {studentAnalytics.subjectBreakdown.map((subj: any) => (
                              <div
                                key={subj.subject}
                                className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2"
                              >
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-bold text-slate-900">{subj.subject}</span>
                                  <span className="font-extrabold text-[#133E87]">{subj.averagePercentage}%</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                  <div
                                    className="bg-gradient-to-r from-[#133E87] to-[#4A90E2] h-full rounded-full transition-all"
                                    style={{ width: `${Math.min(100, Math.max(5, subj.averagePercentage))}%` }}
                                  />
                                </div>
                                <div className="flex items-center justify-between text-[11px] text-slate-500">
                                  <span>{subj.attempts} Attempt{subj.attempts > 1 ? 's' : ''}</span>
                                  <span className="text-emerald-600 font-semibold">{subj.passRate}% Pass Rate</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 2: EXAM ATTEMPTS & SCORECARDS */}
                  {activeAnalyticsTab === 'attempts' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                          Complete Attempt History ({studentDetails.attempts?.length || 0})
                        </h3>
                      </div>

                      {studentDetails.attempts?.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-200/60 text-xs">
                          Cadet has not yet commenced or submitted any examinations.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {studentDetails.attempts.map((att: any) => (
                            <div
                              key={att.id}
                              className={`p-4 rounded-2xl border transition-all ${
                                att.submissionMethod === 'AUTO_TAB_SWITCH' || (att.tabSwitchViolations && att.tabSwitchViolations >= 3)
                                  ? 'bg-rose-50/50 border-rose-200'
                                  : att.tabSwitchViolations > 0
                                  ? 'bg-amber-50/40 border-amber-200'
                                  : 'bg-white border-slate-200/80 shadow-xs'
                              }`}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#133E87]/10 text-[#133E87] border border-[#133E87]/20">
                                      {att.exam?.examCode}
                                    </span>
                                    <h4 className="font-bold text-slate-900 text-sm">
                                      {att.exam?.title}
                                    </h4>
                                  </div>
                                  <div className="text-xs text-slate-500 mt-1">
                                    Started: {new Date(att.startedAt).toLocaleString()} • Status: <span className="font-semibold uppercase">{att.status}</span>
                                  </div>

                                  {/* Proctoring Warning Badge */}
                                  {att.submissionMethod === 'AUTO_TAB_SWITCH' ? (
                                    <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[11px] font-bold">
                                      <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                                      <span>Security Termination: Tab Switch Limit Breached</span>
                                    </div>
                                  ) : att.tabSwitchViolations > 0 ? (
                                    <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold">
                                      <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                                      <span>{att.tabSwitchViolations} Tab Switch Warning{att.tabSwitchViolations > 1 ? 's' : ''}</span>
                                    </div>
                                  ) : null}
                                </div>

                                <div className="flex items-center gap-4 shrink-0 self-end sm:self-center">
                                  <div className="text-right">
                                    <div className="text-base font-black text-slate-900">
                                      {att.totalScore} / {att.exam?.totalMarks}
                                    </div>
                                    <span
                                      className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block ${
                                        att.isPassed
                                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                                      }`}
                                    >
                                      {att.isPassed ? 'Passed' : 'Failed'} ({att.percentage}%)
                                    </span>
                                  </div>

                                  <Link
                                    href={`/admin/attempts/${att.id}/evaluate`}
                                    className="p-2 rounded-xl bg-slate-100 hover:bg-[#133E87] hover:text-white text-slate-600 transition"
                                    title="View & Grade Exam Attempt"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </Link>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 3: PROCTORING & INTEGRITY AUDIT */}
                  {activeAnalyticsTab === 'proctoring' && (
                    <div className="space-y-4">
                      {/* Overall Proctoring Status Banner */}
                      <div className={`p-5 rounded-2xl border ${
                        studentAnalytics?.disciplineScore >= 90
                          ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                          : studentAnalytics?.disciplineScore >= 70
                          ? 'bg-amber-50/60 border-amber-200 text-amber-950'
                          : 'bg-rose-50/60 border-rose-200 text-rose-950'
                      }`}>
                        <div className="flex items-start gap-3">
                          {studentAnalytics?.disciplineScore >= 90 ? (
                            <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                          ) : (
                            <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                          )}
                          <div>
                            <h4 className="font-extrabold text-sm">
                              Discipline Rating: {studentAnalytics?.disciplineScore}% ({studentAnalytics?.disciplineStatus})
                            </h4>
                            <p className="text-xs mt-1 leading-relaxed opacity-90">
                              {studentAnalytics?.totalTabSwitches === 0 && studentAnalytics?.terminatedCount === 0
                                ? 'Cadet has maintained a pristine examination record. Zero tab-switching, unauthorized window focus changes, or security breaches logged across all testing sessions.'
                                : `Cadet has accumulated ${studentAnalytics?.totalTabSwitches} total tab-switch warning(s) and ${studentAnalytics?.terminatedCount} security auto-termination(s). Review attempt logs for detailed proctoring timestamps.`}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Proctoring Metric Breakdown */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Warnings</span>
                          <span className="text-xl font-black text-slate-800">{studentAnalytics?.totalTabSwitches || 0}</span>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Security Auto-Terminations</span>
                          <span className="text-xl font-black text-rose-600">{studentAnalytics?.terminatedCount || 0}</span>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Integrity Index</span>
                          <span className="text-xl font-black text-[#133E87]">{studentAnalytics?.disciplineScore || 100} / 100</span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-400">
                Official National Cadet Corps Examination Analytics Portal
              </span>
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-900 text-white transition"
              >
                Close Analytics
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        title="Delete Cadet Record"
        message={`Are you sure you want to permanently delete ${selectedStudent?.name}? All associated exam attempts and answer records will also be erased.`}
        confirmLabel="Delete Cadet"
        isDestructive={true}
        onConfirm={handleDeleteStudent}
        onCancel={() => setIsDeleteDialogOpen(false)}
      />
    </div>
  );
}
