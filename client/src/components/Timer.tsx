import { useTimer } from '../hooks/useGameState';

interface TimerDisplayProps {
  endTime: number | null;
  running: boolean;
  label: string;
  large?: boolean;
}

export default function TimerDisplay({ endTime, running, label, large }: TimerDisplayProps) {
  const { minutes, seconds, isRunning } = useTimer(endTime, running);

  if (!running && !endTime) return null;

  const isUrgent = isRunning && (minutes * 60 + seconds) < 60;
  const isWarning = isRunning && (minutes * 60 + seconds) < 180 && !isUrgent;

  const borderColor = isUrgent
    ? 'border-red-500/40'
    : isWarning
      ? 'border-amber-500/30'
      : 'border-white/[0.08]';

  const glowStyle = isUrgent
    ? { boxShadow: '0 0 30px rgba(239,68,68,0.15), 0 0 60px rgba(239,68,68,0.05)' }
    : isWarning
      ? { boxShadow: '0 0 30px rgba(245,158,11,0.1)' }
      : {};

  return (
    <div
      className={`rounded-2xl border ${borderColor} bg-white/[0.03] backdrop-blur-xl transition-all duration-500 ${large ? 'p-6 md:p-8' : 'p-4 md:p-5'}`}
      style={glowStyle}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          {label ? (
            <div className="mm-kicker truncate">{label}</div>
          ) : (
            <div className="mm-kicker">Timer</div>
          )}
          <div className="mt-1 text-sm text-white/40">
            {isRunning ? 'Live countdown' : 'Ended'}
          </div>
        </div>

        {!isRunning && endTime && (
          <span className="inline-flex items-center rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-bold text-red-300 animate-scale-in">
            TIME'S UP
          </span>
        )}

        {isRunning && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-white/50">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
        )}
      </div>

      <div
        className={`mt-4 text-center font-mono tabular-nums tracking-tight font-bold ${
          large ? 'text-6xl sm:text-7xl md:text-8xl' : 'text-4xl sm:text-5xl'
        } ${isUrgent ? 'text-red-400' : isWarning ? 'text-amber-300' : 'text-white'}`}
      >
        <span>{String(minutes).padStart(2, '0')}</span>
        <span className={`${isRunning ? 'animate-pulse' : ''} ${isRunning ? 'text-white/30' : 'text-white/15'}`}>:</span>
        <span>{String(seconds).padStart(2, '0')}</span>
      </div>

      {isRunning && large && (
        <div className="mt-4 h-1 rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${
              isUrgent ? 'bg-red-500/60' : isWarning ? 'bg-amber-500/40' : 'bg-[var(--mm-accent)]/30'
            }`}
            style={{ width: isUrgent ? '15%' : isWarning ? '40%' : '100%' }}
          />
        </div>
      )}
    </div>
  );
}
