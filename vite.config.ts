import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import OpenAI from 'openai';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  const dashscopeKey = env.DASHSCOPE_API_KEY || process.env.DASHSCOPE_API_KEY || '';
  
  return {
    plugins: [
      react(), 
      tailwindcss(),
      // Dev-time Netlify Function Simulation
      {
        name: 'netlify-function-sim',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url?.startsWith('/.netlify/functions/qwen-proxy')) {
              if (req.method !== 'POST') {
                res.statusCode = 405;
                res.end('Method Not Allowed');
                return;
              }

              let body = '';
              req.on('data', chunk => { body += chunk; });
              req.on('end', async () => {
                try {
                  const { speechText, mode } = JSON.parse(body || '{}');
                  if (!dashscopeKey) {
                    res.statusCode = 500;
                    res.end(JSON.stringify({ error: "DASHSCOPE_API_KEY is missing in preview environment." }));
                    return;
                  }

                  const openai = new OpenAI({
                    apiKey: dashscopeKey,
                    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
                  });

                  const isSentenceMode = mode === 'sentence';

                  const response = await openai.chat.completions.create({
                    model: "qwen-plus",
                    messages: [
                      { 
                        role: "system", 
                        content: isSentenceMode 
                          ? "你是一个汉字学习助手。请将用户输入的语音文本转换为正确的文字，并为每个汉字标注拼音。请返回 JSON 格式的数据。"
                          : "你是一个汉字学习助手。请从用户的输入中提取出用户想要查询的那个汉字，并返回 JSON 格式的数据。" 
                      },
                      { 
                        role: "user", 
                        content: isSentenceMode
                          ? `请将以下文本转换为文字并标注拼音。用户输入: "${speechText}"。返回格式: {"text": "...", "pinyin": "..."}`
                          : `提取出用户想要查询的那个汉字。用户输入: "${speechText}"。返回格式: {"character": "...", "pinyin": "...", "phrases": [...], "isOffTopic": ...}`
                      }
                    ],
                    response_format: { type: "json_object" }
                  });

                  res.setHeader('Content-Type', 'application/json');
                  res.end(response.choices[0].message.content || "{}");
                } catch (err: any) {
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: err.message }));
                }
              });
              return;
            }
            next();
          });
        }
      }
    ],
    base: './',
    define: {
      'process.env.DASHSCOPE_API_KEY': JSON.stringify(dashscopeKey),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
