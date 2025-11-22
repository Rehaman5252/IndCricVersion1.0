'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import BrandCube, { CubeBrand } from './brand-cube';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';

interface QuizSelectionProps {
  brands: CubeBrand[];
  onBrandSelect: (brand: CubeBrand) => void;
}

const faceRotations = [
  { x: 0, y: 0 },    // Front
  { x: 0, y: -90 },  // Right
  { x: 0, y: -180 }, // Back
  { x: 0, y: 90 },   // Left
  { x: -90, y: 0 },  // Top
  { x: 90, y: 0 },   // Bottom
];

export default function QuizSelection({ brands, onBrandSelect }: QuizSelectionProps) {
  const [rotation, setRotation] = useState({ x: -15, y: 30 });

  const handleFaceClick = (faceIndex: number, brand?: CubeBrand) => {
    setRotation(faceRotations[faceIndex]);
    if (brand) onBrandSelect(brand);
  };

  const handleResetView = () => setRotation({ x: -15, y: 30 });

  if (!brands || brands.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-muted/50 rounded-lg">
        <p className="text-muted-foreground">Loading Quizzes...</p>
      </div>
    );
  }

  // Ensure 6 entries (repeat if required)
  const cubeBrands = Array.from({ length: 6 }).map((_, i) => brands[i % brands.length]);

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', delay: 0.2 }}
      >
        <BrandCube brands={cubeBrands} rotation={rotation} onFaceClick={handleFaceClick} />
      </motion.div>

      <div className="flex items-center space-x-2">
        <p className="text-xs text-muted-foreground">Click a face to select a quiz</p>
        <Button variant="ghost" size="icon" onClick={handleResetView} aria-label="Reset cube view">
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
