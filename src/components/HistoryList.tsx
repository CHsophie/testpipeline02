import React from 'react';
import { History, Trash2, ChevronRight } from 'lucide-react';
import { CharacterInfo } from '../services/llmService';

interface HistoryListProps {
  history: CharacterInfo[];
  onSelect: (item: CharacterInfo) => void;
  onClear: () => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({ history, onSelect, onClear }) => {
  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <History className="w-12 h-12 mb-2 opacity-20" />
        <p>暂无查询历史</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden">
      <div className="px-4 py-3 bg-orange-50 flex justify-between items-center border-b border-orange-100">
        <div className="flex items-center gap-2 text-orange-800 font-bold">
          <History className="w-5 h-5" />
          <span>查询历史</span>
        </div>
        <button 
          onClick={onClear}
          className="text-orange-400 hover:text-red-500 transition-colors"
          title="清空历史"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      <div className="divide-y divide-orange-50 max-h-[400px] overflow-y-auto">
        {history.map((item, index) => (
          <button
            key={`${item.character}-${index}`}
            onClick={() => onSelect(item)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-orange-50 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <span className="text-2xl font-serif text-gray-800">{item.character}</span>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900">{item.character}</p>
                <p className="text-xs text-gray-500">{item.pinyin}</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-orange-200 group-hover:text-orange-400 transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
};
