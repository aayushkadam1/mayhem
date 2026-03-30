import { Link } from 'react-router-dom';
import { PORTALS } from '../navigation';

export default function Landing() {
  return (
    <div className="min-h-screen text-white">
      <header className="max-w-6xl mx-auto px-6 pt-10 pb-6">
        <div className="flex items-center justify-between gap-6">
          <div>
            <div className="text-[var(--mm-accent)] font-black text-2xl tracking-wide">MAYHEM</div>
            <div className="mt-1 text-xs font-semibold uppercase tracking-[0.35em] text-white/40">
              Marketing Mayhem
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pb-12">
        <section className="mm-card p-6 md:p-10">
          <div className="flex flex-col gap-2">
            <div className="mm-kicker">Choose a portal</div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Pick where you want to go</h1>
            <p className="text-white/60 max-w-2xl">
              Real-time leaderboard, war-round voting, and judge scoring—synced across all screens.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PORTALS.map(p => (
              <Link
                key={p.id}
                to={p.path}
                className="group rounded-2xl border border-white/10 bg-black/30 p-5 transition-colors hover:bg-white/5 hover:border-white/20"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white truncate">{p.title}</div>
                    <div className="mt-1 text-sm text-white/55">{p.subtitle}</div>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70 group-hover:text-white group-hover:border-white/20">
                    →
                  </div>
                </div>

                <div className="mt-4 text-xs font-semibold uppercase tracking-[0.25em] text-white/40">
                  Open {p.path}
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-6 mm-card p-6">
          <h2 className="mm-kicker">Where to find passcodes</h2>
          <ul className="mt-3 space-y-2 text-sm text-white/65 list-disc pl-5">
            <li>Admin passcode: shown in the server terminal on startup (and set in server/src/state.js).</li>
            <li>Team passcodes: printed in the server terminal on startup (admin can also manage teams).</li>
            <li>Prime/Judge passcodes: configured in server/src/state.js.</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
