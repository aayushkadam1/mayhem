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

  return (
    <div className={`
      relative overflow-hidden scrapbook-card transform rotate-2
      ${isUrgent
        ? 'bg-[#FF9999]'
        : isWarning
          ? 'bg-[#FFE5B4]'
          : 'bg-[#FEF08A]' // Yellow sticky note
      }
      ${large ? 'p-8' : 'p-4'}
      border-none shadow-[2px_4px_10px_rgba(0,0,0,0.15)]
    `}>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-red-500/10 mix-blend-multiply blur-[2px] -mt-4 shadow-sm" />
      {/* Pin effect */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-red-600 shadow-[1px_2px_2px_rgba(0,0,0,0.3)] z-20">
        <div className="absolute top-1 left-[2px] w-1 h-1 bg-white/50 rounded-full" />
      </div>

      {isUrgent && (
        <div className="absolute inset-0 bg-red-500/20 animate-pulse pointer-events-none" />
      )}
      <div className="relative z-10 pt-4">
        {label && (
          <p className={`text-center font-hand font-bold tracking-wide mb-2 ${
            isUrgent ? 'text-red-900' : 'text-gray-800'
          } ${large ? 'text-2xl' : 'text-lg'} capitalize underline decoration-wavy decoration-black/20`}>
            {label}
          </p>
        )}
        <div className="flex items-center justify-center gap-2">
          <div className={`
            font-hand font-black tabular-nums tracking-widest
            ${large ? 'text-8xl' : 'text-5xl'}
            ${isUrgent ? 'text-red-900' : isWarning ? 'text-orange-900' : 'text-black'}
          `}>
            <span>{String(minutes).padStart(2, '0')}</span>
            <span className={`${isRunning ? 'animate-pulse' : ''} -mx-2`}>:</span>
            <span>{String(seconds).padStart(2, '0')}</span>
          </div>
        </div>
        {!isRunning && endTime && (
          <p className={`text-center mt-2 font-black tracking-widest uppercase font-sans border-2 border-red-600 text-red-600 transform -rotate-6 inline-block w-full ${
            large ? 'text-3xl' : 'text-xl'
          }`}>
            TIME'S UP
          </p>
        )}
      </div>
    </div>
  );
}
