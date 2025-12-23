export enum UserRole {
  USER = 'user',
  ADMIN = 'admin'
}

export enum UserStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  BANNED = 'banned'
}

export enum SubmissionStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  VIRAL_CLAIM = 'viral_claim'
}

export enum PayoutStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  HOLD = 'hold',
  REJECTED = 'rejected'
}

export enum Platform {
  INSTAGRAM = 'Instagram',
  FACEBOOK = 'Facebook'
}

export interface User {
  id: string;
  username: string;
  password?: string;
  securityKey?: string;
  email?: string;
  role: UserRole;
  status: UserStatus;
  walletBalance: number;
  pendingBalance: number;
  totalEarnings: number;
  joinedAt: number;
  savedSocialUsername?: string;
  payoutDetails?: string;
  payoutMethod?: 'UPI' | 'BANK' | 'USDT';
  readBroadcastIds?: string[];
  failedAttempts?: number;
  lockoutUntil?: number;
}

export interface UserReport {
  id: string;
  userId: string;
  username: string;
  message: string;
  status: 'open' | 'resolved';
  timestamp: number;
}

export interface Campaign {
  id: string;
  title: string;
  videoUrl: string;
  thumbnailUrl: string;
  caption: string;
  hashtags: string;
  audioName: string;
  goalViews: number;
  goalLikes: number;
  basicPay: number;
  viralPay: number;
  active: boolean;
  bioLink?: string;
}

export interface PayoutRequest {
  id: string;
  userId: string;
  username: string;
  amount: number;
  method: string;
  status: PayoutStatus;
  timestamp: number;
}

export interface BroadcastMessage {
  id: string;
  content: string;
  targetUserId?: string;
  senderId: string;
  timestamp: number;
}

export interface Submission {
  id: string;
  userId: string;
  username: string;
  socialUsername: string;
  campaignId: string;
  campaignTitle: string;
  platform: Platform;
  status: SubmissionStatus;
  timestamp: number;
  rewardAmount: number;
  isViralBonus?: boolean;
  rejectionReason?: string;
  externalLink?: string;
}

export interface AppLog {
  id: string;
  userId?: string;
  username?: string;
  type: 'auth' | 'transaction' | 'system' | 'admin' | 'action' | 'payout' | 'verify' | 'viral';
  message: string;
  timestamp: number;
}

export interface CashflowConfig {
  dailyLimit: number;
  todaySpent: number;
  startDate?: string;
  endDate?: string;
}

export interface AppState {
  users: User[];
  campaigns: Campaign[];
  submissions: Submission[];
  payoutRequests: PayoutRequest[];
  broadcasts: BroadcastMessage[];
  reports: UserReport[];
  cashflow: CashflowConfig;
  logs: AppLog[];
  config: {
    minWithdrawal: number;
  };
}