import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI } from "@google/genai";
import { User, Campaign, Submission, UserRole, UserStatus, SubmissionStatus, Platform, AppState, AppLog, PayoutRequest, PayoutStatus, BroadcastMessage, UserReport } from './types';
import { ICONS } from './constants';
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from ".src/firebase";
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
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const INITIAL_DATA: AppState = {
  users: [
    { id: 'admin-1', username: 'admin', password: '123', email: 'admin@reelearn.pro', role: UserRole.ADMIN, status: UserStatus.ACTIVE, walletBalance: 0, pendingBalance: 0, totalEarnings: 0, joinedAt: Date.now(), readBroadcastIds: [], securityKey: 'ADMIN-MASTER' },
    { id: 'user-1', username: 'pro_creator', password: '123', email: 'creator@gmail.com', role: UserRole.USER, status: UserStatus.ACTIVE, walletBalance: 2450.00, pendingBalance: 125.00, totalEarnings: 8900.00, joinedAt: Date.now(), savedSocialUsername: 'instagram.com/@pro_creator', payoutDetails: 'UPI: creator@okaxis', payoutMethod: 'UPI', readBroadcastIds: [], securityKey: 'KEY-CREATOR-99' }
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
    },
    {
      id: 'c-2',
      title: 'Fitness Hustle',
      videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=600',
      caption: 'Grind now, shine later. 💪 #FitnessHustle #ReelEarn',
      hashtags: '#gym #workout #lifestyle #motivation',
      audioName: 'Workout Phonk - Heavy Bass',
      goalViews: 15000,
      goalLikes: 1800,
      basicPay: 45.00,
      viralPay: 180.00,
      active: true,
      bioLink: 'reelearn.vip/mission/fitness-1'
    },
    {
      id: 'c-3',
      title: 'Street Food Hunt',
      videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=600',
      caption: 'Best street food in the city! 🥘🔥 #FoodHunt #ReelEarn',
      hashtags: '#foodie #streetfood #travel #vlog',
      audioName: 'Chill Lo-fi - Food Vibes',
      goalViews: 25000,
      goalLikes: 3000,
      basicPay: 55.00,
      viralPay: 280.00,
      active: true,
      bioLink: 'reelearn.vip/mission/food-1'
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
        
        setAppState(prev => ({
          ...prev,
          users: prev.users.map(us => us.id === user.id ? { ...us, failedAttempts: 0, lockoutUntil: 0 } : us)
        }));
        
        setCurrentUser(user);
        addLog('auth', `Sign-in success: @${user.username}`, user.id, user.username);
        setCurrentView(user.role === UserRole.ADMIN ? 'admin' : 'campaigns');
      } else {
        const newAttempts = (user.failedAttempts || 0) + 1;
        let newLockout = 0;
        const attemptsLeft = 3 - newAttempts;
        
        if (newAttempts >= 3) {
          newLockout = Date.now() + 24 * 60 * 60 * 1000;
          setShowLockoutModal(true);
          addLog('system', `Node lockout: @${user.username} (3 failed attempts)`, user.id, user.username);
          // Simulated Email Dispatch
          console.log(`[EMAIL DISPATCH] To: ${user.email} | Subject: Security Alert | Body: Your ReelEarn terminal has been locked for 24 hours due to 3 failed password attempts. Account secured.`);
        } else {
          showToast(`WRONG PASSWORD. ${newAttempts}/3 Used. ${attemptsLeft} REMAINING.`, 'error');
        }

        setAppState(prev => ({
          ...prev,
          users: prev.users.map(us => us.id === user.id ? { ...us, failedAttempts: newAttempts, lockoutUntil: newLockout } : us)
        }));
      }
    } else {
      showToast('Node Username Not Found', 'error');
    }
  };

  const handleLogout = () => {
    if (currentUser) addLog('auth', `User @${currentUser.username} logged out`, currentUser.id, currentUser.username);
    setCurrentUser(null);
    setCurrentView('auth');
    setIsProfileOpen(false);
  };

  const handleSignUp = (u: string, p: string, e: string) => {
    if (!u || !p || !e) return showToast('All fields required', 'error');
    if (appState.users.find(x => x.username === u)) return showToast('Username already taken', 'error');
    
    const newKey = `RE-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString().slice(-4)}`;
    const newUser: User = {
      id: `u-${Date.now()}`,
      username: u,
      password: p,
      email: e,
      securityKey: newKey,
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      walletBalance: 0,
      pendingBalance: 0,
      totalEarnings: 0,
      joinedAt: Date.now(),
      readBroadcastIds: [],
      failedAttempts: 0,
      lockoutUntil: 0
    };
    setAppState(prev => ({ ...prev, users: [...prev.users, newUser] }));
    setGeneratedKey(newKey);
    showToast('Terminal Initialized', 'success');
  };

  const handleForgot = (key: string) => {
    const user = appState.users.find(u => u.securityKey === key);
    if (user) {
      setRecoveryUser(user);
      setResetData({ username: user.username, password: user.password || '' });
      showToast('Key Verified: Node Access Granted', 'success');
    } else showToast('Invalid Security Key', 'error');
  };

  const handleReportSubmit = (msg: string) => {
    if (!msg.trim()) return showToast('Empty report', 'error');
    const newReport: UserReport = {
      id: `rep-${Date.now()}`,
      userId: currentUser!.id,
      username: currentUser!.username,
      message: msg,
      status: 'open',
      timestamp: Date.now()
    };
    setAppState(prev => ({ ...prev, reports: [newReport, ...prev.reports] }));
    setIsReporting(false);
    showToast('Issue Dispatched to Admin', 'success');
  };

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: 'NONE', color: 'bg-slate-800' };
    let score = 0;
    if (pass.length > 5) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    if (pass.length > 9) score++;
    
    if (score === 1) return { score, label: 'WEAK', color: 'bg-red-500' };
    if (score === 2) return { score, label: 'FAIR', color: 'bg-orange-500' };
    if (score === 3) return { score, label: 'GOOD', color: 'bg-cyan-500' };
    if (score === 4) return { score, label: 'STRONG', color: 'bg-green-500' };
    return { score: 0, label: 'VERY WEAK', color: 'bg-red-600' };
  };

  const PasswordMeter: React.FC<{ pass: string }> = ({ pass }) => {
    const strength = getPasswordStrength(pass);
    if (!pass) return null;
    return (
      <div className="w-full px-2 mt-2 space-y-1 animate-slide">
        <div className="flex justify-between items-center px-1">
          <span className="text-[7px] font-black uppercase text-slate-500">Security Level</span>
          <span className={`text-[7px] font-black uppercase ${strength.label === 'STRONG' ? 'text-green-400' : 'text-slate-400'}`}>{strength.label}</span>
        </div>
        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden flex gap-0.5">
          {[1, 2, 3, 4].map(step => (
            <div key={step} className={`h-full flex-1 transition-all duration-500 ${step <= strength.score ? strength.color : 'bg-transparent'}`} />
          ))}
        </div>
      </div>
    );
  };

  const VerifyView = () => {
    const [platform, setPlatform] = useState<Platform>(Platform.INSTAGRAM);
    const initialHandle = currentUser?.savedSocialUsername?.split('/@')[1] || '';
    const [handleInput, setHandleInput] = useState(initialHandle);
    const [links, setLinks] = useState<Record<string, string>>({});
    const [analysisStep, setAnalysisStep] = useState('');

    const toggleCampaign = (id: string) => {
      setSelectedVerifyCampaigns(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleVerifySubmit = async () => {
      if (!handleInput) return showToast('Username required', 'error');
      if (selectedVerifyCampaigns.length === 0) return showToast('Select mission', 'error');
      const missingLink = selectedVerifyCampaigns.find(id => !links[id] || links[id].trim() === '');
      if (missingLink) return showToast('Link required', 'error');
      
      setIsAnalyzing(true);
      setAnalysisStep("AI INITIALIZING...");
      await new Promise(r => setTimeout(r, 800));
      
      // Detailed Multi-Mission Verification Logic
      let allVerified = true;
      let finalSubmissions: Submission[] = [];
      
      for (const cid of selectedVerifyCampaigns) {
        const campaign = appState.campaigns.find(c => c.id === cid)!;
        setAnalysisStep(`VERIFYING MISSION: ${campaign.title.toUpperCase()}...`);
        
        try {
          const prompt = `
            Verification Task:
            Reel Link: ${links[cid]}
            Target Username: @${handleInput}
            Platform: ${platform}
            Required Audio: ${campaign.audioName}
            Required Caption Keywords: ${campaign.caption}
            
            Actions:
            1. Metadata Check: Is it a valid reel URL?
            2. Username Check: Does the URL contain the correct handle?
            3. AI OCR Simulation: Search for text overlay and caption consistency.
            4. Audio Check: Confirm if target audio track is detected.
            5. Size/Ratio Check: Is it a vertical 9:16 video?
            
            Response Requirement:
            If valid, return ONLY the word "SUCCESS".
            If invalid, return a 1-sentence mistake explanation in Hindi-English (Hinglish).
          `;
          
          const response = await ai.models.generateContent({
             model: 'gemini-3-flash-preview',
             contents: prompt
          });
          
          const result = response.text?.trim().toUpperCase() || "";
          
          if (result.includes("SUCCESS")) {
            finalSubmissions.push({ 
              id: `sub-${Date.now()}-${cid}`, 
              userId: currentUser!.id, 
              username: currentUser!.username, 
              socialUsername: `${platform === Platform.INSTAGRAM ? 'instagram.com/@' : 'facebook.com/@'}${handleInput}`, 
              campaignId: cid, 
              campaignTitle: campaign.title, 
              platform, 
              status: SubmissionStatus.PENDING, 
              timestamp: Date.now(), 
              rewardAmount: campaign.basicPay,
              externalLink: links[cid]
            });
          } else {
            allVerified = false;
            showToast(`${campaign.title}: ${response.text}`, 'error');
            break; 
          }
        } catch (err) {
          console.error("AI Verify Error:", err);
          showToast("AI Timeout. Manual submission queue used.", 'error');
          allVerified = false;
          break;
        }
      }

      if (allVerified && finalSubmissions.length > 0) {
        setAnalysisStep("LOGGING PAYOUT DATA...");
        await new Promise(r => setTimeout(r, 600));
        
        setAppState(prev => ({ 
          ...prev, 
          submissions: [...finalSubmissions, ...prev.submissions], 
          users: prev.users.map(u => u.id === currentUser!.id ? { 
            ...u, 
            pendingBalance: u.pendingBalance + (finalSubmissions.reduce((acc, s) => acc + s.rewardAmount, 0)), 
            savedSocialUsername: finalSubmissions[0].socialUsername
          } : u) 
        }));

        addLog('verify', `AI-Verified ${finalSubmissions.length} missions for @${handleInput}`, currentUser?.id, currentUser?.username);
        showToast('VERIFIED: Sent to Payout Queue', 'success'); 
        setCurrentView('campaigns'); 
        setSelectedVerifyCampaigns([]);
      }
      
      setIsAnalyzing(false);
    };

    return (
      <div className="space-y-10 pb-40 animate-slide">
        {isAnalyzing && (
          <div className="fixed inset-0 z-[300] bg-black/90 flex flex-col items-center justify-center p-10 text-center animate-pulse">
             <div className="w-24 h-24 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-8"></div>
             <p className="text-xl font-black italic text-cyan-400 uppercase tracking-widest leading-none">{analysisStep}</p>
             <p className="text-[10px] text-slate-500 mt-4 uppercase font-black">Scanning Metadata & AI OCR...</p>
          </div>
        )}
        <div className="text-center"><h2 className="text-4xl font-black italic tracking-tighter text-white uppercase italic">MISSION <span className="text-cyan-400">VERIFY</span></h2><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1 italic">Audit Submission</p></div>
        <div className="space-y-4 px-2">
           <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-2 italic">1. Selection</p>
           <div className="flex gap-4 overflow-x-auto hide-scrollbar py-2 px-2">
              {appState.campaigns.filter(c => c.active).map(c => (
                <div key={c.id} onClick={() => toggleCampaign(c.id)} className={`flex-shrink-0 w-28 aspect-[9/16] rounded-3xl overflow-hidden relative border-4 transition-all ${selectedVerifyCampaigns.includes(c.id) ? 'border-cyan-500 scale-105 shadow-[0_0_20px_rgba(0,210,255,0.4)]' : 'border-transparent opacity-40'}`}>
                  <img src={c.thumbnailUrl} className="w-full h-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-2"><p className="text-[7px] font-black text-white italic truncate">{c.title.toUpperCase()}</p></div>
                </div>
              ))}
           </div>
        </div>
        <div className="px-2 space-y-8">
           <div className="space-y-6">
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-2 italic">2. Creator Profile</p>
              <div className="grid grid-cols-2 gap-3 p-1.5 bg-white/5 rounded-[28px] border border-white/5">
                 <button onClick={() => setPlatform(Platform.INSTAGRAM)} className={`py-4 rounded-[22px] font-black text-[10px] uppercase ${platform === Platform.INSTAGRAM ? 'bg-cyan-500 text-black shadow-lg' : 'text-slate-500'}`}>Instagram</button>
                 <button onClick={() => setPlatform(Platform.FACEBOOK)} className={`py-4 rounded-[22px] font-black text-[10px] uppercase ${platform === Platform.FACEBOOK ? 'bg-cyan-500 text-black shadow-lg' : 'text-slate-500'}`}>Facebook</button>
              </div>
              <input className="w-full bg-white/5 border border-white/10 rounded-[28px] px-8 py-5 text-xl font-black italic text-white outline-none focus:border-cyan-500 placeholder:text-slate-800" placeholder="Username (no @)" value={handleInput} onChange={e => setHandleInput(e.target.value)} />
           </div>
           {selectedVerifyCampaigns.length > 0 && (
             <div className="space-y-4 animate-slide">
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-2 italic">3. URL Link Verification</p>
                {selectedVerifyCampaigns.map(cid => (
                    <div key={cid} className="space-y-2">
                       <p className="text-[8px] font-black text-cyan-500 uppercase px-4 italic">{appState.campaigns.find(c => c.id === cid)?.title}</p>
                       <input className="w-full bg-white/5 border border-white/10 rounded-[24px] px-6 py-4 text-sm font-bold text-white outline-none focus:border-cyan-500 shadow-md" placeholder="Paste Full URL..." value={links[cid] || ''} onChange={e => setLinks({...links, [cid]: e.target.value})} />
                    </div>
                ))}
             </div>
           )}
           <button onClick={handleVerifySubmit} className="w-full btn-primary py-7 rounded-[40px] font-black uppercase tracking-[0.4em] text-lg shadow-2xl active:scale-95 transition-all">START VERIFICATION</button>
        </div>
      </div>
    );
  };

  const WalletView = () => {
    const userLogs = useMemo(() => appState.logs.filter(l => l.userId === currentUser?.id && (l.type === 'verify' || l.type === 'viral' || l.type === 'payout')), [appState.logs, currentUser]);
    const userMessages = useMemo(() => appState.broadcasts.filter(m => !m.targetUserId || m.targetUserId === currentUser?.id), [appState.broadcasts, currentUser]);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [paymentSettings, setPaymentSettings] = useState({ method: currentUser?.payoutMethod || 'UPI', details: currentUser?.payoutDetails || '' });
    const [viralLink, setViralLink] = useState('');
    const [selectedCampaignForViral, setSelectedCampaignForViral] = useState('');

    const handleWithdrawal = () => {
      const amount = Number(withdrawAmount);
      if (!amount || amount < appState.config.minWithdrawal) return showToast(`Min withdrawal ₹${appState.config.minWithdrawal}`, 'error');
      if (amount > currentUser!.walletBalance) return showToast('Insufficient balance', 'error');
      const req: PayoutRequest = { id: `p-${Date.now()}`, userId: currentUser!.id, username: currentUser!.username, amount, method: currentUser!.payoutDetails || 'UPI', status: PayoutStatus.PENDING, timestamp: Date.now() };
      setAppState(p => ({...p, payoutRequests: [req, ...p.payoutRequests]}));
      addLog('payout', `Requested withdrawal ₹${amount}`, currentUser?.id, currentUser?.username);
      setWithdrawAmount(''); showToast('Payout Request Logged', 'success');
    };

    return (
      <div className="space-y-10 pb-40 animate-slide">
        <h2 className="text-4xl font-black italic px-2 text-white uppercase leading-none italic">CREATOR<br/><span className="text-cyan-400">WALLET</span></h2>
        <div className="glass-panel p-10 rounded-[56px] border-t-8 border-cyan-500 shadow-2xl">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 italic">Available Balance</p>
          <h2 className="text-6xl font-black italic text-white mb-6">₹{currentUser?.walletBalance.toLocaleString()}</h2>
          <div className="flex gap-4">
            <div className="flex-1 p-5 bg-white/5 rounded-3xl text-center"><p className="text-[8px] font-black text-slate-500 uppercase mb-1">Locked (Audit)</p><p className="text-lg font-black text-white italic">₹{currentUser?.pendingBalance.toLocaleString()}</p></div>
            <div className="flex-1 p-5 bg-white/5 rounded-3xl text-center"><p className="text-[8px] font-black text-slate-500 uppercase mb-1">Total Earned</p><p className="text-lg font-black text-cyan-400 italic">₹{currentUser?.totalEarnings.toLocaleString()}</p></div>
          </div>
        </div>
        <div className="flex gap-2 bg-white/5 p-2 rounded-3xl border border-white/10 overflow-x-auto hide-scrollbar">
          {['transactions', 'inbox', 'payment', 'viral'].map(t => (
            <button key={t} onClick={() => setWalletTab(t as any)} className={`whitespace-nowrap flex-1 px-5 py-3 rounded-2xl text-[9px] font-black uppercase transition-all ${walletTab === t ? 'bg-cyan-500 text-black shadow-lg' : 'text-slate-500'}`}>{t.toUpperCase()}</button>
          ))}
        </div>
        {walletTab === 'transactions' && (
           <div className="space-y-8">
              <div className="glass-panel p-10 rounded-[56px] space-y-6 shadow-2xl">
                 <h3 className="text-xl font-black text-white uppercase italic">Withdraw Capital</h3>
                 <div className="space-y-4">
                    <input type="number" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-2xl font-black text-cyan-400 italic outline-none shadow-inner" placeholder="Amount ₹" />
                    <button onClick={handleWithdrawal} className="w-full btn-primary py-6 rounded-[28px] font-black uppercase text-sm shadow-xl active:scale-95">Confirm Withdrawal</button>
                 </div>
              </div>
              <div className="space-y-4">
                 <h3 className="text-xl font-black italic px-2 text-white italic">Terminal Records</h3>
                 {userLogs.map(log => (
                    <div key={log.id} className="flex justify-between items-center p-6 bg-white/5 rounded-3xl border border-white/5 animate-slide">
                       <div><p className="text-[10px] font-black text-white italic uppercase leading-none">{log.type}</p><p className="text-[8px] font-bold text-slate-600 mt-1">{new Date(log.timestamp).toLocaleDateString()}</p></div>
                       <p className={`text-xs font-black italic ${log.type === 'payout' ? 'text-red-400' : 'text-cyan-400'}`}>{log.message}</p>
                    </div>
                 ))}
              </div>
              <button onClick={() => setIsReporting(true)} className="w-full py-5 rounded-3xl bg-red-600/10 text-red-600 font-black uppercase text-[10px] border border-red-600/20 active:scale-95 transition-all">REPORT A TERMINAL ISSUE</button>
           </div>
        )}
        {walletTab === 'inbox' && (
          <div className="space-y-4 animate-slide">
            <h3 className="text-xl font-black italic px-2 text-white italic uppercase">Directives</h3>
            {userMessages.map(m => ( <div key={m.id} className="glass-panel p-6 rounded-[32px] border-l-4 border-l-cyan-500"><p className="text-xs text-white leading-relaxed">{m.content}</p></div> ))}
            {userMessages.length === 0 && <p className="text-center py-20 text-slate-700 font-black uppercase text-[10px]">No new messages</p>}
          </div>
        )}
        {walletTab === 'payment' && (
          <div className="glass-panel p-10 rounded-[56px] space-y-6 animate-slide">
             <h3 className="text-xl font-black text-white italic uppercase">Settlement Terminal</h3>
             <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2"> {['UPI', 'BANK', 'USDT'].map(m => <button key={m} onClick={() => setPaymentSettings({...paymentSettings, method: m as any})} className={`py-3 rounded-xl font-black text-[9px] uppercase ${paymentSettings.method === m ? 'bg-cyan-500 text-black shadow-md' : 'bg-white/5 text-slate-500'}`}>{m}</button>)} </div>
                <input value={paymentSettings.details} onChange={e => setPaymentSettings({...paymentSettings, details: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none shadow-inner" placeholder="Enter Settlement Handle/Details..." />
                <button onClick={() => { setAppState(p => ({...p, users: p.users.map(u => u.id === currentUser!.id ? {...u, payoutDetails: paymentSettings.details, payoutMethod: paymentSettings.method as any} : u)})); showToast('Payment Details Updated', 'success'); }} className="w-full btn-primary py-6 rounded-[28px] font-black uppercase text-sm shadow-xl">Update Node Config</button>
             </div>
          </div>
        )}
        {walletTab === 'viral' && (
          <div className="glass-panel p-10 rounded-[56px] space-y-6 shadow-2xl animate-slide">
             <h3 className="text-xl font-black italic text-white italic uppercase tracking-tighter">Viral Bonus Claim</h3>
             <div className="space-y-4">
                <select value={selectedCampaignForViral} onChange={e => setSelectedCampaignForViral(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white outline-none"> <option value="" className="bg-black">CHOOSE TARGET CAMPAIGN</option> {appState.campaigns.map(c => <option key={c.id} value={c.id} className="bg-black">{c.title}</option>)} </select>
                <input value={viralLink} onChange={e => setViralLink(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none" placeholder="Viral Reel URL (Min 20k Views)" />
                <button onClick={() => { if(!viralLink || !selectedCampaignForViral) return showToast('Information incomplete','error'); setAppState(p => ({...p, submissions: [{id: `v-${Date.now()}`, userId: currentUser!.id, username: currentUser!.username, socialUsername: currentUser?.savedSocialUsername || '', campaignId: selectedCampaignForViral, campaignTitle: 'Viral Claim Audit', platform: Platform.INSTAGRAM, status: SubmissionStatus.VIRAL_CLAIM, timestamp: Date.now(), rewardAmount: appState.campaigns.find(c => c.id === selectedCampaignForViral)?.viralPay || 0, externalLink: viralLink}, ...p.submissions]})); setViralLink(''); showToast('Viral Claim Logged for Audit','success'); }} className="w-full btn-primary py-6 rounded-[28px] font-black uppercase text-sm">Submit Viral Audit</button>
             </div>
          </div>
        )}
      </div>
    );
  };

  const AdminPanel = () => {
    const [broadcastMsg, setBroadcastMsg] = useState('');
    const [targetId, setTargetId] = useState('');
    const [videoBase64, setVideoBase64] = useState('');
    const [thumbBase64, setThumbBase64] = useState('');

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>, type: 'video' | 'thumb') => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (type === 'video') setVideoBase64(reader.result as string);
          else setThumbBase64(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    };

    const handleCreateCampaign = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault(); 
      const formData = new FormData(e.currentTarget); 
      const newCampaign: Campaign = { 
        id: editingCampaign ? editingCampaign.id : `c-${Date.now()}`, 
        title: formData.get('title') as string, 
        videoUrl: videoBase64 || (formData.get('videoUrl') as string) || '', 
        thumbnailUrl: thumbBase64 || (formData.get('thumbnailUrl') as string) || '', 
        caption: formData.get('caption') as string, 
        hashtags: (formData.get('hashtags') as string) || '#viral', 
        audioName: formData.get('audioName') as string, 
        goalViews: Number(formData.get('goalViews')), 
        goalLikes: Number(formData.get('goalLikes')), 
        basicPay: Number(formData.get('basicPay')), 
        viralPay: Number(formData.get('viralPay')), 
        active: true, 
        bioLink: (formData.get('bioLink') as string) || '' 
      };
      
      setAppState(p => ({
        ...p, 
        campaigns: editingCampaign ? p.campaigns.map(c => c.id === editingCampaign.id ? newCampaign : c) : [...p.campaigns, newCampaign]
      })); 
      showToast(editingCampaign ? 'Mission Updated' : 'Mission Launched', 'success'); 
      setEditingCampaign(null); 
      setVideoBase64(''); 
      setThumbBase64('');
    };

    return (
      <div className="space-y-10 pb-40 animate-slide">
        <h2 className="text-4xl font-black italic px-2 text-white uppercase leading-none italic">ADMIN<br/><span className="text-cyan-400">COMMAND</span></h2>
        <div className="flex gap-2 bg-white/5 p-2 rounded-3xl border border-white/10 overflow-x-auto hide-scrollbar sticky top-0 z-[95] backdrop-blur-md">
          {['dashboard', 'member', 'campaign', 'cashflow', 'payout', 'message', 'reports'].map(t => (
            <button key={t} onClick={() => setAdminTab(t as any)} className={`whitespace-nowrap flex-1 px-5 py-3 rounded-2xl text-[9px] font-black uppercase transition-all ${adminTab === t ? 'bg-cyan-500 text-black shadow-lg' : 'text-slate-500'}`}>{t.toUpperCase()}</button>
          ))}
        </div>
        
        {adminTab === 'dashboard' && (
          <div className="space-y-6 animate-slide">
            <div className="grid grid-cols-2 gap-4">
               <div className="glass-panel p-6 rounded-[32px] border-t-4 border-cyan-500 shadow-xl"><p className="text-[8px] font-black text-slate-500 uppercase italic">Total Active Nodes</p><p className="text-2xl font-black text-white italic">{stats.totalUsers}</p></div>
               <div className="glass-panel p-6 rounded-[32px] border-t-4 border-green-500 shadow-xl"><p className="text-[8px] font-black text-slate-500 uppercase italic">User Wallet Pool</p><p className="text-2xl font-black text-white italic">₹{stats.totalBalance.toLocaleString()}</p></div>
               <div className="glass-panel p-6 rounded-[32px] border-t-4 border-orange-500 shadow-xl"><p className="text-[8px] font-black text-slate-500 uppercase italic">Capital In Audit</p><p className="text-2xl font-black text-white italic">₹{stats.totalPending.toLocaleString()}</p></div>
               <div className="glass-panel p-6 rounded-[32px] border-t-4 border-red-500 shadow-xl"><p className="text-[8px] font-black text-slate-500 uppercase italic">Withdrawal Queue</p><p className="text-2xl font-black text-white italic">₹{stats.withdrawalRequestsAmount.toLocaleString()}</p></div>
            </div>
            <div className="glass-panel p-10 rounded-[48px] border-l-8 border-cyan-500 shadow-[0_20px_60px_rgba(0,0,0,0.5)] relative overflow-hidden"><p className="text-[10px] font-black text-slate-500 uppercase mb-2 italic">Remaining Network Liquidity</p><h2 className="text-5xl font-black italic text-cyan-400">₹{stats.cashflowRemaining.toLocaleString()}</h2><p className="text-[8px] font-black text-slate-700 uppercase mt-4">Node Capacity Cap: ₹{stats.cashflowLimit.toLocaleString()}</p></div>
          </div>
        )}
        
        {adminTab === 'member' && (
           <div className="space-y-6 animate-slide"> {appState.users.filter(u => u.role !== UserRole.ADMIN).map(u => (
              <div key={u.id} className="glass-panel p-8 rounded-[40px] space-y-4 shadow-xl border border-white/5">
                 <div className="flex justify-between items-center" onClick={() => setSelectedUserDetail(u)}>
                    <div className="flex items-center gap-4"><div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center font-black text-cyan-400 border border-white/5 text-lg shadow-inner">{u.username[0].toUpperCase()}</div><div><p className="text-sm font-black text-white italic">@{u.username}</p><p className={`text-[8px] font-black uppercase tracking-widest ${u.status === UserStatus.ACTIVE ? 'text-green-500' : 'text-red-500'}`}>{u.status}</p></div></div>
                    <p className="font-black text-white italic text-lg">₹{u.walletBalance.toLocaleString()}</p>
                 </div>
                 <div className="flex gap-2 pt-2">
                    <button onClick={() => setAppState(p => ({...p, users: p.users.map(us => us.id === u.id ? {...us, status: us.status === UserStatus.ACTIVE ? UserStatus.SUSPENDED : UserStatus.ACTIVE} : us)}))} className={`flex-1 py-3 rounded-xl text-[8px] font-black uppercase transition-all ${u.status === UserStatus.ACTIVE ? 'bg-red-500/10 text-red-500' : 'bg-green-500 text-black shadow-lg'}`}>{u.status === UserStatus.ACTIVE ? 'Suspend' : 'Activate'}</button>
                    <button onClick={() => setAppState(p => ({...p, users: p.users.map(us => us.id === u.id ? {...us, status: UserStatus.BANNED} : us)}))} className="flex-1 py-3 bg-red-600/20 text-red-600 rounded-xl text-[8px] font-black uppercase border border-red-600/20 active:scale-95">Ban User</button>
                 </div>
              </div> ))} </div>
        )}
        
        {adminTab === 'campaign' && (
           <div className="space-y-8 animate-slide">
              <div className="glass-panel p-8 rounded-[40px] space-y-6 border-t-4 border-cyan-500 shadow-2xl">
                  <h3 className="text-xl font-black text-white italic uppercase">{editingCampaign ? 'Update Mission' : 'New Mission Launch'}</h3>
                  <form onSubmit={handleCreateCampaign} className="space-y-4">
                      <input name="title" defaultValue={editingCampaign?.title} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:border-cyan-500 transition-all shadow-inner" placeholder="TARGET MISSION TITLE" />
                      
                      <div className="grid grid-cols-2 gap-4"> 
                        <div className="space-y-2">
                           <input name="videoUrl" defaultValue={editingCampaign?.videoUrl} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white shadow-inner" placeholder="VIDEO URL (MP4)" />
                           <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex flex-col gap-1">
                              <p className="text-[7px] text-slate-600 uppercase font-black px-1">Or Upload Video</p>
                              <input type="file" accept="video/*" onChange={e => handleFile(e, 'video')} className="text-[8px] text-slate-400 file:bg-cyan-500 file:border-none file:rounded-lg file:text-[8px] file:font-black file:px-2 file:py-1 cursor-pointer" />
                           </div>
                        </div>
                        <div className="space-y-2">
                           <input name="thumbnailUrl" defaultValue={editingCampaign?.thumbnailUrl} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white shadow-inner" placeholder="THUMB URL (JPG)" />
                           <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex flex-col gap-1">
                              <p className="text-[7px] text-slate-600 uppercase font-black px-1">Or Upload Thumb</p>
                              <input type="file" accept="image/*" onChange={e => handleFile(e, 'thumb')} className="text-[8px] text-slate-400 file:bg-cyan-500 file:border-none file:rounded-lg file:text-[8px] file:font-black file:px-2 file:py-1 cursor-pointer" />
                           </div>
                        </div>
                      </div>

                      <input name="audioName" defaultValue={editingCampaign?.audioName} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white shadow-inner" placeholder="REQUIRED AUDIO TRACK" />
                      
                      <div className="grid grid-cols-2 gap-4"> 
                        <input type="number" name="goalViews" defaultValue={editingCampaign?.goalViews} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white shadow-inner" placeholder="Viral View Criteria" />
                        <input type="number" name="goalLikes" defaultValue={editingCampaign?.goalLikes} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white shadow-inner" placeholder="Viral Like Criteria" /> 
                      </div>

                      <div className="grid grid-cols-2 gap-4"> 
                        <input name="hashtags" defaultValue={editingCampaign?.hashtags} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white shadow-inner" placeholder="HASHTAGS (#viral #reels)" />
                        <input name="bioLink" defaultValue={editingCampaign?.bioLink} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white shadow-inner" placeholder="BIO LINK URL" /> 
                      </div>

                      <div className="grid grid-cols-2 gap-4"> <input type="number" name="basicPay" defaultValue={editingCampaign?.basicPay} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-black text-cyan-400 shadow-inner" placeholder="Basic Reward ₹" /><input type="number" name="viralPay" defaultValue={editingCampaign?.viralPay} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-black text-cyan-400 shadow-inner" placeholder="Viral Bonus ₹" /> </div>
                      <textarea name="caption" defaultValue={editingCampaign?.caption} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white h-20 resize-none shadow-inner" placeholder="MANDATORY DIRECTIVES"></textarea>
                      <button type="submit" className="w-full btn-primary py-6 rounded-[24px] font-black uppercase text-sm shadow-xl active:scale-95 transition-all">Activate Network Mission</button>
                  </form>
              </div>
              <div className="space-y-4">
                {appState.campaigns.map(c => ( <div key={c.id} className="glass-panel p-4 rounded-[32px] flex justify-between items-center shadow-lg border border-white/5"><div className="flex items-center gap-4"><img src={c.thumbnailUrl} className="w-12 h-12 rounded-xl object-cover" /><p className="text-xs font-black text-white italic">{c.title.toUpperCase()}</p></div><div className="flex gap-2"><button onClick={() => setEditingCampaign(c)} className="text-[8px] font-black uppercase text-cyan-400 hover:scale-110 transition-all">Edit</button><button onClick={() => setAppState(p => ({...p, campaigns: p.campaigns.map(cp => cp.id === c.id ? {...cp, active: !cp.active} : cp)}))} className={`text-[8px] font-black uppercase transition-all ${c.active ? 'text-orange-400' : 'text-green-400'}`}>{c.active ? 'Suspend' : 'Activate'}</button><button onClick={() => setAppState(p => ({...p, campaigns: p.campaigns.filter(cp => cp.id !== c.id)}))} className="text-red-600 active:scale-90"><ICONS.X className="w-4 h-4" /></button></div></div> ))}
              </div>
           </div>
        )}
        
        {adminTab === 'cashflow' && (
           <div className="space-y-10 animate-slide">
              <div className="glass-panel p-10 rounded-[48px] border-t-8 border-cyan-500 space-y-8 shadow-2xl">
                 <h3 className="text-2xl font-black text-white text-center italic uppercase tracking-tighter">Liquidity & Burn Config</h3>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-6 bg-white/5 rounded-3xl border border-white/5 text-center shadow-inner"><p className="text-[8px] font-black text-slate-500 uppercase mb-1 italic">Total Daily Cap</p><p className="text-xl font-black text-white italic">₹{appState.cashflow.dailyLimit.toLocaleString()}</p></div>
                    <div className="p-6 bg-white/5 rounded-3xl border border-white/5 text-center shadow-inner"><p className="text-[8px] font-black text-slate-500 uppercase mb-1 italic">Locked for Audit</p><p className="text-xl font-black text-orange-400 italic">₹{stats.pendingCashflow.toLocaleString()}</p></div>
                 </div>
                 <div className="p-10 bg-black/20 rounded-3xl border border-white/5 text-center shadow-2xl border-cyan-500/20"><p className="text-[10px] font-black text-slate-500 uppercase mb-2 italic">Network Available Burn</p><p className="text-5xl font-black text-cyan-400 italic">₹{stats.cashflowRemaining.toLocaleString()}</p></div>
                 <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-600 uppercase px-4 italic">Modify System Threshold (₹)</p>
                    <input type="number" value={appState.cashflow.dailyLimit} onChange={e => setAppState(p => ({...p, cashflow: {...p.cashflow, dailyLimit: Number(e.target.value)}}))} className="w-full bg-black/60 border border-white/10 rounded-[28px] px-8 py-5 text-2xl font-black text-cyan-400 outline-none text-center shadow-inner focus:border-cyan-500/50" />
                    <button className="w-full btn-primary py-7 rounded-[32px] font-black uppercase text-sm shadow-2xl active:scale-95 transition-all" onClick={() => { showToast('Liquidity Profile Synchronized','success'); addLog('admin', `Daily Liquidity updated to ₹${appState.cashflow.dailyLimit}`); }}>Sync System Threshold</button>
                 </div>
              </div>
           </div>
        )}
        
        {adminTab === 'payout' && (
           <div className="space-y-6 animate-slide">
              <div className="flex gap-2 bg-white/5 p-1.5 rounded-[24px] border border-white/5 shadow-inner backdrop-blur-md">
                <button onClick={() => setPayoutSubTab('payouts')} className={`flex-1 py-3 rounded-2xl font-black text-[10px] uppercase transition-all ${payoutSubTab === 'payouts' ? 'bg-cyan-500 text-black shadow-lg' : 'text-slate-500'}`}>Node Settlements</button>
                <button onClick={() => setPayoutSubTab('verifications')} className={`flex-1 py-3 rounded-2xl font-black text-[10px] uppercase transition-all ${payoutSubTab === 'verifications' ? 'bg-cyan-500 text-black shadow-lg' : 'text-slate-500'}`}>Mission Verification</button>
              </div>
              
              {payoutSubTab === 'payouts' ? (
                <div className="space-y-4">
                   {appState.payoutRequests.filter(p => p.status === PayoutStatus.PENDING).map(r => (
                      <div key={r.id} className="glass-panel p-6 rounded-[32px] flex flex-col gap-4 shadow-xl border border-white/5 animate-slide">
                         <div className="flex justify-between items-center" onClick={() => setSelectedUserDetail(appState.users.find(u => u.id === r.userId) || null)}>
                            <div><p className="text-xl font-black text-white italic tracking-tighter">₹{r.amount.toLocaleString()}</p><p className="text-[8px] text-slate-500 uppercase font-black tracking-widest">@{r.username} • {r.method}</p></div>
                            <div className="w-10 h-10 bg-cyan-500/10 rounded-full flex items-center justify-center border border-cyan-500/20"><ICONS.ArrowLeft className="w-4 h-4 text-cyan-500 rotate-180" /></div>
                         </div>
                         <div className="flex gap-2">
                            <button onClick={() => { setAppState(p => ({...p, payoutRequests: p.payoutRequests.map(pr => pr.id === r.id ? {...pr, status: PayoutStatus.APPROVED} : pr), users: p.users.map(u => u.id === r.userId ? {...u, walletBalance: u.walletBalance - r.amount} : u)})); addLog('payout', `Settled ₹${r.amount} for @${r.username}`, r.userId, r.username); showToast('Settlement Finalized','success'); }} className="flex-1 py-3 bg-green-500 text-black rounded-xl text-[9px] font-black uppercase shadow-lg active:scale-95 transition-all">Authorize Settlement</button>
                            <button onClick={() => { setAppState(p => ({...p, payoutRequests: p.payoutRequests.map(pr => pr.id === r.id ? {...pr, status: PayoutStatus.REJECTED} : pr)})); showToast('Rejected & Logged', 'error'); }} className="flex-1 py-3 bg-white/5 text-red-500 rounded-xl text-[9px] font-black uppercase border border-red-500/10 active:scale-95">Decline</button>
                         </div>
                      </div>
                   ))}
                   {appState.payoutRequests.filter(p => p.status === PayoutStatus.PENDING).length === 0 && <p className="text-center py-24 text-slate-800 font-black uppercase text-[10px] tracking-[0.4em] italic opacity-40">Settlement Hub Idle</p>}
                </div>
              ) : (
                <div className="space-y-4">
                  {appState.submissions.filter(s => s.status === SubmissionStatus.PENDING || s.status === SubmissionStatus.VIRAL_CLAIM).map(sub => (
                    <div key={sub.id} className="glass-panel p-6 rounded-[32px] space-y-4 border border-white/5 shadow-xl animate-slide">
                       <div className="flex justify-between items-center" onClick={() => setSelectedUserDetail(appState.users.find(u => u.id === sub.userId) || null)}>
                          <div className="max-w-[70%]"><p className="text-xs font-black text-white italic uppercase tracking-tighter truncate">{sub.campaignTitle}</p><p className="text-[8px] text-slate-500 uppercase font-black">@{sub.username} • {sub.platform}</p></div>
                          <p className={`text-lg font-black italic ${sub.status === SubmissionStatus.VIRAL_CLAIM ? 'text-cyan-400' : 'text-slate-200'}`}>₹{sub.rewardAmount}</p>
                       </div>
                       {sub.externalLink && <div className="p-3 bg-black/40 rounded-xl border border-white/5 overflow-hidden"><p className="text-[7px] text-cyan-400 font-bold truncate italic cursor-pointer" onClick={() => window.open(sub.externalLink, '_blank')}>{sub.externalLink}</p></div>}
                       <div className="flex gap-2">
                          <button onClick={() => { setAppState(p => ({...p, submissions: p.submissions.map(s => s.id === sub.id ? {...s, status: SubmissionStatus.APPROVED} : s), users: p.users.map(u => u.id === sub.userId ? {...u, walletBalance: u.walletBalance + sub.rewardAmount, pendingBalance: u.pendingBalance - sub.rewardAmount, totalEarnings: u.totalEarnings + sub.rewardAmount} : u)})); addLog('verify', `Mission Verified for @${sub.username} (+₹${sub.rewardAmount})`, sub.userId, sub.username); showToast('Audit Verified: Capital Unlocked','success'); }} className="flex-1 py-3 bg-cyan-500 text-black rounded-xl text-[9px] font-black uppercase shadow-lg shadow-cyan-500/20 active:scale-95">Approve & Settle</button>
                          <button onClick={() => { setAppState(p => ({...p, submissions: p.submissions.map(s => s.id === sub.id ? {...s, status: SubmissionStatus.REJECTED} : s), users: p.users.map(u => u.id === sub.userId ? {...u, pendingBalance: u.pendingBalance - sub.rewardAmount} : u)})); showToast('Submission Rejected', 'error'); }} className="flex-1 py-3 bg-white/5 text-red-500 rounded-xl text-[9px] font-black uppercase border border-red-500/10 active:scale-95">Reject Proof</button>
                       </div>
                    </div>
                  ))}
                  {appState.submissions.filter(s => s.status === SubmissionStatus.PENDING || s.status === SubmissionStatus.VIRAL_CLAIM).length === 0 && <p className="text-center py-24 text-slate-800 font-black uppercase text-[10px] tracking-[0.4em] italic opacity-40">Audit Records Clear</p>}
                </div>
              )}
           </div>
        )}
        
        {adminTab === 'reports' && (
          <div className="space-y-4 animate-slide">
            <h3 className="text-xl font-black text-white italic px-2 tracking-tighter uppercase">Incident Reports (Inbox)</h3>
            {appState.reports.map(r => (
              <div key={r.id} className="glass-panel p-6 rounded-[32px] border-l-4 border-l-red-500 space-y-2 shadow-2xl animate-slide relative group" onClick={() => setSelectedUserDetail(appState.users.find(u => u.id === r.userId) || null)}>
                 <div className="flex justify-between items-center"><p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Incident @{r.username}</p><p className="text-[8px] text-slate-500 font-bold">{new Date(r.timestamp).toLocaleString()}</p></div>
                 <p className="text-sm text-white italic leading-relaxed font-medium">"{r.message}"</p>
                 <button onClick={(e) => { e.stopPropagation(); setAppState(p => ({...p, reports: p.reports.filter(rp => rp.id !== r.id)})); showToast('Incident Resolved', 'success'); }} className="text-[8px] font-black uppercase text-green-400 mt-4 tracking-widest bg-green-400/5 px-4 py-2 rounded-lg border border-green-400/10 hover:bg-green-400 hover:text-black transition-all">Mark as Resolved</button>
                 <div className="absolute top-4 right-4 text-slate-800 opacity-0 group-hover:opacity-100 transition-opacity"><ICONS.Users className="w-4 h-4" /></div>
              </div>
            ))}
            {appState.reports.length === 0 && <p className="text-center py-24 text-slate-800 font-black uppercase text-[10px] tracking-widest italic opacity-40">Inbox Clear</p>}
          </div>
        )}
        
        {adminTab === 'message' && (
          <div className="space-y-8 animate-slide">
            <div className="glass-panel p-10 rounded-[48px] border-t-8 border-cyan-500 space-y-6 shadow-2xl">
               <h3 className="text-xl font-black italic text-white italic uppercase tracking-tighter">Directive Dispatch</h3>
               <div className="space-y-4">
                  <select value={targetId} onChange={e => setTargetId(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white outline-none shadow-inner focus:border-cyan-500">
                     <option value="" className="bg-black">Target Mode: BROADCAST (NETWORK)</option>
                     {appState.users.filter(u => u.role !== UserRole.ADMIN).map(u => <option key={u.id} value={u.id} className="bg-black">Target Node: @{u.username}</option>)}
                  </select>
                  <textarea value={broadcastMsg} onChange={e => setBroadcastMsg(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white h-32 resize-none outline-none focus:border-cyan-500 transition-all shadow-inner" placeholder="Enter directive content..."></textarea>
                  <button onClick={() => { if (!broadcastMsg) return showToast('Empty directive', 'error'); const msg: BroadcastMessage = { id: `m-${Date.now()}`, content: broadcastMsg, senderId: currentUser!.id, targetUserId: targetId || undefined, timestamp: Date.now() }; setAppState(p => ({...p, broadcasts: [msg, ...p.broadcasts]})); setBroadcastMsg(''); showToast('Directive Dispatched Successfully','success'); }} className="w-full btn-primary py-7 rounded-[24px] font-black uppercase text-sm shadow-xl active:scale-95 transition-all">Launch Dispatch</button>
               </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const AuthView = () => {
    const [u, setU] = useState(''); const [p, setP] = useState(''); const [e, setE] = useState(''); const [k, setK] = useState('');
    if (generatedKey) return (
      <div className="min-h-screen bg-black flex items-center justify-center p-10 dark-mesh overflow-hidden animate-slide">
        <div className="glass-panel w-full max-w-sm p-12 rounded-[56px] space-y-8 text-center relative border-t-8 border-cyan-500 shadow-[0_0_80px_rgba(0,210,255,0.1)]">
           <div className="w-20 h-20 bg-cyan-500/10 rounded-full mx-auto flex items-center justify-center text-cyan-500 shadow-2xl border border-cyan-500/20"><ICONS.Check className="w-10 h-10" /></div>
           <h2 className="text-2xl font-black text-cyan-400 italic uppercase tracking-tighter">RECOVERY SECURITY KEY</h2>
           <p className="text-sm text-slate-300 font-medium leading-relaxed italic">IMPORTANT! Isko note karke rakhe kahi pe. This unique key is required for forgotten credential recovery. Admin cannot recover your password without this.</p>
           <div className="p-7 bg-black/40 rounded-3xl border-2 border-dashed border-cyan-500/30 group active:scale-95 transition-all cursor-pointer shadow-inner" onClick={() => {navigator.clipboard.writeText(generatedKey); showToast('Security Key Copied','success')}}>
              <p className="text-2xl font-black tracking-widest text-white italic select-all">{generatedKey}</p>
              <p className="text-[8px] font-black text-slate-600 mt-2 uppercase tracking-[0.2em] italic">Tap to Copy Security Key</p>
           </div>
           <button onClick={() => { setGeneratedKey(null); setAuthTab('signin'); }} className="w-full btn-primary py-7 rounded-[32px] font-black uppercase text-sm shadow-2xl active:scale-95 transition-all">I HAVE NOTED THE KEY, CONTINUE</button>
        </div>
      </div>
    );
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-10 dark-mesh overflow-hidden">
        <div className="glass-panel w-full max-w-sm p-12 rounded-[64px] space-y-10 relative border-t-8 border-cyan-500 shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-hidden animate-slide">
          <div className="text-center space-y-4 relative z-10">
             <h1 className="brand-font text-5xl font-black italic tracking-tighter text-white leading-none italic">REEL<span className="text-cyan-400 drop-shadow-[0_0_20px_rgba(0,210,255,0.6)]">EARN</span></h1>
             <div className="flex gap-4 justify-center">
                {['signin', 'signup', 'forgot'].map(t => <button key={t} onClick={() => { setAuthTab(t as any); setRecoveryUser(null); setU(''); setP(''); setE(''); setK(''); }} className={`text-[10px] font-black uppercase tracking-widest italic transition-all ${authTab === t ? 'text-cyan-400 scale-110' : 'text-slate-700 hover:text-slate-500'}`}>{t.toUpperCase()}</button>)}
             </div>
          </div>
          <div className="space-y-5 relative z-10">
            {authTab === 'signin' && ( <>
               <input className="w-full bg-white/5 border border-white/10 rounded-[28px] px-8 py-5 text-white font-black text-center text-lg placeholder:text-slate-800 italic outline-none shadow-inner" placeholder="TERMINAL ID" value={u} onChange={ev => setU(ev.target.value)} />
               <input type="password" className="w-full bg-white/5 border border-white/10 rounded-[28px] px-8 py-5 text-white font-black text-center text-lg placeholder:text-slate-800 italic outline-none shadow-inner" placeholder="AUTHENTICATION KEY" value={p} onChange={ev => setP(ev.target.value)} />
               <PasswordMeter pass={p} />
               <button onClick={() => handleSignIn(u, p)} className="w-full btn-primary py-7 rounded-[32px] font-black uppercase text-sm shadow-2xl active:scale-95 transition-all">INITIALIZE NODE</button>
            </> )}
            {authTab === 'signup' && ( <>
               <input className="w-full bg-white/5 border border-white/10 rounded-[28px] px-8 py-5 text-white font-black text-center text-sm placeholder:text-slate-800 italic outline-none shadow-inner" placeholder="CHOOSE NODE USERNAME" value={u} onChange={ev => setU(ev.target.value)} />
               <input className="w-full bg-white/5 border border-white/10 rounded-[28px] px-8 py-5 text-white font-black text-center text-sm placeholder:text-slate-800 italic outline-none shadow-inner" placeholder="NODE EMAIL" value={e} onChange={ev => setE(ev.target.value)} />
               <input type="password" className="w-full bg-white/5 border border-white/10 rounded-[28px] px-8 py-5 text-white font-black text-center text-sm placeholder:text-slate-800 italic outline-none shadow-inner" placeholder="SECURE PASSWORD" value={p} onChange={ev => setP(ev.target.value)} />
               <PasswordMeter pass={p} />
               <button onClick={() => handleSignUp(u, p, e)} className="w-full btn-primary py-7 rounded-[32px] font-black uppercase text-sm shadow-2xl active:scale-95 transition-all">CREATE NETWORK TERMINAL</button>
            </> )}
            {authTab === 'forgot' && (
              recoveryUser ? (
                <div className="space-y-5 animate-slide">
                  <p className="text-[10px] text-center text-cyan-400 font-black uppercase italic tracking-widest leading-relaxed">Security Verified: Reset Credentials</p>
                  <input className="w-full bg-white/5 border border-white/10 rounded-[28px] px-8 py-5 text-white font-black text-center text-sm placeholder:text-slate-800 italic outline-none shadow-inner" placeholder="NEW TERMINAL ID" value={resetData.username} onChange={e => setResetData({...resetData, username: e.target.value})} />
                  <input type="password" className="w-full bg-white/5 border border-white/10 rounded-[28px] px-8 py-5 text-white font-black text-center text-sm placeholder:text-slate-800 italic outline-none shadow-inner" placeholder="NEW AUTH KEY" value={resetData.password} onChange={e => setResetData({...resetData, password: e.target.value})} />
                  <PasswordMeter pass={resetData.password} />
                  <button onClick={() => {
                    if (!resetData.username || !resetData.password) return showToast('Fields required', 'error');
                    setAppState(prev => ({ ...prev, users: prev.users.map(u => u.id === recoveryUser.id ? { ...u, username: resetData.username, password: resetData.password, failedAttempts: 0, lockoutUntil: 0 } : u) }));
                    setRecoveryUser(null); setAuthTab('signin'); showToast('Node credentials updated', 'success');
                  }} className="w-full btn-primary py-7 rounded-[32px] font-black uppercase text-sm shadow-2xl active:scale-95 transition-all">SYNCHRONIZE DATA</button>
                </div>
              ) : (
                <>
                  <p className="text-[10px] text-center text-slate-500 font-bold italic uppercase tracking-widest leading-relaxed">Input your private security key to recover node access credentials</p>
                  <input className="w-full bg-white/5 border border-white/10 rounded-[28px] px-8 py-5 text-white font-black text-center text-sm placeholder:text-slate-800 italic outline-none shadow-inner focus:border-cyan-500/50" placeholder="SECURITY KEY" value={k} onChange={ev => setK(ev.target.value)} />
                  <button onClick={() => handleForgot(k)} className="w-full btn-primary py-7 rounded-[32px] font-black uppercase text-sm shadow-2xl active:scale-95 transition-all">RECOVER NODE DATA</button>
                </>
              )
            )}
          </div>
          <p className="text-center text-[7px] text-slate-800 uppercase font-black tracking-[0.4em] opacity-30 italic">Encrypted Connection Secure</p>
        </div>
      </div>
    );
  };

  const UserDetailOverlay = () => {
    if (!selectedUserDetail) return null;
    const personalLogs = appState.logs.filter(l => l.userId === selectedUserDetail.id && (l.type === 'verify' || l.type === 'viral' || l.type === 'payout'));
    return (
      <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-3xl flex flex-col p-8 overflow-y-auto animate-slide">
        <div className="flex justify-between items-center mb-10">
          <button onClick={() => setSelectedUserDetail(null)} className="w-fit p-4 bg-white/5 rounded-2xl active:scale-90 transition-all border border-white/5"><ICONS.ArrowLeft className="w-6 h-6 text-white" /></button>
          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">Node Dossier Intelligence</span>
        </div>
        <div className="glass-panel p-10 rounded-[64px] border-t-8 border-cyan-500 shadow-2xl space-y-10 relative">
            <div className="text-center space-y-2">
                <div className="w-24 h-24 bg-cyan-500/10 rounded-full mx-auto flex items-center justify-center text-5xl font-black text-cyan-400 border border-cyan-500/20 shadow-[0_0_50px_rgba(0,210,255,0.1)] mb-4">{selectedUserDetail.username.charAt(0).toUpperCase()}</div>
                <h2 className="text-3xl font-black italic text-white tracking-tighter leading-none italic">@{selectedUserDetail.username}</h2>
                <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${selectedUserDetail.status === UserStatus.ACTIVE ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>{selectedUserDetail.status}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="p-6 bg-white/5 rounded-3xl text-center shadow-inner"><p className="text-[8px] font-black text-slate-500 uppercase mb-1 tracking-widest italic">Capital Balance</p><p className="text-xl font-black text-white italic">₹{selectedUserDetail.walletBalance.toLocaleString()}</p></div>
                <div className="p-6 bg-white/5 rounded-3xl text-center shadow-inner"><p className="text-[8px] font-black text-slate-500 uppercase mb-1 tracking-widest italic">Mission Total</p><p className="text-xl font-black text-cyan-400 italic">₹{selectedUserDetail.totalEarnings.toLocaleString()}</p></div>
            </div>
            <div className="space-y-4"> 
              <h3 className="text-xl font-black text-white italic uppercase px-2 tracking-tighter">Node Activity Log</h3> 
              <div className="space-y-3">
                {personalLogs.length === 0 ? <p className="text-center text-[8px] text-slate-700 uppercase font-black italic py-12 opacity-40">Zero audit entries for this terminal</p> : personalLogs.map(log => ( 
                  <div key={log.id} className="p-5 bg-white/5 rounded-2xl border border-white/5 flex justify-between items-center animate-slide shadow-md"> 
                    <div><p className="text-[9px] font-black text-white italic uppercase tracking-tighter leading-none">{log.type}</p><p className="text-[7px] text-slate-600 mt-1 font-bold">{new Date(log.timestamp).toLocaleDateString()}</p></div> 
                    <p className={`text-[10px] font-black italic ${log.type === 'payout' ? 'text-red-400' : 'text-cyan-400'}`}>{log.message}</p> 
                  </div> 
                ))} 
              </div>
            </div>
        </div>
      </div>
    );
  };

  const ReportingOverlay = () => {
    const [msg, setMsg] = useState('');
    if (!isReporting) return null;
    return (
      <div className="fixed inset-0 z-[250] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-8 animate-slide">
         <div className="glass-panel w-full max-w-sm p-10 rounded-[48px] border-t-8 border-red-600 space-y-8 shadow-[0_0_100px_rgba(255,0,0,0.15)] relative">
            <h3 className="text-2xl font-black text-white italic text-center uppercase tracking-tighter">Terminal Incident</h3>
            <p className="text-[9px] text-center text-slate-500 font-bold uppercase tracking-widest leading-relaxed italic">Detail your issue for rapid network-admin resolution</p>
            <textarea value={msg} onChange={ev => setMsg(ev.target.value)} className="w-full h-32 bg-white/5 border border-white/10 rounded-3xl p-6 text-sm text-white outline-none resize-none shadow-inner focus:border-red-600/50 transition-all" placeholder="Message content..."></textarea>
            <div className="flex gap-4 pt-4">
               <button onClick={() => setIsReporting(false)} className="flex-1 py-4 bg-white/5 rounded-2xl font-black text-[10px] uppercase text-slate-500 border border-white/5 active:scale-95 transition-all">Cancel</button>
               <button onClick={() => handleReportSubmit(msg)} className="flex-1 py-4 btn-primary rounded-2xl font-black text-[10px] uppercase text-black shadow-2xl shadow-red-600/20 active:scale-95 transition-all">Report Issue</button>
            </div>
         </div>
      </div>
    );
  };

  const MyProfileOverlay = () => {
    const [showKey, setShowKey] = useState(false);
    if (!isProfileOpen || !currentUser) return null;
    return (
      <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-3xl flex flex-col p-8 overflow-y-auto animate-slide">
        <div className="flex justify-between items-center mb-10">
          <button onClick={() => setIsProfileOpen(false)} className="w-fit p-4 bg-white/5 rounded-2xl active:scale-90 transition-all border border-white/5 shadow-md"><ICONS.ArrowLeft className="w-6 h-6 text-white" /></button>
          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">Personal Node Config</span>
        </div>
        <div className="glass-panel p-10 rounded-[64px] border-t-8 border-cyan-500 shadow-2xl space-y-8 relative">
            <div className="text-center space-y-3">
                <div className="w-24 h-24 bg-cyan-500/10 rounded-full mx-auto flex items-center justify-center text-5xl font-black text-cyan-400 border border-cyan-500/20 shadow-2xl mb-2">{currentUser.username.charAt(0).toUpperCase()}</div>
                <h2 className="text-3xl font-black italic text-white tracking-tighter leading-none italic">@{currentUser.username}</h2>
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">{currentUser.email}</p>
            </div>
            
            <div className="space-y-6 pt-4">
               <div className="space-y-1">
                  <p className="text-[8px] font-black text-slate-600 uppercase italic px-2 tracking-widest">Node Recovery Key</p>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex justify-between items-center shadow-inner group">
                     <p className="text-sm font-black text-white italic tracking-widest">{showKey ? currentUser.securityKey : '••••••••••••••••'}</p>
                     <button onClick={() => setShowKey(!showKey)} className="text-cyan-500 active:scale-90 transition-all"><ICONS.Eye className="w-5 h-5" /></button>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                     <p className="text-[8px] font-black text-slate-600 uppercase italic px-2 tracking-widest">Linked Handle</p>
                     <div className="bg-white/5 border border-white/10 rounded-2xl p-4 shadow-inner"><p className="text-[10px] font-black text-white truncate italic">{currentUser.savedSocialUsername || 'Not Linked'}</p></div>
                  </div>
                  <div className="space-y-1">
                     <p className="text-[8px] font-black text-slate-600 uppercase italic px-2 tracking-widest">Node ID</p>
                     <div className="bg-white/5 border border-white/10 rounded-2xl p-4 shadow-inner"><p className="text-[10px] font-black text-white truncate italic">{currentUser.id}</p></div>
                  </div>
               </div>

               <div className="space-y-1">
                  <p className="text-[8px] font-black text-slate-600 uppercase italic px-2 tracking-widest">Settlement Terminal</p>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-inner">
                     <p className="text-[10px] font-black text-white italic uppercase tracking-tighter">{currentUser.payoutMethod || 'None'} • {currentUser.payoutDetails || 'No details set'}</p>
                  </div>
               </div>

               <div className="pt-4 flex flex-col gap-3">
                  <button onClick={handleLogout} className="w-full py-5 bg-red-600/10 text-red-600 border border-red-600/20 rounded-[28px] font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all">Deactivate Node Session</button>
                  <p className="text-center text-[7px] text-slate-800 font-black uppercase italic tracking-[0.4em]">Node Active Since {new Date(currentUser.joinedAt).toLocaleDateString()}</p>
               </div>
            </div>
        </div>
      </div>
    );
  };

  const LockoutModal = () => {
    if (!showLockoutModal) return null;
    return (
      <div className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-8 animate-slide">
         <div className="glass-panel w-full max-w-sm p-12 rounded-[56px] border-t-8 border-red-600 space-y-8 text-center shadow-2xl relative">
            <div className="w-20 h-20 bg-red-600/10 rounded-full mx-auto flex items-center justify-center text-red-600 border border-red-600/20 animate-pulse">
               <ICONS.X className="w-10 h-10" />
            </div>
            <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">Terminal Locked</h3>
            <p className="text-sm text-slate-300 font-medium leading-relaxed italic">
              Aapne 3 baar galat password enter kiya hai. Security reasons ki wajah se aapka account block kar diya gaya hai.
              <br/><br/>
              <span className="text-red-500 font-black uppercase tracking-widest">24hr baad hi password Dale.</span>
            </p>
            <button onClick={() => setShowLockoutModal(false)} className="w-full btn-primary py-7 rounded-[32px] font-black uppercase text-sm shadow-2xl active:scale-95 transition-all">OKAY</button>
         </div>
      </div>
    );
  };

  if (currentView === 'auth') return <><AuthView /><LockoutModal /></>;

  return (
    <div className="min-h-screen pb-40 text-white selection:bg-cyan-500/30">
      <Header 
        user={currentUser} 
        onLogout={handleLogout} 
        onNotifyClick={() => { if(currentUser?.role === UserRole.ADMIN) { setAdminTab('reports'); setCurrentView('admin'); } else { setWalletTab('inbox'); setCurrentView('wallet'); } }} 
        onProfileClick={() => setIsProfileOpen(true)}
        unreadCount={currentUser?.role === UserRole.ADMIN ? appState.reports.length : appState.broadcasts.length} 
      />
      {toast && <div className={`fixed top-24 left-8 right-8 z-[200] p-6 rounded-[32px] shadow-2xl font-black text-[10px] text-center border border-white/10 ${toast.type === 'success' ? 'bg-cyan-600' : 'bg-red-600'} animate-slide tracking-widest uppercase`}>{toast.message}</div>}

      <main className="px-6 py-8 max-w-lg mx-auto">
        {currentView === 'campaigns' && (
          <div className="space-y-10 pb-20">
            <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none italic">LIVE<br/><span className="text-cyan-400">MISSIONS</span></h2>
            {appState.campaigns.filter(c => c.active).map(c => (
              <div key={c.id} onClick={() => setSelectedCampaign(c)} className="glass-panel rounded-[56px] overflow-hidden relative group aspect-[9/16] shadow-[0_40px_100px_rgba(0,0,0,0.6)] cursor-pointer border border-white/5">
                <img src={c.thumbnailUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[4000ms]" />
                <div className="absolute top-6 left-6 flex flex-col gap-2 z-20">
                   <div className="bg-black/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 shadow-xl"><p className="text-[8px] font-black text-slate-500 uppercase italic">Basic Reward</p><p className="text-xl font-black text-white italic leading-tight">₹{c.basicPay.toLocaleString()}</p></div>
                   <div className="bg-cyan-500/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-xl border border-white/20"><p className="text-[8px] font-black text-black/60 uppercase italic">Viral Bonus Pool</p><p className="text-xl font-black text-black italic leading-tight">₹{c.viralPay.toLocaleString()}</p></div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent flex flex-col justify-end p-10 space-y-2">
                   <h3 className="text-3xl font-black italic uppercase text-white tracking-tighter leading-none italic drop-shadow-lg">{c.title}</h3>
                   <div className="flex gap-4"> <p className="text-[9px] font-black text-slate-400 uppercase italic tracking-[0.2em]">{c.goalViews.toLocaleString()} Views Goal</p> <p className="text-[9px] font-black text-slate-400 uppercase italic tracking-[0.2em]">{c.goalLikes.toLocaleString()} Likes Goal</p> </div>
                </div>
              </div> ))}
          </div>
        )}
        {currentView === 'verify' && <VerifyView />}
        {currentView === 'wallet' && <WalletView />}
        {currentView === 'admin' && <AdminPanel />}
      </main>

      {/* Mission Detail Overlay */}
      {selectedCampaign && (
        <div className="fixed inset-0 z-[100] bg-black overflow-y-auto pb-40 animate-slide">
            <div className="px-6 py-5 sticky top-0 bg-black/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between z-50"> <button onClick={() => setSelectedCampaign(null)} className="p-4 bg-white/5 rounded-2xl transition-all active:scale-90 border border-white/10"><ICONS.ArrowLeft className="w-6 h-6 text-white" /></button> <h2 className="font-black text-lg text-white italic uppercase tracking-tighter italic">Mission Plan</h2> <div className="w-10"></div> </div>
            <div className="max-w-lg mx-auto p-6 space-y-8">
                <div className="bg-slate-900 rounded-[48px] overflow-hidden border-2 border-white/5 shadow-2xl aspect-video relative group"><video src={selectedCampaign.videoUrl} className="w-full h-full object-cover" controls autoPlay loop /></div>
                <div className="space-y-6">
                   <div className="glass-panel border border-white/10 rounded-[32px] p-8 space-y-6 shadow-2xl">
                      {selectedCampaign.bioLink && ( <div> <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 italic">Official Link Page</p> <div className="flex justify-between items-center bg-cyan-500/10 p-5 rounded-2xl border border-cyan-500/20 active:scale-95 transition-all" onClick={() => {navigator.clipboard.writeText(selectedCampaign.bioLink!); showToast('Asset Link Copied','success')}}> <p className="text-cyan-400 font-black text-xs italic truncate pr-4">{selectedCampaign.bioLink}</p><ICONS.Copy className="w-4 h-4 text-cyan-400" /> </div> </div> )}
                      <div className="h-px bg-white/5"></div>
                      <div><p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 italic">Audio Audit Key</p><p className="text-sm italic font-black text-cyan-400 uppercase tracking-widest">{selectedCampaign.audioName}</p></div>
                      <div className="h-px bg-white/5"></div>
                      <div className="grid grid-cols-2 gap-4"> <div className="bg-white/5 p-5 rounded-3xl border border-white/5 shadow-inner"><p className="text-[8px] font-black text-slate-500 uppercase mb-1 italic">Viral Views Threshold</p><p className="text-xl font-black text-white italic">{selectedCampaign.goalViews.toLocaleString()}+</p></div> <div className="bg-white/5 p-5 rounded-3xl border border-white/5 shadow-inner"><p className="text-[8px] font-black text-slate-500 uppercase mb-1 italic">Viral Likes Threshold</p><p className="text-xl font-black text-white italic">{selectedCampaign.goalLikes.toLocaleString()}+</p></div> </div>
                      <div className="h-px bg-white/5"></div>
                      <div> <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 italic">Mission Mandatory Directives</p> <p className="text-sm italic text-slate-300 leading-relaxed font-medium">"{selectedCampaign.caption}"</p> <button className="text-cyan-400 text-[9px] font-black uppercase mt-4 tracking-widest flex items-center gap-2 bg-cyan-500/10 px-6 py-3 rounded-xl border border-cyan-500/20 active:scale-95 shadow-lg shadow-cyan-500/5 transition-all" onClick={() => {navigator.clipboard.writeText(selectedCampaign.caption); showToast('Directives Copied','success')}}><ICONS.Copy className="w-3 h-3" /> Copy Directive Text</button> </div>
                   </div>
                   <button onClick={() => { setCurrentView('verify'); setSelectedVerifyCampaigns([selectedCampaign.id]); setSelectedCampaign(null); }} className="w-full btn-primary py-8 rounded-[40px] font-black uppercase tracking-[0.4em] text-lg shadow-2xl active:scale-95 transition-all">Engage Verification</button>
                </div>
            </div>
        </div>
      )}

      <UserDetailOverlay />
      <ReportingOverlay />
      <MyProfileOverlay />

      <nav className="fixed bottom-10 left-10 right-10 z-[80]">
        <div className="max-w-md mx-auto glass-panel p-4 rounded-[48px] flex justify-between items-center border border-white/10 shadow-[0_20px_80px_rgba(0,0,0,0.9)] bg-[#050505]/80 backdrop-blur-3xl border-t-2 border-white/5">
          <button onClick={() => setCurrentView('campaigns')} className={`flex-1 flex flex-col items-center py-3 transition-all ${currentView === 'campaigns' ? 'text-cyan-400 scale-110' : 'text-slate-700 hover:text-slate-500'}`}> <ICONS.Home className="w-7 h-7" /> <span className="text-[9px] font-black uppercase mt-1 italic tracking-widest leading-none">Missions</span> </button>
          <button onClick={() => setCurrentView('verify')} className={`flex-1 flex flex-col items-center py-3 transition-all ${currentView === 'verify' ? 'text-cyan-400 scale-110' : 'text-slate-700 hover:text-slate-500'}`}> <div className="bg-cyan-500 p-6 rounded-[28px] -mt-24 text-black shadow-[0_20px_60px_rgba(0,210,255,0.4)] btn-primary active:scale-90 relative border-4 border-black/50"><ICONS.Check className="w-8 h-8" /></div> <span className="text-[9px] font-black uppercase mt-3 italic tracking-widest leading-none">Verify</span> </button>
          <button onClick={() => setCurrentView(currentUser?.role === UserRole.ADMIN ? 'admin' : 'wallet')} className={`flex-1 flex flex-col items-center py-3 transition-all ${currentView === (currentUser?.role === UserRole.ADMIN ? 'admin' : 'wallet') ? 'text-cyan-400 scale-110' : 'text-slate-700 hover:text-slate-500'}`}> {currentUser?.role === UserRole.ADMIN ? <ICONS.Users className="w-7 h-7" /> : <ICONS.Wallet className="w-7 h-7" />} <span className="text-[9px] font-black uppercase mt-1 italic tracking-widest leading-none">{currentUser?.role === UserRole.ADMIN ? 'Admin Command' : 'Node Wallet'}</span> </button>
        </div>
      </nav>
    </div>
  );
};

export default App;
