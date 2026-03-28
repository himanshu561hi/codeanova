import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, Link } from "react-router-dom";
import { API_BASE_URL, UPLOADS_URL } from "../config";

const StudentDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [assignedProjects, setAssignedProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [broadcast, setBroadcast] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
    fetchBroadcast();
    const interval = setInterval(fetchBroadcast, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchBroadcast = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/broadcast/latest`);
      const data = await res.json();
      if (data.success) setBroadcast(data.data);
    } catch (err) { console.error(err); }
  };

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("studentToken");
      const res = await fetch(`${API_BASE_URL}/api/student/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        localStorage.removeItem("studentToken");
        navigate("/student-login");
        return;
      }
      const data = await res.json();
      if (data.success) {
        setProfile(data.data.user);
        setProjects(data.data.projects);
        setAssignedProjects(data.data.assignedProjects || []);
      }
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const handleLogout = () => {
    localStorage.removeItem("studentToken");
    navigate("/student-login");
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("profilePic", file);
    try {
      const token = localStorage.getItem("studentToken");
      const res = await fetch(`${API_BASE_URL}/api/student/upload-profile-pic`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (data.success) {
        setProfile({ ...profile, profilePic: data.profilePic });
        toast.success("Profile photo updated! ✨");
      }
    } catch { toast.error("Upload failed"); }
  };

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-zinc-500 text-xs uppercase tracking-widest font-bold">Loading your portal…</p>
      </div>
    </div>
  );

  const targetProjects = parseInt(profile?.preferredDuration?.split(" ")[0]) || 0;
  const progressPct = targetProjects === 0 ? 0 : Math.min(100, (projects.length / targetProjects) * 100);
  const isComplete = projects.length >= targetProjects && targetProjects > 0;

  const calculateScore = () => {
    let score = projects.length * 50;
    projects.forEach(p => {
      if (p.grade === "A+") score += 30;
      else if (p.grade === "A") score += 20;
      else if (p.grade === "B") score += 10;
    });
    if (profile?.badges?.includes("Early Bird ⚡")) score += 100;
    return score;
  };
  const score = calculateScore();

  const milestones = [
    { label: "Registered", done: true, date: profile?.appliedAt ? new Date(profile.appliedAt).toLocaleDateString("en-IN", { day:"numeric", month:"short" }) : "" },
    { label: "Batch Assigned", done: profile?.internshipStartDate !== "Unassigned", date: profile?.internshipStartDate !== "Unassigned" ? profile?.internshipStartDate : "Pending" },
    { label: "First Submission", done: projects.length > 0, date: projects.length > 0 ? new Date(projects[projects.length - 1].submittedAt).toLocaleDateString("en-IN", { day:"numeric", month:"short" }) : "Locked" },
    { label: "Completed", done: isComplete, date: isComplete ? "Internship Done" : "In Progress" },
  ];

  return (
    <div className="bg-zinc-950 min-h-screen text-white font-sans">

      {/* ── TOP NAV BAR ─────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/90 backdrop-blur border-b border-zinc-800 px-5 md:px-10 h-16 flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-emerald-400">Code-A-Nova Portal</span>
        <div className="flex items-center gap-3">
          <Link
            to="/submit-project"
            state={{ email: profile?.email, studentId: profile?.studentId, preferredDomain: profile?.preferredDomain }}
            className="hidden md:flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
            Submit Project
          </Link>
          
          <button
            onClick={() => {
              const url = `${window.location.origin}/verify/${profile?.studentId}`;
              window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, "_blank");
            }}
            className="hidden lg:flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full border border-zinc-700 hover:border-emerald-500 hover:text-emerald-400 transition-all"
          >
            Share
          </button>
          <button
            onClick={handleLogout}
            className="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full border border-zinc-800 text-zinc-500 hover:border-red-500/50 hover:text-red-400 transition-all"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="pt-24 pb-20 px-5 md:px-10 max-w-7xl mx-auto space-y-6 md:space-y-10">
        
        {/* ── BROADCAST BANNER ──────────────────────────────────── */}
        {broadcast && (
          <div className="flex items-center gap-4 px-5 py-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <p className="text-sm text-blue-200 italic flex-1">"{broadcast.message}"</p>
            <button onClick={() => setBroadcast(null)} className="text-zinc-600 hover:text-white transition-colors shrink-0">✕</button>
          </div>
        )}

        {/* ── BENTO HERO SECTION ───────────────────────────────────── */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Profile card — spans 2 cols */}
          <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-3xl p-8 flex flex-col sm:flex-row gap-8 items-start relative overflow-hidden">
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-emerald-500/5 blur-[60px] rounded-full pointer-events-none" />

            {/* Avatar */}
            <div className="relative shrink-0 group cursor-pointer" onClick={() => document.getElementById("picInput").click()}>
              <input type="file" id="picInput" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
              <div className="w-24 h-24 rounded-2xl overflow-hidden border border-zinc-700">
                <img
                  src={profile?.profilePic 
                    ? (profile.profilePic.startsWith('http') ? profile.profilePic : `${UPLOADS_URL}${profile.profilePic}`) 
                    : `https://api.dicebear.com/7.x/initials/svg?seed=${profile?.fullName}&backgroundColor=059669,065f46&fontFamily=Arial&fontSize=40&fontWeight=700`}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl">
                <span className="text-[8px] text-white font-black uppercase tracking-widest">Change</span>
              </div>
              <div className="absolute -bottom-1.5 -right-1.5 w-5 h-5 bg-emerald-500 rounded-full border-2 border-zinc-900 flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                </svg>
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-black tracking-tighter uppercase italic">Code-A-Nova <span className="text-emerald-500">Portal</span></h1>
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white truncate flex items-center gap-3">
                {profile?.fullName}
                {(() => {
                  const s = new Date(profile?.internshipStartDate);
                  const dur = parseInt(profile?.preferredDuration) || 1;
                  if (profile?.internshipStartDate !== "Unassigned" && !isNaN(s.getTime())) {
                    const e = new Date(s);
                    e.setMonth(s.getMonth() + dur);
                    if (new Date() >= e) return <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/20">✓</span>;
                  }
                  return null;
                })()}
              </h1>
              <p className="text-zinc-500 text-sm mt-1 font-mono tracking-tighter flex items-center gap-4">
                {profile?.studentId}
                {profile?.certificateId && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[9px] font-black text-emerald-500 uppercase tracking-widest animate-pulse">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.64.304 1.25.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745a3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm1.652 2.26a1 1 0 011.414 0L12 8.414l2.667-2.667a1 1 0 011.414 1.414L13.414 10l2.667 2.667a1 1 0 01-1.414 1.414L12 11.586l-2.667 2.667a1 1 0 01-1.414-1.414L10.586 10 7.919 7.333a1 1 0 010-1.414z" /></svg>
                    ID: {profile.certificateId}
                  </span>
                )}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-full text-xs text-zinc-300 font-medium">{profile?.preferredDomain}</span>
                <span className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-full text-xs text-zinc-300 font-medium">{profile?.course} · {profile?.branch}</span>
                <span className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-full text-xs text-zinc-300 font-medium">{profile?.collegeName}</span>
              </div>

              {/* Badges */}
              {(profile?.badges || []).length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {profile.badges.map(b => (
                    <span key={b} className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-[10px] text-amber-400 font-black uppercase tracking-wide">
                      🏅 {b}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Score card */}
          <div className="bg-emerald-500 rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-emerald-400/30 rounded-full blur-2xl" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-900">Excellence Score</span>
            <div className="relative z-10">
              <p className="text-7xl font-black text-emerald-950 leading-none">{score}</p>
              <p className="text-emerald-800 text-sm font-bold mt-2">+50 per project · +30 for A+</p>
            </div>
            <div className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full w-fit ${
              profile?.paymentStatus === "Paid" ? "bg-emerald-950/30 text-emerald-950" : "bg-amber-400/20 text-amber-800"
            }`}>
              {profile?.paymentStatus === "Paid" ? "✓ Payment Verified" : "⏳ Payment Pending"}
            </div>
          </div>
        </section>

        {/* ── PROGRESS + INFO ROW ───────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {/* Progress ring */}
          <div className="col-span-2 md:col-span-1 bg-zinc-900 border border-zinc-800 rounded-3xl p-7 flex flex-col items-center justify-center gap-4">
            <div className="relative w-28 h-28">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                <circle cx="50" cy="50" r="42" fill="none" stroke={isComplete ? "#10b981" : "#6366f1"}
                  strokeWidth="8" strokeLinecap="round"
                  strokeDasharray="264" strokeDashoffset={264 - (264 * progressPct) / 100}
                  style={{ transition: "stroke-dashoffset 1s ease" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-white">{projects.length}</span>
                <span className="text-[9px] text-zinc-500 font-bold uppercase">/ {targetProjects}</span>
              </div>
            </div>
            <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest text-center">
              {isComplete ? "✅ All Done!" : "Projects"}
            </p>
          </div>

          {/* Info chips */}
          {(() => {
            const calculateEndDate = (start, dur) => {
              if (!start || start === "Unassigned") return "Pending";
              const s = new Date(start);
              if (isNaN(s.getTime())) return "Pending";
              const months = parseInt(dur) || 1;
              const e = new Date(s);
              e.setMonth(s.getMonth() + months);
              return e.toISOString().split('T')[0];
            };
            const endDate = calculateEndDate(profile?.internshipStartDate, profile?.preferredDuration);

            return [
              { label: "Domain", value: profile?.preferredDomain },
              { label: "Duration", value: profile?.preferredDuration },
              { label: "Batch Start", value: profile?.internshipStartDate === "Unassigned" ? "Pending" : profile?.internshipStartDate },
              { label: "Deadline", value: endDate },
            ].map(info => (
              <div key={info.label} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-7 flex flex-col justify-between">
                <span className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-500">{info.label}</span>
                <p className={`text-lg font-black leading-tight ${info.value === "Pending" ? "text-amber-400" : "text-white"}`}>
                  {info.value}
                </p>
              </div>
            ));
          })()}
        </div>

        {/* ── INTERNSHIP TIMELINE ───────────────────────────────────── */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-center justify-between mb-6 md:mb-8 gap-4">
            <h3 className="text-lg md:text-xl font-black text-white uppercase tracking-tight">Internship <span className="text-zinc-500">Timeline</span></h3>
            <div className="flex items-center gap-3 px-3 py-1.5 bg-zinc-950 rounded-full border border-zinc-800">
              <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Duration: {profile?.preferredDuration}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 relative">
            {milestones.map((m, i) => (
              <div key={m.label} className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                    m.done ? "bg-emerald-500 text-white" : "bg-zinc-800 border border-zinc-700 text-zinc-600"
                  }`}>
                    {m.done ? "✓" : String(i + 1).padStart(2, "0")}
                  </div>
                  {i < milestones.length - 1 && (
                    <div className={`hidden md:block h-px flex-1 ${m.done ? "bg-emerald-500/40" : "bg-zinc-800"}`} />
                  )}
                </div>
                <p className="text-white font-bold text-sm">{m.label}</p>
                <p className="text-zinc-500 text-xs font-mono">{m.date}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── ASSIGNED PROJECTS (NEW) ────────────────────────────── */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8">
             <div className="w-24 h-24 bg-emerald-500/5 blur-3xl rounded-full" />
          </div>
          <div className="mb-8 relative z-10">
            <span className="text-[8px] font-black uppercase tracking-[0.4em] text-emerald-500 mb-1 block underline decoration-emerald-500/20 underline-offset-4">Curriculum</span>
            <h2 className="text-2xl font-black text-white mt-2">Milestone <span className="text-emerald-500">Projects</span></h2>
            <p className="text-zinc-500 text-[10px] mt-2 max-w-lg leading-relaxed">Projects unlock every 30 days based on your start date. Complete each milestone to qualify for certification.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
            {assignedProjects.length === 0 ? (
              <div className="col-span-full py-24 text-center bg-zinc-950/40 rounded-[2.5rem] border border-zinc-800/40 border-dashed">
                <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-6">
                   <svg className="w-8 h-8 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <p className="text-zinc-500 font-black uppercase text-[10px] tracking-[0.2em]">Assignment Pending</p>
                <p className="text-zinc-600 text-[10px] mt-2 italic px-10">Your specialized curriculum will appear here once your batch is assigned by the admin team.</p>
              </div>
            ) : (
              assignedProjects.map((p, idx) => {
                const isSubmitted = projects.some(sp => sp.monthNumber === p.monthNumber);
                
                // NEW: Month 1 is ONLY active if Today >= startDate
                const startDate = new Date(profile?.internshipStartDate);
                const today = new Date();
                const isStarted = !isNaN(startDate.getTime()) && today >= startDate;

                const firstUnsubmittedIdx = assignedProjects.filter(ap => projects.some(sp => sp.monthNumber === ap.monthNumber)).length;
                const isCurrent = isStarted && assignedProjects.indexOf(p) === firstUnsubmittedIdx;
                
                return (
                  <div key={p._id} className={`group relative p-6 md:p-7 rounded-3xl border transition-all duration-500 flex flex-col items-start ${
                    isSubmitted 
                    ? 'bg-emerald-500/5 border-emerald-500/10' 
                    : isCurrent 
                      ? 'bg-zinc-900 border-zinc-700 shadow-[0_20px_50px_rgba(0,0,0,0.3)] ring-1 ring-zinc-800' 
                      : 'bg-zinc-950/40 border-zinc-900 opacity-60'
                  }`}>
                    {/* Status Glow */}
                    {isCurrent && !isSubmitted && (
                       <div className="absolute inset-0 bg-emerald-500/5 blur-3xl rounded-3xl -z-10 group-hover:bg-emerald-500/10 transition-all" />
                    )}

                    <div className="w-full flex justify-between items-center mb-6">
                      <div className={`p-2.5 rounded-xl flex items-center justify-center ${isSubmitted ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-800 text-zinc-500'}`}>
                         <span className="text-[9px] font-black uppercase tracking-tighter">M{p.monthNumber}</span>
                      </div>
                      <div className="flex gap-2">
                        {isSubmitted ? (
                          <span className="bg-emerald-500 text-zinc-950 px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1 animate-in fade-in zoom-in">
                            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                            DONE
                          </span>
                        ) : isCurrent ? (
                          <span className="bg-zinc-800 text-zinc-300 px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1 ring-1 ring-zinc-700">
                            <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                            ACTIVE
                          </span>
                        ) : (
                          <span className="bg-zinc-950 text-zinc-600 px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border border-zinc-900">
                             LOCKED
                          </span>
                        )}
                      </div>
                    </div>

                    <h4 className={`text-lg font-black mb-2 leading-tight tracking-tight transition-colors ${isCurrent ? 'text-white' : 'text-zinc-400'}`}>{p.title}</h4>
                    <p className="text-zinc-500 text-[10px] leading-relaxed mb-6 flex-1 line-clamp-3">{p.description}</p>
                    
                    <div className="w-full pt-4 border-t border-zinc-800/40 flex items-center justify-between mt-auto">
                      {p.documentLink && (isSubmitted || isCurrent) ? (
                        <a 
                          href={p.documentLink} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className={`flex items-center gap-2 text-[9px] font-black uppercase tracking-widest transition-all ${
                            isSubmitted ? 'text-emerald-500 hover:text-emerald-400' : 'text-zinc-300 hover:text-emerald-400'
                          }`}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          Briefing
                        </a>
                      ) : p.documentLink ? (
                        <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-zinc-700 cursor-not-allowed" title="Unlock current milestone first">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                          Locked
                        </div>
                      ) : (
                        <span className="text-[8px] text-zinc-700 font-black uppercase tracking-widest italic">No Link</span>
                      )}

                      <button 
                        disabled={!isSubmitted && !isCurrent}
                        onClick={() => {
                          const link = p.documentLink || `${window.location.origin}/submit-project`;
                          navigator.clipboard.writeText(link);
                          toast.success("Link copied! ✨");
                        }}
                        className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all font-bold ${
                          (!isSubmitted && !isCurrent) 
                          ? 'bg-zinc-950/20 border-zinc-900 text-zinc-800 cursor-not-allowed' 
                          : 'bg-zinc-950/50 border-zinc-800 text-zinc-500 hover:bg-emerald-500 hover:text-zinc-950 hover:border-emerald-500'
                        }`}
                        title={(!isSubmitted && !isCurrent) ? "Locked" : "Copy Share Link"}
                      >
                         <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 100-6 3 3 0 000 6zm0 12a3 3 0 100-6 3 3 0 000 6z" /></svg>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
            
            {/* Locked Preview Placeholder */}
            {profile?.preferredDuration && assignedProjects.length < parseInt(profile.preferredDuration) && (
              <div className="group relative p-6 md:p-7 rounded-3xl border border-zinc-900 bg-zinc-950/20 flex flex-col items-center justify-center text-center opacity-40">
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
                   <svg className="w-6 h-6 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <p className="text-[10px] font-black uppercase text-zinc-600 tracking-[0.3em]">Milestone {assignedProjects.length + 1} Locked</p>
                <p className="text-[9px] text-zinc-700 mt-2 italic px-8">Complete the current phase to progress further</p>
              </div>
            )}
          </div>
        </div>

        {/* ── PERSONAL DETAILS ──────────────────────────────────── */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-500 mb-6">Personal Details</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
            {[
              { l: "Email", v: profile?.email },
              { l: "WhatsApp", v: profile?.whatsapp },
              { l: "State", v: profile?.state },
              { l: "Year", v: profile?.currentYear },
              { l: "Student ID", v: profile?.studentId, mono: true },
              { l: "Joined", v: profile?.appliedAt ? new Date(profile.appliedAt).toLocaleDateString("en-IN") : "—" },
            ].map(d => (
              <div key={d.l}>
                <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest mb-1">{d.l}</p>
                <p className={`text-sm text-white font-medium truncate ${d.mono ? "font-mono" : ""}`} title={d.v}>{d.v || "—"}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── SUBMISSIONS ───────────────────────────────────────── */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-500 mb-1">Submissions</p>
              <h2 className="text-2xl font-black text-white">Project History
                <span className="ml-3 text-sm text-zinc-500 font-bold">({projects.length})</span>
              </h2>
            </div>
            {projects.length < targetProjects && (
              <Link
                to="/submit-project"
                state={{ email: profile?.email, studentId: profile?.studentId, preferredDomain: profile?.preferredDomain }}
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs uppercase tracking-widest rounded-full transition-all active:scale-[0.98] shadow-[0_0_30px_rgba(52,211,153,0.2)]"
              >
                Submit Project →
              </Link>
            )}
          </div>

          {projects.length === 0 ? (
            <div className="py-16 flex flex-col items-center text-zinc-600">
              <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-dashed border-zinc-700 flex items-center justify-center mb-4">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-sm font-bold">No submissions yet</p>
              <p className="text-xs mt-1">Click "Submit Project" to begin your journey</p>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.map((proj, idx) => (
                <div key={proj._id} className="border border-zinc-800 rounded-2xl overflow-hidden">
                  {/* Row header */}
                  <button
                    className="w-full flex items-center justify-between p-6 hover:bg-zinc-800/50 transition-colors text-left group"
                    onClick={() => setExpandedId(expandedId === proj._id ? null : proj._id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-black text-zinc-400 group-hover:border-emerald-500/30 group-hover:text-emerald-400 transition-all">
                        {String(proj.monthNumber).padStart(2, "0")}
                      </div>
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 block">Month {proj.monthNumber} Submission</span>
                        <span className="text-white font-bold">Multiple Tasks</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="hidden sm:block text-right">
                        <span className="text-[9px] text-zinc-600 uppercase tracking-widest block">Grade</span>
                        <span className={`font-black text-lg ${proj.grade === "Pending" ? "text-zinc-600" : "text-emerald-400"}`}>
                          {proj.grade === "Pending" ? "—" : proj.grade}
                        </span>
                      </div>
                      <div className="hidden sm:block text-right">
                        <span className="text-[9px] text-zinc-600 uppercase tracking-widest block">Submitted</span>
                        <span className="text-zinc-300 text-xs font-mono">{new Date(proj.submittedAt).toLocaleDateString("en-IN")}</span>
                      </div>
                      <svg className={`w-5 h-5 text-zinc-600 group-hover:text-emerald-400 transition-all duration-300 ${expandedId === proj._id ? "rotate-180 text-emerald-400" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {/* Expanded content */}
                  {expandedId === proj._id && (
                    <div className="border-t border-zinc-800 p-6 space-y-4 bg-zinc-950/50">
                      {/* Legacy */}
                      {proj.projectTitle && !proj.task1?.name && (
                        <div className="p-5 bg-zinc-900 rounded-xl border border-zinc-700">
                          <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 block mb-2">Project</span>
                          <h5 className="text-white font-bold mb-1">{proj.projectTitle}</h5>
                          <p className="text-zinc-400 text-sm">{proj.projectDescription}</p>
                          <a href={proj.githubUrl} target="_blank" rel="noreferrer" className="text-blue-400 text-xs hover:text-white mt-2 block truncate">{proj.githubUrl}</a>
                        </div>
                      )}

                      {/* Tasks grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                          { task: proj.task1, n: "01", label: "Mandatory", color: "border-blue-500/30 text-blue-400" },
                          { task: proj.task2, n: "02", label: "Optional", color: "border-emerald-500/30 text-emerald-400" },
                          { task: proj.task3, n: "03", label: "Optional", color: "border-violet-500/30 text-violet-400" },
                        ].filter(t => t.task?.name).map(({ task, n, label, color }) => (
                          <div key={n} className={`p-5 bg-zinc-900 rounded-xl border ${color}`}>
                            <div className="flex items-center justify-between mb-3">
                              <span className={`text-[9px] font-black uppercase tracking-widest ${color.split(" ")[1]}`}>Task {n}</span>
                              <span className="text-[9px] text-zinc-600 uppercase">{label}</span>
                            </div>
                            <h5 className="text-white font-bold text-sm mb-2">{task.name}</h5>
                            <a href={task.githubUrl} target="_blank" rel="noreferrer" className="text-blue-400 text-xs block truncate hover:text-white">GitHub →</a>
                            {task.liveUrl && <a href={task.liveUrl} target="_blank" rel="noreferrer" className="text-emerald-400 text-xs block truncate hover:text-white mt-1">Live Demo →</a>}
                          </div>
                        ))}
                      </div>

                      {/* Feedback */}
                      <div className="flex flex-col sm:flex-row gap-4 p-5 bg-zinc-900 rounded-xl border border-zinc-700">
                        <div className="flex-1">
                          <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 block mb-2">Mentor Feedback</span>
                          <p className="text-zinc-300 text-sm italic">
                            {proj.feedback && proj.feedback !== "No feedback yet"
                              ? `"${proj.feedback}"`
                              : "Awaiting review from our mentoring team. Your work is in good hands!"}
                          </p>
                        </div>
                        <div className="shrink-0 text-center flex flex-col items-center justify-center min-w-[80px]">
                          <span className="text-[9px] text-zinc-600 uppercase tracking-widest block mb-1">Grade</span>
                          <span className={`text-4xl font-black ${proj.grade === "Pending" ? "text-zinc-700" : "text-emerald-400"}`}>
                            {proj.grade === "Pending" ? "—" : proj.grade}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default StudentDashboard;
