import React, { useState } from "react";
import { AppState, User, UserRole, UserStatus } from "../types";
import { generateId, isEmpty, now } from "../utils";

interface AuthProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ state, setState, onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  /* ===== LOGIN ===== */
  const handleLogin = () => {
    if (isEmpty(username) || isEmpty(password)) {
      setError("All fields required");
      return;
    }

    const user = state.users.find(
      u => u.username === username && u.password === password
    );

    if (!user) {
      setError("Invalid credentials");
      return;
    }

    if (user.status !== UserStatus.ACTIVE) {
      setError("Account not active");
      return;
    }

    onLogin(user);
  };

  /* ===== SIGNUP ===== */
  const handleSignup = () => {
    if (isEmpty(username) || isEmpty(email) || isEmpty(password)) {
      setError("All fields required");
      return;
    }

    if (state.users.some(u => u.username === username)) {
      setError("Username already exists");
      return;
    }

    const newUser: User = {
      id: generateId("user"),
      username,
      email,
      password,
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      walletBalance: 0,
      pendingBalance: 0,
      totalEarnings: 0,
      joinedAt: now(),
      readBroadcastIds: [],
      failedAttempts: 0,
      lockoutUntil: 0,
      securityKey: generateId("sec"),
    };

    setState(prev => ({
      ...prev,
      users: [...prev.users, newUser],
    }));

    onLogin(newUser);
  };

  /* ===== UI (same as before) ===== */
  return (
    <div className="auth-container">
      <h2>{isLogin ? "Login" : "Sign Up"}</h2>

      <input
        placeholder="Username"
        value={username}
        onChange={e => setUsername(e.target.value)}
      />

      {!isLogin && (
        <input
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
      )}

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />

      {error && <p className="error">{error}</p>}

      <button onClick={isLogin ? handleLogin : handleSignup}>
        {isLogin ? "Login" : "Create Account"}
      </button>

      <p
        style={{ cursor: "pointer" }}
        onClick={() => {
          setIsLogin(!isLogin);
          setError("");
        }}
      >
        {isLogin
          ? "No account? Create one"
          : "Already have an account? Login"}
      </p>
    </div>
  );
};

export default Auth;
