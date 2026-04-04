"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, CheckCircle2, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { useRouter } from "next/navigation";
import { api } from '@openchat/lib';
import { Checkbox, Label } from "@openchat/ui"
import { signupSchema } from "@openchat/lib/validations/auth";
import { useGoogleLogin } from "@react-oauth/google";
import Link from 'next/link';

interface FormErrors {
  name?: string;
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export default function AuthPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [isPending, setIsPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [shake, setShake] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    api(`/auth/me?t=${Date.now()}`, { credentials: "include" })
      .then((res) => res.ok && router.replace("/zone"))
      .catch(() => {});
  }, [router]);

  const redirectToZone = async () => {
    for (let attempt = 0; attempt < 5; attempt++) {
      const res = await api(`/auth/me`, { credentials: "include", cache: "no-store" });
      if (res.ok) {
        window.location.assign("/zone");
        return;
      }
      await new Promise((r) => setTimeout(r, 250));
    }
    throw new Error("Session was not established");
  };

  const validateField = useCallback((name: string, value: string) => {
    const newErrors: FormErrors = { ...errors };
    
    switch (name) {
      case 'name':
        if (value.length < 3) newErrors.name = 'Name must be at least 3 characters';
        else if (value.length > 50) newErrors.name = 'Name must be less than 50 characters';
        else delete newErrors.name;
        break;
      case 'username':
        if (value.length < 3) newErrors.username = 'Username must be at least 3 characters';
        else if (!/^[a-zA-Z0-9_]+$/.test(value)) newErrors.username = 'Only letters, numbers, and underscores allowed';
        else delete newErrors.username;
        break;
      case 'email':
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) newErrors.email = 'Please enter a valid email';
        else delete newErrors.email;
        break;
      case 'password':
        if (value.length < 8) newErrors.password = 'Password must be at least 8 characters';
        else if (!/[A-Z]/.test(value)) newErrors.password = 'Add at least one uppercase letter';
        else if (!/[0-9]/.test(value)) newErrors.password = 'Add at least one number';
        else delete newErrors.password;
        break;
      case 'confirmPassword':
        if (value !== signupData.password) newErrors.confirmPassword = 'Passwords do not match';
        else delete newErrors.confirmPassword;
        break;
    }
    
    setErrors(newErrors);
    return !newErrors[name as keyof FormErrors];
  }, [errors, signupData.password]);

  const handleBlur = (field: string, value: string) => {
    setTouched({ ...touched, [field]: true });
    validateField(field, value);
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(signupData.password);
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-emerald-500'];

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (isPending) return;

    setError('');
    if (!loginData.email || !loginData.password) {
      setError('Please fill in all fields');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    try {
      setIsPending(true);
      const res = await api(`/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Invalid email or password');
        setShake(true);
        setTimeout(() => setShake(false), 500);
        return;
      }

      setSuccess('Login successful! Redirecting...');
      await redirectToZone();
    } catch {
      setError('Connection error. Please try again.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setIsPending(false);
    }
  };

  const handleSignup = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (isPending) return;

    setError('');
    const result = signupSchema.safeParse(signupData);

    if (!result.success) {
      const fieldErrors: FormErrors = {};
      Object.entries(result.error.flatten().fieldErrors).forEach(([key, value]) => {
        fieldErrors[key as keyof FormErrors] = value?.[0];
      });
      setErrors(fieldErrors);
      setError('Please fix the errors below');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    try {
      setIsPending(true);
      const { confirmPassword, ...registerData } = signupData;
      const res = await api(`/auth/register`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registerData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Registration failed');
        setShake(true);
        setTimeout(() => setShake(false), 500);
        return;
      }

      setSuccess('Account created! Redirecting...');
      await redirectToZone();
    } catch {
      setError('Connection error. Please try again.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setIsPending(false);
    }
  };

  const login = useGoogleLogin({
    flow: "auth-code",
    onSuccess: async (codeResponse) => {
      try {
        setIsPending(true);
        setError('');
        const res = await api(`/auth/google`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: codeResponse.code }),
        });

        if (!res.ok) {
          setError('Google login failed. Please try again.');
          return;
        }

        await redirectToZone();
      } catch {
        setError('Something went wrong. Please try again.');
      } finally {
        setIsPending(false);
      }
    },
    onError: () => {
      setError('Google login failed');
      setIsPending(false);
    }
  });

  return (
    <div className="min-h-screen flex bg-[#020617]">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-cyan-500/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/30 via-transparent to-transparent" />
        
        <div className="relative z-10 flex flex-col justify-center px-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center gap-4 mb-12">
              <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/30">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
                </svg>
              </div>
              <span className="text-3xl font-bold text-white">OpenChat</span>
            </div>
            
            <h1 className="text-4xl font-bold text-white mb-6 leading-tight">
              Build and join<br />
              <span className="bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent">
                real communities
              </span>
            </h1>
            
            <p className="text-xl text-zinc-400 mb-12 max-w-md leading-relaxed">
    Chat, collaborate, and connect with people in a simple and fast way.
      No noise. Just communication that works.
            </p>
             
              </motion.div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute top-20 right-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className={`w-full max-w-md ${shake ? 'animate-pulse' : ''}`}
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
              </svg>
            </div>
            <span className="text-2xl font-bold text-white">OpenChat</span>
          </div>

          {/* Tab Switcher */}
          <div className="flex gap-2 p-1.5 bg-white/5 rounded-xl mb-8 backdrop-blur-xl border border-white/10">
            {['login', 'signup'].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab as 'login' | 'signup');
                  setError('');
                  setSuccess('');
                  setErrors({});
                }}
                className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === tab
                    ? 'bg-primary text-white shadow-lg shadow-primary/25'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {tab === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {/* Alerts */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3"
              >
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span className="text-sm">{error}</span>
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-3"
              >
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span className="text-sm">{success}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {activeTab === 'login' ? (
              <motion.form
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleLogin}
                className="space-y-5"
              >
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                    <input
                      type="email"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      placeholder="you@example.com"
                      className="w-full h-12 pl-12 pr-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-zinc-300">Password</label>
                    <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      placeholder="••••••••"
                      className="w-full h-12 pl-12 pr-12 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

               <div className="flex items-center space-x-2">
  <Checkbox
    id="remember"
    checked={rememberMe}
    onCheckedChange={(checked) => setRememberMe(!!checked)}
  />
  <Label
    htmlFor="remember"
    className="text-sm text-muted-foreground cursor-pointer"
  >
    Remember me
  </Label>
</div>
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary/25"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </button>

                <div className="relative flex items-center justify-center my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10" />
                  </div>
                  <span className="relative px-4 bg-[#020617] text-sm text-zinc-500">or continue with</span>
                </div>

                <button
                  type="button"
                  onClick={() => login()}
                  disabled={isPending}
                  className="w-full h-12 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>
              </motion.form>
            ) : (
              <motion.form
                key="signup"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleSignup}
                className="space-y-5"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                      <input
                        type="text"
                        value={signupData.name}
                        onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                        onBlur={(e) => handleBlur('name', e.target.value)}
                        placeholder="John Doe"
                        className={`w-full h-12 pl-12 pr-4 bg-white/5 border rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:bg-white/10 transition-all ${
                          touched.name && errors.name ? 'border-red-500' : 'border-white/10 focus:border-primary/50'
                        }`}
                      />
                    </div>
                    {touched.name && errors.name && (
                      <p className="mt-1.5 text-xs text-red-400">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Username</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">@</span>
                      <input
                        type="text"
                        value={signupData.username}
                        onChange={(e) => setSignupData({ ...signupData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                        onBlur={(e) => handleBlur('username', e.target.value)}
                        placeholder="johndoe"
                        className={`w-full h-12 pl-10 pr-4 bg-white/5 border rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:bg-white/10 transition-all ${
                          touched.username && errors.username ? 'border-red-500' : 'border-white/10 focus:border-primary/50'
                        }`}
                      />
                    </div>
                    {touched.username && errors.username && (
                      <p className="mt-1.5 text-xs text-red-400">{errors.username}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                    <input
                      type="email"
                      value={signupData.email}
                      onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                      onBlur={(e) => handleBlur('email', e.target.value)}
                      placeholder="you@example.com"
                      className={`w-full h-12 pl-12 pr-4 bg-white/5 border rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:bg-white/10 transition-all ${
                        touched.email && errors.email ? 'border-red-500' : 'border-white/10 focus:border-primary/50'
                      }`}
                    />
                  </div>
                  {touched.email && errors.email && (
                    <p className="mt-1.5 text-xs text-red-400">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={signupData.password}
                      onChange={(e) => {
                        setSignupData({ ...signupData, password: e.target.value });
                        if (touched.password) validateField('password', e.target.value);
                      }}
                      onBlur={(e) => handleBlur('password', e.target.value)}
                      placeholder="••••••••"
                      className={`w-full h-12 pl-12 pr-12 bg-white/5 border rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:bg-white/10 transition-all ${
                        touched.password && errors.password ? 'border-red-500' : 'border-white/10 focus:border-primary/50'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  
                  {/* Password Strength Indicator */}
                  {signupData.password && (
                    <div className="mt-3">
                      <div className="flex gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <div
                            key={level}
                            className={`h-1.5 flex-1 rounded-full transition-colors ${
                              level <= passwordStrength ? strengthColors[passwordStrength - 1] : 'bg-white/10'
                            }`}
                          />
                        ))}
                      </div>
                      <p className={`text-xs ${
                        passwordStrength <= 2 ? 'text-red-400' : 
                        passwordStrength <= 3 ? 'text-yellow-400' : 
                        'text-emerald-400'
                      }`}>
                        {passwordStrength > 0 && strengthLabels[passwordStrength - 1]}
                      </p>
                    </div>
                  )}
                  {touched.password && errors.password && (
                    <p className="mt-1.5 text-xs text-red-400">{errors.password}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={signupData.confirmPassword}
                      onChange={(e) => {
                        setSignupData({ ...signupData, confirmPassword: e.target.value });
                        if (touched.confirmPassword) validateField('confirmPassword', e.target.value);
                      }}
                      onBlur={(e) => handleBlur('confirmPassword', e.target.value)}
                      placeholder="••••••••"
                      className={`w-full h-12 pl-12 pr-12 bg-white/5 border rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:bg-white/10 transition-all ${
                        touched.confirmPassword && errors.confirmPassword ? 'border-red-500' : 'border-white/10 focus:border-primary/50'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {touched.confirmPassword && errors.confirmPassword && (
                    <p className="mt-1.5 text-xs text-red-400">{errors.confirmPassword}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary/25"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Create Account
                    </>
                  )}
                </button>

                <p className="text-xs text-zinc-500 text-center">
                  By creating an account, you agree to our{' '}
                  <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>
                  {' '}and{' '}
                  <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                </p>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
