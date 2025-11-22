// app/components/home/CubeFaceWithAd.tsx
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { getAdsBySlot, Ad, logAdView } from '@/lib/ad-service';
import { motion } from 'framer-motion';
import type { AdSlot } from '@/types/ads'; // <-- use the AdSlot type from your types file

interface CubeFaceWithAdProps {
  format: AdSlot; // <- strongly typed now
  brand: string; // Amazon, Netflix, etc.
  onClick: () => void;
  userId: string;
  index: number;
}

export default function CubeFaceWithAd({
  format,
  brand,
  onClick,
  userId,
  index,
}: CubeFaceWithAdProps) {
  const [ad, setAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(true);
  const [adViewed, setAdViewed] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchAd = async () => {
      try {
        setLoading(true);
        // format is already typed as AdSlot so no cast required
        console.log(`🔍 Fetching ad for cube face: ${format}`);
        const ads = await getAdsBySlot(format);

        if (!mounted) return;

        if (ads && ads.length > 0) {
          const selectedAd = ads[0];
          setAd(selectedAd);
          console.log(`✅ Cube ad found: ${selectedAd.companyName} (${format})`);

          // Log view (only once)
          if (!adViewed && userId) {
            try {
              await logAdView(selectedAd.id, userId, format, selectedAd.companyName);
              setAdViewed(true);
            } catch (logErr) {
              console.warn('Unable to log ad view:', logErr);
            }
          }
        } else {
          console.log(`⚠️ No ad for format: ${format}, showing default brand`);
          setAd(null);
        }
      } catch (error) {
        console.error(`❌ Error fetching ad for ${format}:`, error);
        if (mounted) setAd(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchAd();

    return () => {
      mounted = false;
    };
  }, [format, userId, adViewed]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.06 }}
      onClick={onClick}
      className="cursor-pointer group"
    >
      <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-gray-700 hover:border-blue-500 transition-all duration-300 hover:shadow-2xl hover:scale-105 shadow-lg">
        {/* AD IMAGE (if available) */}
        {ad && ad.mediaUrl ? (
          <>
            <Image
              src={ad.mediaUrl}
              alt={ad.companyName}
              fill
              className="w-full h-full object-cover"
              priority={index === 0}
              onError={(e) => {
                // Next/Image onError receives a synthetic event; just log
                console.error(`❌ Failed to load ad image for ${format}`, e);
              }}
            />
            {/* Overlay with company name */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
              <p className="text-white font-bold text-sm">{ad.companyName}</p>
              <p className="text-yellow-400 text-xs font-semibold">{format}</p>
            </div>
          </>
        ) : (
          // FALLBACK: Brand Logo (if no ad)
          !loading && (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gray-800">
              <div className="text-3xl font-bold text-yellow-500">{brand?.charAt(0) ?? '?'}</div>
              <p className="text-white text-sm font-semibold truncate max-w-full">{brand}</p>
              <p className="text-gray-400 text-xs">{format}</p>
            </div>
          )
        )}

        {/* LOADING STATE */}
        {loading && (
          <div className="w-full h-full flex items-center justify-center bg-gray-800">
            <div className="animate-spin w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full" />
          </div>
        )}

        {/* Format Badge */}
        <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold shadow-lg">
          {format}
        </div>
      </div>
    </motion.div>
  );
}
