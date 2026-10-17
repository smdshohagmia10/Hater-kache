"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/* ============================================================
   ডাটা (পরে চাইলে MongoDB/API থেকে আনতে পারবেন)
   ============================================================ */
const HOTLINE = "০১৭XX-XXXXXX";

const services = [
  { slug: "electrician", name: "ইলেকট্রিশিয়ান", icon: "⚡", desc: "ওয়্যারিং, সুইচ, ফ্যান, লাইট", keywords: "electrician bijli current" },
  { slug: "plumber", name: "প্লাম্বার", icon: "🚰", desc: "পাইপ, ট্যাপ, ট্যাংক, লিকেজ", keywords: "plumber pani pipe" },
  { slug: "ac-technician", name: "এসি টেকনিশিয়ান", icon: "❄️", desc: "সার্ভিসিং, গ্যাস, ইনস্টলেশন", keywords: "ac air condition" },
  { slug: "mobile-repair", name: "মোবাইল রিপেয়ার", icon: "📱", desc: "স্ক্রিন, ব্যাটারি, সফটওয়্যার", keywords: "mobile phone repair" },
  { slug: "computer-repair", name: "কম্পিউটার রিপেয়ার", icon: "💻", desc: "ল্যাপটপ, ডেস্কটপ, নেটওয়ার্ক", keywords: "computer laptop pc" },
  { slug: "appliance-repair", name: "ফ্রিজ ও ওয়াশিং মেশিন", icon: "🧊", desc: "ফ্রিজ, ওয়াশিং মেশিন, ওভেন", keywords: "fridge washing machine appliance" },
  { slug: "painter", name: "রংমিস্ত্রি", icon: "🎨", desc: "ঘর, দেয়াল, ওয়াটারপ্রুফিং", keywords: "painter rong paint" },
  { slug: "carpenter", name: "কাঠমিস্ত্রি", icon: "🪚", desc: "ফার্নিচার, দরজা, জানালা", keywords: "carpenter furniture kath" },
  { slug: "cctv", name: "সিসিটিভি টেকনিশিয়ান", icon: "📹", desc: "ক্যামেরা সেটআপ ও মেরামত", keywords: "cctv camera security" },
];

const navLinks = [
  { name: "হোম", href: "/" },
  { name: "সার্ভিসসমূহ", href: "/services", mega: true },
  { name: "যেভাবে কাজ করে", href: "/how-it-works" },
  { name: "আমাদের সম্পর্কে", href: "/about" },
  { name: "যোগাযোগ", href: "/contact" },
];

const cities = ["রংপুর", "ঢাকা", "চট্টগ্রাম", "রাজশাহী", "খুলনা", "সিলেট", "বরিশাল", "ময়মনসিংহ"];

const preferenceMemory = new Map();

function subscribeToPreferences(onChange) {
  const handleStorage = (event) => {
    if (event.key === null) {
      preferenceMemory.clear();
    } else if (event.key) {
      preferenceMemory.delete(event.key);
    }
    onChange();
  };
  const handlePreferenceChange = () => onChange();

  window.addEventListener("storage", handleStorage);
  window.addEventListener("hk-preference-change", handlePreferenceChange);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener("hk-preference-change", handlePreferenceChange);
  };
}

function getPreference(key, fallback) {
  if (typeof window === "undefined") return fallback;

  try {
    return localStorage.getItem(key) || preferenceMemory.get(key) || fallback;
  } catch (error) {
    console.error(`Could not read the "${key}" preference from localStorage.`, error);
    return preferenceMemory.get(key) || fallback;
  }
}

function savePreference(key, value) {
  try {
    localStorage.setItem(key, value);
    preferenceMemory.delete(key);
  } catch (error) {
    console.error(`Could not save the "${key}" preference to localStorage.`, error);
    preferenceMemory.set(key, value);
  }
  window.dispatchEvent(new CustomEvent("hk-preference-change", { detail: key }));
}

/* ============================================================
   Helpers
   ============================================================ */
function useClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (e) => {
      if (ref.current && !ref.current.contains(e.target)) handler();
    };
    document.addEventListener("mousedown", listener);
    return () => document.removeEventListener("mousedown", listener);
  }, [ref, handler]);
}

/* ============================================================
   Icons
   ============================================================ */
