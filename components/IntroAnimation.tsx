
import React, { useEffect, useState } from 'react';
import { Sparkles, Terminal, ShieldCheck, Activity } from 'lucide-react';

interface IntroAnimationProps {
  onComplete: () => void;
}

const IntroAnimation: React.FC<IntroAnimationProps> = ({ onComplete }) => {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 800);  // Text Reveal
    const t2 = setTimeout(() => setStage(2), 2400); // Technical Overlay
    const t3 = setTimeout(() => setStage(3), 4000); // Final Transition
    const t4 = setTimeout(() => onComplete(), 5000);
    return () => [t1, t2, t3, t4].forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-[#020617] flex flex-col items-center justify-center z-[100] overflow-hidden px-6">
      <div className="absolute inset-0 bg-grid opacity-10"></div>
      
      <div className={`transition-all duration-1000 flex flex-col items-center ${stage >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-95 translate-y-4'}`}>
        <div className="w-16 h-16 md:w-20 md:h-20 bg-cyan-500/10 rounded-2xl md:rounded-3xl border border-cyan-500/30 flex items-center justify-center mb-6 md:mb-10 relative">
           {/* Fixed: Removed invalid md:size prop which causes JSX parsing/type errors */}
           <Terminal size={32} className="text-cyan-400 animate-pulse md:w-10 md:h-10" />
           <div className="absolute inset-0 blur-2xl bg-cyan-500/20"></div>
        </div>

        <h1 className="font-orbitron text-3xl md:text-6xl font-black tracking-[0.2em] md:tracking-[0.3em] text-center mb-4">
          <span className="text-white">WEALTH</span>
          <span className="text-cyan-500">OS</span>
        </h1>
        
        <div className="h-[1px] w-48 md:w-64 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent mb-4"></div>
        
        <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] md:tracking-[0.5em] text-slate-500 flex items-center gap-2">
          {/* Fixed: Removed invalid md:size props */}
          <Activity size={10} className="md:w-3 md:h-3" /> INITIALIZING PROFIT_PROTOCOL <Activity size={10} className="md:w-3 md:h-3" />
        </p>
      </div>

      <div className={`absolute bottom-20 transition-all duration-700 ${stage >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
         <div className="bg-white/5 border border-white/10 px-4 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl flex items-center gap-3 md:gap-4 backdrop-blur-md">
            <ShieldCheck size={16} className="text-emerald-500" />
            <span className="text-[9px] md:text-xs font-bold text-slate-300">AUTHORIZED SESSION</span>
            <div className="w-1 h-1 rounded-full bg-slate-700"></div>
            <Sparkles size={16} className="text-amber-500 animate-pulse" />
         </div>
      </div>

      <div className={`fixed inset-0 bg-white pointer-events-none transition-opacity duration-1000 ${stage === 3 ? 'opacity-10' : 'opacity-0'}`}></div>
    </div>
  );
};

export default IntroAnimation;
