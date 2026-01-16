
export interface AdNode {
  id: number;
  status: 'ready' | 'loading' | 'completed';
  reward: number;
  title: string;
}

export interface ViewLog {
  timestamp: string;
  reward: number;
  id: number;
}

export interface UserRecord {
  id?: string;
  username: string;
  password?: string;
  referral_code: string;
  ip: string;
  earnings: number;
  referrals: number;
  viewed_today: number;
  last_reset: string; // ISO String
  wallet?: string;
  wallet_updated_at?: string; // ISO String for 90-day lock
}

export enum AppState {
  INTRO = 'INTRO',
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD',
  AIRDROP = 'AIRDROP'
}

export interface UserProfile {
  skills: string[];
  availableTime: string;
  initialBudget: string;
}

export interface SideHustle {
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  potentialEarnings: string;
  timeToStart: string;
  category: string;
}
