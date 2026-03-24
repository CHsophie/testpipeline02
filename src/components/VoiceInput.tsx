import React, { useState, useEffect, useCallback } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface VoiceInputProps {
  onResult: (text: string) => void;
  isProcessing: boolean;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({ onResult, isProcessing }) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'zh-CN';

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        console.log("Speech recognition transcript:", transcript);
        if (transcript && transcript.trim().length > 0) {
          onResult(transcript);
        } else {
          console.warn("Empty transcript received");
          onResult(""); // Still call onResult to let App handle the empty state
        }
        setIsListening(false);
      };

      rec.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'no-speech') {
          onResult(""); // Trigger empty state in App
        }
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      setRecognition(rec);
    }
  }, [onResult]);

  const toggleListening = useCallback(() => {
    if (!recognition) {
      alert('您的浏览器不支持语音识别，请尝试使用 Chrome 浏览器。');
      return;
    }

    if (isListening) {
      recognition.stop();
    } else {
      try {
        recognition.start();
        setIsListening(true);
      } catch (e) {
        console.error('Recognition start error:', e);
      }
    }
  }, [recognition, isListening]);

  return (
    <div className="fixed bottom-24 md:bottom-10 left-auto right-6 md:left-0 md:right-0 z-50 flex items-center justify-end md:justify-center gap-3 pointer-events-none px-6">
      <div className="flex items-center gap-3">
        <AnimatePresence>
          {isListening && (
            <motion.div 
              initial={{ opacity: 0, x: 20, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.8 }}
              className="bg-white/90 backdrop-blur-sm border border-red-100 px-4 py-3 rounded-2xl shadow-lg flex items-center gap-2"
            >
              <div className="flex items-center gap-1 h-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ 
                      height: [4, 16, 8, 12, 4],
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 0.6, 
                      delay: i * 0.1,
                      ease: "easeInOut"
                    }}
                    className="w-1 bg-red-500 rounded-full"
                  />
                ))}
              </div>
              <span className="text-sm font-bold text-red-500 whitespace-nowrap">正在听...</span>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={toggleListening}
          disabled={isProcessing}
          className={`pointer-events-auto w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-2xl relative group ${
            isListening 
              ? 'bg-red-500 ring-4 ring-red-100' 
              : isProcessing 
                ? 'bg-gray-200 cursor-not-allowed' 
                : 'bg-red-500 hover:bg-red-600 active:scale-90'
          }`}
        >
          {isProcessing ? (
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          ) : isListening ? (
            <MicOff className="w-8 h-8 text-white" />
          ) : (
            <Mic className="w-8 h-8 text-white" />
          )}
          
          {!isListening && !isProcessing && (
            <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              点击说话
            </span>
          )}
        </button>
      </div>
    </div>
  );
};
