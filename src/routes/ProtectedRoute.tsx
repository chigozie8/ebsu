/* eslint-disable @typescript-eslint/no-unused-vars */
import { ReactNode, FC, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useGetUserInfo } from "../hooks/auth/useGetUserInfo";
import LogoSpinner from "../components/loaders/FullLogoSpinner";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useGetUserInfo();

  useEffect(() => {
    console.log("[v0] ProtectedRoute - user:", !!user, "loading:", loading);
  }, [user, loading]);

  if (loading) {
    return <LogoSpinner />;
  }

  if (!user) {
    console.log("[v0] ProtectedRoute - No user, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
