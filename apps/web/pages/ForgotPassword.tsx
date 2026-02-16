import React, { useState } from "react";
import { Link } from "react-router-dom";
import { KeyRound, Mail, ArrowLeft, CheckCircle, Shield, Lock, RefreshCw, Key } from "lucide-react";
import { BASE_URL } from "../lib/api";

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setFieldError("Please enter your email address");
      return;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFieldError("Please enter a valid email address");
      return;
    }
    setFieldError("");

    setLoading(true);

    try {
      const response = await fetch(`${BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitted(true);
      } else {
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Unable to connect to server. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Shield, title: "Secure Reset", desc: "Encrypted token-based process" },
    { icon: Lock, title: "Time-Limited", desc: "Links expire after 30 minutes" },
    { icon: RefreshCw, title: "One-Time Use", desc: "Each link works only once" },
    { icon: Key, title: "Strong Passwords", desc: "Enforced complexity requirements" },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden bg-gradient-to-br from-primary-dark via-primary to-accent-teal">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute top-1/2 -left-20 w-60 h-60 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
          <div className="absolute -bottom-20 right-1/3 w-72 h-72 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '2s' }} />
        </div>

        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 text-white w-full">
          {/* Logo & Title */}
          <div>
            <div className="flex items-center gap-4 mb-4">
              <img
                src="/logo/AIYA_Logo.png"
                alt="AIYA Logo"
                className="h-14 w-14 rounded-xl shadow-lg shadow-black/20 object-contain bg-white/10 p-2"
              />
              <div>
                <h1 className="text-3xl font-bold tracking-tight">HARI</h1>
                <p className="text-white/70 text-sm">HR Intelligence by AIYA</p>
              </div>
            </div>
          </div>

          {/* Main Message */}
          <div className="flex-1 flex flex-col justify-center max-w-lg">
            <h2 className="text-4xl xl:text-5xl font-bold leading-tight mb-6">
              Secure Password
              <span className="block text-white/90">Recovery</span>
            </h2>
            <p className="text-white/80 text-lg leading-relaxed mb-10">
              Don't worry, it happens to the best of us. We'll help you get back into your account securely.
            </p>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="group bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/15 hover:border-white/20 transition-all duration-300 cursor-default"
                >
                  <feature.icon className="h-8 w-8 text-white mb-3 group-hover:scale-110 transition-transform duration-300" />
                  <h3 className="font-semibold text-sm mb-1">{feature.title}</h3>
                  <p className="text-white/60 text-xs">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="text-white/50 text-sm">
            &copy; 2026 AIYA Technology. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-background-light dark:bg-background-dark">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <img
              src="/logo/AIYA_Logo.png"
              alt="AIYA Logo"
              className="h-12 w-12 rounded-xl shadow-md object-contain"
            />
            <div>
              <h1 className="text-2xl font-bold text-text-light dark:text-text-dark">HARI</h1>
              <p className="text-xs text-text-muted-light dark:text-text-muted-dark">HR Intelligence by AIYA</p>
            </div>
          </div>

          {/* Card */}
          <div className="bg-card-light dark:bg-card-dark rounded-2xl shadow-xl dark:shadow-2xl dark:shadow-black/20 p-8 border border-border-light dark:border-border-dark">
            {!submitted ? (
              <>
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center h-14 w-14 bg-gradient-to-br from-primary to-accent-teal text-white rounded-xl shadow-lg shadow-primary/30 mb-4">
                    <KeyRound size={26} />
                  </div>
                  <h2 className="text-2xl font-bold text-text-light dark:text-text-dark">Forgot Password?</h2>
                  <p className="text-text-muted-light dark:text-text-muted-dark mt-2">
                    Enter your email and we'll send you a reset link
                  </p>
                </div>

                {error && (
                  <div className="bg-accent-red/10 text-accent-red p-4 rounded-xl text-sm mb-6 border border-accent-red/20 animate-slide-in-right">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-2">
                      Email Address
                    </label>
                    <div className="relative group">
                      <Mail
                        className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${fieldError ? "text-accent-red" : "text-text-muted-light dark:text-text-muted-dark group-focus-within:text-primary"}`}
                        size={20}
                      />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setFieldError(""); }}
                        className={`w-full pl-12 pr-4 py-3 bg-background-light dark:bg-background-dark border rounded-xl focus:ring-2 focus:border-transparent outline-none transition-all text-text-light dark:text-text-dark placeholder:text-text-muted-light dark:placeholder:text-text-muted-dark ${fieldError ? "border-accent-red focus:ring-accent-red/30" : "border-border-light dark:border-border-dark focus:ring-primary"}`}
                        placeholder="name@company.com"
                      />
                    </div>
                    {fieldError && (
                      <p className="mt-1.5 text-sm text-accent-red">{fieldError}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full bg-gradient-to-r from-primary to-primary-dark hover:from-primary-hover hover:to-primary text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 transform hover:-translate-y-0.5 ${
                      loading ? "opacity-70 cursor-not-allowed transform-none" : ""
                    }`}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Sending...
                      </span>
                    ) : "Send Reset Link"}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center">
                <div className="inline-flex items-center justify-center h-14 w-14 bg-gradient-to-br from-accent-green to-accent-teal text-white rounded-xl shadow-lg shadow-accent-green/30 mb-4">
                  <CheckCircle size={26} />
                </div>
                <h2 className="text-2xl font-bold text-text-light dark:text-text-dark mb-2">Check Your Email</h2>
                <p className="text-text-muted-light dark:text-text-muted-dark mb-6">
                  If an account exists for <strong className="text-text-light dark:text-text-dark">{email}</strong>,
                  you'll receive a password reset link shortly.
                </p>
                <div className="bg-primary/5 dark:bg-primary/10 p-4 rounded-xl text-sm text-text-muted-light dark:text-text-muted-dark border border-primary/10 mb-6">
                  The link will expire in 30 minutes. Don't forget to check your spam folder.
                </div>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-border-light dark:border-border-dark text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm text-primary font-semibold hover:text-primary-hover transition-colors"
              >
                <ArrowLeft size={16} />
                Back to Sign In
              </Link>
            </div>
          </div>

          {/* Additional Info */}
          <p className="text-center text-xs text-text-muted-light dark:text-text-muted-dark mt-6">
            Secured with 256-bit SSL encryption
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
