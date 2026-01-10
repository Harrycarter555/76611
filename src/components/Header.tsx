import React from "react";
import { ICONS } from "../constants";
import { User } from "../types";

const Header: React.FC<any> = ({
  user,
  onLogout,
  onNotifyClick,
  onProfileClick,
  unreadCount
}) => {
  if (!user) return null;

  return (
    <header className="px-6 py-6 flex justify-between items-center">
      <h1>REEL<span className="text-cyan-400">EARN</span></h1>
      <button onClick={onLogout}><ICONS.X /></button>
    </header>
  );
};

export default Header;
