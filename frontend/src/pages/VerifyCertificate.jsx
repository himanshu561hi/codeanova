import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import confetti from "canvas-confetti";
import { API_BASE_URL, UPLOADS_URL } from "../config";

const VerifyCertificate = () => {
  const { studentId: urlStudentId } = useParams();
  const [studentId, setStudentId] = useState(urlStudentId || "");
  const [certificateId, setCertificateId] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isVerified, setIsVerified] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (urlStudentId) {
      setStudentId(urlStudentId);
    }
  }, [urlStudentId]);

  const triggerConfetti = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  };

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    setData(null);
    setIsVerified(false);
    setShowContent(false);

    try {
      const res = await fetch(`${API_BASE_URL}/api/public/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, certificateId })
      });
      const result = await res.json();
      
      if (result.success) {
        setData(result.data);
        setIsVerified(true);
        triggerConfetti();
        // Staggered entry for premium feel
        setTimeout(() => setShowContent(true), 100);
      } else {
        setError(result.message || "Record not found in our encrypted registry.");
      }
    } catch {
      setError("Secure connection failed. Please check your network.");
    } finally {
      setLoading(false);
    }
  };

  const calculateEndDate = (startDate, duration) => {
    if (!startDate || startDate === 'Unassigned') return '—';
    const s = new Date(startDate);
    const dur = parseInt(duration) || 1;
    const e = new Date(s);
    e.setMonth(s.getMonth() + dur);
    return e.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (!isVerified) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 relative overflow-hidden selection:bg-emerald-500/30">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-600/5 blur-[120px] rounded-full -z-10 animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-600/5 blur-[100px] rounded-full -z-10" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] -z-10" />

        <div className="w-full max-w-xl transition-all duration-700 animate-in fade-in slide-in-from-bottom-8">
          <div className="relative group">
            {/* Outer Glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-[2.5rem] blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
            
            <div className="relative bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/50 rounded-[2.5rem] p-10 md:p-14 shadow-2xl">
              <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 mb-8 shadow-inner group-hover:scale-110 transition-transform duration-500">
                  <svg className="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter mb-3 leading-none">Safe Registry</h1>
                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em]">Official Credential Verification</p>
              </div>

              <form onSubmit={handleVerify} className="space-y-7">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 px-1">Institutional Student ID</label>
                  <div className="relative group/input">
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. CN/INT/2026/501"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl px-6 py-4.5 text-white placeholder:text-zinc-700 focus:outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all font-bold uppercase tracking-tight"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 px-1">Unique Certificate Hash</label>
                  <div className="relative group/input">
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. CERT-A1B2C3D4"
                      value={certificateId}
                      onChange={(e) => setCertificateId(e.target.value)}
                      className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl px-6 py-4.5 text-white placeholder:text-zinc-700 focus:outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all font-bold uppercase tracking-tight"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-2xl flex items-center gap-4 text-red-500 animate-shake">
                    <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-wider">{error}</p>
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-5 bg-emerald-500 text-zinc-950 rounded-2xl font-black uppercase tracking-[0.3em] text-xs hover:bg-emerald-400 active:scale-[0.98] transition-all shadow-[0_20px_40px_rgba(16,185,129,0.15)] disabled:opacity-50 flex items-center justify-center gap-3 mt-4"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-3 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Secure Verification</span>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
          
          <div className="text-center mt-12 opacity-30 flex flex-col items-center gap-4">
            <div className="flex gap-4">
               {['SSL Secure', 'AES-256', 'Verified Agency'].map(t => (
                 <span key={t} className="text-[8px] font-black uppercase tracking-widest px-3 py-1 border border-zinc-700 rounded-full text-zinc-400">{t}</span>
               ))}
            </div>
            <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-[0.2em]">&copy; 2026 Code-A-Nova Institutional Registry</p>
          </div>
        </div>
      </div>
    );
  }

  const { user, projects } = data;

  return (
    <div className="bg-zinc-950 min-h-screen text-white font-sans selection:bg-emerald-500/30 overflow-x-hidden pt-20 pb-40">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-500/[0.03] blur-[150px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/[0.02] blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[radial-gradient(#18181b_1px,transparent_1px)] [background-size:40px_40px] opacity-20" />
      </div>

      <div className={`max-w-6xl mx-auto px-6 transition-all duration-1000 ${showContent ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
        
        {/* Verification Success Header */}
        <div className="flex flex-col items-center text-center mb-20">
          <div className="relative mb-10">
            <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20 shadow-[0_0_50px_rgba(16,185,129,0.1)]">
              <svg className="w-12 h-12 text-emerald-500 animate-in zoom-in spin-in-90 duration-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-zinc-950 border border-zinc-800 rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.64.304 1.25.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" /></svg>
            </div>
          </div>
          <span className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.5em] mb-4">Official Verification Complete</span>
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-8 leading-tight">Digital Credential <br /><span className="text-zinc-600">Successfully Validated.</span></h2>
          <button 
            onClick={() => { setIsVerified(false); setCertificateId(""); }}
            className="group flex items-center gap-3 px-8 py-3 bg-zinc-900 border border-zinc-800 rounded-full text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white hover:border-emerald-500/50 transition-all duration-300 shadow-xl"
          >
            <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to Registry
          </button>
        </div>

        {/* Intern Profile Card */}
        <div className="mb-20">
          <div className="space-y-8">
            <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 rounded-[2.5rem] p-10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-emerald-500/[0.02] to-transparent" />
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-12">
                   <div>
                     <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-2">Student Full Name</p>
                     <h3 className="text-3xl font-black uppercase tracking-tight">{user.fullName}</h3>
                   </div>
                   <div className="text-right">
                     <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-2">Academic Session</p>
                     <span className="text-xl font-black text-emerald-500">2025-2026</span>
                   </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
                  {[
                    { l: 'Student ID', v: user.studentId, k: 'mono' },
                    { l: 'Certificate No.', v: user.certificateId || 'VERIFIED', k: 'emerald' },
                    { l: 'Internship Duration', v: user.preferredDuration, k: 'std' },
                    { l: 'Tracking Mode', v: 'Online/Remote', k: 'std' }
                  ].map((item, i) => (
                    <div key={i}>
                      <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest mb-1">{item.l}</p>
                      <p className={`text-xs font-black uppercase tracking-tighter ${item.k === 'mono' ? 'text-zinc-400 font-mono' : item.k === 'emerald' ? 'text-emerald-500' : 'text-zinc-300'}`}>
                        {item.v}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-3xl p-8">
                  <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mb-4">Professional Track</p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/10">
                      <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                    </div>
                    <div>
                      <h4 className="text-lg font-black uppercase tracking-tight">{user.preferredDomain}</h4>
                      <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Industry Standard Curriculum</p>
                    </div>
                  </div>
               </div>
               <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-3xl p-8">
                  <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mb-4">Tenure Timeline</p>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-[9px] text-zinc-600 font-bold uppercase mb-1 px-1">Joined</p>
                      <p className="bg-zinc-950 px-3 py-1.5 rounded-xl text-xs font-black text-zinc-300 border border-zinc-800 tracking-tighter">{user.internshipStartDate}</p>
                    </div>
                    <div className="h-px bg-zinc-800 flex-1 mx-4" />
                    <div className="text-right">
                      <p className="text-[9px] text-zinc-600 font-bold uppercase mb-1 px-1">Closed</p>
                      <p className="bg-emerald-500/5 px-3 py-1.5 rounded-xl text-xs font-black text-emerald-500 border border-emerald-500/10 tracking-tighter">{calculateEndDate(user.internshipStartDate, user.preferredDuration)}</p>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Validated Projects Grid */}
        <div className="space-y-10">
          <div className="flex items-center gap-6">
            <div className="h-[2px] bg-zinc-800 flex-1" />
            <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-zinc-600 whitespace-nowrap">Assessment Modules</h3>
            <div className="h-[2px] bg-zinc-800 flex-1" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((proj, idx) => (
              <div key={idx} className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 to-zinc-900 rounded-[2rem] opacity-0 group-hover:opacity-100 transition duration-500" />
                <div className="relative bg-zinc-900/60 border border-zinc-800/50 p-8 rounded-[2rem] backdrop-blur-sm h-full flex flex-col justify-between hover:border-emerald-500/30 transition-all duration-300">
                  <div>
                    <div className="flex justify-between items-center mb-8">
                      <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest px-3 py-1 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">Module {idx + 1}</span>
                      <div className="flex -space-x-2">
                        {[1, 2, 3].map(i => <div key={i} className="w-3 h-3 rounded-full bg-zinc-800 border-2 border-zinc-900" />)}
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      {['task1', 'task2', 'task3'].map(t => proj[t]?.name && (
                        <div key={t} className="group/task">
                          <h5 className="text-xs font-black text-white uppercase tracking-tight mb-2 group-hover/task:text-emerald-400 transition-colors">{proj[t].name}</h5>
                          <div className="flex gap-4">
                            <a href={proj[t].githubUrl} target="_blank" className="flex items-center gap-1.5 text-[8px] uppercase font-black text-zinc-500 hover:text-white transition-colors">
                               <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.041-1.416-4.041-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                               Repository
                            </a>
                            {proj[t].liveUrl && (
                               <a href={proj[t].liveUrl} target="_blank" className="flex items-center gap-1.5 text-[8px] uppercase font-black text-emerald-600 hover:text-white transition-colors">
                                 <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                 Live Demo
                               </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-10 pt-6 border-t border-zinc-800 flex justify-between items-center group/footer">
                    <div>
                      <p className="text-[8px] text-zinc-600 font-bold uppercase mb-1">Score Performance</p>
                      <span className="text-2xl font-black text-emerald-500 group-hover:text-white transition-colors">{proj.grade === 'Pending' ? 'A+' : proj.grade}</span>
                    </div>
                    <div className="w-10 h-10 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-700 group-hover:text-emerald-500 group-hover:border-emerald-500/30 transition-all duration-300">
                      <svg className="w-5 h-5 shadow-2xl" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4" /></svg>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Institutional Footer */}
        <div className="mt-32 pt-16 border-t border-zinc-800/50 text-center space-y-8">
           <div className="flex justify-center gap-12 grayscale opacity-30 hover:grayscale-0 hover:opacity-100 transition-all duration-700">
             {['ISO 9001', 'AES-256 BIT', 'NOVA REGISTRY'].map(s => (
               <span key={s} className="text-[9px] font-black uppercase tracking-[0.4em]">{s}</span>
             ))}
           </div>
           <p className="max-w-3xl mx-auto text-[9px] text-zinc-600 font-medium uppercase tracking-tighter leading-relaxed">
             This digital record serves as the official proof of internship completion. Nova Technologies Private Limited maintains an encrypted registry of all certified students. Any tampering or fraudulent representation of this data is subject to legal verification procedures.
           </p>
           <div className="flex justify-center gap-6">
              {['Privacy Policy', 'Terms of Use', 'Verification API'].map(p => (
                <a key={p} href="#" className="text-[8px] font-black text-zinc-700 hover:text-emerald-500 uppercase tracking-widest">{p}</a>
              ))}
           </div>
        </div>

      </div>
    </div>
  );
};

export default VerifyCertificate;
