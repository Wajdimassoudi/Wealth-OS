
import React, { useState, useEffect } from 'react';
import { User, ChevronRight, ShieldCheck, Terminal, Users, Zap, Lock, AlertCircle, UserPlus, LogIn } from 'lucide-react';
import { supabase, getClientIP } from '../services/supabase';
import { sendAdminNotification } from '../services/telegramService';

interface LoginProps {
  onLogin: (username: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [totalUsers, setTotalUsers] = useState(15243);

  useEffect(() => {
    const interval = setInterval(() => {
      setTotalUsers(prev => prev + Math.floor(Math.random() * 2) + 1);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim().toUpperCase();
    
    if (cleanName.length < 4) {
      setError("Username min 4 characters");
      return;
    }
    if (password.length < 4) {
      setError("Password min 4 characters");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('username', cleanName)
        .maybeSingle();

      if (fetchError) throw new Error("Connection failed: " + fetchError.message);

      if (existingUser) {
        if (isSignUp) {
          setError("Account exists. Switch to Login.");
        } else {
          if (existingUser.password === password) {
            onLogin(cleanName);
          } else {
            setError("Wrong password.");
          }
        }
      } else {
        if (!isSignUp) {
          setError("User not found. Switch to Sign Up.");
          setIsProcessing(false);
          return;
        }

        const ip = await getClientIP();
        const urlParams = new URLSearchParams(window.location.search);
        const refCodeFromUrl = urlParams.get('ref'); 
        const myReferralCode = 'OS' + Math.floor(100000 + Math.random() * 899999);
        
        const { error: insertError } = await supabase
          .from('users')
          .insert([{
            username: cleanName,
            password: password,
            referral_code: myReferralCode,
            ip: ip,
            earnings: 0,
            referrals: 0,
            viewed_today: 0,
            last_reset: new Date().toISOString()
          }]);

        if (insertError) throw new Error("Registry failed: " + insertError.message);

        // Telegram Notification for Admin
        await sendAdminNotification(`🚀 *New User Registered!*\n👤 User: ${cleanName}\n📍 IP: ${ip}\n🔗 Ref: ${refCodeFromUrl || 'None'}`);

        if (refCodeFromUrl) {
          const { data: referrer } = await supabase
            .from('users')
            .select('id, earnings, referrals')
            .eq('referral_code', refCodeFromUrl)
            .maybeSingle();

          if (referrer) {
            await supabase.from('users').update({ 
              earnings: (referrer.earnings || 0) + 2, // Updated to 2 $WOS
              referrals: (referrer.referrals || 0) + 1 
            }).eq('id', referrer.id);
            
            await supabase.from('referrals').insert([{
              referrer_id: refCodeFromUrl,
              referred_ip: ip,
              bonus_paid: 2
            }]);
          }
        }
        
        onLogin(cleanName);
      }
    } catch (err: any) {
      console.error("Auth Failure:", err);
      setError(err.message || "System error. Please try later.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 bg-[#020617]">
      <div className="absolute inset-0 bg-grid opacity-5 pointer-events-none"></div>
      
      <div className="w-full max-w-md glass-panel p-8 md:p-10 rounded-[2.5rem] border border-cyan-500/20 shadow-[0_0_60px_rgba(6,182,212,0.1)] relative overflow-hidden shimmer-effect">
        <div className="flex flex-col items-center">
          
          <div className="flex w-full justify-between items-center mb-8">
             <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">WealthOS</span>
                <span className="text-xs font-black text-cyan-400 uppercase tracking-tighter">SECURE CLOUD</span>
             </div>
             <button 
               onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
               className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95"
             >
               {isSignUp ? <LogIn size={14} /> : <UserPlus size={14} />}
               {isSignUp ? 'To Login' : 'To Sign Up'}
             </button>
          </div>

          <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-transparent rounded-2xl border border-cyan-500/40 flex items-center justify-center mb-8 relative">
            <ShieldCheck size={32} className="text-cyan-400" />
            <div className="absolute -inset-2 bg-cyan-500/10 blur-xl rounded-full"></div>
          </div>
          
          <h2 className="font-orbitron text-2xl font-black text-white tracking-[0.2em] mb-2 uppercase">
            {isSignUp ? 'Create Node' : 'Access Node'}
          </h2>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-8">
            {isSignUp ? 'Quantum Registry Active' : 'Identity Verification Required'}
          </p>

          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div className="relative group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <User size={18} className="text-slate-600 group-focus-within:text-cyan-400 transition-colors" />
              </div>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="USERNAME"
                className="w-full bg-slate-950/80 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold tracking-widest text-white focus:outline-none focus:border-cyan-500/40 focus:ring-4 focus:ring-cyan-500/5 transition-all placeholder:text-slate-800 uppercase"
              />
            </div>

            <div className="relative group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Lock size={18} className="text-slate-600 group-focus-within:text-cyan-400 transition-colors" />
              </div>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="PASSWORD"
                className="w-full bg-slate-950/80 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold tracking-widest text-white focus:outline-none focus:border-cyan-500/40 focus:ring-4 focus:ring-cyan-500/5 transition-all placeholder:text-slate-800"
              />
            </div>

            {error && (
              <div className="flex items-center gap-3 text-[10px] font-black text-red-400 uppercase tracking-widest bg-red-500/5 p-3 rounded-xl border border-red-500/20 animate-pulse">
                <AlertCircle size={16} /> {error}
              </div>
            )}
            
            <button 
              disabled={!name.trim() || !password.trim() || isProcessing}
              type="submit"
              className="w-full bg-white text-slate-950 py-4.5 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30 shadow-2xl mt-4"
            >
              {isProcessing ? 'PROCESSING...' : isSignUp ? 'CREATE ACCOUNT' : 'INITIALIZE SESSION'} 
              <ChevronRight size={18} />
            </button>
          </form>
          
          <div className="mt-10 flex flex-col items-center gap-2">
             <div className="flex items-center gap-2 text-[8px] font-black text-slate-600 uppercase tracking-widest">
                <Users size={12} /> Live Network Users: {totalUsers.toLocaleString()}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
