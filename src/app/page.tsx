import {
  Clock,
  FileText,
  Layers,
} from 'lucide-react';
import { NccLogo } from '@/components/NccLogo';
import { Navbar } from '@/components/Navbar';
import { getSession } from '@/lib/auth';

export default async function HomePage() {
  const session = await getSession();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-white transition-colors duration-200">
      {/* Universal Persistent Navbar */}
      <Navbar user={session} />

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">
        <div className="text-center max-w-3xl mx-auto">
          {/* Official NCC Emblem Display */}
          <div className="flex justify-center mb-6">
            <NccLogo size={90} priority className="shadow-2xl shadow-black/10 dark:shadow-black/50 ring-4 ring-[#D4AF37]/30" />
          </div>

          {/* Authentic NCC Tri-Service Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-xs font-bold tracking-wide uppercase mb-6 shadow-xs">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#B71C1C]" title="Army" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#133E87]" title="Navy" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#4A90E2]" title="Air Force" />
            </div>
            <span className="text-amber-700 dark:text-[#D4AF37]">National Cadet Corps</span>
            <span className="text-slate-400">•</span>
            <span className="text-[#133E87] dark:text-[#4A90E2]">Tri-Service Assessment Platform</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Precision Assessment for{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#B71C1C] via-[#133E87] to-amber-600">
              Future Leaders & Cadets
            </span>
          </h1>

          <p className="mt-4 sm:mt-6 text-base sm:text-lg text-slate-600 leading-relaxed px-2">
            A comprehensive, server-authoritative online examination engine, reusable question bank,
            and automated question paper extractor for NCC training units and educational directorates.
          </p>


        </div>

        {/* Feature Cards Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md dark:hover:border-slate-700 transition">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Server-Authoritative Timer</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Tamper-proof countdown timer strictly validated on the server. Survives browser refresh
              and triggers automatic locked submission upon zero remaining time.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md dark:hover:border-slate-700 transition">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">8 Question Archetypes</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Full support for MCQ, True/False, Fill in the Blanks, Short Answer, Long Answer,
              Match the Following, Ordering sequences, and Image-based questions.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md dark:hover:border-slate-700 transition">
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Question Paper Upload & Review</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Upload existing PDF/DOCX/text question papers. The intelligent extractor stages questions
              with a mandatory &apos;Needs Review&apos; workflow before bank integration.
            </p>
          </div>
        </div>

      </main>
    </div>
  );
}
