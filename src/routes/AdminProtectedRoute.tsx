/* eslint-disable @typescript-eslint/no-unused-vars */
import { ReactNode, FC, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useGetUserInfo } from "../hooks/auth/useGetUserInfo";
import LogoSpinner from "../components/loaders/FullLogoSpinner";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";

interface AdminProtectedRouteProps {
  children: ReactNode;
}

const AdminProtectedRoute: FC<AdminProtectedRouteProps> = ({ children }) => {
  const { user, loading, userID } = useGetUserInfo();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (userID) {
        try {
          const adminDoc = await getDoc(doc(db, "admins", userID));
          setIsAdmin(adminDoc.exists());
        } catch (error) {
          console.error("Error checking admin status:", error);
          setIsAdmin(false);
        } finally {
          setCheckingAdmin(false);
        }
      } else if (!loading) {
        setCheckingAdmin(false);
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, [userID, loading]);

  if (loading || checkingAdmin) {
    return <LogoSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" />;
  }

  return <>{children}</>;
};

export default AdminProtectedRoute;
