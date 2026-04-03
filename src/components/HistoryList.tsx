import React from 'react';
import { History, Trash2, ChevronRight, Type } from 'lucide-react';
import { HistoryItem } from '../services/llmService';

interface HistoryListProps {
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onClear: () => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({ history, onSelect, onClear }) => {
  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400 bg-white rounded-3xl border border-orange-100 shadow-sm">
        <History className="w-12 h-12 mb-2 opacity-20" />
        <p>暂无查询历史</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-orange-100 overflow-hidden">
      <div className="px-6 py-4 bg-orange-50 flex justify-between items-center border-b border-orange-100">
        <div className="flex items-center gap-2 text-orange-800 font-bold">
          <History className="w-5 h-5" />
          <span>查询历史</span>
          <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full font-bold ml-2">
            {history.length}
          </span>
        </div>
        <button 
          onClick={onClear}
          className="text-orange-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-orange-100"
          title="清空历史"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
      <div className="divide-y divide-orange-50 max-h-[500px] overflow-y-auto">
        {history.map((item, index) => (
          <button
            key={`${item.lastSearchedAt}-${index}`}
            onClick={() => onSelect(item)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-orange-50 transition-colors group"
          >
            <div className="flex items-center gap-4 overflow-hidden">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0 ${item.type === 'character' ? 'bg-white border border-orange-100' : 'bg-blue-50 border border-blue-100'}`}>
                {item.type === 'character' ? (
                  <span className="text-2xl font-serif text-gray-800">{item.character}</span>
                ) : (
                  <Type className="w-6 h-6 text-blue-500" />
                )}
              </div>
              <div className="text-left overflow-hidden">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {item.type === 'character' ? item.character : item.text}
                  </p>
                  <span className="text-xs text-orange-500 font-medium flex-shrink-0">{item.pinyin}</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">
                  {new Date(item.lastSearchedAt).toLocaleString('zh-CN', { 
                    month: 'short', 
                    day: 'numeric', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-orange-200 group-hover:text-orange-400 transition-colors flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
};
