// src/app/login/page.tsx
'use client';

import React from 'react';
import AuthForm from '@/components/auth/AuthForm';

export default function LoginPage() {
  // temporary cast to `any` so TS doesn't complain while you update AuthForm's props
  const props = { type: 'login' } as any;
  return <AuthForm {...props} />;
}

