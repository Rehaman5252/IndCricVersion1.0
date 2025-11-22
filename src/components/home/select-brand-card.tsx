// src/components/home/selected-brand-card.tsx
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

//
// Local CubeBrand type (don't import from a hook file to avoid module resolution issues).
// Keep this in sync with your actual hook shape if it changes.
//
export interface CubeBrand {
  id: string;
  brand: string;
  format?: string;
  logoUrl?: string;
  logoHint?: string;
  description?: string;
  order?: number;
}

interface SelectedBrandCardProps {
  brand: CubeBrand;
  onPlayNow: () => void;
}

/**
 * SelectedBrandCard
 * - Uses a local CubeBrand interface to avoid import errors when the hook file can't be resolved.
 * - Uses a plain <img> for the logo to avoid Next/Image domain configuration problems in dev.
 * - Defensive: renders sensible fallbacks if any field is missing.
 */
export default function SelectedBrandCard({ brand, onPlayNow }: SelectedBrandCardProps) {
  const logoAlt = `${brand?.brand ?? 'Brand'} logo`;
  const description = brand?.description ?? 'No description available for this brand.';
  const formatLabel = brand?.format ? `${brand.format} Quiz` : 'Quiz';

  // small inline placeholder (svg data URI) to use when logoUrl is missing
  const placeholderDataUri =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="80"><rect width="100%" height="100%" fill="#f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#9ca3af" font-family="Arial, Helvetica, sans-serif" font-size="12">No logo</text></svg>`
    );

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={brand?.id ?? 'selected-brand-card'}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.28 }}
      >
        <Card className="flex flex-col justify-between h-full">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div
                className="flex-shrink-0 rounded-md overflow-hidden bg-card/30"
                style={{ width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                aria-hidden={!brand?.logoUrl}
              >
                <img
                  src={brand?.logoUrl ?? placeholderDataUri}
                  alt={logoAlt}
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }}
                />
              </div>

              <div>
                <CardTitle className="leading-tight">{formatLabel}</CardTitle>
                <CardDescription className="mt-0">Sponsored by {brand?.brand ?? 'Unknown'}</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <p className="text-sm text-muted-foreground">{description}</p>
          </CardContent>

          <CardFooter>
            <Button className="w-full" onClick={onPlayNow} aria-label={`Play ${brand?.brand ?? 'selected'} quiz`}>
              Play Now
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
