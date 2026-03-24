import React, { useEffect, useRef } from 'react';
import HanziWriter from 'hanzi-writer';

interface HanziDisplayProps {
  character: string;
  size?: number;
  onComplete?: () => void;
}

export const HanziDisplay: React.FC<HanziDisplayProps> = ({ character, size = 200, onComplete }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const writerRef = useRef<any>(null);

  useEffect(() => {
    if (containerRef.current && character) {
      containerRef.current.innerHTML = '';
      writerRef.current = HanziWriter.create(containerRef.current, character, {
        width: size,
        height: size,
        padding: 5,
        showOutline: true,
        strokeAnimationSpeed: 1,
        delayBetweenStrokes: 200,
        strokeColor: '#1f2937', // gray-800
        outlineColor: '#e5e7eb', // gray-200
        drawingColor: '#3b82f6', // blue-500
        showCharacter: true,
      });
      
      writerRef.current.animateCharacter({
        onComplete: () => {
          if (onComplete) onComplete();
        }
      });
    }
  }, [character, size, onComplete]);

  const handleAnimate = () => {
    if (writerRef.current) {
      writerRef.current.animateCharacter();
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div 
        ref={containerRef} 
        className="bg-white border-2 border-gray-800 rounded-sm shadow-sm relative overflow-hidden"
        style={{ 
          width: size,
          height: size,
        }}
      >
        {/* Tianzige lines - Authentic grid */}
        <div className="absolute inset-0 pointer-events-none">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* Horizontal Dashed Line */}
            <line x1="0" y1="50" x2="100" y2="50" stroke="#9ca3af" strokeWidth="0.5" strokeDasharray="2 2" />
            {/* Vertical Dashed Line */}
            <line x1="50" y1="0" x2="50" y2="100" stroke="#9ca3af" strokeWidth="0.5" strokeDasharray="2 2" />
          </svg>
        </div>
      </div>
      <button 
        onClick={handleAnimate}
        className="px-6 py-2.5 bg-red-500 text-white rounded-full hover:bg-red-600 active:scale-95 transition-all shadow-md text-sm font-bold flex items-center gap-2 group"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:rotate-180 transition-transform duration-500">
          <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
          <path d="M21 3v5h-5" />
        </svg>
        重新演示
      </button>
    </div>
  );
};
