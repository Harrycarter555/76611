import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

export async function getUserProfile(uid: string) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}
