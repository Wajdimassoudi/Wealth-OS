
import React, { useState, useEffect } from 'react';
import { 
  Coins, 
  ArrowLeft, 
  Zap, 
  Globe, 
  ShieldCheck, 
  User, 
  Copy, 
  Cpu, 
  CheckCircle2, 
  Rocket,
  AlertTriangle,
  RefreshCw,
  Wallet,
  Search,
  DollarSign,
  TrendingUp,
  Award,
  Users,
  Target,
  Code,
  BrainCircuit,
  Database,
  Network,
  Layers,
  ArrowRight
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { sendAdminNotification } from '../services/telegramService';

interface AirdropProps {
  onBack: () => void;
}

const generateHash = () => `0x${Math.random().toString(16).slice(2, 6)}...${Math.random().toString(16).slice(2, 6)}`;

const Airdrop: React.FC<AirdropProps> = ({ onBack }) => {
  const [price, setPrice] = useState(0.0364);
  const [copied, setCopied] = useState(false);
  const [userWallet, setUserWallet] = useState('');
  const [isWalletSaved, setIsWalletSaved] = useState(false);
  const [wosBalance, setWosBalance] = useState<number>(0);
  const [investAmount, setInvestAmount] = useState<string>('10');
  const [verifying, setVerifying] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'success' | 'error' | 'not_found'>('idle');
  const [recentBuyers, setRecentBuyers] = useState<{hash: string, amount: string, time: string}[]>([]);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });

  const BSC_API_KEY = "Q5DHPUZX5HA9M4U7TMEJUCT4CF98RI645X";
  const TARGET_WALLET = "0x9eb989d94300c1a7a8a2f2ba03201ed3395ffff3";
  const USDT_CONTRACT = "0x55d398326f99059fF775485246999027B3197955";

  const fetchUser = async () => {
    const username = localStorage.getItem('wealthos_active_session');
    if (username) {
      const { data } = await supabase.from('users').select('*').eq('username', username).maybeSingle();
      if (data) {
        setUserWallet(data.wallet || '');
        setWosBalance(data.earnings || 0);
        if (data.wallet_updated_at) {
          const lastUpdate = new Date(data.wallet_updated_at).getTime();
          if (Date.now() - lastUpdate < 90 * 24 * 60 * 60 * 1000) setIsWalletSaved(true);
        }
      }
    }
  };

  useEffect(() => {
    fetchUser();
    
    const timer = setInterval(() => {
      const launchDate = new Date('2026-12-29T00:00:00').getTime();
      const diff = launchDate - new Date().getTime();
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        mins: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        secs: Math.floor((diff % (1000 * 60)) / 1000)
      });
    }, 1000);

    // Initial seed for buyers
    const initialBuyers = Array.from({ length: 8 }).map((_, i) => ({
      hash: generateHash(),
      amount: (Math.random() * 800 + 20).toFixed(1) + " USDT",
      time: (i * 12 + 5) + "s ago"
    }));
    setRecentBuyers(initialBuyers);

    // Faster interval for more "alive" feeling (Every 3-6 seconds)
    const buyerInterval = setInterval(() => {
      const newBuyer = {
        hash: generateHash(),
        amount: (Math.random() * 1200 + 10).toFixed(1) + " USDT",
        time: "Just now"
      };
      setRecentBuyers(prev => [newBuyer, ...prev.slice(0, 7)]);
    }, Math.floor(Math.random() * 3000 + 3000));

    return () => { clearInterval(timer); clearInterval(buyerInterval); };
  }, []);

  const handleSaveWallet = async () => {
    if (userWallet.length < 20 || isWalletSaved) return;
    const username = localStorage.getItem('wealthos_active_session');
    if (!username) return;
    try {
      const { error } = await supabase.from('users').update({ wallet: userWallet, wallet_updated_at: new Date().toISOString() }).eq('username', username);
      if (!error) setIsWalletSaved(true);
    } catch (e) { console.error(e); }
  };

  const verifyPayment = async () => {
    if (!isWalletSaved) return;
    const amountToVerify = parseFloat(investAmount);
    if (isNaN(amountToVerify) || amountToVerify < 10) { setVerifyStatus('error'); return; }
    
    setVerifying(true);
    setVerifyStatus('idle');

    try {
      const url = `https://api.bscscan.com/api?module=account&action=tokentx&contractaddress=${USDT_CONTRACT}&address=${TARGET_WALLET}&page=1&offset=100&sort=desc&apikey=${BSC_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === "1" && Array.isArray(data.result)) {
        const tx = data.result.find((t: any) => 
          t.from.toLowerCase() === userWallet.toLowerCase() && 
          t.to.toLowerCase() === TARGET_WALLET.toLowerCase()
        );

        if (tx) {
          const actualAmount = parseFloat(tx.value) / 1e18;
          const { data: existingDeposit } = await supabase.from('deposits').select('id').eq('tx_hash', tx.hash).maybeSingle();
          
          if (existingDeposit) {
            setVerifyStatus('error');
            alert("Security Alert: Transaction already verified.");
            return;
          }

          if (actualAmount >= amountToVerify) {
            const tokensGained = actualAmount / 0.0364;
            const newBalance = wosBalance + tokensGained;
            const username = localStorage.getItem('wealthos_active_session');
            
            await supabase.from('users').update({ earnings: newBalance }).eq('username', username);
            await supabase.from('deposits').insert([{ username, tx_hash: tx.hash, amount: actualAmount }]);

            await sendAdminNotification(`💰 *NEW DEPOSIT DETECTED!*\n👤 User: ${username}\n💵 Amount: ${actualAmount} USDT\n💎 Tokens: ${tokensGained.toFixed(2)} WOS\n🔗 Hash: ${tx.hash}`);

            setWosBalance(newBalance);
            setVerifyStatus('success');
          } else { setVerifyStatus('error'); }
        } else { setVerifyStatus('not_found'); }
      } else { setVerifyStatus('not_found'); }
    } catch (err) { setVerifyStatus('error'); } finally { setVerifying(false); }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-300 pb-20 relative overflow-x-hidden font-sans custom-scrollbar">
      <div className="fixed top-[-10%] right-[-10%] w-[50%] h-[50%] bg-amber-500/10 blur-[120px] rounded-full pointer-events-none"></div>
      
      <nav className="border-b border-white/5 bg-slate-950/40 backdrop-blur-2xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 md:h-20 flex items-center justify-between">
          <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-xl transition-all flex items-center gap-2 text-xs font-black uppercase text-slate-400">
            <ArrowLeft size={18} /> Exit Portal
          </button>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end">
               <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Global Index</span>
               <span className="text-xs font-orbitron font-black text-amber-500">{wosBalance.toLocaleString()} WOS</span>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full flex items-center gap-2">
               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
               <span className="text-[10px] font-black text-emerald-400 tracking-widest">$0.0364</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 pt-12 space-y-12">
        
        {/* Launch Countdown */}
        <section className="glass-panel p-6 rounded-[2rem] border border-cyan-500/30 bg-cyan-500/5 text-center">
           <h3 className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.4em] mb-4">Mainnet Genesis Countdown</h3>
           <div className="flex justify-center gap-4 md:gap-8">
              {[ {l: 'Days', v: timeLeft.days}, {l: 'Hours', v: timeLeft.hours}, {l: 'Mins', v: timeLeft.mins}, {l: 'Secs', v: timeLeft.secs} ].map((t,i) => (
                <div key={i} className="flex flex-col items-center">
                  <span className="text-2xl md:text-4xl font-orbitron font-black text-white">{t.v < 10 ? `0${t.v}` : t.v}</span>
                  <span className="text-[8px] font-black text-slate-500 uppercase">{t.l}</span>
                </div>
              ))}
           </div>
           <p className="mt-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Public Launch: Dec 29, 2026 @ 00:00 UTC</p>
        </section>

        {/* Hero Section */}
        <section className="text-center space-y-6 relative">
          <div className="relative inline-block group">
            <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-amber-400 to-amber-600 rounded-[2.5rem] flex items-center justify-center shadow-[0_0_50px_rgba(245,158,11,0.3)] border-4 border-white/10 relative z-10 overflow-hidden transform group-hover:rotate-[10deg] transition-all">
               <Coins size={64} className="text-white drop-shadow-2xl" />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-cyan-500 p-2 rounded-xl border-4 border-slate-950 z-20 shadow-lg animate-bounce">
               <Cpu size={16} className="text-white" />
            </div>
          </div>
          <div className="space-y-1">
            <h1 className="font-orbitron text-4xl md:text-5xl font-black text-white tracking-tighter uppercase">Wealth <span className="text-amber-500">Node</span></h1>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em]">Quantum Financial Ledger</p>
          </div>
        </section>

        {/* Identity & Wallet Connection */}
        <section className="glass-panel p-8 rounded-[2.5rem] border border-white/10 relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-full md:w-1/2 space-y-4">
               <div className="flex items-center gap-3 text-cyan-400">
                  <Wallet size={20} />
                  <h3 className="text-sm font-black uppercase tracking-widest">Deployment Identity</h3>
               </div>
               <p className="text-[10px] text-slate-500 font-bold uppercase leading-relaxed">
                 Linking your BEP20 wallet is required for smart contract verification. 
                 <span className="text-amber-500"> Locked for 90 days upon first save.</span>
               </p>
               <div className="space-y-3">
                  <div className="relative">
                    <input 
                      type="text" 
                      value={userWallet}
                      onChange={(e) => setUserWallet(e.target.value)}
                      disabled={isWalletSaved}
                      placeholder="ENTER BEP20 WALLET"
                      className="w-full bg-slate-950 border border-white/5 rounded-xl py-4 px-5 text-[10px] font-mono text-cyan-400 focus:border-cyan-500/40 outline-none uppercase disabled:opacity-50"
                    />
                    {!isWalletSaved && userWallet.length > 20 && (
                      <button onClick={handleSaveWallet} className="absolute right-2 top-2 bottom-2 bg-emerald-500 text-slate-950 px-4 rounded-lg text-[9px] font-black uppercase">Lock & Save</button>
                    )}
                  </div>
               </div>
            </div>
            <div className="w-full md:w-1/2 bg-slate-950/50 rounded-3xl border border-white/5 p-6 flex flex-col items-center justify-center text-center space-y-2">
               <span className="text-[10px] font-black text-slate-600 uppercase">My Total Balance</span>
               <div className="text-3xl font-orbitron font-black text-white">{wosBalance.toLocaleString(undefined, {maximumFractionDigits: 2})} <span className="text-amber-500 text-lg">WOS</span></div>
               <div className="text-[9px] font-black text-emerald-500 uppercase flex items-center gap-2">
                 <CheckCircle2 size={12} /> Protocol Active
               </div>
            </div>
          </div>
        </section>

        {/* Investment & Verification */}
        <section className={`transition-all duration-700 ${isWalletSaved ? 'opacity-100' : 'opacity-30 pointer-events-none grayscale'}`}>
          <div className="glass-panel p-10 rounded-[3rem] border-2 border-amber-500/20 bg-gradient-to-b from-amber-500/5 to-transparent space-y-8">
             <div className="text-center space-y-2">
                <h2 className="text-xl font-orbitron font-black text-white uppercase tracking-[0.2em]">Deployment Phase: Active</h2>
                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Min Investment: 10 USDT • Network: BEP20</p>
             </div>

             <div className="space-y-4">
                <div className="bg-slate-950 border border-white/5 rounded-2xl p-6 space-y-3">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Investment Amount (USDT BEP20)</span>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-amber-500">
                      <DollarSign size={18} />
                    </div>
                    <input 
                      type="number" 
                      value={investAmount}
                      onChange={(e) => setInvestAmount(e.target.value)}
                      placeholder="Min 10 USDT"
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-sm font-bold tracking-widest text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="bg-slate-950/80 border border-white/5 rounded-2xl p-6 space-y-3 relative overflow-hidden group">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Target Deposit Address (BEP20)</span>
                    <div className="flex items-center gap-3 relative z-10">
                      <div className="flex-1 font-mono text-xs text-amber-500 bg-black/40 p-3.5 rounded-xl border border-white/5 truncate">{TARGET_WALLET}</div>
                      <button onClick={() => { navigator.clipboard.writeText(TARGET_WALLET); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="p-3.5 bg-white text-slate-950 rounded-xl">
                          {copied ? <CheckCircle2 size={18} className="text-emerald-500" /> : <Copy size={18} />}
                      </button>
                    </div>
                </div>
             </div>

             <div className="space-y-4">
                <button onClick={verifyPayment} disabled={verifying} className="w-full bg-slate-950 border border-white/10 text-white py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-slate-900 transition-all shadow-xl">
                  {verifying ? <RefreshCw className="animate-spin" size={18} /> : <Search size={18} />}
                  {verifying ? "Scanning Blockchain..." : "Verify My Investment"}
                </button>

                {verifyStatus === 'success' && <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3 text-emerald-400 text-[10px] font-black uppercase"><CheckCircle2 size={16} /> Transaction confirmed! Added to balance.</div>}
                {verifyStatus === 'not_found' && <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-400 text-[10px] font-black uppercase tracking-widest"><AlertTriangle size={16} /> No transaction detected. Verify BEP20 network.</div>}
                {verifyStatus === 'error' && <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-3 text-amber-500 text-[10px] font-black uppercase tracking-widest"><AlertTriangle size={16} /> Minimum entry: 10 USDT.</div>}
             </div>
          </div>
        </section>

        {/* Project Vision & Tokenomics (The Genesis Blueprint) */}
        <section className="space-y-12">
           <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-full text-[10px] font-black text-amber-500 uppercase tracking-[0.3em]">The Genesis Blueprint</div>
              <h2 className="text-3xl md:text-5xl font-orbitron font-black text-white tracking-tighter uppercase leading-tight">
                 50 Million Nodes. <br /><span className="text-cyan-500">One Global Wealth OS.</span>
              </h2>
              <p className="text-[11px] md:text-xs font-bold text-slate-500 uppercase tracking-[0.4em]">Fair wealth distribution for all through the power of AI</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Tokenomics Card */}
              <div className="glass-panel p-10 rounded-[3rem] border border-white/5 bg-gradient-to-br from-slate-950 to-transparent space-y-8">
                 <div className="flex items-center gap-4 text-amber-500">
                    <Database size={28} />
                    <h3 className="text-xl font-orbitron font-black uppercase tracking-widest">$WOS Tokenomics</h3>
                 </div>
                 <div className="space-y-6">
                    <div className="flex justify-between items-end border-b border-white/5 pb-4">
                       <div>
                          <div className="text-[10px] font-black text-slate-500 uppercase">Total Supply</div>
                          <div className="text-2xl font-orbitron font-black text-white tracking-widest">1,000,000,000</div>
                       </div>
                       <span className="text-[10px] font-black text-amber-500 uppercase">Fixed Supply</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       {[
                         { label: 'Community & Nodes', val: '50%' },
                         { label: 'AI Liquidity (AMM)', val: '20%' },
                         { label: 'Protocol Dev', val: '15%' },
                         { label: 'Global Expansion', val: '15%' }
                       ].map((item, i) => (
                         <div key={i} className="p-4 bg-black/40 rounded-2xl border border-white/5">
                            <div className="text-[9px] font-black text-slate-500 uppercase mb-1">{item.label}</div>
                            <div className="text-xl font-orbitron font-black text-white">{item.val}</div>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>

              {/* Technology Stack Card */}
              <div className="glass-panel p-10 rounded-[3rem] border border-white/5 bg-gradient-to-br from-cyan-500/5 to-transparent space-y-8">
                 <div className="flex items-center gap-4 text-cyan-400">
                    <BrainCircuit size={28} />
                    <h3 className="text-xl font-orbitron font-black uppercase tracking-widest">Protocol Tech</h3>
                 </div>
                 <div className="space-y-4">
                    {[
                      { title: 'AI Liquidity Engine', desc: 'Automated liquidity distribution to ensure price stability and yield growth.', icon: <Zap size={16} /> },
                      { title: 'Multi-Chain Protocol', desc: 'Full compatibility with (BSC + Ethereum + Solana).', icon: <Network size={16} /> },
                      { title: 'Yield Node Farming', desc: 'Real-time rewards system for every activated node in the network.', icon: <Cpu size={16} /> },
                      { title: 'DAO Governance', desc: 'Community management for 50 million nodes through decentralized voting.', icon: <Users size={16} /> }
                    ].map((tech, i) => (
                      <div key={i} className="flex gap-4 group">
                         <div className="shrink-0 w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-all">{tech.icon}</div>
                         <div>
                            <h4 className="text-[11px] font-black text-white uppercase tracking-wider">{tech.title}</h4>
                            <p className="text-[10px] text-slate-500 leading-relaxed font-bold">{tech.desc}</p>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
           </div>

           {/* Profit Mechanisms Section */}
           <div className="glass-panel p-10 rounded-[3rem] border border-emerald-500/20 bg-emerald-500/5 space-y-8">
              <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                 <div className="space-y-4 text-center md:text-left">
                    <div className="flex items-center gap-4 text-emerald-500 justify-center md:justify-start">
                       <Award size={32} />
                       <h3 className="text-2xl font-orbitron font-black uppercase">Profit Mechanisms</h3>
                    </div>
                    <p className="text-xs text-slate-400 max-w-xl font-bold uppercase leading-relaxed tracking-wider">
                       Every operation in the system aims to maximize community wealth. From simple clicks to massive investments, everyone wins.
                    </p>
                 </div>
                 <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
                    <div className="p-4 bg-slate-950 rounded-2xl border border-white/5 flex flex-col items-center">
                       <div className="text-[10px] font-black text-slate-500 uppercase">Per Click</div>
                       <div className="text-xl font-orbitron text-white">0.20 $WOS</div>
                    </div>
                    <div className="p-4 bg-slate-950 rounded-2xl border border-white/5 flex flex-col items-center">
                       <div className="text-[10px] font-black text-slate-500 uppercase">Per Ref</div>
                       <div className="text-xl font-orbitron text-amber-500">2.00 $WOS</div>
                    </div>
                 </div>
              </div>
           </div>

           {/* Roadmap / Fair Distribution */}
           <div className="space-y-8">
              <div className="flex items-center gap-4">
                 <Rocket size={24} className="text-amber-500" />
                 <h3 className="text-lg font-orbitron font-black uppercase tracking-widest">Genesis Roadmap</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                 {[
                   { phase: 'Phase 1: Now', title: 'Early Adopters', val: '10M $WOS', desc: 'The first 50,000 users receive the highest yield rates.' },
                   { phase: 'Phase 2: Month 1', title: 'Network Surge', val: '100M $WOS', desc: 'Community building and incentivizing network leaders (Affiliates).' },
                   { phase: 'Phase 3: Launch', title: 'Ecosystem Live', val: '400M $WOS', desc: 'Node activation and public withdrawal on trading platforms.' },
                   { phase: 'Phase 4: Future', title: 'Global Dominance', val: '490M $WOS', desc: 'Reaching 50 million users and a target price of +$2.50.' }
                 ].map((step, i) => (
                   <div key={i} className="glass-panel p-6 rounded-3xl border border-white/5 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><ArrowRight size={40} /></div>
                      <div className="text-[9px] font-black text-amber-500 uppercase mb-2">{step.phase}</div>
                      <h4 className="text-[11px] font-black text-white uppercase mb-1">{step.title}</h4>
                      <div className="text-lg font-orbitron text-cyan-400 mb-3">{step.val}</div>
                      <p className="text-[10px] text-slate-500 font-bold leading-relaxed">{step.desc}</p>
                   </div>
                 ))}
              </div>
           </div>
        </section>

        {/* Live Network Ledger */}
        <section className="space-y-6">
           <div className="flex items-center justify-between">
              <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] flex items-center gap-2"><Globe size={14} className="text-cyan-400" /> Network Ledger</h2>
              <span className="text-[8px] font-black text-slate-600 uppercase">Updating Live...</span>
           </div>
           <div className="grid grid-cols-1 gap-3">
              {recentBuyers.map((buyer, idx) => (
                <div key={idx} className="glass-panel p-4 rounded-2xl border border-white/5 flex items-center justify-between animate-in fade-in slide-in-from-right-4 duration-500">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-900/50 flex items-center justify-center border border-white/5 text-cyan-500"><ShieldCheck size={18} /></div>
                      <div>
                         <div className="text-[10px] font-mono text-slate-300 tracking-wider">{buyer.hash}</div>
                         <div className="text-[8px] font-black text-slate-600 uppercase tracking-tighter">Verified Node Purchase • {buyer.time}</div>
                      </div>
                   </div>
                   <div className="text-right">
                      <div className="text-[9px] font-black text-emerald-500 uppercase tracking-tighter">Confirmed</div>
                      <div className="text-xs font-orbitron text-white">{buyer.amount}</div>
                   </div>
                </div>
              ))}
           </div>
        </section>

        {/* Core Visionaries Section */}
        <section className="space-y-10">
           <div className="text-center space-y-2">
              <h2 className="text-2xl font-orbitron font-black text-white uppercase tracking-widest">The Visionaries</h2>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em]">Architects of the Future Financial Stack</p>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { name: "Dr. Victor Quantum", role: "Chief Architect", icon: <Code />, bio: "Former Silicon Valley expert specialized in high-frequency liquidity algorithms." },
                { name: "Elena Cipher", role: "Blockchain Strategist", icon: <ShieldCheck />, bio: "Leading DeFi security consultant in designing global decentralized infrastructure." },
                { name: "X-Group Labs", role: "Core Developers", icon: <Cpu />, bio: "An elite group of 42 programmers from 5 continents working on building the largest smart financial community." }
              ].map((member, i) => (
                <div key={i} className="glass-panel p-8 rounded-[2.5rem] border border-white/5 space-y-4 hover:border-cyan-500/20 transition-all group">
                   <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-all">{member.icon}</div>
                   <div>
                      <h4 className="text-sm font-black text-white uppercase tracking-wider">{member.name}</h4>
                      <span className="text-[9px] font-black text-cyan-500 uppercase">{member.role}</span>
                   </div>
                   <p className="text-[11px] text-slate-500 leading-relaxed font-bold">{member.bio}</p>
                </div>
              ))}
           </div>
        </section>

        <section className="text-center pt-8 opacity-40">
           <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">© 2026 WealthOS Quantum Ecosystem • Decentralized Asset Protocol</p>
        </section>

      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-slate-950/80 backdrop-blur-xl border-t border-white/5 p-4 flex justify-between items-center z-[110] md:hidden">
         <div className="flex flex-col">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Total Assets</span>
            <span className="text-sm font-orbitron font-black text-amber-500">{wosBalance.toFixed(2)}</span>
         </div>
         <button onClick={() => isWalletSaved ? verifyPayment() : null} className="bg-amber-500 text-slate-950 px-6 py-2.5 rounded-xl font-black text-[10px] uppercase shadow-lg">Verify Node</button>
      </div>

    </div>
  );
};

export default Airdrop;
