// src/lib/ads.ts
import { AdSlot } from '@/lib/ad-service';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// ✅ UNIFIED AD INTERFACE - MATCHES lib/ad-service.ts
export interface Ad {
  id: string;
  companyName: string;
  adSlot: AdSlot;
  adType: 'image' | 'video';
  mediaUrl: string;
  redirectUrl: string;
  revenue: number;
  viewCount: number;
  clickCount: number;
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
}

// Interface for interstitial ads
export interface InterstitialAdConfig {
  type: 'static' | 'video';
  logoUrl?: string;
  logoHint?: string;
  hint?: string; // <- added so UI can safely use `hint`
  durationMs?: number;
  videoUrl?: string;
  videoTitle?: string;
  durationSec?: number;
  skippableAfterSec?: number;
}

// ✅ FETCH AD FROM FIRESTORE BY SLOT - RETURNS FULL Ad OBJECT
export async function getAdForSlot(slot: AdSlot | null | undefined): Promise<Ad | null> {
  try {
    if (!slot) {
      console.warn('⚠️ [getAdForSlot] No slot provided');
      return null;
    }

    // Query Firestore for active ads matching this slot
    const q = query(
      collection(db, 'ads'),
      where('adSlot', '==', slot),
      where('isActive', '==', true)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.warn(`⚠️ [getAdForSlot] No ads found in Firebase for slot: ${slot}`);
      return null;
    }

    // Get first ad from results
    const doc = snapshot.docs[0];
    const docData = doc.data() as any;

    // ✅ BUILD FULL Ad OBJECT WITH ALL REQUIRED FIELDS (INCLUDING id!)
    const ad: Ad = {
      id: doc.id,
      companyName: docData.companyName || '',
      adSlot: docData.adSlot,
      adType: (docData.adType as 'image' | 'video') || 'image',
      mediaUrl: docData.mediaUrl || '',
      redirectUrl: docData.redirectUrl || '',
      revenue: typeof docData.revenue === 'number' ? docData.revenue : 0,
      viewCount: typeof docData.viewCount === 'number' ? docData.viewCount : 0,
      clickCount: typeof docData.clickCount === 'number' ? docData.clickCount : 0,
      isActive: typeof docData.isActive === 'boolean' ? docData.isActive : true,
      createdAt: docData.createdAt,
      updatedAt: docData.updatedAt,
    };

    console.log(`✅ [getAdForSlot] Ad found from Firebase:`, ad.companyName, ad.mediaUrl);
    return ad;
  } catch (error) {
    console.error('❌ [getAdForSlot] Error fetching from Firebase:', error);
    return null;
  }
}

export async function getInterstitialAdForSlot(slot: AdSlot | null | undefined): Promise<InterstitialAdConfig | null> {
  try {
    if (!slot) {
      console.warn('⚠️ [getInterstitialAdForSlot] No slot provided');
      return null;
    }

    // Fetch the actual ad from Firebase
    const ad = await getAdForSlot(slot);

    if (!ad) {
      console.warn(`⚠️ [getInterstitialAdForSlot] No ad found for slot: ${slot}`);
      return null;
    }

    // Detect if ad is video or image
    const isVideo = ad.adType === 'video' || ad.mediaUrl.toLowerCase().includes('.mp4');

    // Set default duration: 40 seconds for video, 10 seconds for image
    const durationSec = isVideo ? 40 : 10;
    const durationMs = durationSec * 1000;

    // Set skip button availability: example logic, keep defensive
    let skippableAfterSec: number;
    const slotStr = String(slot);
    if (slotStr === 'Q3_Q4' || slotStr === 'AfterQuiz') {
      skippableAfterSec = Math.min(30, Math.floor(durationSec / 2));
    } else {
      skippableAfterSec = Math.max(5, durationSec - 5);
    }

    // Convert to interstitial config
    const interstitialConfig: InterstitialAdConfig = {
      type: isVideo ? 'video' : 'static',
      logoUrl: !isVideo ? ad.mediaUrl : undefined,
      logoHint: ad.companyName,
      hint: ad.companyName, // helpful fallback for UI
      durationMs,
      durationSec,
      videoUrl: isVideo ? ad.mediaUrl : undefined,
      videoTitle: ad.companyName,
      skippableAfterSec,
    };

    console.log(`✅ [getInterstitialAdForSlot] Interstitial ad config:`, {
      type: interstitialConfig.type,
      duration: `${durationSec}s (${durationMs}ms)`,
      hasVideo: !!interstitialConfig.videoUrl,
      hasLogo: !!interstitialConfig.logoUrl,
      skippableAfterSec,
    });

    return interstitialConfig;
  } catch (error) {
    console.error('❌ [getInterstitialAdForSlot] Error:', error);
    return null;
  }
}

/**
 * Backwards-compatible in-file adLibrary fallback.
 * Keep both named export and default export because legacy code imported default.
 *
 * Note:
 * - adLibrary.resultsAd uses `type: 'image' | 'video'` (UI expects that shape in several places).
 * - InterstitialAdConfig uses `type: 'static' | 'video'` when returning from getInterstitialAdForSlot.
 */
export const adLibrary = {
  resultsAd: {
    id: 'results-ad-default',
    title: 'Watch & Review — sponsored',
    type: 'image' as 'image' | 'video',
    // local dev asset path (change if you serve assets from /public)
    url: '/mnt/data/6589e65a-9cdf-4573-a63f-75216cbb5864.png',
    duration: 7,
    skippableAfter: 5,
    hint: 'Watch this ad to unlock review.',
  },
  fallbackAd: {
    id: 'fallback-ad-default',
    title: 'Support IndCric',
    type: 'image' as 'image' | 'video',
    url: '/mnt/data/6589e65a-9cdf-4573-a63f-75216cbb5864.png',
    duration: 6,
    skippableAfter: 3,
  },
};

// Provide default export for modules that import default adLibrary
export default adLibrary;
