import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useNavigate, useLocation } from "react-router-dom";
import { API_BASE_URL } from "../config";

const SubmitProject = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const [formData, setFormData] = useState({
    email: location.state?.email || "",
    studentId: location.state?.studentId || "",
    preferredDomain: location.state?.preferredDomain || "",
    t1Name: "", t1Github: "", t1Live: "",
    t2Name: "", t2Github: "", t2Live: "",
    t3Name: "", t3Github: "", t3Live: "",
  });
  const [errors, setErrors] = useState({});
  const [isShaking, setIsShaking] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const domains = [
    "Frontend Development","Backend Development","MERN Stack Development",
    "Full Stack Development","Artificial Intelligence","Machine Learning",
    "Data Science","Python Development","C Programming","Figma or UI/UX",
  ];

  const loadRazorpay = () => new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: "" });
  };

  const validateForm = () => {
    const newErrors = {};
    ["email","studentId","preferredDomain","t1Name","t1Github"].forEach(k => {
      if (!formData[k]) newErrors[k] = "Required";
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
      const payload = {
        email: formData.email, studentId: formData.studentId,
        preferredDomain: formData.preferredDomain,
        task1: { name: formData.t1Name, githubUrl: formData.t1Github, liveUrl: formData.t1Live },
      };
      if (formData.t2Name || formData.t2Github)
        payload.task2 = { name: formData.t2Name || "Task 2", githubUrl: formData.t2Github, liveUrl: formData.t2Live };
      if (formData.t3Name || formData.t3Github)
        payload.task3 = { name: formData.t3Name || "Task 3", githubUrl: formData.t3Github, liveUrl: formData.t3Live };

      const res = await fetch(`${API_BASE_URL}/api/projects/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.showPaymentGateway) {
          setShowPaymentModal(true);
        } else {
          setSubmitted(true);
        }
      } else {
        toast.error(`Error: ${data.message}`);
      }
    } catch {
      toast.error("Failed to connect to backend server.");
    }
  };

  const handlePayment = async () => {
    try {
      const isLoaded = await loadRazorpay();
      if (!isLoaded) { toast.error("Razorpay SDK failed to load."); return; }

      const res = await fetch(`${API_BASE_URL}/api/projects/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) { toast.error(`Order failed: ${data.message}`); return; }

      const options = {
        key: data.key_id, amount: data.order.amount, currency: data.order.currency,
        name: "Codeanova Internship", description: "Certificate Issuance Fee",
        order_id: data.order.id,
        handler: async (response) => {
          const vRes = await fetch(`${API_BASE_URL}/api/projects/verify-payment`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...response, email: formData.email }),
          });
          const vData = await vRes.json();
          if (vData.success) {
            setShowPaymentModal(false);
            setSubmitted(true);
          } else {
            toast.error(`Payment blocked: ${vData.message}`);
          }
        },
        prefill: { email: formData.email },
        theme: { color: "#10b981" },
      };
      new window.Razorpay(options).open();
    } catch { toast.error("Failed to initiate payment."); }
  };

  const inp = (f) => `w-full bg-zinc-900 border rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none transition-all ${
    errors[f] ? "border-red-500/60" : "border-zinc-800 focus:border-emerald-500/50"
  }`;

  // ── Success Screen ───────────────────────────────────────────────────
  if (submitted) return (
    <main className="bg-zinc-950 min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-lg">
        <div className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center mx-auto mb-8 shadow-[0_0_60px_rgba(52,211,153,0.4)]">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-4xl font-black text-white tracking-tight mb-4 uppercase">Tasks Submitted!</h1>
        <p className="text-zinc-400 text-sm leading-relaxed mb-10">
          Your submission has been received. Our mentoring team will review and provide feedback within 48 hours.
        </p>
        <button
          onClick={() => localStorage.getItem("studentToken") ? navigate("/portal") : setSubmitted(false)}
          className="px-8 py-3 bg-emerald-500 text-zinc-950 font-black text-xs tracking-widest uppercase rounded-full hover:bg-emerald-400 transition-all"
        >
          {localStorage.getItem("studentToken") ? "Back to Dashboard →" : "Submit Another →"}
        </button>
      </div>
    </main>
  );

  return (
    <main className="bg-zinc-950 min-h-screen text-white">
      <div className="max-w-5xl mx-auto px-5 md:px-10 pt-32 pb-24">

        {/* Header */}
        <div className="mb-14 border-b border-zinc-800 pb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="text-[10px] text-emerald-400 font-black uppercase tracking-[0.5em]">Monthly Submission</span>
            <h1 className="text-5xl md:text-7xl font-black tracking-[-0.03em] leading-none mt-3 uppercase">
              Submit<br /><span className="text-zinc-600">Tasks.</span>
            </h1>
          </div>
          <p className="text-zinc-500 text-sm max-w-xs leading-relaxed">
            Task 1 is mandatory. Tasks 2 & 3 are optional bonus submissions that boost your Excellence Score.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className={isShaking ? "animate-shake" : ""}>

          {/* ── Student Info card ──────────────────────────────── */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 mb-5 space-y-5">
            <p className="text-[10px] text-emerald-400 font-black uppercase tracking-[0.4em] mb-2">01 — Student Identity</p>

            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-400 block mb-2">Registered Email *</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="your@email.com" className={inp("email")} />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-zinc-400 block mb-2">Student ID *</label>
                <input type="text" name="studentId" value={formData.studentId} onChange={handleChange} placeholder="CN/INT/2026/..." className={`${inp("studentId")} font-mono`} />
                {errors.studentId && <p className="text-red-400 text-xs mt-1">{errors.studentId}</p>}
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-zinc-400 block mb-2">Domain *</label>
                <div className="relative">
                  <select name="preferredDomain" value={formData.preferredDomain} onChange={handleChange} className={`${inp("preferredDomain")} appearance-none cursor-pointer`}>
                    <option value="">Select Domain</option>
                    {domains.map(d => <option key={d} value={d} className="bg-zinc-900">{d}</option>)}
                  </select>
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                {errors.preferredDomain && <p className="text-red-400 text-xs mt-1">{errors.preferredDomain}</p>}
              </div>
            </div>
          </div>

          {/* ── Task Sections ──────────────────────────────────── */}
          {[
            { num: 1, label: "Mandatory", accent: "border-blue-500/30 bg-blue-500/5", dot: "bg-blue-500", req: true },
            { num: 2, label: "Optional · Bonus", accent: "border-emerald-500/20 bg-emerald-500/3", dot: "bg-emerald-500", req: false },
            { num: 3, label: "Optional · Bonus", accent: "border-violet-500/20 bg-violet-500/3", dot: "bg-violet-500", req: false },
          ].map(({ num, label, accent, dot, req }) => {
            const pfx = `t${num}`;
            return (
              <div key={num} className={`border rounded-3xl p-8 mb-5 space-y-5 ${accent}`}>
                <div className="flex items-center gap-3 mb-2">
                  <span className={`w-2 h-2 rounded-full ${dot}`} />
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400">
                    0{num + 1} — Task {num} <span className="text-zinc-600">· {label}</span>
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-400 block mb-2">Task Name {req ? "*" : ""}</label>
                  <input type="text" name={`${pfx}Name`} value={formData[`${pfx}Name`]} onChange={handleChange}
                    placeholder={`e.g. Portfolio Website, Todo App…`} className={inp(`${pfx}Name`)} />
                  {errors[`${pfx}Name`] && <p className="text-red-400 text-xs mt-1">{errors[`${pfx}Name`]}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-400 block mb-2">GitHub URL {req ? "*" : ""}</label>
                    <input type="url" name={`${pfx}Github`} value={formData[`${pfx}Github`]} onChange={handleChange}
                      placeholder="https://github.com/username/repo" className={inp(`${pfx}Github`)} />
                    {errors[`${pfx}Github`] && <p className="text-red-400 text-xs mt-1">{errors[`${pfx}Github`]}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-400 block mb-2">Live URL <span className="text-zinc-600">(Optional)</span></label>
                    <input type="url" name={`${pfx}Live`} value={formData[`${pfx}Live`]} onChange={handleChange}
                      placeholder="https://your-site.vercel.app" className={inp(`${pfx}Live`)} />
                  </div>
                </div>
              </div>
            );
          })}

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-sm uppercase tracking-[0.3em] rounded-2xl transition-all active:scale-[0.98] shadow-[0_0_40px_rgba(52,211,153,0.2)] hover:shadow-[0_0_60px_rgba(52,211,153,0.35)] mt-2"
          >
            Submit Month's Tasks →
          </button>
          <p className="text-center text-zinc-700 text-xs mt-4">Submissions are reviewed within 48 hours. Mentor feedback will appear in your dashboard.</p>
        </form>
      </div>

      {/* ── Payment Modal ────────────────────────────────────── */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-10 max-w-md w-full text-center relative">
            <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(52,211,153,0.3)]">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400">Final Step</span>
            <h2 className="text-3xl font-black text-white mt-2 mb-3 uppercase">Get Certified</h2>
            <p className="text-zinc-400 text-sm leading-relaxed mb-8">
              Congratulations on completing all tasks! Complete the one-time payment to receive your globally verifiable certificate.
            </p>
            <button
              onClick={handlePayment}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs uppercase tracking-[0.3em] rounded-xl transition-all"
            >
              Pay with Razorpay →
            </button>
            <button
              onClick={() => setShowPaymentModal(false)}
              className="mt-3 w-full text-zinc-600 hover:text-white text-xs font-bold transition-colors"
            >
              Pay later
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-8px)} 75%{transform:translateX(8px)} }
        .animate-shake { animation: shake 0.3s ease-in-out 2; }
      `}</style>
    </main>
  );
};

export default SubmitProject;
