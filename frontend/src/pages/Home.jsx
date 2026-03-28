import React from "react";
import { Link } from "react-router-dom";

const Home = () => (
  <main className="bg-zinc-950 text-white selection:bg-emerald-500/20 overflow-x-hidden font-sans">

    {/* ─── HERO ──────────────────────────────────────────────────── */}
    <section className="min-h-screen px-5 md:px-10 pt-32 pb-16 flex flex-col justify-between relative overflow-hidden">

      {/* Aurora background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute top-20 right-0 w-[400px] h-[400px] rounded-full bg-blue-600/10 blur-[100px]" />
        <div className="absolute bottom-0 left-1/3 w-[500px] h-[300px] rounded-full bg-violet-600/8 blur-[120px]" />
      </div>

      <div className="relative z-10">
        {/* Top Label */}
        <div className="flex items-center justify-between mb-20">
          <span className="text-[10px] text-zinc-500 tracking-[0.5em] uppercase font-bold">Est. 2024 · India</span>
          <Link to="/register" className="text-[10px] text-emerald-400 tracking-[0.3em] uppercase font-black border border-emerald-500/30 px-4 py-2 rounded-full hover:bg-emerald-500/10 transition-all">
            Apply Now →
          </Link>
        </div>

        {/* Giant Headline */}
        <div className="max-w-6xl">
          <h1 className="text-[clamp(3.5rem,14vw,11rem)] font-black leading-[0.85] tracking-[-0.04em] uppercase">
            <span className="text-white">Code</span>
            <span className="text-zinc-700">—</span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-300 to-teal-400">
              A-Nova
            </span>
          </h1>
        </div>

        {/* Tagline Row */}
        <div className="mt-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <p className="text-zinc-400 text-base md:text-xl max-w-md leading-relaxed font-light">
            India's most intensive virtual internship. Real projects. Real mentors. Real certificates.
          </p>
          <div className="flex items-center gap-10">
            {[["400+","Students"],["10","Domains"],["3","Month Tracks"],["99%","Remote"]].map(([n,l]) => (
              <div key={l}>
                <p className="text-3xl font-black text-white">{n}</p>
                <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Horizontal rule */}
      <div className="relative z-10 mt-16 border-t border-zinc-800" />
    </section>

    {/* ─── BENTO GRID ─────────────────────────────────────────────── */}
    <section className="px-5 md:px-10 pb-16">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 auto-rows-auto md:auto-rows-[220px]">

        {/* Card 1 — Wide headline */}
        <div className="col-span-1 md:col-span-2 row-span-1 bg-zinc-900 border border-zinc-800 rounded-3xl p-8 flex flex-col justify-between hover:border-zinc-700 transition-colors group">
          <span className="text-[10px] text-emerald-400 tracking-[0.4em] uppercase font-black">What We Build</span>
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">Production-grade tech. Not toy projects.</h2>
            <p className="text-zinc-500 text-sm mt-2">Every submission goes through real code review.</p>
          </div>
        </div>

        {/* Card 2 — Stat */}
        <div className="col-span-1 row-span-1 bg-emerald-500 rounded-3xl p-8 flex flex-col justify-between">
          <span className="text-[10px] text-emerald-900 tracking-[0.3em] uppercase font-black">Duration</span>
          <div>
            <p className="text-6xl font-black text-emerald-950 leading-none">1–3</p>
            <p className="text-emerald-900 text-sm font-bold uppercase tracking-wider mt-1">Months</p>
          </div>
        </div>

        {/* Card 3 — CTA */}
        <div className="col-span-1 row-span-1 bg-zinc-900 border border-zinc-800 rounded-3xl p-8 flex flex-col justify-between hover:border-emerald-500/30 transition-all group cursor-pointer">
          <span className="text-[10px] text-zinc-500 tracking-[0.4em] uppercase font-black">Join Now</span>
          <Link to="/register" className="block">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center group-hover:bg-emerald-400 transition-colors mb-3">
              <svg className="w-5 h-5 text-zinc-950" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
            <p className="text-white font-black text-xl">Free Registration</p>
            <p className="text-zinc-500 text-xs mt-1">2 minutes · No credit card</p>
          </Link>
        </div>

        {/* Card 4 — Domains list */}
        <div className="col-span-1 md:col-span-2 row-span-1 bg-zinc-900 border border-zinc-800 rounded-3xl p-8 hover:border-zinc-700 transition-colors">
          <span className="text-[10px] text-emerald-400 tracking-[0.4em] uppercase font-black mb-5 block">Domains</span>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2">
            {["Frontend Development","Backend Development","MERN Stack Development","Full Stack Development","Artificial Intelligence","Machine Learning","Data Science","Python Development","C Programming","Figma / UI UX"].map(d => (
              <p key={d} className="text-sm text-zinc-400 flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-emerald-500 shrink-0" />
                {d}
              </p>
            ))}
          </div>
        </div>

        {/* Card 5 — Certificate */}
        <div className="col-span-1 row-span-1 bg-zinc-900 border border-zinc-800 rounded-3xl p-8 flex flex-col justify-between hover:border-zinc-700 transition-colors">
          <span className="text-[10px] text-zinc-500 tracking-[0.4em] uppercase font-black">Credential</span>
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <p className="text-white font-bold">Verified Certificate</p>
            <p className="text-zinc-500 text-xs mt-1">Globally verifiable digital ID</p>
          </div>
        </div>

        {/* Card 6 — Mentorship dark */}
        <div className="col-span-1 row-span-1 bg-zinc-900 border border-zinc-800 rounded-3xl p-8 flex flex-col justify-between hover:border-zinc-700 transition-colors">
          <span className="text-[10px] text-zinc-500 tracking-[0.4em] uppercase font-black">Support</span>
          <div>
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-white font-bold">1-on-1 Mentorship</p>
            <p className="text-zinc-500 text-xs mt-1">Senior engineers guide you</p>
          </div>
        </div>

      </div>
    </section>

    {/* ─── MARQUEE TICKER ─────────────────────────────────────────── */}
    <section className="border-y border-zinc-800 py-5 overflow-hidden">
      <div className="animate-marquee flex gap-10 whitespace-nowrap">
        {Array(3).fill(["Web Dev","AI / ML","Cloud","App Dev","Cyber Security","Data Science","Real Projects","Certificate","Remote Internship","1-3 Months"]).flat().map((item, i) => (
          <span key={i} className="text-zinc-600 text-sm font-bold uppercase tracking-widest shrink-0">
            {item} <span className="text-zinc-800 mx-3">·</span>
          </span>
        ))}
      </div>
    </section>

    {/* ─── HOW IT WORKS ───────────────────────────────────────────── */}
    <section className="px-5 md:px-10 py-24">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-6">
          <h2 className="text-4xl md:text-6xl font-black tracking-tight uppercase leading-none">
            How it<br /><span className="text-emerald-400">works.</span>
          </h2>
          <p className="text-zinc-500 text-sm max-w-xs">From registration to a verified certificate in as few as 4 weeks. Tracks available for 1, 2, and 3 months.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-px bg-zinc-800 rounded-3xl overflow-hidden">
          {[
            { n: "01", t: "Register", d: "Fill out the form. Free, takes 2 minutes." },
            { n: "02", t: "Pick Domain", d: "Choose your tech stack and track duration." },
            { n: "03", t: "Build", d: "Ship monthly projects with mentor feedback." },
            { n: "04", t: "Graduate", d: "Get your verified certificate + share on LinkedIn." },
          ].map((s) => (
            <div key={s.n} className="bg-zinc-950 p-8 hover:bg-zinc-900 transition-colors">
              <span className="text-emerald-400 text-5xl font-black leading-none">{s.n}</span>
              <h3 className="text-white font-black text-lg mt-4 mb-2">{s.t}</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ─── FOOTER CTA ─────────────────────────────────────────────── */}
    <section className="px-5 md:px-10 pb-24">
      <div className="max-w-6xl mx-auto bg-emerald-500 rounded-3xl p-10 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8">
        <div>
          <p className="text-emerald-950 text-sm font-black uppercase tracking-widest mb-2">Limited Seats Available</p>
          <h2 className="text-3xl md:text-5xl font-black text-emerald-950 tracking-tight leading-tight">
            Start building<br />your future today.
          </h2>
        </div>
        <div className="flex flex-col gap-3 shrink-0">
          <Link
            to="/register"
            className="px-10 py-4 bg-zinc-950 text-white font-black text-xs tracking-widest uppercase rounded-full hover:bg-zinc-800 transition-all active:scale-[0.98]"
          >
            Apply for Free
          </Link>
          <a
            href="mailto:codeanova26@gmail.com"
            className="px-10 py-3 border-2 border-emerald-800 text-emerald-900 font-bold text-xs tracking-widest uppercase rounded-full hover:bg-emerald-400 transition-all text-center"
          >
            Contact Us
          </a>
        </div>
      </div>
    </section>

    {/* Marquee CSS */}
    <style>{`
      @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
      .animate-marquee { animation: marquee 30s linear infinite; }
    `}</style>

  </main>
);

export default Home;