const Svg = ({ d, className = "h-5 w-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);
const icons = {
  menu: "M4 7h16M4 12h16M4 17h16",
  close: "M6 6l12 12M18 6L6 18",
  search: "m21 21-4.3-4.3M17 10.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z",
  chevron: "m6 9 6 6 6-6",
  arrow: "M5 12h14m-6-6 6 6-6 6",
  pin: "M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  phone: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z",
  tool: "M14.5 6.5a5 5 0 0 0-6.6 6.6L3.5 17.5a2.1 2.1 0 0 0 3 3l4.4-4.4a5 5 0 0 0 6.6-6.6l-3 3-3-3 3-3Z",
};

function Brand({ compact = false }) {
  return (
    <>
      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-700/30">
        <Svg d={icons.tool} className="h-6 w-6" />
        <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-amber-400" />
      </div>
      {!compact && (
        <div className="leading-tight">
          <span className="block text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl">হাতের কাছে</span>
          <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-700">
            Hater Kache
          </span>
        </div>
      )}
    </>
  );
}

/* ============================================================
   1) Top info bar
   ============================================================ */
function TopBar({ lang, setLang }) {
  return (
    <div className="hidden bg-emerald-950 text-emerald-50 md:block">
      <div className="mx-auto flex h-10 max-w-7xl items-center justify-between px-4 text-xs sm:px-6 lg:px-8">
        <div className="flex items-center gap-5">
          <span className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            এখন রংপুরে সার্ভিস চালু আছে
          </span>
          <a href={`tel:${HOTLINE}`} className="hidden items-center gap-1.5 transition hover:text-white lg:flex">
            <Svg d={icons.phone} className="h-3.5 w-3.5" />
            হটলাইন: {HOTLINE}
          </a>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/join-as-technician" className="font-semibold text-amber-300 transition hover:text-amber-200">
            🔧 টেকনিশিয়ান হিসেবে যোগ দিন
          </Link>
          <span className="h-4 w-px bg-emerald-800" />
          <div className="flex overflow-hidden rounded-full border border-emerald-800">
            {[
              ["bn", "বাং"],
              ["en", "EN"],
            ].map(([code, label]) => (
              <button
                key={code}
                type="button"
                onClick={() => setLang(code)}
                className={`px-3 py-1 font-bold transition ${
                  lang === code ? "bg-emerald-500 text-white" : "text-emerald-200 hover:bg-emerald-900"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   2) Location picker
   ============================================================ */
function LocationPicker({ city, setCity }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(ref, close);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700"
      >
        <Svg d={icons.pin} className="h-4 w-4 text-emerald-600" />
        {city}
        <Svg d={icons.chevron} className={`h-4 w-4 text-slate-400 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-3 w-52 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/10">
          <p className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">আপনার এলাকা</p>
          {cities.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setCity(c);
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-semibold transition ${
                c === city ? "bg-emerald-50 text-emerald-700" : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              {c}
              {c === city && <span className="text-emerald-600">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   3) Services mega menu (desktop)
   ============================================================ */
function ServicesMenu({ active }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const timer = useRef(null);
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(ref, close);

  const show = () => {
    clearTimeout(timer.current);
    setOpen(true);
  };
  const hide = () => {
    timer.current = setTimeout(() => setOpen(false), 120);
  };

  return (
    <div ref={ref} className="relative" onMouseEnter={show} onMouseLeave={hide}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`relative flex items-center gap-1 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
          active || open ? "text-emerald-700" : "text-slate-600 hover:text-emerald-700"
        }`}
      >
        সার্ভিসসমূহ
        <Svg d={icons.chevron} className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
        <span
          className={`absolute inset-x-4 -bottom-0.5 h-0.5 rounded-full bg-emerald-600 transition-transform duration-300 ${
            active ? "scale-x-100" : "scale-x-0"
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-1/2 top-full z-50 w-[640px] -translate-x-1/2 pt-4">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15">
            <div className="grid grid-cols-3 gap-1 p-3">
              {services.map((s) => (
                <Link
                  key={s.slug}
                  href={`/services/${s.slug}`}
                  onClick={() => setOpen(false)}
                  className="group flex items-start gap-3 rounded-2xl p-3 transition hover:bg-emerald-50"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xl transition group-hover:bg-white group-hover:shadow">
                    {s.icon}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-slate-800 group-hover:text-emerald-700">{s.name}</span>
                    <span className="mt-0.5 block text-xs leading-snug text-slate-500">{s.desc}</span>
                  </span>
                </Link>
              ))}
            </div>
            <Link
              href="/services"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-3.5 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50"
            >
              সব সার্ভিস দেখুন
              <Svg d={icons.arrow} className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   4) Search modal (Ctrl/⌘ + K)
   ============================================================ */
function SearchModal({ open, onClose }) {
  const [q, setQ] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const timeoutId = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timeoutId);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return services.slice(0, 6);
    return services.filter((s) => `${s.name} ${s.desc} ${s.keywords}`.toLowerCase().includes(term));
  }, [q]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[12vh]" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center gap-3 border-b border-slate-100 px-5">
          <Svg d={icons.search} className="h-5 w-5 text-slate-400" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="কোন সেবা খুঁজছেন? যেমন: এসি, প্লাম্বার..."
            className="h-16 w-full bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400"
          />
          <kbd className="hidden rounded-md border border-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-400 sm:block">
            ESC
          </kbd>
        </div>

        <div className="max-h-[50vh] overflow-y-auto p-3">
          <p className="px-3 pb-2 pt-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {q ? "ফলাফল" : "জনপ্রিয় সেবা"}
          </p>
          {results.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-slate-500">কোনো সেবা পাওয়া যায়নি 😕</p>
          ) : (
            results.map((s) => (
              <Link
                key={s.slug}
                href={`/services/${s.slug}`}
                onClick={onClose}
                className="flex items-center gap-3 rounded-2xl px-3 py-3 transition hover:bg-emerald-50"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-xl">{s.icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-slate-800">{s.name}</span>
                  <span className="block truncate text-xs text-slate-500">{s.desc}</span>
                </span>
                <Svg d={icons.arrow} className="h-4 w-4 text-slate-300" />
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   5) Mobile drawer
   ============================================================ */
function MobileDrawer({ open, onClose, city, setCity, lang, setLang, onSearch, isActive }) {
  const [showServices, setShowServices] = useState(false);

  return (
    <div className={`fixed inset-0 z-[90] lg:hidden ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />
      <aside
        className={`absolute right-0 top-0 flex h-full w-[86%] max-w-sm flex-col bg-white shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <Link href="/" onClick={onClose} className="flex items-center gap-3">
            <Brand />
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="মেনু বন্ধ করুন"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700"
          >
            <Svg d={icons.close} className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          {/* Search */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onSearch();
            }}
            className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-500"
          >
            <Svg d={icons.search} className="h-5 w-5" />
            সেবা খুঁজুন...
          </button>

          {/* City */}
          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
              <Svg d={icons.pin} className="h-3.5 w-3.5" /> আপনার এলাকা
            </span>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-emerald-500"
            >
              {cities.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>

          {/* Links */}
          <div className="space-y-1">
            {navLinks.map((link) =>
              link.mega ? (
                <div key={link.href}>
                  <button
                    type="button"
                    onClick={() => setShowServices((v) => !v)}
                    className={`flex w-full items-center justify-between rounded-xl px-4 py-3 font-semibold transition ${
                      isActive(link.href) ? "bg-emerald-50 text-emerald-700" : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {link.name}
                    <Svg d={icons.chevron} className={`h-4 w-4 transition ${showServices ? "rotate-180" : ""}`} />
                  </button>
                  {showServices && (
                    <div className="mt-1 grid grid-cols-2 gap-2 px-1 pb-2">
                      {services.map((s) => (
                        <Link
                          key={s.slug}
                          href={`/services/${s.slug}`}
                          onClick={onClose}
                          className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50"
                        >
                          <span className="text-base">{s.icon}</span>
                          <span className="leading-tight">{s.name}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onClose}
                  className={`block rounded-xl px-4 py-3 font-semibold transition ${
                    isActive(link.href) ? "bg-emerald-50 text-emerald-700" : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {link.name}
                </Link>
              )
            )}
          </div>

          {/* Technician CTA */}
          <Link
            href="/join-as-technician"
            onClick={onClose}
            className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 p-4 ring-1 ring-amber-200"
          >
            <span className="text-2xl">🔧</span>
            <span>
              <span className="block text-sm font-extrabold text-amber-900">আপনি কি টেকনিশিয়ান?</span>
              <span className="text-xs text-amber-800/80">আমাদের সাথে যোগ দিন, আয় বাড়ান</span>
            </span>
          </Link>
        </div>

        {/* Footer */}
        <div className="space-y-3 border-t border-slate-100 px-5 py-4">
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/login"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              লগইন
            </Link>
            <Link
              href="/register"
              onClick={onClose}
              className="rounded-xl bg-emerald-600 px-4 py-3 text-center text-sm font-bold text-white hover:bg-emerald-700"
            >
              সেবা নিন
            </Link>
          </div>
          <div className="flex items-center justify-between text-xs">
            <a href={`tel:${HOTLINE}`} className="flex items-center gap-1.5 font-semibold text-slate-600">
              <Svg d={icons.phone} className="h-4 w-4 text-emerald-600" /> {HOTLINE}
            </a>
            <div className="flex overflow-hidden rounded-full border border-slate-200">
              {[
                ["bn", "বাং"],
                ["en", "EN"],
              ].map(([code, label]) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLang(code)}
                  className={`px-3 py-1.5 font-bold ${lang === code ? "bg-emerald-600 text-white" : "text-slate-500"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

/* ============================================================
   Main Navbar
   ============================================================ */
export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [openUI, setOpenUI] = useState({ pathname, drawer: false, searchOpen: false });
  const drawer = openUI.pathname === pathname && openUI.drawer;
  const searchOpen = openUI.pathname === pathname && openUI.searchOpen;
  const city = useSyncExternalStore(
    subscribeToPreferences,
    () => getPreference("hk_city", "রংপুর"),
    () => "রংপুর",
  );
  const lang = useSyncExternalStore(
    subscribeToPreferences,
    () => getPreference("hk_lang", "bn"),
    () => "bn",
  );

  const setDrawer = useCallback(
    (isOpen) => {
      setOpenUI((current) => ({
        pathname,
        drawer: isOpen,
        searchOpen: current.pathname === pathname && current.searchOpen,
      }));
    },
    [pathname],
  );
  const setSearchOpen = useCallback(
    (isOpen) => {
      setOpenUI((current) => ({
        pathname,
        drawer: current.pathname === pathname && current.drawer,
        searchOpen: isOpen,
      }));
    },
    [pathname],
  );

  const setCity = (c) => {
    savePreference("hk_city", c);
  };
  const setLang = (l) => {
    savePreference("hk_lang", l);
    // TODO: পরে i18n (next-intl) এখানে যুক্ত করা যাবে
  };

  // স্ক্রল ইফেক্ট
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Ctrl/⌘ + K দিয়ে সার্চ
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setSearchOpen]);

  // ড্রয়ার খোলা থাকলে স্ক্রল বন্ধ
  useEffect(() => {
    document.body.style.overflow = drawer ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawer]);

  const isActive = (href) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const closeSearch = useCallback(() => setSearchOpen(false), [setSearchOpen]);

  return (
    <>
      <TopBar lang={lang} setLang={setLang} />

      <header className="sticky top-0 z-50 px-3 pt-3 sm:px-6">
        <nav
          className={`mx-auto max-w-7xl rounded-2xl border bg-white/85 px-4 backdrop-blur-xl transition-all duration-300 sm:px-5 ${
            scrolled
              ? "border-slate-200 shadow-xl shadow-slate-900/10"
              : "border-slate-200/70 shadow-md shadow-slate-900/5"
          }`}
        >
          <div className="flex min-h-[68px] items-center justify-between gap-3">
            {/* Brand */}
            <Link href="/" className="flex shrink-0 items-center gap-3" aria-label="হাতের কাছে - HATER KACHE">
              <Brand />
            </Link>

            {/* Desktop links */}
            <div className="hidden items-center lg:flex">
              {navLinks.map((link) =>
                link.mega ? (
                  <ServicesMenu key={link.href} active={isActive(link.href)} />
                ) : (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={isActive(link.href) ? "page" : undefined}
                    className={`relative whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                      isActive(link.href) ? "text-emerald-700" : "text-slate-600 hover:text-emerald-700"
                    }`}
                  >
                    {link.name}
                    <span
                      className={`absolute inset-x-4 -bottom-0.5 h-0.5 rounded-full bg-emerald-600 transition-transform duration-300 ${
                        isActive(link.href) ? "scale-x-100" : "scale-x-0"
                      }`}
                    />
                  </Link>
                )
              )}
            </div>

            {/* Desktop actions */}
            <div className="hidden items-center gap-2 lg:flex">
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                aria-label="সেবা খুঁজুন"
                className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-slate-500 transition hover:border-emerald-300 hover:bg-white hover:text-emerald-700"
              >
                <Svg d={icons.search} className="h-5 w-5" />
                <kbd className="hidden rounded border border-slate-200 bg-white px-1.5 text-[10px] font-bold xl:block">
                  Ctrl K
                </kbd>
              </button>

              <LocationPicker city={city} setCity={setCity} />

              <Link
                href="/login"
                className="rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
              >
                লগইন
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition hover:-translate-y-0.5 hover:shadow-emerald-600/40"
              >
                সেবা নিন
                <Svg d={icons.arrow} className="h-4 w-4" />
              </Link>
            </div>

            {/* Mobile actions */}
            <div className="flex items-center gap-2 lg:hidden">
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                aria-label="সেবা খুঁজুন"
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-100"
              >
                <Svg d={icons.search} className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => setDrawer(true)}
                aria-label="মেনু খুলুন"
                aria-expanded={drawer}
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/25 transition hover:bg-emerald-700"
              >
                <Svg d={icons.menu} className="h-6 w-6" />
              </button>
            </div>
          </div>
        </nav>
      </header>

      {searchOpen && <SearchModal open={searchOpen} onClose={closeSearch} />}
      <MobileDrawer
        open={drawer}
        onClose={() => setDrawer(false)}
        city={city}
        setCity={setCity}
        lang={lang}
        setLang={setLang}
        onSearch={() => setSearchOpen(true)}
        isActive={isActive}
      />
    </>
  );
}