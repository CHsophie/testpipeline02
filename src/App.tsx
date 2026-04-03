/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { VoiceInput } from './components/VoiceInput';
import { HanziDisplay } from './components/HanziDisplay';
import { HistoryList } from './components/HistoryList';
import { extractCharacterFromSpeech, extractSentenceFromSpeech, CharacterInfo, SentenceInfo, HistoryItem } from './services/llmService';
import { BookOpen, Sparkles, GraduationCap, Volume2, Search, History, ChevronLeft, Languages, X, Type } from 'lucide-react';
import { SentenceDisplay } from './components/SentenceDisplay';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'sonner';

const STORAGE_KEY = 'hanzi_search_history';
const GOAL_KEY = 'hanzi_daily_goal';

type Tab = 'search' | 'sentence' | 'history';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('search');
  const [currentCharacter, setCurrentCharacter] = useState<CharacterInfo | null>(null);
  const [currentSentence, setCurrentSentence] = useState<SentenceInfo | null>(null);
  const [historyDetailItem, setHistoryDetailItem] = useState<HistoryItem | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
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

  const cancelSpeak = useCallback(() => {
    window.speechSynthesis?.cancel();
  }, []);

  const speak = useCallback((text: string, times: number = 1, onEnd?: () => void) => {
    const synth = window.speechSynthesis;
    if (!synth) return;

    synth.cancel();

    const play = (remaining: number) => {
      if (remaining <= 0) {
        if (onEnd) onEnd();
        return;
      }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.8;
      utterance.onend = () => {
        if (remaining > 1) {
          setTimeout(() => play(remaining - 1), 500);
        } else {
          if (onEnd) onEnd();
        }
      };
      utterance.onerror = () => {
        if (onEnd) onEnd();
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
    if (currentSentence) {
      // Auto-play removed as per user request
    }
  }, [currentSentence, speak]);

  useEffect(() => {
    if (historyDetailItem) {
      const textToSpeak = historyDetailItem.type === 'character' ? historyDetailItem.character : historyDetailItem.text;
      const times = historyDetailItem.type === 'character' ? 3 : 1;
      
      // Only auto-play for characters, not sentences
      if (historyDetailItem.type === 'character') {
        const timer = setTimeout(() => {
          speak(textToSpeak, times);
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [historyDetailItem, speak]);

  const handleVoiceResult = useCallback(async (text: string) => {
    console.log("Voice recognition result:", text);
    if (!text || text.trim().length === 0) {
      setError('哎呀，我好像没听到声音，请再试一次。');
      return;
    }

    setIsProcessing(true);
    setError(null);
    try {
      if (activeTab === 'search') {
        const result = await extractCharacterFromSpeech(text);
        console.log("Extraction result:", result);
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
            nextReviewAt: 0,
            type: 'character'
          };
          setCurrentCharacter(newInfo);
          // Add to history if not already the most recent
          setHistory(prev => {
            const filtered = prev.filter(item => item.type === 'character' && item.character !== result.character);
            const others = prev.filter(item => item.type !== 'character');
            return [newInfo, ...filtered, ...others].sort((a, b) => b.lastSearchedAt - a.lastSearchedAt).slice(0, 50); // Keep last 50
          });
        } else {
          setError(`抱歉，我听到了“${text}”，但没能提取出你想查的字，请换个说法试试。`);
        }
      } else if (activeTab === 'sentence') {
        const result = await extractSentenceFromSpeech(text);
        console.log("Sentence result:", result);
        if (result) {
          // 100 character limit
          if (result.text.length > 100) {
            const truncatedText = result.text.substring(0, 100);
            const truncatedPinyin = result.pinyin.split(' ').slice(0, 100).join(' ');
            
            const truncatedResult: SentenceInfo = {
              ...result,
              text: truncatedText,
              pinyin: truncatedPinyin
            };
            
            setCurrentSentence(truncatedResult);
            
            // Voice warning only, no auto-reading of content
            const warning = "要显示的汉字好多呀，我先给你显示100个，等你写完了你再问我。";
            const synth = window.speechSynthesis;
            const utterance = new SpeechSynthesisUtterance(warning);
            utterance.lang = 'zh-CN';
            synth.speak(utterance);

            setHistory(prev => {
              const filtered = prev.filter(item => item.type === 'sentence' && item.text !== truncatedResult.text);
              const others = prev.filter(item => item.type !== 'sentence');
              return [truncatedResult, ...filtered, ...others].sort((a, b) => b.lastSearchedAt - a.lastSearchedAt).slice(0, 50);
            });
          } else {
            setCurrentSentence(result);
            setHistory(prev => {
              const filtered = prev.filter(item => item.type === 'sentence' && item.text !== result.text);
              const others = prev.filter(item => item.type !== 'sentence');
              return [result, ...filtered, ...others].sort((a, b) => b.lastSearchedAt - a.lastSearchedAt).slice(0, 50);
            });
          }
        } else {
          setError(`抱歉，我听到了“${text}”，但没能标注拼音，请换个说法试试。`);
        }
      }
    } catch (err: any) {
      console.error("Voice result processing error:", err);
      setError(err.message || '发生了一点小错误，请稍后再试。');
    } finally {
      setIsProcessing(false);
    }
  }, [activeTab, speak]);

  const handleSelectHistory = (item: HistoryItem) => {
    setHistoryDetailItem(item);
  };

  const handleClearHistory = () => {
    if (window.confirm('确定要清空所有查询历史吗？')) {
      setHistory([]);
    }
  };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setHistoryDetailItem(null);
  };

  return (
    <div className="min-h-screen bg-[#FFFBF0] text-gray-900 font-sans selection:bg-red-100 pb-24">
      <Toaster position="top-center" expand={true} richColors />
      {/* Header */}
      <header className="bg-white border-b border-orange-100 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
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

          {activeTab === 'sentence' && (
            <motion.div
              key="sentence"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >
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

              {currentSentence ? (
                <SentenceDisplay 
                  text={currentSentence.text} 
                  pinyin={currentSentence.pinyin} 
                  onSpeak={speak} 
                  onCancelSpeak={cancelSpeak}
                />
              ) : (
                <section className="bg-white p-12 rounded-3xl border border-orange-100 shadow-sm flex flex-col items-center justify-center text-center space-y-6">
                  <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center">
                    <Type className="w-12 h-12 text-orange-200" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">想写哪个句子？</h3>
                    <p className="text-gray-500 mt-2">点击右下角麦克风，录入想写的句子。</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
                    {['我爱学汉字', '今天天气真好', '我们要保护环境', '好好学习天天向上'].map((example) => (
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
              {historyDetailItem ? (
                <div className="space-y-6">
                  <button 
                    onClick={() => setHistoryDetailItem(null)}
                    className="flex items-center gap-1 text-orange-600 font-bold hover:text-orange-700 transition-colors mb-4"
                  >
                    <ChevronLeft className="w-5 h-5" />
                    <span>返回历史列表</span>
                  </button>

                  {historyDetailItem.type === 'character' ? (
                    <section className="bg-white p-8 rounded-3xl shadow-sm border border-orange-100">
                      <div className="flex flex-col md:flex-row items-center justify-center gap-12">
                        {/* Left: Tianzige */}
                        <div className="flex flex-col items-center">
                          <div className="mb-4 text-center">
                            <h2 className="text-4xl font-serif font-bold text-gray-900">{historyDetailItem.character}</h2>
                            <div className="flex items-center justify-center gap-2 mt-1">
                              <p className="text-xl text-orange-600 font-medium tracking-widest">{historyDetailItem.pinyin}</p>
                              <button 
                                onClick={() => speak(historyDetailItem.character, 1)}
                                className="p-1.5 text-orange-400 hover:text-orange-600 hover:bg-orange-50 rounded-full transition-colors"
                                title="播放读音"
                              >
                                <Volume2 className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                          <HanziDisplay character={historyDetailItem.character} size={250} />
                        </div>

                        {/* Right: Info */}
                        <div className="flex-1 space-y-6 max-w-md">
                          <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100">
                            <div className="flex items-center gap-2 text-orange-800 font-bold mb-4">
                              <Languages className="w-5 h-5" />
                              <span>常用词组</span>
                            </div>
                            <div className="flex flex-wrap gap-3">
                              {historyDetailItem.phrases?.map((phrase, idx) => (
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
                    <SentenceDisplay 
                      text={historyDetailItem.text} 
                      pinyin={historyDetailItem.pinyin} 
                      onSpeak={speak} 
                      onCancelSpeak={cancelSpeak}
                    />
                  )}
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
          onClick={() => handleTabChange('sentence')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'sentence' ? 'text-red-500' : 'text-gray-400'}`}
        >
          <Type className="w-6 h-6" />
          <span className="text-xs font-bold">查句</span>
        </button>
        <button 
          onClick={() => handleTabChange('history')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'history' ? 'text-red-500' : 'text-gray-400'}`}
        >
          <History className="w-6 h-6" />
          <span className="text-xs font-bold">历史</span>
        </button>
      </nav>

      {/* Footer */}
      <footer className="mt-12 py-8 text-center text-gray-400 text-sm border-t border-orange-50">
        <p>© 2026 小状元识字 - 陪伴孩子快乐成长</p>
      </footer>
    </div>
  );
}
