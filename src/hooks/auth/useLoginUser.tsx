/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { ILoginForm } from "../../models/auth/form";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../config/firebase";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { notifyUser } from "../../helpers/notifyUser";
import { logInSchema } from "../../validation";
import { yupResolver } from "@hookform/resolvers/yup";

export default function useLoginUser() {
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { reset } = useForm<ILoginForm>({ resolver: yupResolver(logInSchema) });

  const loginUser = async (data: ILoginForm) => {
    try {
      setLoading(true);
      const { email, password } = data;
      await signInWithEmailAndPassword(auth, email, password);
      
      // Check for redirect parameter, otherwise go to home
      const redirectUrl = searchParams.get("redirect");
      if (redirectUrl) {
        navigate(redirectUrl);
      } else {
        navigate("/");
      }
      
      reset();
      notifyUser("success", `Login Successful. Good to have you back!`);
    } catch (error: any) {
      const code: string = error?.code ?? "";
      if (
        code === "auth/invalid-credential" ||
        code === "auth/wrong-password" ||
        code === "auth/user-not-found"
      ) {
        notifyUser("error", "Invalid email or password. Please try again.");
      } else if (code === "auth/invalid-email") {
        notifyUser("error", "The email address is not valid.");
      } else if (code === "auth/user-disabled") {
        notifyUser("error", "This account has been disabled. Contact support.");
      } else if (code === "auth/too-many-requests") {
        notifyUser("error", "Too many failed attempts. Please wait and try again.");
      } else if (code === "auth/network-request-failed") {
        notifyUser("error", "Network error. Check your connection and try again.");
      } else {
        notifyUser("error", "Something went wrong. Please try again.");
      }
      setLoading(false);
    }
  };

  return { loginUser, loading };
}
