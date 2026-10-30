import React, { useState } from 'react';
import { UserCheck, Mail, Lock, KeyRound, AlertCircle, ArrowLeft, CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthPageProps {
  onSuccess: () => void;
  onBackToLanding: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onSuccess, onBackToLanding }) => {
  const { loginWithGoogle, loginWithGuest, loginWithEmail, registerWithEmail, resetPassword } = useAuth();
  
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const clearState = () => {
    setError(null);
    setSuccessMsg(null);
  };

  const handleGoogleSignIn = async () => {
    try {
      clearState();
      setSubmitting(true);
      await loginWithGoogle();
      onSuccess();
    } catch (err: any) {
      setError(err?.message || 'Failed to sign in with Google');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGuestSignIn = async () => {
    try {
      clearState();
      setSubmitting(true);
      await loginWithGuest();
      onSuccess();
    } catch (err: any) {
      setError(err?.message || 'Failed to sign in as guest');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearState();

    if (mode === 'register') {
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
    }

    setSubmitting(true);
    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
        onSuccess();
      } else if (mode === 'register') {
        await registerWithEmail(email, password);
        onSuccess();
      } else if (mode === 'forgot') {
        await resetPassword(email);
        setSuccessMsg('Password reset link sent to your email.');
      }
    } catch (err: any) {
      const code = err?.code;
      if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
        setError('Invalid email or password credentials');
      } else if (code === 'auth/email-already-in-use') {
        setError('An account already exists with this email');
      } else {
        setError(err?.message || 'Authentication error occurred');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-10 animate-fade-in">
      <div className="glass-panel rounded-3xl p-8 border border-white/10 shadow-2xl relative overflow-hidden space-y-6">
        {/* Subtle background glows */}
        <div className="absolute -top-10 -right-10 w-36 h-36 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="text-center space-y-2">
          <h2 className="font-display text-2xl font-bold tracking-tight text-white">
            {mode === 'login' && 'Welcome Back'}
            {mode === 'register' && 'Create Account'}
            {mode === 'forgot' && 'Reset Password'}
          </h2>
          <p className="text-slate-400 text-xs">
            {mode === 'login' && 'Sign in to access the CircuDesign multi-agent portal.'}
            {mode === 'register' && 'Register to optimize raw BOMs and track carbon footprint.'}
            {mode === 'forgot' && 'Enter your email address to receive a password reset link.'}
          </p>
        </div>

        {/* Alert Error / Success */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="engineer@company.com"
                className="w-full rounded-xl bg-white/5 border border-white/10 pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Password</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => { clearState(); setMode('forgot'); }}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 transition"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl bg-white/5 border border-white/10 pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}

          {mode === 'register' && (
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Confirm Password</label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl bg-white/5 border border-white/10 pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full glass-button flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold text-white shadow-xl hover:scale-[1.01] transition disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin text-white" />
            ) : (
              <>
                {mode === 'login' && 'Sign In'}
                {mode === 'register' && 'Create Account'}
                {mode === 'forgot' && 'Send Reset Email'}
              </>
            )}
          </button>
        </form>

        {/* OAuth & Guest Options */}
        {mode === 'login' && (
          <>
            <div className="relative flex items-center justify-center">
              <div className="border-t border-white/10 w-full" />
              <span className="bg-[#0D1527] px-3 text-[10px] uppercase font-semibold text-slate-500">Or continue with</span>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={submitting}
                className="w-full glass-button flex items-center justify-center gap-3 rounded-xl py-2.5 text-xs font-bold text-white hover:scale-[1.01] transition"
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Google Account</span>
              </button>

              <button
                type="button"
                onClick={handleGuestSignIn}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 py-2.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20 transition"
              >
                <UserCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Guest Mode</span>
              </button>
            </div>
          </>
        )}

        {/* Toggle Mode Footer */}
        <div className="border-t border-white/10 pt-4 flex justify-between items-center text-xs text-slate-400">
          <button
            type="button"
            onClick={onBackToLanding}
            className="flex items-center gap-1 hover:text-white transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Landing Page</span>
          </button>

          {mode === 'login' && (
            <button
              type="button"
              onClick={() => { clearState(); setMode('register'); }}
              className="font-semibold text-cyan-400 hover:text-cyan-300 transition"
            >
              Need an account? Register
            </button>
          )}

          {(mode === 'register' || mode === 'forgot') && (
            <button
              type="button"
              onClick={() => { clearState(); setMode('login'); }}
              className="font-semibold text-cyan-400 hover:text-cyan-300 transition"
            >
              Already registered? Sign in
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
