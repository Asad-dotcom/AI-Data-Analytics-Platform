import { LandingNavbar } from '@/components/landing/Navbar';
import { HeroSection } from '@/components/landing/HeroSection';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      <LandingNavbar />
      <main className="flex-1 flex items-center justify-center">
        <HeroSection />
      </main>
      <footer className="py-6 border-t border-slate-900 text-center text-xs text-slate-500">
        AI Data Analytics Platform © 2026. Built with Next.js, PostgreSQL, Gemini AI & Recharts.
      </footer>
    </div>
  );
}
