import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API route for LLM extraction
  app.post("/api/extract", async (req, res) => {
    const { speechText } = req.body;
    const apiKey = process.env.DASHSCOPE_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "DASHSCOPE_API_KEY is not configured on the server." });
    }

    if (!speechText) {
      return res.status(400).json({ error: "speechText is required." });
    }

    const openai = new OpenAI({
      apiKey: apiKey,
      baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    });

    try {
      const response = await openai.chat.completions.create({
        model: "qwen-plus",
        messages: [
          {
            role: "system",
            content: "你是一个汉字学习助手。请从用户的输入中提取出用户想要查询的那个汉字，并返回 JSON 格式的数据。"
          },
          {
            role: "user",
            content: `提取出用户想要查询的那个汉字。
用户输入: "${speechText}"

规则:
1. 如果用户是在询问某个汉字怎么写、读音、或者关于某个汉字的学习，提取该汉字。
2. 如果用户的输入与学习汉字无关（例如：闲聊、问天气、讲故事、数学题等），请将 isOffTopic 设置为 true。
3. 如果是查询汉字，请返回该汉字（必须是单个汉字）、其拼音，以及3-5个适合小朋友学习的常用词组。
4. 即使用户只说了一个词（如“老虎”），也请提取其中的核心汉字（如“虎”）。
5. 如果无法确定用户想查哪个字，或者用户说的是一段完整的话但没有明显的查字意图，请设置 isOffTopic 为 true。

例如: "老虎的虎怎么写" -> { "character": "虎", "pinyin": "hǔ", "phrases": ["老虎", "小虎", "爬山虎"], "isOffTopic": false }
例如: "你好呀" -> { "character": "", "pinyin": "", "phrases": [], "isOffTopic": true }
例如: "草地的草" -> { "character": "草", "pinyin": "cǎo", "phrases": ["草地", "小草", "青草"], "isOffTopic": false }

请严格按照以下 JSON 格式返回:
{
  "character": "提取出的单个汉字",
  "pinyin": "该汉字的拼音",
  "phrases": ["词组1", "词组2", "词组3"],
  "isOffTopic": boolean
}`
          }
        ],
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content;
      if (!content) {
        return res.status(500).json({ error: "Empty response from Qwen." });
      }

      res.json(JSON.parse(content));
    } catch (error: any) {
      console.error("Qwen extraction error:", error);
      res.status(500).json({ error: error.message || "Failed to call Qwen API." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
