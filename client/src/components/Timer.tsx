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

  const panelTone = isUrgent
    ? 'border-red-500/30 bg-red-500/10'
    : isWarning
      ? 'border-amber-500/30 bg-amber-500/10'
      : 'border-white/10 bg-white/5';

  return (
    <div className={`rounded-2xl border ${panelTone} backdrop-blur ${large ? 'p-6 md:p-8' : 'p-4'}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          {label ? (
            <div className="text-xs font-semibold uppercase tracking-[0.25em] text-white/50 truncate">{label}</div>
          ) : (
            <div className="text-xs font-semibold uppercase tracking-[0.25em] text-white/50">Timer</div>
          )}
          <div className="mt-1 text-sm text-white/60">
            {isRunning ? 'Live countdown' : 'Ended'}
          </div>
        </div>

        {!isRunning && endTime && (
          <span className="inline-flex items-center rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-200">
            TIME’S UP
          </span>
        )}
      </div>

      <div
        className={`mt-4 text-center font-mono tabular-nums tracking-tight ${
          large ? 'text-6xl sm:text-7xl md:text-8xl' : 'text-4xl sm:text-5xl'
        }`}
      >
        <span>{String(minutes).padStart(2, '0')}</span>
        <span className={isRunning ? 'text-white/40' : 'text-white/25'}>:</span>
        <span>{String(seconds).padStart(2, '0')}</span>
      </div>
    </div>
  );
}
