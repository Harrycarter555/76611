import React, { useState, useEffect, useMemo } from 'react';
import { User, Campaign, Submission, UserRole, UserStatus, SubmissionStatus, Platform, AppState, AppLog, PayoutRequest, PayoutStatus, BroadcastMessage, UserReport } from './types';
import { ICONS } from './constants';
import { doc, getDoc, setDoc } from "firebase/firestore";
// Sahi path: kyunki firebase.ts bhi src folder mein hi hai
import { db, auth } from "./src/firebase"; 

// Firestore document path
const STATE_DOC = "main_state";

// Load full app state from Firestore
async function loadAppStateFromFirebase(): Promise<AppState | null> {
  try {
    const snap = await getDoc(doc(db, "appState", STATE_DOC));
    if (snap.exists()) {
      return snap.data() as AppState;
    }
  } catch (err) {
    console.error("Firebase load error:", err);
  }
  return null;
}

// Save full app state to Firestore
async function saveAppStateToFirebase(state: AppState) {
  try {
    await setDoc(doc(db, "appState", STATE_DOC), state);
  } catch (err) {
    console.error("Firebase save error:", err);
  }
}

const INITIAL_DATA: AppState = {
  users: [
    { id: 'admin-1', username: 'admin', password: '123', email: 'admin@reelearn.pro', role: UserRole.ADMIN, status: UserStatus.ACTIVE, walletBalance: 0, pendingBalance: 0, totalEarnings: 0, joinedAt: Date.now(), readBroadcastIds: [], securityKey: 'ADMIN-MASTER' }
  ],
  campaigns: [
    {
      id: 'c-1',
      title: 'Neon Drift Style',
      videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=600',
      caption: 'The future of drifting is here. 🏎️💨 #NeonDrift #ReelEarn',
      hashtags: '#viral #trending #reels #supercars',
      audioName: 'Phonk Killer - Drift Mode',
      goalViews: 20000,
      goalLikes: 2500,
      basicPay: 50.00,
      viralPay: 250.00,
      active: true,
      bioLink: 'reelearn.vip/mission/c-1'
    }
  ],
  submissions: [],
  payoutRequests: [],
  broadcasts: [
    { id: 'm-1', content: 'Welcome to ReelEarn Pro! Check your missions and start earning.', senderId: 'admin-1', timestamp: Date.now() }
  ],
  reports: [],
  cashflow: { dailyLimit: 100000, todaySpent: 0, startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0] },
  logs: [],
  config: { minWithdrawal: 100 }
};

