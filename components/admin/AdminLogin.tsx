// components/admin/AdminLogin.tsx
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Eye, EyeOff, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  getAuth,
  type Auth,
} from 'firebase/auth';
import { saveSessionToStorage } from '@/lib/admin-auth';

const ADMIN_EMAIL = 'rehamansyed07@gmail.com';
const ADMIN_PASSWORD = 'Indcric@100';

const GoogleIcon = () => (
  <svg
    className="mr-2 h-4 w-4"
    aria-hidden="true"
    focusable="false"
    data-prefix="fab"
    data-icon="google"
    role="img"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 488 512"
  >
    <path
      fill="currentColor"
      d="M488 261.8C488 403.3 381.5 512 244 512S0 403.3 0 261.8C0 120.3 106.5 8 244 8s244 112.3 244 253.8zM138.3 336.7c-21.7-21.7-33.2-50.2-33.2-80.1s11.5-58.4 33.2-80.1c21.7-21.7 50.2-33.2 80.1-33.2s58.4 11.5 80.1 33.2c21.7 21.7 33.2 50.2 33.2 80.1s-11.5 58.4-33.2 80.1c-21.7-21.7-50.2-33.2-80.1-33.2s-58.4 11.5-80.1-33.2z"
    />
  </svg>
);

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  // Use the official Firebase client getAuth()
  // Make sure Firebase is initialized in your /lib/firebase file (client-side)
  let auth: Auth | null = null;
  try {
    auth = getAuth();
  } catch (e) {
    // If Firebase isn't initialized yet, auth may be null — we handle that later.
    console.warn('Firebase auth not available yet:', e);
    auth = null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Developer shortcut login (NOT for production)
    if (email.toLowerCase() === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      // Cast to `any` to avoid strict AdminRole typing issues in various places.
      const adminSession: any = {
        id: 'admin_001',
        email: ADMIN_EMAIL,
        username: 'admin',
        displayName: 'Rehaman Syed',
        phone: '+91-XXXXXXXXXX',
        role: 'superadmin', // cast kept as plain string; stored as any
        permissions: ['*'],
        modules: ['all'],
        loginTime: new Date().toISOString(),
        sessionId: Math.random().toString(36).substr(2, 9),
      };

      // Save session (saveSessionToStorage should accept this shape)
      saveSessionToStorage(adminSession);

      toast({
        title: 'Authentication Successful',
        description: "Welcome, Admin. Redirecting to the Third Umpire's room...",
      });
      router.push('/admin/dashboard');
      return;
    }

    // Otherwise, fail
    toast({
      title: 'Authentication Failed',
      description: 'Invalid credentials. Please try again.',
      variant: 'destructive',
    });
    setIsLoading(false);
  };

  const handleGoogleSignIn = async () => {
    if (!auth) {
      toast({
        title: 'Error',
        description: 'Authentication service not available.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);

      if (result.user.email?.toLowerCase() === ADMIN_EMAIL) {
        const adminSession: any = {
          id: 'admin_001',
          email: result.user.email,
          username: 'admin',
          displayName: result.user.displayName || 'Rehaman Syed',
          phone: result.user.phoneNumber || '+91-XXXXXXXXXX',
          role: 'superadmin',
          permissions: ['*'],
          modules: ['all'],
          loginTime: new Date().toISOString(),
          sessionId: Math.random().toString(36).substr(2, 9),
        };

        saveSessionToStorage(adminSession);

        toast({ title: 'Authentication Successful', description: 'Welcome, Admin.' });
        router.push('/admin/dashboard');
      } else {
        // Not authorized admin account
        try {
          await signOut(auth);
        } catch (_) {
          // ignore signOut errors
        }
        toast({
          title: 'Unauthorized',
          description: 'This Google account is not authorized for admin access.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      if (error?.code !== 'auth/popup-closed-by-user') {
        console.error('Admin Google Sign-In Error:', error);
        toast({ title: 'Sign-in Error', description: 'Could not sign in with Google.', variant: 'destructive' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card className="shadow-2xl bg-card/80 backdrop-blur-lg border-primary/20 animate-fade-in-up">
      <CardHeader className="text-center">
        <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
          <Shield className="h-12 w-12 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold">Third Umpire's Room</CardTitle>
        <CardDescription>Access restricted to authorized match officials.</CardDescription>
      </CardHeader>

      <CardContent className="p-6">
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Official Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your official email"
              required
              className="h-12"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2 relative">
            <Label htmlFor="password">Access Code</Label>
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              required
              className="h-12 pr-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-7 h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={togglePasswordVisibility}
              disabled={isLoading}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </Button>
          </div>

          <Button type="submit" className="w-full h-12 text-base font-bold" disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isLoading ? "Checking Credentials..." : "Enter the Third Umpire's Room"}
          </Button>
        </form>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or</span>
          </div>
        </div>

        <Button variant="outline" className="w-full h-12 text-base" onClick={handleGoogleSignIn} disabled={isLoading}>
          <GoogleIcon />
          Continue with Google
        </Button>

        <div className="text-center mt-4">
          <Button variant="link" asChild className="text-xs text-muted-foreground">
            <Link href="/">Return to the Pitch</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
