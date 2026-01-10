import React from "react";

const ProtectedRoute: React.FC<{
  allow: boolean;
  children: React.ReactNode;
}> = ({ allow, children }) => {
  if (!allow) {
    return <div className="text-red-500 p-6">Access Denied</div>;
  }
  return <>{children}</>;
};

export default ProtectedRoute;
