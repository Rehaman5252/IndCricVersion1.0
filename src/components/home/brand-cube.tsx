// src/components/home/brand-cube.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

/**
 * NOTE:
 * - If you have `CubeBrand` exported from '@/hooks/useBrandAds', delete this local type
 *   and import it instead:
 *     import { type CubeBrand } from '@/hooks/useBrandAds';
 */
export type CubeBrand = {
  id: string;
  brand: string;
  logoUrl: string;
  logoHint?: string;
};

/** Props */
interface BrandCubeProps {
  brands: (CubeBrand | undefined)[]; // up to 6 items, can be shorter
  rotation: { x: number; y: number };
  onFaceClick: (face: number, brand?: CubeBrand) => void;
  size?: number; // visual size in px (defaults to 160)
}

const DEFAULT_SIZE = 160;

const faceTransforms = (translateZ: number) => [
  { transform: `rotateY(0deg) translateZ(${translateZ}px)` },   // front
  { transform: `rotateY(90deg) translateZ(${translateZ}px)` },  // right
  { transform: `rotateY(180deg) translateZ(${translateZ}px)` }, // back
  { transform: `rotateY(-90deg) translateZ(${translateZ}px)` }, // left
  { transform: `rotateX(90deg) translateZ(${translateZ}px)` },  // top
  { transform: `rotateX(-90deg) translateZ(${translateZ}px)` }, // bottom
];

const BrandCube: React.FC<BrandCubeProps> = ({ brands, rotation, onFaceClick, size = DEFAULT_SIZE }) => {
  // Ensure exactly 6 faces — fill missing with undefined placeholders
  const faces = Array.from({ length: 6 }).map((_, i) => brands?.[i]);

  const translateZ = Math.round(size / 2);
  const transforms = faceTransforms(translateZ);

  return (
    <div
      className="relative flex items-center justify-center"
      aria-label="Brand cube"
      role="group"
    >
      {/* Inline styles for the cube (keeps component self-contained) */}
      <style jsx>{`
        .scene {
          width: ${size}px;
          height: ${size}px;
          perspective: ${size * 4}px;
        }
        .cube {
          width: 100%;
          height: 100%;
          position: relative;
          transform-style: preserve-3d;
          will-change: transform;
        }
        .cube-face {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 6px 18px rgba(0,0,0,0.12);
          background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(0,0,0,0.04));
          cursor: pointer;
          padding: 8px;
        }
        .cube-face:focus {
          outline: 2px solid rgba(59,130,246,0.6);
          outline-offset: 2px;
        }
        .brand-placeholder {
          display:flex;
          align-items:center;
          justify-content:center;
          width:100%;
          height:100%;
          font-size:12px;
          color:var(--muted-foreground, #9ca3af);
          padding:8px;
          text-align:center;
        }
      `}</style>

      <div className="scene" data-testid="brand-cube-scene">
        <motion.div
          className="cube"
          style={{ transformStyle: 'preserve-3d' }}
          animate={{ rotateX: rotation.x, rotateY: rotation.y }}
          transition={{ type: 'spring', stiffness: 120, damping: 18 }}
        >
          {faces.map((brand, idx) => {
            const transformStyle = transforms[idx] ?? transforms[0];
            const key = brand?.id ?? `empty-face-${idx}`;

            return (
              <motion.button
                key={key}
                className="cube-face"
                style={transformStyle as React.CSSProperties}
                onClick={() => onFaceClick(idx, brand)}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.98 }}
                tabIndex={0}
                aria-label={brand ? `${brand.brand} ad` : `Empty brand face ${idx + 1}`}
                title={brand?.brand ?? `Empty face ${idx + 1}`}
                type="button"
              >
                {brand ? (
                  <div style={{ width: '80%', height: '60%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {/* Next/Image: ensure remote patterns or loader are configured for external URLs */}
                    <Image
                      src={brand.logoUrl}
                      alt={brand.brand}
                      width={Math.round(size * 0.6)}
                      height={Math.round(size * 0.35)}
                      className="object-contain"
                      style={{ maxWidth: '100%', height: 'auto' }}
                      priority={false}
                    />
                  </div>
                ) : (
                  <div className="brand-placeholder" aria-hidden>
                    No brand
                  </div>
                )}
              </motion.button>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
};

export default BrandCube;