const Header: React.FC<{ user: User | null; onLogout: () => void; onNotifyClick: () => void; onProfileClick: () => void; unreadCount: number }> = ({ user, onLogout, onNotifyClick, onProfileClick, unreadCount }) => {
  if (!user) return null;
  return (
    <header className="px-6 py-6 flex justify-between items-center max-w-lg mx-auto sticky top-0 bg-black/50 backdrop-blur-xl z-[90]">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-black italic tracking-tighter text-white">REEL<span className="text-cyan-400">EARN</span></h1>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={onProfileClick} className="p-3 bg-white/5 rounded-2xl border border-white/10 text-cyan-400 active:scale-95 transition-all">
          <ICONS.User className="w-5 h-5" />
        </button>
        <button onClick={onNotifyClick} className="relative p-3 bg-white/5 rounded-2xl border border-white/10 text-slate-400 active:scale-95 transition-all">
          <ICONS.Bell className="w-5 h-5" />
          {unreadCount > 0 && <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[8px] font-black flex items-center justify-center rounded-full animate-pulse">{unreadCount}</span>}
        </button>
        <button onClick={onLogout} className="p-3 bg-white/5 rounded-2xl border border-white/10 text-slate-400 active:scale-95 transition-all">
          <ICONS.X className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(INITIAL_DATA);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<'auth' | 'campaigns' | 'verify' | 'wallet' | 'admin'>('auth');
  const [authTab, setAuthTab] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [adminTab, setAdminTab] = useState<'dashboard' | 'member' | 'campaign' | 'cashflow' | 'payout' | 'message' | 'reports'>('dashboard');
  const [walletTab, setWalletTab] = useState<'transactions' | 'inbox' | 'payment' | 'viral'>('transactions');
  const [payoutSubTab, setPayoutSubTab] = useState<'payouts' | 'verifications'>('payouts');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [selectedUserDetail, setSelectedUserDetail] = useState<User | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [isReporting, setIsReporting] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showLockoutModal, setShowLockoutModal] = useState(false);
  const [recoveryUser, setRecoveryUser] = useState<User | null>(null);
  const [resetData, setResetData] = useState({ username: '', password: '' });
  const [selectedVerifyCampaigns, setSelectedVerifyCampaigns] = useState<string[]>([]);

  useEffect(() => {
    loadAppStateFromFirebase().then((data) => {
      if (data) setAppState(data);
    });
  }, []);

  // Sync with Firebase whenever appState changes
  useEffect(() => {
    if (appState !== INITIAL_DATA) {
      saveAppStateToFirebase(appState);
    }
  }, [appState]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const stats = useMemo(() => {
    const totalUsers = appState.users.filter(u => u.role !== UserRole.ADMIN).length;
    const totalBalance = appState.users.reduce((acc, u) => acc + u.walletBalance, 0);
    const totalPending = appState.users.reduce((acc, u) => acc + u.pendingBalance, 0);
    const withdrawalRequestsCount = appState.payoutRequests.filter(p => p.status === PayoutStatus.PENDING).length;
    const withdrawalRequestsAmount = appState.payoutRequests.filter(p => p.status === PayoutStatus.PENDING).reduce((acc, p) => acc + p.amount, 0);
    const pendingCashflow = totalPending + withdrawalRequestsAmount;
    const cashflowRemaining = appState.cashflow.dailyLimit - totalBalance;
    return { totalUsers, totalBalance, totalPending, pendingCashflow, withdrawalRequestsCount, withdrawalRequestsAmount, cashflowLimit: appState.cashflow.dailyLimit, cashflowRemaining };
  }, [appState]);

  const addLog = (type: AppLog['type'], message: string, userId?: string, username?: string) => {
    const newLog: AppLog = { id: `log-${Date.now()}-${Math.random()}`, userId, username, type, message, timestamp: Date.now() };
    setAppState(prev => ({ ...prev, logs: [newLog, ...prev.logs].slice(0, 500) }));
  };

  const handleSignIn = (u: string, p: string) => {
    const user = appState.users.find(x => x.username === u);
    if (user) {
      if (user.lockoutUntil && user.lockoutUntil > Date.now()) {
        const remainingHours = Math.ceil((user.lockoutUntil - Date.now()) / (1000 * 60 * 60));
        return showToast(`TERMINAL LOCKED. ACCESS RESTRICTED FOR ${remainingHours} HOURS.`, 'error');
      }
      if (user.password === p) {
        if (user.status === UserStatus.BANNED) return showToast('ACCOUNT TERMINATED', 'error');
        if (user.status === UserStatus.SUSPENDED) return showToast('ACCOUNT SUSPENDED', 'error');
        setAppState(prev => ({ ...prev, users: prev.users.map(us => us.id === user.id ? { ...us, failedAttempts: 0, lockoutUntil: 0 } : us) }));
        setCurrentUser(user);
        addLog('auth', `Sign-in success: @${user.username}`, user.id, user.username);
        setCurrentView(user.role === UserRole.ADMIN ? 'admin' : 'campaigns');
      } else {
        const newAttempts = (user.failedAttempts || 0) + 1;
        let newLockout = 0;
        if (newAttempts >= 3) {
          newLockout = Date.now() + 24 * 60 * 60 * 1000;
          setShowLockoutModal(true);
        } else {
          showToast(`WRONG PASSWORD. ${newAttempts}/3 Used.`, 'error');
        }
        setAppState(prev => ({ ...prev, users: prev.users.map(us => us.id === user.id ? { ...us, failedAttempts: newAttempts, lockoutUntil: newLockout } : us) }));
      }
    } else {
      showToast('Node Username Not Found', 'error');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('auth');
    setIsProfileOpen(false);
  };

  const handleSignUp = (u: string, p: string, e: string) => {
    if (!u || !p || !e) return showToast('All fields required', 'error');
    if (appState.users.find(x => x.username === u)) return showToast('Username already taken', 'error');
    const newKey = `RE-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString().slice(-4)}`;
    const newUser: User = { id: `u-${Date.now()}`, username: u, password: p, email: e, securityKey: newKey, role: UserRole.USER, status: UserStatus.ACTIVE, walletBalance: 0, pendingBalance: 0, totalEarnings: 0, joinedAt: Date.now(), readBroadcastIds: [] };
    setAppState(prev => ({ ...prev, users: [...prev.users, newUser] }));
    setGeneratedKey(newKey);
    showToast('Terminal Initialized', 'success');
  };

  const handleForgot = (key: string) => {
    const user = appState.users.find(u => u.securityKey === key);
    if (user) {
      setRecoveryUser(user);
      setResetData({ username: user.username, password: user.password || '' });
    } else showToast('Invalid Security Key', 'error');
  };

  const handleReportSubmit = (msg: string) => {
    if (!msg.trim()) return showToast('Empty report', 'error');
    const newReport: UserReport = { id: `rep-${Date.now()}`, userId: currentUser!.id, username: currentUser!.username, message: msg, status: 'open', timestamp: Date.now() };
    setAppState(prev => ({ ...prev, reports: [newReport, ...prev.reports] }));
    setIsReporting(false);
    showToast('Issue Dispatched to Admin', 'success');
  };

  const VerifyView = () => {
    const [platform, setPlatform] = useState<Platform>(Platform.INSTAGRAM);
    const initialHandle = currentUser?.savedSocialUsername?.split('/@')[1] || '';
    const [handleInput, setHandleInput] = useState(initialHandle);
    const [links, setLinks] = useState<Record<string, string>>({});

    const handleVerifySubmit = async () => {
      if (!handleInput || selectedVerifyCampaigns.length === 0) return showToast('Fill all details', 'error');
      
      setIsAnalyzing(true);
      // Artificial Delay for "Analysis" feel
      await new Promise(r => setTimeout(r, 2000));
      
      const newSubmissions: Submission[] = selectedVerifyCampaigns.map(cid => {
        const campaign = appState.campaigns.find(c => c.id === cid)!;
        return {
          id: `sub-${Date.now()}-${cid}`,
          userId: currentUser!.id,
          username: currentUser!.username,
          socialUsername: `${platform === Platform.INSTAGRAM ? 'instagram.com/@' : 'facebook.com/@'}${handleInput}`,
          campaignId: cid,
          campaignTitle: campaign.title,
          platform,
          status: SubmissionStatus.PENDING, // Direct to Admin Queue
          timestamp: Date.now(),
          rewardAmount: campaign.basicPay,
          externalLink: links[cid] || ''
        };
      });

      const totalPendingReward = newSubmissions.reduce((acc, s) => acc + s.rewardAmount, 0);

      setAppState(prev => ({
        ...prev,
        submissions: [...newSubmissions, ...prev.submissions],
        users: prev.users.map(u => u.id === currentUser!.id ? {
          ...u,
          pendingBalance: u.pendingBalance + totalPendingReward,
          savedSocialUsername: newSubmissions[0].socialUsername
        } : u)
      }));

      setIsAnalyzing(false);
      showToast('SUBMITTED: Waiting for Admin Audit', 'success');
      setCurrentView('campaigns');
      setSelectedVerifyCampaigns([]);
    };

    return (
      <div className="space-y-10 pb-40 animate-slide">
        {isAnalyzing && (
          <div className="fixed inset-0 z-[300] bg-black/90 flex flex-col items-center justify-center p-10 text-center">
             <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
             <p className="text-cyan-400 font-black uppercase tracking-widest">Uploading Proof to Server...</p>
          </div>
        )}
        <div className="text-center">
          <h2 className="text-4xl font-black italic text-white uppercase">MISSION <span className="text-cyan-400">VERIFY</span></h2>
        </div>
        <div className="px-2 space-y-6">
           <div className="flex gap-4 overflow-x-auto py-2">
              {appState.campaigns.filter(c => c.active).map(c => (
                <div key={c.id} onClick={() => setSelectedVerifyCampaigns(prev => prev.includes(c.id) ? prev.filter(i => i !== c.id) : [...prev, c.id])} 
                     className={`flex-shrink-0 w-28 aspect-[9/16] rounded-3xl overflow-hidden relative border-4 transition-all ${selectedVerifyCampaigns.includes(c.id) ? 'border-cyan-500 scale-105' : 'border-transparent opacity-40'}`}>
                  <img src={c.thumbnailUrl} className="w-full h-full object-cover" />
                </div>
              ))}
           </div>
           <div className="grid grid-cols-2 gap-3 p-1.5 bg-white/5 rounded-[28px]">
              <button onClick={() => setPlatform(Platform.INSTAGRAM)} className={`py-4 rounded-[22px] font-black text-[10px] uppercase ${platform === Platform.INSTAGRAM ? 'bg-cyan-500 text-black' : 'text-slate-500'}`}>Instagram</button>
              <button onClick={() => setPlatform(Platform.FACEBOOK)} className={`py-4 rounded-[22px] font-black text-[10px] uppercase ${platform === Platform.FACEBOOK ? 'bg-cyan-500 text-black' : 'text-slate-500'}`}>Facebook</button>
           </div>
           <input className="w-full bg-white/5 border border-white/10 rounded-[28px] px-8 py-5 text-xl font-black text-white outline-none" placeholder="Social Username" value={handleInput} onChange={e => setHandleInput(e.target.value)} />
           {selectedVerifyCampaigns.map(cid => (
             <input key={cid} className="w-full bg-white/5 border border-white/10 rounded-[24px] px-6 py-4 text-sm font-bold text-white outline-none" 
                    placeholder={`Link for ${appState.campaigns.find(c => c.id === cid)?.title}`} value={links[cid] || ''} onChange={e => setLinks({...links, [cid]: e.target.value})} />
           ))}
           <button onClick={handleVerifySubmit} className="w-full btn-primary py-7 rounded-[40px] font-black uppercase tracking-widest text-lg">SUBMIT PROOF</button>
        </div>
      </div>
    );
  };

  const WalletView = () => {
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const userLogs = useMemo(() => appState.logs.filter(l => l.userId === currentUser?.id), [appState.logs, currentUser]);
    const userMessages = useMemo(() => appState.broadcasts.filter(m => !m.targetUserId || m.targetUserId === currentUser?.id), [appState.broadcasts, currentUser]);

    return (
      <div className="space-y-10 pb-40 animate-slide">
        <h2 className="text-4xl font-black italic px-2 text-white uppercase">CREATOR <span className="text-cyan-400">WALLET</span></h2>
        <div className="glass-panel p-10 rounded-[56px] border-t-8 border-cyan-500">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Available Balance</p>
          <h2 className="text-6xl font-black italic text-white mb-6">₹{currentUser?.walletBalance.toLocaleString()}</h2>
          <div className="flex gap-4">
            <div className="flex-1 p-5 bg-white/5 rounded-3xl text-center"><p className="text-[8px] font-black text-slate-500 uppercase mb-1">Locked (Audit)</p><p className="text-lg font-black text-white">₹{currentUser?.pendingBalance.toLocaleString()}</p></div>
            <div className="flex-1 p-5 bg-white/5 rounded-3xl text-center"><p className="text-[8px] font-black text-slate-500 uppercase mb-1">Total Earned</p><p className="text-lg font-black text-cyan-400">₹{currentUser?.totalEarnings.toLocaleString()}</p></div>
          </div>
        </div>
        
        <div className="flex gap-2 bg-white/5 p-2 rounded-3xl overflow-x-auto">
          {['transactions', 'inbox', 'payment'].map(t => (
            <button key={t} onClick={() => setWalletTab(t as any)} className={`flex-1 px-5 py-3 rounded-2xl text-[9px] font-black uppercase ${walletTab === t ? 'bg-cyan-500 text-black' : 'text-slate-500'}`}>{t}</button>
          ))}
        </div>

        {walletTab === 'transactions' && (
           <div className="space-y-6">
              <div className="glass-panel p-8 rounded-[40px] space-y-4">
                 <input type="number" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-2xl font-black text-cyan-400 outline-none" placeholder="Amount ₹" />
                 <button onClick={() => {
                   const amt = Number(withdrawAmount);
                   if (amt >= 100 && amt <= (currentUser?.walletBalance || 0)) {
                     const req: PayoutRequest = { id: `p-${Date.now()}`, userId: currentUser!.id, username: currentUser!.username, amount: amt, method: currentUser!.payoutMethod || 'UPI', status: PayoutStatus.PENDING, timestamp: Date.now() };
                     setAppState(p => ({...p, payoutRequests: [req, ...p.payoutRequests]}));
                     showToast('Withdrawal Requested', 'success');
                     setWithdrawAmount('');
                   } else showToast('Invalid Amount (Min ₹100)', 'error');
                 }} className="w-full btn-primary py-5 rounded-2xl font-black uppercase text-sm">Withdraw Funds</button>
              </div>
              <div className="space-y-4">
                {userLogs.map(log => (
                  <div key={log.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex justify-between items-center">
                    <p className="text-[10px] font-black text-white uppercase">{log.type}</p>
                    <p className="text-[10px] font-black italic text-cyan-400">{log.message}</p>
                  </div>
                ))}
              </div>
           </div>
        )}

        {walletTab === 'inbox' && (
          <div className="space-y-4">
            {userMessages.map(m => <div key={m.id} className="glass-panel p-6 rounded-3xl border-l-4 border-cyan-500"><p className="text-xs text-white">{m.content}</p></div>)}
          </div>
        )}
      </div>
    );
  };

  const AdminPanel = () => {
    return (
      <div className="space-y-10 pb-40 animate-slide">
        <h2 className="text-4xl font-black italic px-2 text-white uppercase">ADMIN <span className="text-cyan-400">CONTROL</span></h2>
        <div className="flex gap-2 bg-white/5 p-2 rounded-3xl overflow-x-auto">
          {['dashboard', 'member', 'payout', 'message'].map(t => (
            <button key={t} onClick={() => setAdminTab(t as any)} className={`flex-1 px-5 py-3 rounded-2xl text-[9px] font-black uppercase ${adminTab === t ? 'bg-cyan-500 text-black' : 'text-slate-500'}`}>{t}</button>
          ))}
        </div>

        {adminTab === 'dashboard' && (
          <div className="grid grid-cols-2 gap-4">
             <div className="glass-panel p-6 rounded-3xl border-t-4 border-cyan-500"><p className="text-[8px] font-black text-slate-500 uppercase">Total Users</p><p className="text-2xl font-black text-white">{stats.totalUsers}</p></div>
             <div className="glass-panel p-6 rounded-3xl border-t-4 border-green-500"><p className="text-[8px] font-black text-slate-500 uppercase">User Pool</p><p className="text-2xl font-black text-white">₹{stats.totalBalance}</p></div>
             <div className="glass-panel p-6 rounded-3xl border-t-4 border-orange-500"><p className="text-[8px] font-black text-slate-500 uppercase">In Audit</p><p className="text-2xl font-black text-white">₹{stats.totalPending}</p></div>
             <div className="glass-panel p-6 rounded-3xl border-t-4 border-red-500"><p className="text-[8px] font-black text-slate-500 uppercase">Payout Queue</p><p className="text-2xl font-black text-white">₹{stats.withdrawalRequestsAmount}</p></div>
          </div>
        )}

        {adminTab === 'payout' && (
           <div className="space-y-6">
              <div className="flex gap-2 bg-white/5 p-1.5 rounded-2xl">
                <button onClick={() => setPayoutSubTab('payouts')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase ${payoutSubTab === 'payouts' ? 'bg-cyan-500 text-black' : 'text-slate-500'}`}>Withdrawals</button>
                <button onClick={() => setPayoutSubTab('verifications')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase ${payoutSubTab === 'verifications' ? 'bg-cyan-500 text-black' : 'text-slate-500'}`}>Missions</button>
              </div>

              {payoutSubTab === 'verifications' ? (
                appState.submissions.filter(s => s.status === SubmissionStatus.PENDING).map(sub => (
                  <div key={sub.id} className="glass-panel p-6 rounded-3xl space-y-4">
                    <div className="flex justify-between items-center">
                      <div><p className="text-xs font-black text-white">{sub.campaignTitle}</p><p className="text-[8px] text-slate-500 uppercase">@{sub.username}</p></div>
                      <p className="text-lg font-black text-cyan-400">₹{sub.rewardAmount}</p>
                    </div>
                    {sub.externalLink && <button onClick={() => window.open(sub.externalLink, '_blank')} className="text-[8px] text-cyan-500 underline truncate w-full text-left">View Proof Link</button>}
                    <div className="flex gap-2">
                      <button onClick={() => {
                        setAppState(p => ({
                          ...p,
                          submissions: p.submissions.map(s => s.id === sub.id ? {...s, status: SubmissionStatus.APPROVED} : s),
                          users: p.users.map(u => u.id === sub.userId ? {
                            ...u, 
                            walletBalance: u.walletBalance + sub.rewardAmount, 
                            pendingBalance: u.pendingBalance - sub.rewardAmount,
                            totalEarnings: u.totalEarnings + sub.rewardAmount
                          } : u)
                        }));
                        showToast('Mission Approved', 'success');
                      }} className="flex-1 py-3 bg-green-500 text-black rounded-xl text-[9px] font-black uppercase">Approve</button>
                      <button onClick={() => {
                        setAppState(p => ({
                          ...p,
                          submissions: p.submissions.map(s => s.id === sub.id ? {...s, status: SubmissionStatus.REJECTED} : s),
                          users: p.users.map(u => u.id === sub.userId ? {...u, pendingBalance: u.pendingBalance - sub.rewardAmount} : u)
                        }));
                        showToast('Mission Rejected', 'error');
                      }} className="flex-1 py-3 bg-red-500 text-white rounded-xl text-[9px] font-black uppercase">Reject</button>
                    </div>
                  </div>
                ))
              ) : (
                appState.payoutRequests.filter(p => p.status === PayoutStatus.PENDING).map(req => (
                  <div key={req.id} className="glass-panel p-6 rounded-3xl flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                      <p className="text-xl font-black text-white">₹{req.amount}</p>
                      <p className="text-[10px] text-slate-500">@{req.username}</p>
                    </div>
                    <button onClick={() => {
                      setAppState(p => ({
                        ...p,
                        payoutRequests: p.payoutRequests.map(pr => pr.id === req.id ? {...pr, status: PayoutStatus.APPROVED} : pr),
                        users: p.users.map(u => u.id === req.userId ? {...u, walletBalance: u.walletBalance - req.amount} : u)
                      }));
                      showToast('Payout Settled', 'success');
                    }} className="w-full py-3 bg-cyan-500 text-black rounded-xl text-[9px] font-black uppercase">Mark as Paid</button>
                  </div>
                ))
              )}
           </div>
        )}
      </div>
    );
  };

  if (currentView === 'auth') return (
    <div className="min-h-screen bg-black flex items-center justify-center p-10">
      {generatedKey ? (
        <div className="glass-panel p-12 rounded-[56px] text-center space-y-6">
          <h2 className="text-2xl font-black text-cyan-400 uppercase">SECURITY KEY</h2>
          <p className="text-sm text-slate-300">Ise note kar lein password recover karne ke liye:</p>
          <div className="p-6 bg-black/40 rounded-2xl border-2 border-dashed border-cyan-500/30">
            <p className="text-2xl font-black text-white tracking-widest">{generatedKey}</p>
          </div>
          <button onClick={() => {setGeneratedKey(null); setAuthTab('signin');}} className="btn-primary w-full py-5 rounded-2xl font-black uppercase text-sm">Continue</button>
        </div>
      ) : (
        <div className="glass-panel w-full max-w-sm p-12 rounded-[64px] space-y-10 border-t-8 border-cyan-500 shadow-2xl">
          <h1 className="text-5xl font-black italic text-white text-center">REEL<span className="text-cyan-400">EARN</span></h1>
          <div className="flex gap-4 justify-center">
            {['signin', 'signup', 'forgot'].map(t => <button key={t} onClick={() => setAuthTab(t as any)} className={`text-[10px] font-black uppercase ${authTab === t ? 'text-cyan-400' : 'text-slate-700'}`}>{t}</button>)}
          </div>
          <div className="space-y-4">
            <input className="w-full bg-white/5 border border-white/10 rounded-[28px] px-8 py-5 text-white font-black text-center" placeholder="USERNAME" onChange={e => { if(authTab === 'signin' || authTab === 'signup') (e.target.value) }} />
            {authTab === 'signup' && <input className="w-full bg-white/5 border border-white/10 rounded-[28px] px-8 py-5 text-white font-black text-center" placeholder="EMAIL" />}
            <input type="password" className="w-full bg-white/5 border border-white/10 rounded-[28px] px-8 py-5 text-white font-black text-center" placeholder="PASSWORD / KEY" />
            <button onClick={() => {
              const inputs = document.querySelectorAll('input');
              if(authTab === 'signin') handleSignIn(inputs[0].value, inputs[1].value);
              if(authTab === 'signup') handleSignUp(inputs[0].value, inputs[2].value, inputs[1].value);
              if(authTab === 'forgot') handleForgot(inputs[0].value);
            }} className="w-full btn-primary py-7 rounded-[32px] font-black uppercase text-sm">ENTER SYSTEM</button>
          </div>
        </div>
      )}
      {showLockoutModal && (
        <div className="fixed inset-0 z-[300] bg-black/95 flex items-center justify-center p-8">
           <div className="glass-panel p-10 rounded-[48px] text-center space-y-6">
              <h3 className="text-2xl font-black text-red-500 uppercase">TERMINAL LOCKED</h3>
              <p className="text-slate-300">3 galat attempts! 24 ghante ke liye account block hai.</p>
              <button onClick={() => setShowLockoutModal(false)} className="btn-primary w-full py-4 rounded-xl font-black uppercase">OKAY</button>
           </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen pb-40 text-white">
      <Header user={currentUser} onLogout={handleLogout} onNotifyClick={() => {}} onProfileClick={() => setIsProfileOpen(true)} unreadCount={0} />
      {toast && <div className={`fixed top-24 left-8 right-8 z-[200] p-4 rounded-3xl text-center font-black text-[10px] uppercase tracking-widest ${toast.type === 'success' ? 'bg-cyan-600' : 'bg-red-600'}`}>{toast.message}</div>}

      <main className="px-6 py-8 max-w-lg mx-auto">
        {currentView === 'campaigns' && (
          <div className="space-y-8">
            <h2 className="text-3xl font-black italic text-white uppercase">LIVE <span className="text-cyan-400">MISSIONS</span></h2>
            {appState.campaigns.map(c => (
              <div key={c.id} onClick={() => setSelectedCampaign(c)} className="glass-panel rounded-[50px] overflow-hidden aspect-[9/16] relative shadow-2xl">
                <img src={c.thumbnailUrl} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black flex flex-col justify-end p-10">
                   <h3 className="text-3xl font-black uppercase italic text-white">{c.title}</h3>
                   <p className="text-cyan-400 font-black">₹{c.basicPay} Reward</p>
                </div>
              </div>
            ))}
          </div>
        )}
        {currentView === 'verify' && <VerifyView />}
        {currentView === 'wallet' && <WalletView />}
        {currentView === 'admin' && <AdminPanel />}
      </main>

      {selectedCampaign && (
        <div className="fixed inset-0 z-[100] bg-black overflow-y-auto pb-40 p-6">
            <button onClick={() => setSelectedCampaign(null)} className="p-4 bg-white/5 rounded-2xl mb-6"><ICONS.ArrowLeft className="w-6 h-6 text-white" /></button>
            <div className="space-y-8">
                <video src={selectedCampaign.videoUrl} className="w-full rounded-[40px] shadow-2xl" controls autoPlay loop />
                <div className="glass-panel p-8 rounded-[40px] space-y-4">
                   <h2 className="text-2xl font-black text-white uppercase">{selectedCampaign.title}</h2>
                   <p className="text-sm text-slate-400">Caption: {selectedCampaign.caption}</p>
                   <p className="text-sm text-cyan-400">Audio: {selectedCampaign.audioName}</p>
                </div>
                <button onClick={() => { setCurrentView('verify'); setSelectedVerifyCampaigns([selectedCampaign.id]); setSelectedCampaign(null); }} 
                        className="w-full btn-primary py-7 rounded-[40px] font-black uppercase text-lg">Accept & Verify</button>
            </div>
        </div>
      )}

      {isProfileOpen && currentUser && (
        <div className="fixed inset-0 z-[200] bg-black/95 p-8 flex flex-col items-center justify-center">
           <div className="glass-panel p-10 rounded-[56px] w-full max-w-sm text-center space-y-6">
              <div className="w-20 h-20 bg-cyan-500/20 rounded-full mx-auto flex items-center justify-center text-3xl font-black text-cyan-400">{currentUser.username[0]}</div>
              <h2 className="text-2xl font-black text-white">@{currentUser.username}</h2>
              <p className="text-xs text-slate-500">Node ID: {currentUser.id}</p>
              <button onClick={handleLogout} className="w-full py-4 bg-red-600/10 text-red-600 rounded-2xl font-black uppercase text-[10px]">Logout Node</button>
              <button onClick={() => setIsProfileOpen(false)} className="w-full py-4 bg-white/5 text-slate-500 rounded-2xl font-black uppercase text-[10px]">Close</button>
           </div>
        </div>
      )}

      <nav className="fixed bottom-10 left-10 right-10 z-[80]">
        <div className="max-w-md mx-auto glass-panel p-4 rounded-[48px] flex justify-between items-center bg-black/80 backdrop-blur-3xl border border-white/10">
          <button onClick={() => setCurrentView('campaigns')} className={`flex-1 flex flex-col items-center ${currentView === 'campaigns' ? 'text-cyan-400' : 'text-slate-700'}`}> <ICONS.Home className="w-6 h-6" /> </button>
          <button onClick={() => setCurrentView('verify')} className={`flex-1 flex flex-col items-center`}> <div className="bg-cyan-500 p-5 rounded-[24px] -mt-16 text-black shadow-xl"><ICONS.Check className="w-6 h-6" /></div> </button>
          <button onClick={() => setCurrentView(currentUser?.role === UserRole.ADMIN ? 'admin' : 'wallet')} className={`flex-1 flex flex-col items-center ${currentView === (currentUser?.role === UserRole.ADMIN ? 'admin' : 'wallet') ? 'text-cyan-400' : 'text-slate-700'}`}> <ICONS.Wallet className="w-6 h-6" /> </button>
        </div>
      </nav>
    </div>
  );
};

export default App;
