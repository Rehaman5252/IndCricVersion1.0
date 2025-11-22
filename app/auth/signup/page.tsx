// src/app/auth/signup/page.tsx
'use client';

import React from 'react';
import AuthForm from '@/components/auth/AuthForm';

export default function SignupPage() {
  // temporary cast to `any` to satisfy TypeScript until AuthForm props are updated
  const props = { type: 'signup' } as any;
  return <AuthForm {...props} />;
}
