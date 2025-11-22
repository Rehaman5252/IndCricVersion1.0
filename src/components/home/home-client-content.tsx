// src/components/home/home-client-content.tsx
'use client';

import React, { memo } from 'react';

/**
 * NOTE:
 * If you have the real components available, replace these placeholders with:
 * import GlobalStats from './global-stats';
 * import QuizSelection from './quiz-selection';
 * import SelectedBrandCard from './selected-brand-card';
 *
 * The placeholders below exist only to avoid "Cannot find module ..." TS errors
 * and to let the file compile while you restore the missing files.
 */

/* ----------------------
   Local placeholder components
   ---------------------- */
const GlobalStatsPlaceholder: React.FC = () => (
  <div className="p-6 bg-card rounded-lg shadow text-center">
    <h3 className="text-lg font-semibold">Global Stats</h3>
    <p className="text-sm text-muted-foreground mt-2">(placeholder) Loading site-wide stats…</p>
  </div>
);

type CubeBrandMinimal = {
  id: string;
  brand: string;
  format?: string;
  logoUrl?: string;
  logoHint?: string;
  description?: string;
  order?: number;
};

interface QuizSelectionProps {
  brands?: CubeBrandMinimal[];
  onBrandSelect?: (b: CubeBrandMinimal) => void;
}
const QuizSelectionPlaceholder: React.FC<QuizSelectionProps> = ({ brands = [], onBrandSelect }) => (
  <div className="p-6 bg-card rounded-lg shadow">
    <h3 className="text-lg font-semibold mb-3">Quiz Selection</h3>
    <div className="grid grid-cols-1 gap-2">
      {brands.length === 0 ? (
        <div className="text-sm text-muted-foreground">No brands available (placeholder)</div>
      ) : (
        brands.map(b => (
          <button
            key={b.id}
            onClick={() => onBrandSelect?.(b)}
            className="text-left p-2 rounded hover:bg-primary/5"
            type="button"
          >
            <div className="font-medium">{b.brand}</div>
            <div className="text-xs text-muted-foreground">{b.format ?? 'format'}</div>
          </button>
        ))
      )}
    </div>
  </div>
);

interface SelectedBrandCardProps {
  brand: CubeBrandMinimal;
  onPlayNow?: () => void;
}
const SelectedBrandCardPlaceholder: React.FC<SelectedBrandCardProps> = ({ brand, onPlayNow }) => (
  <div className="p-6 bg-card rounded-lg shadow">
    <h3 className="text-lg font-semibold">{brand.brand}</h3>
    <p className="text-sm text-muted-foreground mt-2">{brand.description ?? 'No description available.'}</p>
    <div className="mt-4">
      <button onClick={onPlayNow} className="px-4 py-2 bg-primary text-white rounded">
        Play Now
      </button>
    </div>
  </div>
);

/* ----------------------
   Component props and main export
   ---------------------- */

interface HomeClientContentProps {
  // We provide a small, local CubeBrand interface here to avoid depending on an external hook file
  brands?: CubeBrandMinimal[];
  selectedBrand: CubeBrandMinimal | null;
  setSelectedBrand: (brand: CubeBrandMinimal) => void;
  handleStartQuiz: (brand: CubeBrandMinimal) => void;
}

function HomeClientContent({
  brands = [],
  selectedBrand,
  setSelectedBrand,
  handleStartQuiz,
}: HomeClientContentProps) {
  return (
    <>
      {/* Replace the placeholder with your real GlobalStats when available */}
      <GlobalStatsPlaceholder />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center mt-6">
        {/* Replace QuizSelectionPlaceholder with your real QuizSelection */}
        <QuizSelectionPlaceholder
          brands={brands}
          onBrandSelect={(b) => setSelectedBrand(b)}
        />

        {selectedBrand ? (
          // Replace SelectedBrandCardPlaceholder with your real SelectedBrandCard
          <SelectedBrandCardPlaceholder
            brand={selectedBrand}
            onPlayNow={() => handleStartQuiz(selectedBrand)}
          />
        ) : (
          <div className="flex items-center justify-center p-6 bg-card rounded-lg shadow">
            <p className="text-sm text-muted-foreground">
              Select a brand to see details and play
            </p>
          </div>
        )}
      </div>
    </>
  );
}

export default memo(HomeClientContent);
