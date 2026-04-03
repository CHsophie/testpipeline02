import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface VoiceInputProps {
  onResult: (text: string) => void;
  isProcessing: boolean;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({ onResult, isProcessing }) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const transcriptRef = useRef('');

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'zh-CN';

      rec.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            transcriptRef.current += event.results[i][0].transcript;
          } else {
            currentTranscript += event.results[i][0].transcript;
          }
        }
        console.log("Speech recognition current interim:", currentTranscript);
        console.log("Speech recognition accumulated final:", transcriptRef.current);
      };

      rec.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        
        if (event.error === 'not-allowed') {
          toast.error('麦克风权限被拒绝，请在浏览器设置中允许访问麦克风。', {
            description: '如果是微信内打开，请点击右上角“在浏览器中打开”。'
          });
        } else if (event.error === 'network') {
          toast.error('网络连接问题，语音识别需要联网。');
        } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
          toast.error(`语音识别出错: ${event.error}`);
        }
      };

      rec.onend = () => {
        setIsListening(false);
        if (transcriptRef.current.trim().length > 0) {
          onResult(transcriptRef.current);
          transcriptRef.current = ''; // Reset for next time
        }
      };

      setRecognition(rec);

      return () => {
        rec.stop();
      };
    }
  }, [onResult]);

  const toggleListening = useCallback(() => {
    if (!recognition) {
      toast.error('您的浏览器不支持语音识别', {
        description: '建议使用 Chrome、Safari 或 Edge 浏览器。如果您在微信中，请点击右上角选择“在浏览器中打开”。'
      });
      return;
    }

    if (isListening) {
      recognition.stop();
    } else {
      try {
        transcriptRef.current = ''; // Reset on start
        recognition.start();
        setIsListening(true);
      } catch (e: any) {
        console.error('Recognition start error:', e);
        if (e.name === 'InvalidStateError') {
          // Already started, ignore
        } else {
          toast.error('无法启动语音识别', {
            description: e.message || '请检查麦克风是否被占用。'
          });
          setIsListening(false);
        }
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
