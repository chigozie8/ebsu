/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db, isFirebaseConfigured } from "../../config/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { StudentDetails } from "../../models/auth/studentDetails";
import { notifyUser } from "../../helpers/notifyUser";

export const useGetUserInfo = () => {
  const [studentDetails, setStudentDetails] = useState<StudentDetails | null>(
    null
  );
  const [gettingStudentDetails, setGettingStudentDetails] = useState(false);
  const [gettingStudentDetailsErr, setGettingStudentDetailsErr] =
    useState(false);
  
  // Only use auth state if Firebase is configured
  const [user, loading, error] = auth ? useAuthState(auth) : [null, false, undefined];
  const userID = user?.uid;

  useEffect(() => {
    // Only query Firestore if Firebase is configured and we have a user
    if (!isFirebaseConfigured || !db || !userID) {
      return;
    }
    
    const userInfoRef = collection(db, "userInfo");
    setGettingStudentDetails(true);
    const unsubscribe = onSnapshot(
      query(userInfoRef, where("userID", "==", userID)),
      (snapshot) => {
        const userDoc = snapshot.docs[0];
        if (userDoc?.exists()) {
          const userFields = userDoc.data();
          setStudentDetails(userFields as StudentDetails);
          setGettingStudentDetails(false);
        } else {
          console.warn("User document not found");
          setGettingStudentDetails(false);
        }
      },
      (error: any) => {
        setGettingStudentDetails(false);
        setGettingStudentDetailsErr(error);
        notifyUser("error", "Something went wrong.");
      }
    );
    return () => unsubscribe();
  }, [userID]);

  return {
    user,
    userID,
    loading,
    error,
    studentDetails,
    gettingStudentDetails,
    gettingStudentDetailsErr,
  };
};
