/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { VoiceInput } from './components/VoiceInput';
import { HanziDisplay } from './components/HanziDisplay';
import { HistoryList } from './components/HistoryList';
import { extractCharacterFromSpeech, CharacterInfo } from './services/geminiService';
import { BookOpen, Sparkles, GraduationCap, Volume2, Search, History, CheckCircle2, ChevronLeft, Languages, X } from 'lucide-react';
import { Review } from './components/Review';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'sonner';

const STORAGE_KEY = 'hanzi_search_history';
const GOAL_KEY = 'hanzi_daily_goal';

type Tab = 'search' | 'history' | 'review';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('search');
  const [currentCharacter, setCurrentCharacter] = useState<CharacterInfo | null>(null);
  const [historyDetailCharacter, setHistoryDetailCharacter] = useState<CharacterInfo | null>(null);
  const [history, setHistory] = useState<CharacterInfo[]>([]);
  const [dailyGoal, setDailyGoal] = useState(5);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load history and goal from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem(STORAGE_KEY);
    const savedGoal = localStorage.getItem(GOAL_KEY);
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }
    if (savedGoal) {
      setDailyGoal(parseInt(savedGoal));
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  // Save goal to localStorage
  useEffect(() => {
    localStorage.setItem(GOAL_KEY, dailyGoal.toString());
  }, [dailyGoal]);

  const speak = useCallback((text: string, times: number = 1) => {
    const synth = window.speechSynthesis;
    if (!synth) return;

    synth.cancel();

    const play = (remaining: number) => {
      if (remaining <= 0) return;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.8;
      utterance.onend = () => {
        setTimeout(() => play(remaining - 1), 500);
      };
      synth.speak(utterance);
    };

    play(times);
  }, []);

  // Auto-play 3 times when character changes
  useEffect(() => {
    if (currentCharacter) {
      const timer = setTimeout(() => {
        speak(currentCharacter.character, 3);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentCharacter, speak]);

  useEffect(() => {
    if (historyDetailCharacter) {
      const timer = setTimeout(() => {
        speak(historyDetailCharacter.character, 3);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [historyDetailCharacter, speak]);

  const handleVoiceResult = async (text: string) => {
    setIsProcessing(true);
    setError(null);
    try {
      const result = await extractCharacterFromSpeech(text);
      if (result) {
        if (result.isOffTopic) {
          toast('哎呀，请专心问我汉字怎么写，我不会闲聊带偏你的哦。', {
            duration: 5000,
            closeButton: true,
            icon: <Sparkles className="w-5 h-5 text-orange-500" />,
            className: "bg-white border-orange-100 rounded-2xl shadow-xl",
          });
          return;
        }

        const now = Date.now();
        const newInfo: CharacterInfo = {
          ...result,
          lastSearchedAt: now,
          reviewCount: 0,
          nextReviewAt: now + 24 * 60 * 60 * 1000, // First review in 24 hours
        };
        setCurrentCharacter(newInfo);
        // Add to history if not already the most recent
        setHistory(prev => {
          const filtered = prev.filter(item => item.character !== result.character);
          return [newInfo, ...filtered].slice(0, 50); // Keep last 50
        });
      } else {
        setError('抱歉，我没听清你想查哪个字，请再试一次。');
      }
    } catch (err) {
      setError('发生了一点小错误，请稍后再试。');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReviewComplete = (char: string) => {
    const intervals = [1, 2, 4, 7, 15, 30]; // days
    setHistory(prev => prev.map(item => {
      if (item.character === char) {
        const nextCount = item.reviewCount + 1;
        const intervalDays = intervals[Math.min(nextCount, intervals.length - 1)];
        return {
          ...item,
          reviewCount: nextCount,
          nextReviewAt: Date.now() + intervalDays * 24 * 60 * 60 * 1000,
        };
      }
      return item;
    }));
  };

  const handleSelectHistory = (item: CharacterInfo) => {
    setHistoryDetailCharacter(item);
  };

  const handleClearHistory = () => {
    if (window.confirm('确定要清空所有查询历史吗？')) {
      setHistory([]);
    }
  };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setHistoryDetailCharacter(null);
  };

  return (
    <div className="min-h-screen bg-[#FFFBF0] text-gray-900 font-sans selection:bg-red-100 pb-24">
      <Toaster position="top-center" expand={true} richColors />
      {/* Header */}
      <header className="bg-white border-b border-orange-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center shadow-lg transform -rotate-3">
            <GraduationCap className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">小状元识字</h1>
            <p className="text-xs text-orange-500 font-medium">汉字书写助手</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-sm font-medium text-orange-800 bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100">
          <Sparkles className="w-4 h-4" />
          <span>让汉字学习更有趣</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'search' && (
            <motion.div
              key="search"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >
              {/* Fixed Voice Input is now handled inside its own component with fixed positioning */}
              <VoiceInput onResult={handleVoiceResult} isProcessing={isProcessing} />

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-600 shadow-sm"
                >
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <p className="text-sm font-medium">{error}</p>
                </motion.div>
              )}

              {/* Character Display Section */}
              {currentCharacter ? (
                <section className="bg-white p-8 rounded-3xl shadow-sm border border-orange-100">
                  <div className="flex flex-col md:flex-row items-center justify-center gap-12">
                    {/* Left: Tianzige */}
                    <div className="flex flex-col items-center">
                      <div className="mb-4 text-center">
                        <h2 className="text-4xl font-serif font-bold text-gray-900">{currentCharacter.character}</h2>
                        <div className="flex items-center justify-center gap-2 mt-1">
                          <p className="text-xl text-orange-600 font-medium tracking-widest">{currentCharacter.pinyin}</p>
                          <button 
                            onClick={() => speak(currentCharacter.character, 1)}
                            className="p-1.5 text-orange-400 hover:text-orange-600 hover:bg-orange-50 rounded-full transition-colors"
                            title="播放读音"
                          >
                            <Volume2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      <HanziDisplay character={currentCharacter.character} size={250} />
                    </div>

                    {/* Right: Info */}
                    <div className="flex-1 space-y-6 max-w-md">
                      <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100">
                        <div className="flex items-center gap-2 text-orange-800 font-bold mb-4">
                          <Languages className="w-5 h-5" />
                          <span>常用词组</span>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          {currentCharacter.phrases?.map((phrase, idx) => (
                            <button
                              key={idx}
                              onClick={() => speak(phrase)}
                              className="px-4 py-2 bg-white border border-orange-200 rounded-xl text-gray-800 font-medium hover:bg-orange-100 hover:border-orange-300 transition-all shadow-sm flex items-center gap-2 group"
                            >
                              <span>{phrase}</span>
                              <Volume2 className="w-3 h-3 text-orange-400 group-hover:text-orange-600" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              ) : (
                <section className="bg-white p-12 rounded-3xl border border-orange-100 shadow-sm flex flex-col items-center justify-center text-center space-y-6">
                  <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center">
                    <Search className="w-12 h-12 text-orange-200" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">想学哪个字？</h3>
                    <p className="text-gray-500 mt-2">点击右下角的麦克风，大声告诉我吧！</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
                    {['老虎的虎', '爱心的爱', '天上的天', '花朵的花'].map((example) => (
                      <button 
                        key={example}
                        onClick={() => handleVoiceResult(example)}
                        className="px-4 py-2 bg-orange-50 text-orange-700 text-xs font-bold rounded-xl hover:bg-orange-100 transition-colors"
                      >
                        “{example}”
                      </button>
                    ))}
                  </div>
                </section>
              )}
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {historyDetailCharacter ? (
                <div className="space-y-6">
                  <button 
                    onClick={() => setHistoryDetailCharacter(null)}
                    className="flex items-center gap-1 text-orange-600 font-bold hover:text-orange-700 transition-colors mb-4"
                  >
                    <ChevronLeft className="w-5 h-5" />
                    <span>返回历史列表</span>
                  </button>

                  <section className="bg-white p-8 rounded-3xl shadow-sm border border-orange-100">
                    <div className="flex flex-col md:flex-row items-center justify-center gap-12">
                      {/* Left: Tianzige */}
                      <div className="flex flex-col items-center">
                        <div className="mb-4 text-center">
                          <h2 className="text-4xl font-serif font-bold text-gray-900">{historyDetailCharacter.character}</h2>
                          <div className="flex items-center justify-center gap-2 mt-1">
                            <p className="text-xl text-orange-600 font-medium tracking-widest">{historyDetailCharacter.pinyin}</p>
                            <button 
                              onClick={() => speak(historyDetailCharacter.character, 1)}
                              className="p-1.5 text-orange-400 hover:text-orange-600 hover:bg-orange-50 rounded-full transition-colors"
                              title="播放读音"
                            >
                              <Volume2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                        <HanziDisplay character={historyDetailCharacter.character} size={250} />
                      </div>

                      {/* Right: Info */}
                      <div className="flex-1 space-y-6 max-w-md">
                        <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100">
                          <div className="flex items-center gap-2 text-orange-800 font-bold mb-4">
                            <Languages className="w-5 h-5" />
                            <span>常用词组</span>
                          </div>
                          <div className="flex flex-wrap gap-3">
                            {historyDetailCharacter.phrases?.map((phrase, idx) => (
                              <button
                                key={idx}
                                onClick={() => speak(phrase)}
                                className="px-4 py-2 bg-white border border-orange-200 rounded-xl text-gray-800 font-medium hover:bg-orange-100 hover:border-orange-300 transition-all shadow-sm flex items-center gap-2 group"
                              >
                                <span>{phrase}</span>
                                <Volume2 className="w-3 h-3 text-orange-400 group-hover:text-orange-600" />
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              ) : (
                <HistoryList 
                  history={history} 
                  onSelect={handleSelectHistory} 
                  onClear={handleClearHistory} 
                />
              )}
            </motion.div>
          )}

          {activeTab === 'review' && (
            <motion.div
              key="review"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <Review 
                history={history}
                dailyGoal={dailyGoal}
                onUpdateGoal={setDailyGoal}
                onReviewComplete={handleReviewComplete}
                speak={speak}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-orange-100 px-6 py-3 flex items-center justify-around z-20 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <button 
          onClick={() => handleTabChange('search')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'search' ? 'text-red-500' : 'text-gray-400'}`}
        >
          <Search className="w-6 h-6" />
          <span className="text-xs font-bold">查字</span>
        </button>
        <button 
          onClick={() => handleTabChange('history')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'history' ? 'text-red-500' : 'text-gray-400'}`}
        >
          <History className="w-6 h-6" />
          <span className="text-xs font-bold">历史</span>
        </button>
        <button 
          onClick={() => handleTabChange('review')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'review' ? 'text-red-500' : 'text-gray-400'}`}
        >
          <div className="relative">
            <CheckCircle2 className="w-6 h-6" />
            {history.filter(i => i.nextReviewAt <= Date.now()).length > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
            )}
          </div>
          <span className="text-xs font-bold">复习</span>
        </button>
      </nav>

      {/* Footer */}
      <footer className="mt-12 py-8 text-center text-gray-400 text-sm border-t border-orange-50">
        <p>© 2026 小状元识字 - 陪伴孩子快乐成长</p>
      </footer>
    </div>
  );
}
