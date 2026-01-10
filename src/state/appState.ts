import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { AppState, UserRole, UserStatus } from "../types";

const STATE_DOC = "main_state";

export async function loadAppStateFromFirebase(): Promise<AppState | null> {
  try {
    const snap = await getDoc(doc(db, "appState", STATE_DOC));
    if (snap.exists()) return snap.data() as AppState;
  } catch (e) {
    console.error(e);
  }
  return null;
}

export async function saveAppStateToFirebase(state: AppState) {
  try {
    await setDoc(doc(db, "appState", STATE_DOC), state);
  } catch (e) {
    console.error(e);
  }
}

export const INITIAL_DATA: AppState = {
  users: [
    {
      id: "admin-1",
      username: "admin",
      password: "123",
      email: "admin@reelearn.pro",
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      walletBalance: 0,
      pendingBalance: 0,
      totalEarnings: 0,
      joinedAt: Date.now(),
      readBroadcastIds: [],
      securityKey: "ADMIN-MASTER"
    }
  ],
  campaigns: [],
  submissions: [],
  payoutRequests: [],
  broadcasts: [],
  reports: [],
  cashflow: { dailyLimit: 100000, todaySpent: 0, startDate: "", endDate: "" },
  logs: [],
  config: { minWithdrawal: 100 }
};
