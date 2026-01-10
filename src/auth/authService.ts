import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User
} from "firebase/auth";
import { auth } from "../firebase";

export const login = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);

export const signup = (email: string, password: string) =>
  createUserWithEmailAndPassword(auth, email, password);

export const logout = () => signOut(auth);

export const onAuthChange = (cb: (user: User | null) => void) =>
  auth.onAuthStateChanged(cb);
