import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  // Scroll lock logic: Menu khulne par page scroll nahi hoga
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    // Cleanup function jab component unmount ho
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  return (
    <>
      {/* Navbar Container */}
      <nav className={`fixed top-0 left-0 right-0 z-[1000] transition-all duration-300 ${isOpen ? "bg-zinc-950" : "bg-slate-950/40 backdrop-blur-md border-b border-white/5"}`}>
        <div className="max-w-[1440px] mx-auto flex justify-between items-center px-8 md:px-16 py-8">
          {/* --- LEFT SIDE: BRANDING --- */}
          <Link
            to="/"
            onClick={() => setIsOpen(false)}
            className="group shrink-0 relative z-[130]"
          >
            <div className="flex items-center tracking-[0.3em] md:tracking-[0.5em] text-sm md:text-lg font-light text-white group-hover:opacity-80 transition-all">
              <span className="font-semibold">CODE</span>
              <span className="mx-2 md:mx-3 text-white/20 font-thin">|</span>
              <span className="font-semibold">A</span>
              <span className="mx-2 md:mx-3 text-white/20 font-thin">|</span>
              <span className="font-semibold">NOVA</span>
            </div>
            <div className="h-[1px] w-0 group-hover:w-full bg-gradient-to-r from-transparent via-white/50 to-transparent transition-all duration-700 mt-1 hidden md:block"></div>
          </Link>

          {/* --- RIGHT SIDE: DESKTOP NAV --- */}
          <div className="hidden lg:flex items-center gap-12">
            <Link
              to="/"
              className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/60 hover:text-white hover:translate-y-[-1px] transition-all"
            >
              Home
            </Link>
            <Link
              to="/register"
              className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/60 hover:text-white hover:translate-y-[-1px] transition-all"
            >
              Registration
            </Link>
            <Link
              to="/student-login"
              className="text-[10px] uppercase tracking-[0.3em] font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-full transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_20px_rgba(37,99,235,0.5)] active:scale-95"
            >
              Student Login
            </Link>

            <div className="flex items-center gap-3 pl-8 border-l border-white/10">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-20"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)]"></span>
              </span>
            </div>
          </div>

          {/* --- MOBILE HAMBURGER ICON --- */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden flex flex-col gap-1.5 z-[130] p-2 focus:outline-none"
            aria-label="Toggle Menu"
          >
            <span
              className={`w-6 h-[1px] bg-white transition-all duration-500 ${isOpen ? "rotate-45 translate-y-2" : ""}`}
            ></span>
            <span
              className={`w-6 h-[1px] bg-white transition-all duration-300 ${isOpen ? "opacity-0" : ""}`}
            ></span>
            <span
              className={`w-4 h-[1px] bg-white self-end transition-all duration-500 ${isOpen ? "-rotate-45 -translate-y-2 w-6" : ""}`}
            ></span>
          </button>
        </div>

        {/* --- MOBILE OVERLAY MENU --- */}
        <div
          className={`fixed inset-0 z-[1100] transition-all duration-500 ease-in-out lg:hidden ${
            isOpen
              ? "opacity-100 visible"
              : "opacity-0 invisible pointer-events-none"
          }`}
        >
          {/* Opaque Background Overlay (Click outside to close) */}
          <div 
            className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm cursor-pointer" 
            onClick={() => setIsOpen(false)}
          ></div>

          {/* Side Panel Animation */}
          <div
            className={`absolute right-0 top-0 h-full w-[300px] bg-zinc-900 border-l border-zinc-800 shadow-2xl transition-transform duration-500 flex flex-col pt-32 px-10 pb-10 ${isOpen ? "translate-x-0" : "translate-x-full"}`}
          >
            <div className="flex justify-between items-center mb-10">
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 -ml-2 text-zinc-500 hover:text-white transition-colors"
                aria-label="Close Menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="text-right">
                <span className="text-[10px] tracking-[0.5em] text-emerald-500 font-black uppercase">
                  Directory
                </span>
                <div className="h-[2px] w-8 bg-emerald-600 ml-auto mt-2"></div>
              </div>
            </div>

            {/* Links - Right Aligned */}
            <div className="flex flex-col gap-10 items-end">
              <Link
                to="/"
                onClick={() => setIsOpen(false)}
                className="group flex flex-col items-end"
              >
                <span className="text-[9px] tracking-[0.2em] text-slate-500 font-bold uppercase mb-1">
                  Main
                </span>
                <h2 className="text-2xl font-light tracking-tight text-white active:text-emerald-500 transition-all">
                  Home<span className="text-emerald-600">.</span>
                </h2>
              </Link>

              <Link
                to="/register"
                onClick={() => setIsOpen(false)}
                className="group flex flex-col items-end"
              >
                <span className="text-[9px] tracking-[0.2em] text-slate-500 font-bold uppercase mb-1">
                  Apply Now
                </span>
                <h2 className="text-2xl font-light tracking-tight text-white active:text-emerald-500 transition-all">
                  Registration<span className="text-emerald-600">.</span>
                </h2>
              </Link>

              <Link
                to="/student-login"
                onClick={() => setIsOpen(false)}
                className="group flex flex-col items-end"
              >
                <span className="text-[9px] tracking-[0.2em] text-slate-500 font-bold uppercase mb-1">
                  Interns
                </span>
                <h2 className="text-2xl font-light tracking-tight text-white active:text-emerald-500 transition-all">
                  Student Portal<span className="text-emerald-600">.</span>
                </h2>
              </Link>

              {/* Small Action Button */}
              <Link
                to="/register"
                onClick={() => setIsOpen(false)}
                className="mt-4 px-8 py-2.5 bg-white text-slate-950 text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-emerald-600 hover:text-white transition-all active:scale-95"
              >
                Get Started
              </Link>
            </div>

            {/* Bottom Branding */}
            <div className="mt-auto pt-8 border-t border-white/5 text-right">
              <span className="text-[10px] tracking-[0.8em] text-white font-black uppercase italic block mb-2">
                CODE-A-NOVA
              </span>
              <p className="text-[8px] text-slate-700 tracking-widest uppercase font-bold leading-relaxed">
                Premium Internship <br /> Program © 2026
              </p>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
