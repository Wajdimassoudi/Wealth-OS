import React, { useState, useEffect } from 'react';
import { boostTraffic } from './lib/otohits';
import IntroAnimation from './components/IntroAnimation';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import Airdrop from './components/Airdrop';
import { AppState } from './types';

const App: React.FC = () => {
  const [currentStage, setCurrentStage] = useState<AppState>(AppState.INTRO);
  const [currentUser, setCurrentUser] = useState<string | null>(localStorage.getItem('wealthos_active_session'));

  useEffect(() => {
    boostTraffic();
  }, []);

  const handleIntroComplete = () => {
    if (currentUser) {
      setCurrentStage(AppState.DASHBOARD);
    } else {
      setCurrentStage(AppState.LOGIN);
    }
  };

  const handleLogin = (username: string) => {
    setCurrentUser(username);
    localStorage.setItem('wealthos_active_session', username);
    setCurrentStage(AppState.DASHBOARD);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('wealthos_active_session');
    setCurrentStage(AppState.LOGIN);
  };

  return (
    <div className="min-h-screen bg-[#020617]">
      {currentStage === AppState.INTRO && (
        <IntroAnimation onComplete={handleIntroComplete} />
      )}
      
      {currentStage === AppState.LOGIN && (
        <div className="animate-in fade-in zoom-in duration-700 h-screen">
          <Login onLogin={handleLogin} />
        </div>
      )}
      
      {currentStage === AppState.DASHBOARD && currentUser && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <Dashboard 
            username={currentUser} 
            onLogout={handleLogout} 
            onNavigateAirdrop={() => setCurrentStage(AppState.AIRDROP)}
          />
        </div>
      )}

      {currentStage === AppState.AIRDROP && currentUser && (
        <div className="animate-in fade-in slide-in-from-right-4 duration-700">
          <Airdrop onBack={() => setCurrentStage(AppState.DASHBOARD)} />
        </div>
      )}
    </div>
  );
};

export default App;
