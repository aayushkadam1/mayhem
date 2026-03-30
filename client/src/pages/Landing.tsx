import { Link } from 'react-router-dom';
import { PORTALS } from '../navigation';

export default function Landing() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-[var(--paper-bg)]">
      <div className="absolute top-[-10%] left-[-10%] w-72 h-72 bg-[var(--blue-light)] rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
      <div className="absolute bottom-[-10%] right-[-10%] w-72 h-72 bg-[var(--peach-light)] rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" />

      <div className="w-full max-w-4xl scrapbook-card tape-effect relative z-10 bg-white">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[var(--orange-primary)] shadow-[4px_4px_0_var(--blue-primary)] flex items-center justify-center font-black text-3xl text-white mx-auto mb-6 transform -rotate-6">
            M
          </div>
          <h1 className="font-extrabold text-3xl md:text-4xl text-[var(--text-main)] tracking-tight uppercase">Marketing Mayhem</h1>
          <p className="font-hand text-xl md:text-2xl text-gray-600 mt-2">
            <span className="marker-highlight">Choose your portal</span>
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PORTALS.map(p => (
            <Link
              key={p.id}
              to={p.path}
              className="group block p-5 rounded-xl border-2 border-dashed border-gray-300 bg-[var(--paper-bg)] hover:bg-white transition-colors shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-black text-lg tracking-tight text-[var(--blue-primary)] uppercase truncate">{p.title}</h2>
                  <p className="text-sm text-gray-500 mt-1">{p.subtitle}</p>
                </div>
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center group-hover:border-[var(--orange-primary)]">
                  <span className="font-black text-[var(--orange-primary)]">→</span>
                </div>
              </div>
              <div className="mt-3 text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400">
                Open {p.path}
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-gray-500 mb-2">Where to find passcodes</h3>
          <ul className="text-sm text-gray-600 space-y-1 list-disc pl-5">
            <li>Admin passcode: shown in the server terminal on startup (and set in server/src/state.js).</li>
            <li>Team passcodes: printed in the server terminal on startup (admin can also manage teams).</li>
            <li>Prime/Judge passcodes: configured in server/src/state.js.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
