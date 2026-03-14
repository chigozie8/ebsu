import logo from "../../../assets/logo/logo.png";
import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../../config/firebase";
import { Link } from "react-router-dom";
import { Spinner } from "../../../components/loaders/Spinner";
import { notifyUser } from "../../../helpers/notifyUser";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSent(true);
      notifyUser("success", "Password reset email sent! Check your inbox.");
    } catch (error: any) {
      if (error.code === "auth/user-not-found" || error.code === "auth/invalid-email") {
        notifyUser("error", "No account found with that email address.");
      } else {
        notifyUser("error", "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-white">
      <div className="flex items-center justify-center px-4 sm:px-6 py-8 mx-auto h-screen lg:py-0">
        <div className="w-full bg-white rounded-lg shadow border border-gray-200 mt-16 max-w-md sm:max-w-lg xl:p-0">
          <div className="space-y-4 md:space-y-6 p-3 ss:p-6 sm:p-8">
            <div className="flex items-center justify-center flex-col">
              <img className="w-16 h-16 sm:w-20 sm:h-20 mb-3" src={logo} alt="logo" />
              <h1 className="text-base sm:text-md font-bold leading-tight tracking-tight text-gray-900 md:text-[21px]">
                Reset your password
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 text-center mt-1 text-balance">
                Enter your account email and we'll send you a reset link.
              </p>
            </div>

            {sent ? (
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-900 text-center">Check your email</p>
                <p className="text-xs text-gray-500 text-center text-balance">
                  A password reset link has been sent to <span className="font-semibold text-gray-700">{email}</span>. Follow the instructions in the email to reset your password.
                </p>
                <button
                  onClick={() => { setSent(false); setEmail(""); }}
                  className="text-xs font-semibold text-green1 hover:underline"
                >
                  Try a different email
                </button>
              </div>
            ) : (
              <form className="space-y-4 md:space-y-6" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="email" className="block mb-2 text-ss ss:text-sm sm:text-xs font-bold text-gray-900">
                    Email address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-transparent font-medium text-gray-700 border border-gray-300 text-ss ss:text-sm sm:text-xs rounded-lg focus:ring-green1 focus:border-green1 block w-full p-2.5"
                    placeholder="eg. name@gmail.com"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="text-white bg-green1 hover:bg-green1/90 disabled:opacity-60 disabled:cursor-not-allowed font-semibold rounded-lg text-sm sm:text-xs w-fit px-3 ss:px-4 sm:px-5 py-2 ss:py-2.5 flex items-center gap-2"
                >
                  {loading ? (
                    <Spinner className="w-4 h-4 text-transparent animate-spin fill-white" />
                  ) : (
                    "Send reset link"
                  )}
                </button>
              </form>
            )}
          </div>
          <div className="border-t border-t-gray-300 px-6 py-4 sm:px-8">
            <p className="text-ss sm:text-sm font-semibold text-gray-700">
              Remembered your password?{" "}
              <Link to="/login" className="font-semibold text-green1 hover:underline">
                Back to Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
