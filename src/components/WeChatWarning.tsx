import React from 'react';
import { Globe, MessageSquareOff, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';

export const WeChatWarning: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FFFBF0] flex flex-col items-center justify-center p-6 text-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white p-10 rounded-[3rem] shadow-xl border-4 border-orange-100 space-y-8"
      >
        <div className="relative">
          <div className="w-32 h-32 bg-orange-50 rounded-full flex items-center justify-center mx-auto">
            <MessageSquareOff className="w-16 h-16 text-orange-200" />
          </div>
          <motion.div 
            animate={{ 
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="absolute -top-2 -right-2 w-12 h-12 bg-red-500 rounded-2xl flex items-center justify-center shadow-lg"
          >
            <Globe className="text-white w-6 h-6" />
          </motion.div>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">暂不支持在微信中访问</h2>
          <p className="text-gray-500 leading-relaxed">
            为了确保语音识别和书写功能的最佳体验，<br />
            请点击右上角 <span className="font-bold text-orange-600">“...”</span> <br />
            选择 <span className="font-bold text-orange-600">“在浏览器中打开”</span>
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 text-sm font-medium text-orange-400">
          <ExternalLink className="w-4 h-4" />
          <span>小状元识字 · 陪伴孩子快乐成长</span>
        </div>
      </motion.div>
    </div>
  );
};
