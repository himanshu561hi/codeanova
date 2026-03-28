import React, { useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";

const StudentLogin = () => {
  const [email, setEmail] = useState("");
  const [studentId, setStudentId] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/student/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), studentId: studentId.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem("studentToken", data.token);
        navigate("/portal");
      } else {
        toast.error(`Login Failed: ${data.message}`);
      }
    } catch {
      toast.error("Server connection error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="bg-zinc-950 min-h-screen flex overflow-hidden">

      {/* ── Left Panel ─────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-14 bg-zinc-900 border-r border-zinc-800 relative overflow-hidden">
        {/* bg accent */}
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.5em] text-emerald-400">Code-A-Nova</span>
        </div>

        <div className="relative z-10">
          <h2 className="text-6xl font-black uppercase tracking-tight text-white leading-none mb-6">
            Student<br /><span className="text-zinc-600">Portal.</span>
          </h2>
          <p className="text-zinc-500 text-sm max-w-xs leading-relaxed">
            Access your dashboard, submit projects, track progress, and download your certificate.
          </p>

          <div className="mt-12 space-y-4">
            {["Submit monthly projects","Track internship progress","Download your certificate","View mentor feedback"].map(item => (
              <div key={item} className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-zinc-400 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-zinc-700 text-xs">© 2026 Code-A-Nova · code-a-nova.online</p>
      </div>

      {/* ── Right Panel — Form ──────────────────────────── */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center px-8 py-16 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="w-full max-w-sm relative z-10">
          {/* Header */}
          <div className="mb-10">
            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.5em] mb-4">Code-A-Nova Internship</p>
          <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none mb-6">Intern <span className="text-zinc-600">Access.</span></h2>
<p className="text-zinc-500 text-sm mt-2">Use your registered email & Student ID.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-400 block mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="intern@example.com"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/60 transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-400 block mb-2">
                Student ID
              </label>
              <input
                type="text"
                required
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="CN/INT/2026/..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/60 transition-all font-mono"
              />
              <p className="text-zinc-600 text-xs mt-2">Your Student ID was sent to your email after registration.</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-950 font-black text-xs uppercase tracking-[0.3em] rounded-xl transition-all active:scale-[0.98] shadow-[0_0_30px_rgba(52,211,153,0.2)]"
            >
              {loading ? "Authenticating…" : "Access Portal →"}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-600">
            <Link to="/" className="hover:text-white transition-colors">← Home</Link>
            <Link to="/register" className="hover:text-white transition-colors">Not registered? Apply →</Link>
          </div>
        </div>
      </div>
    </main>
  );
};

export default StudentLogin;
