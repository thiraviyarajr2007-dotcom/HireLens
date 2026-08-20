import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  sendPasswordResetEmail 
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

export default function LoginPage({ onNavigate, initialMode = 'login', onAuthSuccess }) {
  const [mode, setMode] = useState(initialMode); // 'login', 'signup', 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email.trim() || (!password.trim() && mode !== 'forgot')) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        const userCred = await signInWithEmailAndPassword(auth, email, password);
        if (onAuthSuccess) onAuthSuccess(userCred.user);
        onNavigate('/dashboard');
      } else if (mode === 'signup') {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        if (onAuthSuccess) onAuthSuccess(userCred.user);
        onNavigate('/dashboard');
      } else if (mode === 'forgot') {
        await sendPasswordResetEmail(auth, email);
        setMessage('Password reset email sent! Check your inbox.');
      }
    } catch (err) {
      console.error('Firebase Auth Error:', err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Invalid email address or password.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email address already exists.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters long.');
      } else {
        setError(err.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (onAuthSuccess) onAuthSuccess(result.user);
      onNavigate('/dashboard');
    } catch (err) {
      console.error('Google Sign-In Error:', err);
      setError('Google Sign-In was cancelled or failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    const demoUser = {
      displayName: 'Demo Recruiter',
      email: 'recruiter@hirelens-ai.com',
      photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    };
    if (onAuthSuccess) onAuthSuccess(demoUser);
    onNavigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#0B1C30] text-white flex flex-col justify-center items-center p-6 relative overflow-hidden font-body-md">
      {/* Background Tech Rings */}
      <div className="absolute inset-0 opacity-10 pointer-events-none flex justify-center items-center">
        <div className="w-[800px] h-[800px] rounded-full border border-primary border-dashed animate-[spin_60s_linear_infinite]"></div>
        <div className="absolute w-[600px] h-[600px] rounded-full border border-cyan-400 border-dashed animate-[spin_40s_linear_infinite_reverse]"></div>
      </div>

      {/* Brand Header */}
      <div className="relative z-10 mb-8 text-center cursor-pointer" onClick={() => onNavigate('/')}>
        <div className="inline-flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>lens_blur</span>
          </div>
          <div className="text-left">
            <h1 className="text-3xl font-display font-bold text-white tracking-tight">HireLens</h1>
            <p className="text-xs font-label-sm text-primary-fixed-dim uppercase tracking-widest">AI Recruitment Intelligence</p>
          </div>
        </div>
      </div>

      {/* Auth Box Container */}
      <div className="relative z-10 w-full max-w-md bg-white text-[#0B1C30] rounded-2xl p-8 shadow-2xl border border-slate-200 space-y-6">
        {/* Toggle Mode Tabs */}
        {mode !== 'forgot' && (
          <div className="flex bg-slate-100 p-1 rounded-xl font-semibold text-xs text-slate-600">
            <button 
              type="button"
              onClick={() => { setMode('login'); setError(''); setMessage(''); }}
              className={`flex-1 py-2.5 rounded-lg transition-all ${
                mode === 'login' ? 'bg-white text-primary shadow font-bold' : 'hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button 
              type="button"
              onClick={() => { setMode('signup'); setError(''); setMessage(''); }}
              className={`flex-1 py-2.5 rounded-lg transition-all ${
                mode === 'signup' ? 'bg-white text-primary shadow font-bold' : 'hover:text-slate-900'
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Title */}
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-display font-bold text-[#0B1C30]">
            {mode === 'login' ? 'Welcome Back' : mode === 'signup' ? 'Get Started with HireLens' : 'Reset Password'}
          </h2>
          <p className="text-xs text-slate-500">
            {mode === 'login' ? 'Sign in to access candidate analyses and rankings' : mode === 'signup' ? 'Create a recruiter workspace for evidence-based hiring' : 'Enter your email to receive a password reset link'}
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-red-600">error</span>
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="p-3.5 rounded-xl bg-green-50 border border-green-200 text-green-700 text-xs font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-green-600">check_circle</span>
            <span>{message}</span>
          </div>
        )}

        {/* Social Google Sign-In (Login / Signup) */}
        {mode !== 'forgot' && (
          <div className="space-y-4">
            <button 
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm transition-all shadow-xs flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="relative flex items-center justify-center">
              <div className="w-full border-t border-slate-200"></div>
              <span className="bg-white px-3 text-xs text-slate-400 uppercase font-semibold relative">Or with email</span>
            </div>
          </div>
        )}

        {/* Email / Password Form */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Full Name</label>
              <input 
                type="text" 
                value={fullName} 
                onChange={(e) => setFullName(e.target.value)} 
                placeholder="Alex Johnson" 
                className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Work Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="recruiter@company.com" 
              required
              className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary"
            />
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Password</label>
                {mode === 'login' && (
                  <button 
                    type="button" 
                    onClick={() => { setMode('forgot'); setError(''); setMessage(''); }}
                    className="text-xs text-primary font-semibold hover:underline"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="••••••••••••" 
                  required
                  className="w-full p-3 pr-10 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <span className="material-symbols-outlined text-lg">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all shadow-md flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">
                  {mode === 'login' ? 'login' : mode === 'signup' ? 'person_add' : 'mail'}
                </span>
                <span>
                  {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
                </span>
              </>
            )}
          </button>
        </form>

        {/* Demo Fast Login Button */}
        <div className="pt-2 border-t border-slate-100 text-center space-y-2">
          <button 
            type="button"
            onClick={handleDemoLogin}
            className="w-full py-2.5 rounded-xl bg-blue-50 text-primary font-bold text-xs hover:bg-blue-100 transition-colors flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">bolt</span>
            <span>Instant Demo Recruiter Login</span>
          </button>
          
          {mode === 'forgot' && (
            <button 
              type="button"
              onClick={() => setMode('login')}
              className="text-xs text-slate-500 hover:text-primary font-semibold block mx-auto"
            >
              ← Back to Sign In
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
