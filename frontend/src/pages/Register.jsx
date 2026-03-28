import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { API_BASE_URL } from "../config";

const Register = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const [formData, setFormData] = useState({
    fullName: "", email: "", whatsapp: "", course: "",
    branch: "", currentYear: "", collegeName: "",
    state: "", preferredDomain: "", preferredDuration: "",
  });
  const [errors, setErrors] = useState({});
  const [isShaking, setIsShaking] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const domains = [
    "Frontend Development", "Backend Development", "MERN Stack Development",
    "Full Stack Development", "Artificial Intelligence", "Machine Learning",
    "Data Science", "Python Development", "C Programming", "Figma or UI/UX",
  ];
  const durations = ["1 Month", "2 Months", "3 Months"];
  const years = ["1st Year", "2nd Year", "3rd Year", "4th Year", "Passout"];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: "" });
  };

  const validateForm = () => {
    const newErrors = {};
    Object.keys(formData).forEach((key) => {
      if (!formData[key]) newErrors[key] = "Required";
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (response.ok) {
        setSubmitted(true);
        setFormData({ fullName:"",email:"",whatsapp:"",course:"",branch:"",
          currentYear:"",collegeName:"",state:"",preferredDomain:"",preferredDuration:"" });
      } else {
        toast.error(`Error: ${data.message}`);
      }
    } catch {
      toast.error("Cannot connect to server. Make sure backend is running.");
    }
  };

  const inp = (field) =>
    `w-full bg-zinc-900 border rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none transition-all ${
      errors[field] ? "border-red-500/60 bg-red-500/5" : "border-zinc-800 focus:border-emerald-500/60 focus:bg-zinc-800/80"
    }`;

  const sel = (field) =>
    `w-full bg-zinc-900 border rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-all appearance-none cursor-pointer ${
      errors[field] ? "border-red-500/60 bg-red-500/5" : "border-zinc-800 focus:border-emerald-500/60"
    }`;

  if (submitted) return (
    <main className="bg-zinc-950 min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-lg">
        <div className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center mx-auto mb-8">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter mb-4">You're in, <span className="text-emerald-400">{formData.fullName.split(' ')[0]}!</span></h2>
        <p className="text-zinc-500 text-sm max-w-sm mx-auto mb-10 leading-relaxed uppercase font-bold">Your application for the <span className="text-white">{formData.preferredDomain}</span> internship at <span className="text-emerald-500">Code-A-Nova</span> has been successfully logged. We'll send your Student ID to your email within 24 hours.</p>
        <a href="/" className="inline-block px-8 py-3 bg-emerald-500 text-zinc-950 font-black text-xs tracking-widest uppercase rounded-full hover:bg-emerald-400 transition-all">
          Back to Home
        </a>
      </div>
    </main>
  );

  return (
    <main className="bg-zinc-950 min-h-screen text-white">

      <div className="max-w-6xl mx-auto px-5 md:px-10 pt-32 pb-24">

        {/* Page Header */}
        <div className="mb-14 border-b border-zinc-800 pb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="text-[10px] text-emerald-400 font-black uppercase tracking-[0.5em]">Code-A-Nova · 2026</span>
            <h1 className="text-5xl md:text-7xl font-black tracking-[-0.03em] leading-none mt-3 uppercase">
              Apply<br /><span className="text-zinc-600">Now.</span>
            </h1>
          </div>
          <p className="text-zinc-500 text-sm max-w-xs leading-relaxed">
            Free registration. Takes 2 minutes. Your Student ID will be emailed within 24 hours.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className={isShaking ? "animate-shake" : ""}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Left column — section labels */}
            <div className="hidden lg:flex flex-col gap-8 pt-1">
              {[
                { n: "01", t: "Personal", d: "Your contact information" },
                { n: "02", t: "Academic", d: "College & course details" },
                { n: "03", t: "Internship", d: "Track & duration" },
              ].map(s => (
                <div key={s.n} className="py-6 border-t border-zinc-800">
                  <p className="text-emerald-400 text-xs font-black tracking-[0.4em] uppercase mb-1">{s.n}</p>
                  <p className="text-white font-black text-lg">{s.t}</p>
                  <p className="text-zinc-600 text-xs mt-1">{s.d}</p>
                </div>
              ))}
            </div>

            {/* Right column — form fields */}
            <div className="lg:col-span-2 space-y-6">

              {/* ── Personal ─── */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 space-y-5">
                <p className="text-[10px] text-emerald-400 font-black uppercase tracking-[0.4em] mb-6 lg:hidden">01 — Personal Information</p>

                <div>
                  <label className="text-xs text-zinc-400 font-bold uppercase tracking-widest block mb-2">Full Name *</label>
                  <input type="text" name="fullName" value={formData.fullName} placeholder="Himanshu Gupta" onChange={handleChange} className={inp("fullName")} />
                  {errors.fullName && <p className="text-red-400 text-xs mt-1">{errors.fullName}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="text-xs text-zinc-400 font-bold uppercase tracking-widest block mb-2">Email *</label>
                    <input type="email" name="email" value={formData.email} placeholder="your@email.com" onChange={handleChange} className={inp("email")} />
                    {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400 font-bold uppercase tracking-widest block mb-2">WhatsApp *</label>
                    <input type="tel" name="whatsapp" value={formData.whatsapp} placeholder="+91 00000 00000" onChange={handleChange} className={inp("whatsapp")} />
                    {errors.whatsapp && <p className="text-red-400 text-xs mt-1">{errors.whatsapp}</p>}
                  </div>
                </div>
              </div>

              {/* ── Academic ─── */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 space-y-5">
                <p className="text-[10px] text-emerald-400 font-black uppercase tracking-[0.4em] mb-6 lg:hidden">02 — Academic Details</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="text-xs text-zinc-400 font-bold uppercase tracking-widest block mb-2">Course *</label>
                    <input type="text" name="course" value={formData.course} placeholder="B.Tech, BCA…" onChange={handleChange} className={inp("course")} />
                    {errors.course && <p className="text-red-400 text-xs mt-1">{errors.course}</p>}
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400 font-bold uppercase tracking-widest block mb-2">Branch *</label>
                    <input type="text" name="branch" value={formData.branch} placeholder="CSE, IT, ECE…" onChange={handleChange} className={inp("branch")} />
                    {errors.branch && <p className="text-red-400 text-xs mt-1">{errors.branch}</p>}
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400 font-bold uppercase tracking-widest block mb-2">Current Year *</label>
                    <div className="relative">
                      <select name="currentYear" value={formData.currentYear} onChange={handleChange} className={sel("currentYear")}>
                        <option value="">Select Year</option>
                        {years.map(y => <option key={y} value={y} className="bg-zinc-900">{y}</option>)}
                      </select>
                      <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                    {errors.currentYear && <p className="text-red-400 text-xs mt-1">{errors.currentYear}</p>}
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400 font-bold uppercase tracking-widest block mb-2">State *</label>
                    <input type="text" name="state" value={formData.state} placeholder="Rajasthan, Delhi…" onChange={handleChange} className={inp("state")} />
                    {errors.state && <p className="text-red-400 text-xs mt-1">{errors.state}</p>}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-zinc-400 font-bold uppercase tracking-widest block mb-2">College / University *</label>
                  <input type="text" name="collegeName" value={formData.collegeName} placeholder="Full name of your institution" onChange={handleChange} className={inp("collegeName")} />
                  {errors.collegeName && <p className="text-red-400 text-xs mt-1">{errors.collegeName}</p>}
                </div>
              </div>

              {/* ── Internship Preference ─── */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 space-y-5">
                <p className="text-[10px] text-emerald-400 font-black uppercase tracking-[0.4em] mb-6 lg:hidden">03 — Internship Preference</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="text-xs text-zinc-400 font-bold uppercase tracking-widest block mb-2">Domain / Track *</label>
                    <div className="relative">
                      <select name="preferredDomain" value={formData.preferredDomain} onChange={handleChange} className={sel("preferredDomain")}>
                        <option value="">Choose Track</option>
                        {domains.map(d => <option key={d} value={d} className="bg-zinc-900">{d}</option>)}
                      </select>
                      <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                    {errors.preferredDomain && <p className="text-red-400 text-xs mt-1">{errors.preferredDomain}</p>}
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400 font-bold uppercase tracking-widest block mb-2">Duration *</label>
                    <div className="relative">
                      <select name="preferredDuration" value={formData.preferredDuration} onChange={handleChange} className={sel("preferredDuration")}>
                        <option value="">Select Period</option>
                        {durations.map(d => <option key={d} value={d} className="bg-zinc-900">{d}</option>)}
                      </select>
                      <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                    {errors.preferredDuration && <p className="text-red-400 text-xs mt-1">{errors.preferredDuration}</p>}
                  </div>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-sm uppercase tracking-[0.3em] rounded-2xl transition-all active:scale-[0.98] shadow-[0_0_40px_rgba(52,211,153,0.2)] hover:shadow-[0_0_60px_rgba(52,211,153,0.35)]"
              >
                Submit Application →
              </button>

              <p className="text-center text-zinc-700 text-xs">
                By applying you agree to our terms. Student ID will be emailed within 24 hrs.
              </p>
            </div>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-8px)} 75%{transform:translateX(8px)} }
        .animate-shake { animation: shake 0.3s ease-in-out 2; }
      `}</style>
    </main>
  );
};

export default Register;
