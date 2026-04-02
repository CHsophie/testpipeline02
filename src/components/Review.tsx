import React, { useState } from 'react';
import { CharacterInfo } from '../services/llmService';
import { BookOpen, CheckCircle2, Settings, ChevronRight, PlayCircle } from 'lucide-react';
import { HanziDisplay } from './HanziDisplay';
import { motion, AnimatePresence } from 'motion/react';

interface ReviewProps {
  history: CharacterInfo[];
  dailyGoal: number;
  onUpdateGoal: (goal: number) => void;
  onReviewComplete: (character: string) => void;
  speak: (text: string, times?: number) => void;
}

export const Review: React.FC<ReviewProps> = ({ history, dailyGoal, onUpdateGoal, onReviewComplete, speak }) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeReviewIndex, setActiveReviewIndex] = useState<number | null>(null);

  // Ebbinghaus Forgetting Curve Logic (Simplified)
  // We prioritize characters that haven't been reviewed in a while
  const getReviewTasks = () => {
    const now = Date.now();
    return history
      .filter(item => item.nextReviewAt <= now)
      .sort((a, b) => a.nextReviewAt - b.nextReviewAt)
      .slice(0, dailyGoal);
  };

  const tasks = getReviewTasks();

  const handleComplete = (char: string) => {
    onReviewComplete(char);
    if (activeReviewIndex !== null && activeReviewIndex < tasks.length - 1) {
      setActiveReviewIndex(activeReviewIndex + 1);
    } else {
      setActiveReviewIndex(null);
    }
  };

  if (activeReviewIndex !== null && tasks[activeReviewIndex]) {
    const currentTask = tasks[activeReviewIndex];
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setActiveReviewIndex(null)}
            className="text-orange-600 font-medium flex items-center gap-1"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            返回列表
          </button>
          <span className="text-sm text-gray-500">复习进度: {activeReviewIndex + 1} / {tasks.length}</span>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-8 rounded-3xl shadow-sm border border-orange-100 flex flex-col items-center"
        >
          <div className="mb-6 text-center">
            <h2 className="text-4xl font-serif font-bold text-gray-900">{currentTask.character}</h2>
            <p className="text-xl text-orange-600 font-medium tracking-widest">{currentTask.pinyin}</p>
          </div>
          
          <HanziDisplay character={currentTask.character} size={250} />

          <div className="mt-8 flex gap-4">
            <button 
              onClick={() => speak(currentTask.character, 1)}
              className="px-6 py-3 bg-blue-50 text-blue-600 rounded-full font-bold flex items-center gap-2 hover:bg-blue-100 transition-colors"
            >
              <PlayCircle className="w-5 h-5" />
              听读音
            </button>
            <button 
              onClick={() => handleComplete(currentTask.character)}
              className="px-8 py-3 bg-green-500 text-white rounded-full font-bold flex items-center gap-2 hover:bg-green-600 transition-all shadow-md active:scale-95"
            >
              <CheckCircle2 className="w-5 h-5" />
              掌握了
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-orange-800 font-bold text-xl">
          <BookOpen className="w-6 h-6" />
          <span>今日复习任务</span>
        </div>
        <button 
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          className="p-2 text-gray-400 hover:text-orange-500 transition-colors"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 mb-4">
              <label className="block text-sm font-bold text-orange-800 mb-2">每日复习个数 (1-99)</label>
              <div className="flex items-center gap-4">
                <input 
                  type="range" 
                  min="1" 
                  max="99" 
                  value={dailyGoal}
                  onChange={(e) => onUpdateGoal(parseInt(e.target.value))}
                  className="flex-1 accent-orange-500"
                />
                <span className="w-12 text-center font-bold text-orange-600 bg-white rounded-lg py-1 border border-orange-200">
                  {dailyGoal}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {tasks.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border-2 border-dashed border-orange-100 flex flex-col items-center justify-center text-gray-400">
          <CheckCircle2 className="w-16 h-16 mb-4 opacity-10 text-green-500" />
          <p className="text-lg font-medium">太棒了！今日任务已全部完成</p>
          <p className="text-sm mt-2">休息一下，明天再来吧</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {tasks.map((task, index) => (
            <button
              key={task.character}
              onClick={() => setActiveReviewIndex(index)}
              className="bg-white p-4 rounded-2xl border border-orange-100 flex items-center justify-between hover:border-orange-300 transition-all group"
            >
              <div className="flex items-center gap-4">
                <span className="text-3xl font-serif text-gray-800">{task.character}</span>
                <div className="text-left">
                  <p className="text-sm font-bold text-gray-900">{task.character}</p>
                  <p className="text-xs text-gray-500">{task.pinyin}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-orange-400 font-medium">复习次数: {task.reviewCount}</span>
                <ChevronRight className="w-5 h-5 text-orange-200 group-hover:text-orange-500 transition-colors" />
              </div>
            </button>
          ))}
          <button 
            onClick={() => setActiveReviewIndex(0)}
            className="mt-4 w-full py-4 bg-orange-500 text-white rounded-2xl font-bold text-lg shadow-lg hover:bg-orange-600 active:scale-[0.98] transition-all"
          >
            开始复习
          </button>
        </div>
      )}
    </div>
  );
};
