'use client';

import React, { useState } from 'react';
import { Settings, Save, Shield, Clock, Bell, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function AdminSettingsPage() {
  const { success } = useToast();
  const [passingPercentage, setPassingPercentage] = useState(50);
  const [networkGraceSeconds, setNetworkGraceSeconds] = useState(5);
  const [autosaveInterval, setAutosaveInterval] = useState(15);
  const [emailAlerts, setEmailAlerts] = useState(true);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    success('System settings saved successfully');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          System & Examination Settings
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure Directorate defaults, server-timer network buffers, and evaluation preferences.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Timing & Security */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2 border-b pb-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            <span>Server Timer & Submission Protection</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Network Latency Grace Buffer (Seconds)
              </label>
              <input
                type="number"
                min="0"
                max="30"
                value={networkGraceSeconds}
                onChange={(e) => setNetworkGraceSeconds(parseInt(e.target.value, 10) || 5)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-bold"
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Allowed clock skew buffer for student autosave sync requests.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Autosave Interval (Seconds)
              </label>
              <input
                type="number"
                min="5"
                max="60"
                value={autosaveInterval}
                onChange={(e) => setAutosaveInterval(parseInt(e.target.value, 10) || 15)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-bold"
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Background synchronization frequency for student answers.
              </span>
            </div>
          </div>
        </div>

        {/* Directorate Defaults */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2 border-b pb-2">
            <Shield className="w-4 h-4 text-indigo-600" />
            <span>Grading Policies</span>
          </h2>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Standard Passing Benchmark Percentage
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="20"
                  max="80"
                  value={passingPercentage}
                  onChange={(e) => setPassingPercentage(parseInt(e.target.value, 10) || 50)}
                  className="w-24 px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold text-center"
                />
                <span className="text-sm font-bold text-slate-600">% marks required to qualify</span>
              </div>
            </div>

            <label className="flex items-center gap-3 pt-2 cursor-pointer">
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm font-medium text-slate-700">
                Notify ANO / Officer on exam submission completion
              </span>
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm transition flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Preferences</span>
          </button>
        </div>
      </form>
    </div>
  );
}
