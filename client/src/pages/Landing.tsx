import { Link } from 'react-router-dom';
import { PORTALS } from '../navigation';

const PORTAL_ICONS: Record<string, string> = {
  display: '📺',
  team: '⚔️',
  prime: '👑',
  judge: '⚖️',
  admin: '🛡️',
};

export default function Landing() {
  return (
    <div className="min-h-screen text-white">
      {/* Hero Section */}
      <section className="relative min-h-[70vh] md:min-h-[80vh] flex flex-col justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="/hero-bg.png"
            alt=""
            className="h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--mm-bg)]/60 via-[var(--mm-bg)]/40 to-[var(--mm-bg)]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--mm-bg)]/80 via-transparent to-[var(--mm-bg)]/80" />
          <div className="absolute bottom-0 h-40 bg-gradient-to-t from-[var(--mm-bg)] to-transparent" />
        </div>

        {/* Nav Bar */}
        <header className="absolute top-0 left-0 right-0 z-20">
          <div className="max-w-7xl mx-auto px-5 md:px-8 py-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-1 rounded-full bg-[var(--mm-accent)]" />
              <div>
                <div className="text-[var(--mm-accent)] font-black text-xl md:text-2xl tracking-wider">MAYHEM</div>
              </div>
            </div>
            <div className="mm-badge backdrop-blur-md bg-white/[0.06]">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse mr-2" />
              System Online
            </div>
          </div>
        </header>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-5 md:px-8 pt-32 pb-16 md:pt-40 md:pb-24">
          <div className="max-w-2xl animate-fade-in-up">
            <div className="mm-kicker mb-4">Marketing Competition Platform</div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05]">
              Marketing
              <br />
              <span className="text-gradient-red">Mayhem</span>
            </h1>
            <p className="mt-5 text-base md:text-lg text-white/50 max-w-lg leading-relaxed">
              Real-time leaderboard, war-round voting, and judge scoring — synced across all screens in real time.
            </p>
          </div>
        </div>
      </section>

      {/* Portal Cards */}
      <section className="relative z-10 max-w-7xl mx-auto px-5 md:px-8 -mt-8 md:-mt-12 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-4">
          {PORTALS.map((p, i) => (
            <Link
              key={p.id}
              to={p.path}
              className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-5 md:p-6 transition-all duration-300 hover:bg-white/[0.07] hover:border-white/[0.15] hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)] animate-fade-in-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl bg-gradient-to-r from-transparent via-[var(--mm-accent)]/0 to-transparent group-hover:via-[var(--mm-accent)]/60 transition-all duration-500" />

              <div className="text-2xl mb-3">{PORTAL_ICONS[p.id] || '→'}</div>
              <div className="text-sm font-bold text-white tracking-tight">{p.title}</div>
              <div className="mt-1.5 text-xs text-white/40 leading-relaxed">{p.subtitle}</div>

              <div className="mt-4 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/25 group-hover:text-[var(--mm-accent)] transition-colors duration-300">
                <span>Enter</span>
                <svg className="w-3 h-3 transform group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-5 md:px-8 pb-10">
        <div className="border-t border-white/[0.06] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/25">
          <span>Powered by <span className="text-white/40 font-semibold">BloomBox</span></span>
          <span>Marketing Mayhem — All rights reserved</span>
        </div>
      </footer>
    </div>
  );
}
