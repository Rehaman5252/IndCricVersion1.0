// app/components/home/BrandCubeWithAd.tsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import type { Ad } from "@/lib/ad-service";

/**
 * Lightweight local CubeBrand definition (replaces missing "@/lib/cubeBrandData" import).
 * Adjust as needed to match your real CubeBrand shape.
 */
export interface CubeBrand {
  id?: string;
  brand: string;
  format: string; // e.g. "T20", "IPL", etc.
  logoUrl?: string;
}

/**
 * Props for the wrapper component
 */
interface BrandCubeWithAdProps {
  brand: CubeBrand;
  userId: string;
  onClick: () => void;
}

/**
 * Simple inline AdSlotDisplay fallback component.
 * Replaces the missing import './AdSlotDisplay'. This is intentionally lightweight:
 * - Renders a small placeholder tile for the ad.
 * - Calls onAdLoaded with a typed Ad object so the parent can react.
 *
 * Replace this with your real AdSlotDisplay implementation when it exists.
 */
function AdSlotDisplay({
  adSlot,
  userId,
  className,
  onAdLoaded,
}: {
  adSlot: string;
  userId: string;
  className?: string;
  onAdLoaded?: (ad: Ad) => void;
}) {
  useEffect(() => {
    // Build a minimal mock Ad object (typed) to send back to the parent.
    // This keeps TypeScript happy and allows the parent to display the ad metadata.
    const mockAd: Ad = {
      id: `mock-${adSlot}-${userId}`,
      companyName: "IndCric (Demo Ad)",
      adSlot: (adSlot as unknown) as any, // keep as-is; your app can cast to real AdSlot if needed
      adType: "image",
      mediaUrl: "/images/mock-ad.jpg", // replace with a real URL or local dev asset
      redirectUrl: "",
      revenue: 0,
      viewCount: 0,
      clickCount: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Simulate async load (you can replace with real fetch)
    const t = setTimeout(() => {
      onAdLoaded?.(mockAd);
    }, 250);

    return () => clearTimeout(t);
  }, [adSlot, userId, onAdLoaded]);

  return (
    <div
      className={`w-full bg-gray-800/60 rounded-lg p-2 flex items-center gap-3 ${className || ""}`}
      role="region"
      aria-label={`Ad slot ${adSlot}`}
    >
      <div className="h-16 w-28 bg-gray-700 rounded overflow-hidden flex items-center justify-center">
        {/* Image can be swapped to Next/Image when you have a real URL */}
        <span className="text-xs text-gray-300">Ad</span>
      </div>
      <div className="flex-1 text-xs text-gray-300">
        <div className="font-semibold text-sm">Sponsored</div>
        <div className="mt-1 truncate text-gray-400">Ad Slot: {adSlot}</div>
      </div>
      <div className="text-right">
        <button
          type="button"
          className="px-2 py-1 text-xs rounded bg-green-600 hover:bg-green-700"
        >
          View
        </button>
      </div>
    </div>
  );
}

/**
 * Main exported component (updated to avoid missing imports & implicit any)
 */
export default function BrandCubeWithAd({ brand, userId, onClick }: BrandCubeWithAdProps) {
  const [showAd, setShowAd] = useState(false);
  const [ad, setAd] = useState<Ad | null>(null);

  return (
    <div className="space-y-3 cursor-pointer" onClick={onClick}>
      {/* Brand Logo/Cube Face */}
      <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-gray-900 flex items-center justify-center hover:shadow-lg transition-shadow">
        {brand.logoUrl ? (
          <Image
            src={brand.logoUrl}
            alt={brand.brand}
            width={120}
            height={120}
            className="object-contain"
          />
        ) : (
          <div className="text-gray-400">No logo</div>
        )}
      </div>

      {/* Brand Name & Format */}
      <div>
        <h3 className="font-bold text-white">{brand.brand}</h3>
        <p className="text-sm text-gray-400">{brand.format} Cricket</p>
      </div>

      {/* Ad for this brand format */}
      {userId && (
        <div className="pt-2">
          <AdSlotDisplay
            adSlot={brand.format}
            userId={userId}
            className="h-24 w-full rounded text-xs"
            onAdLoaded={(loadedAd: Ad) => {
              // typed parameter, no implicit any
              setAd(loadedAd);
              setShowAd(true);
            }}
          />
        </div>
      )}

      {/* Optional: show small preview of loaded ad metadata */}
      {showAd && ad && (
        <div className="mt-2 text-xs text-gray-300 bg-gray-800/50 p-2 rounded">
          <div className="font-semibold text-sm text-white truncate">{ad.companyName}</div>
          <div className="text-gray-400">Slot: {String(ad.adSlot)}</div>
          <div className="text-gray-400">Type: {ad.adType}</div>
        </div>
      )}
    </div>
  );
}
