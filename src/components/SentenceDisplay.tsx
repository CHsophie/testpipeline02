import React, { useState, useEffect } from 'react';
import { Volume2, X, RotateCcw, Sparkles, VolumeX } from 'lucide-react';
import { HanziDisplay } from './HanziDisplay';
import { motion, AnimatePresence } from 'motion/react';

interface SentenceDisplayProps {
  text: string;
  pinyin: string;
  onSpeak: (text: string, times?: number, onEnd?: () => void) => void;
  onCancelSpeak: () => void;
}

export const SentenceDisplay: React.FC<SentenceDisplayProps> = ({ text, pinyin, onSpeak, onCancelSpeak }) => {
  const [selectedChar, setSelectedChar] = useState<{ char: string, pinyin: string } | null>(null);
  const [animationKey, setAnimationKey] = useState(0);
  const [isReading, setIsReading] = useState(false);
  
  const characters = text.split('');
  const pinyins = pinyin.split(' ');

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      onCancelSpeak();
    };
  }, [onCancelSpeak]);

  const handleCharClick = (char: string, py: string) => {
    setSelectedChar({ char, pinyin: py });
    setAnimationKey(prev => prev + 1);
    onSpeak(char);
  };

  const handleToggleRead = () => {
    if (isReading) {
      onCancelSpeak();
      setIsReading(false);
    } else {
      setIsReading(true);
      onSpeak(text, 1, () => setIsReading(false));
    }
  };

  return (
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-orange-100 space-y-8 relative">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-800">查句结果</h3>
          <button 
            onClick={handleToggleRead}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${
              isReading 
                ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
            }`}
          >
            {isReading ? (
              <>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  <VolumeX className="w-5 h-5" />
                </motion.div>
                <span>取消朗读</span>
              </>
            ) : (
              <>
                <Volume2 className="w-5 h-5" />
                <span>朗读全文</span>
              </>
            )}
          </button>
        </div>
        <div className="flex items-center gap-2 text-orange-500 text-sm font-bold animate-pulse">
          <Sparkles className="w-4 h-4" />
          <span>点击汉字可查看书写笔顺</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-10 justify-center py-4">
        {characters.map((char, index) => (
          <div 
            key={index} 
            className="flex flex-col items-center min-w-[3rem] cursor-pointer group"
            onClick={() => handleCharClick(char, pinyins[index] || '')}
          >
            <span className="text-sm text-orange-500 font-medium h-6 mb-1 group-hover:scale-110 transition-transform">
              {pinyins[index] || ''}
            </span>
            <div className="w-16 h-16 border-2 border-red-100 rounded-lg flex items-center justify-center bg-[#FFFBF0] relative group-hover:border-orange-300 group-hover:shadow-md transition-all">
              {/* Tianzige lines */}
              <div className="absolute inset-0 border-b border-red-50 border-dashed top-1/2 -translate-y-1/2"></div>
              <div className="absolute inset-0 border-l border-red-50 border-dashed left-1/2 -translate-x-1/2"></div>
              <span className="text-3xl font-serif text-gray-900 relative z-10">{char}</span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100">
        <p className="text-gray-700 leading-relaxed text-lg font-medium">
          {text}
        </p>
      </div>

      {/* Character Detail Popup */}
      <AnimatePresence>
        {selectedChar && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden relative border-4 border-orange-100"
            >
              <button 
                onClick={() => setSelectedChar(null)}
                className="absolute top-4 right-4 p-2 bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200 transition-colors z-10"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="p-8 flex flex-col items-center space-y-6">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <span className="text-2xl text-orange-600 font-bold tracking-widest">{selectedChar.pinyin}</span>
                    <button 
                      onClick={() => onSpeak(selectedChar.char)}
                      className="p-1.5 text-orange-400 hover:text-orange-600 hover:bg-orange-50 rounded-full transition-colors"
                    >
                      <Volume2 className="w-6 h-6" />
                    </button>
                  </div>
                  <h2 className="text-5xl font-serif font-bold text-gray-900">{selectedChar.char}</h2>
                </div>

                <div className="bg-[#FFFBF0] p-4 rounded-3xl border-2 border-red-100 shadow-inner">
                  <HanziDisplay 
                    key={animationKey} 
                    character={selectedChar.char} 
                    size={200} 
                    onAnimate={() => onSpeak(selectedChar.char)}
                  />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
