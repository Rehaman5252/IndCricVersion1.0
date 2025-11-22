// components/admin/AdminNav.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Users, FileCheck, Banknote, LogOut, Shield } from 'lucide-react';
import { signOut, getAuth, type Auth } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Link from 'next/link';

/**
 * Simple admin nav used in the admin area.
 * Note: getAuth() is imported from 'firebase/auth' (official SDK).
 * Ensure Firebase client is initialized somewhere before this component mounts.
 */

const navItems = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/users', icon: Users, label: 'Users' },
  { href: '/admin/submissions', icon: FileCheck, label: 'Submissions' },
  { href: '/admin/payouts', icon: Banknote, label: 'Payouts' },
];

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [auth, setAuth] = useState<Auth | null>(null);

  useEffect(() => {
    // Use the SDK getAuth() — this will return the initialized auth instance
    // if you initialized Firebase elsewhere (for instance in /lib/firebase).
    try {
      const a = getAuth();
      setAuth(a);
    } catch (err) {
      // If Firebase isn't initialized yet, just keep auth null and avoid crashing.
      console.warn('Firebase auth not available yet in AdminNav:', err);
      setAuth(null);
    }
  }, []);

  const handleLogout = async () => {
    if (!auth) {
      toast({ title: 'Sign Out Error', description: 'Auth not available.', variant: 'destructive' });
      return;
    }
    try {
      await signOut(auth);
      toast({ title: 'Signed Out' });
      router.replace('/admin/login');
    } catch (error) {
      console.error('Sign out error:', error);
      toast({ title: 'Sign Out Error', description: 'Could not sign out.', variant: 'destructive' });
    }
  };

  return (
    <div className="flex flex-col h-full bg-card p-4 rounded-lg shadow-lg">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="h-8 w-8 text-primary" />
        <h2 className="text-xl font-bold">Admin Panel</h2>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const ActiveIcon = item.icon;
          const active = pathname === item.href;
          return (
            <Button
              key={item.href}
              asChild
              variant={active ? 'secondary' : 'ghost'}
              className={cn('w-full justify-start', active ? 'opacity-100' : '')}
            >
              <Link href={item.href}>
                <ActiveIcon className="mr-2 h-4 w-4" />
                {item.label}
              </Link>
            </Button>
          );
        })}
      </nav>

      <div className="mt-auto">
        <Button variant="destructive" className="w-full justify-start" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
