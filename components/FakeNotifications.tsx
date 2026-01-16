
import React, { useState, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';

const NAMES = ["Ahmed_77", "Sami_TRX", "CryptoKing", "Sarah_USDT", "User_992", "ProfitMaster", "Khalid_TRC", "Elena_X", "Noor_2025", "Mega_Earning"];
const AMOUNTS = [12.5, 5.0, 45.2, 7.8, 100.0, 15.4, 8.2, 50.0, 22.1, 5.5];

const FakeNotifications: React.FC = () => {
  const [active, setActive] = useState(false);
  const [data, setData] = useState({ name: "", amount: 0 });

  useEffect(() => {
    const trigger = () => {
      const randomName = NAMES[Math.floor(Math.random() * NAMES.length)];
      const randomAmount = AMOUNTS[Math.floor(Math.random() * AMOUNTS.length)];
      setData({ name: randomName, amount: randomAmount });
      setActive(true);
      
      setTimeout(() => setActive(false), 4000);
      
      // Trigger next one in 10-25 seconds
      setTimeout(trigger, Math.random() * 15000 + 10000);
    };

    const initialTimeout = setTimeout(trigger, 5000);
    return () => clearTimeout(initialTimeout);
  }, []);

  return (
    <div className={`fixed bottom-16 sm:bottom-20 md:bottom-24 right-4 md:right-6 z-[100] transition-all duration-700 transform ${active ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-12 opacity-0 scale-90 pointer-events-none'}`}>
      <div className="bg-slate-900/90 backdrop-blur-xl border border-emerald-500/30 p-3 md:p-4 rounded-xl md:rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.2)] flex items-center gap-3 md:gap-4 min-w-[200px] md:min-w-[280px] max-w-[260px] md:max-w-none">
        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/40 shrink-0">
          <CheckCircle2 size={16} md:size={20} className="text-emerald-400" />
        </div>
        <div>
          <div className="text-[8px] md:text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
            Withdrawal Success <span className="w-1 md:w-1.5 h-1 md:h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <div className="text-xs md:text-sm font-bold text-white mt-0.5">
            {data.name} <span className="text-emerald-400">${data.amount.toFixed(2)}</span>
          </div>
          <div className="text-[7px] md:text-[8px] font-bold text-slate-500 uppercase mt-0.5 tracking-tighter">Network: USDT TRC20</div>
        </div>
      </div>
    </div>
  );
};

export default FakeNotifications;
