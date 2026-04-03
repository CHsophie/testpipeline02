import { Handler } from "@netlify/functions";
import OpenAI from "openai";

const handler: Handler = async (event) => {
  // 只允许 POST 请求
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { speechText, mode } = JSON.parse(event.body || "{}");
    const apiKey = process.env.DASHSCOPE_API_KEY;

    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "服务器未配置 DASHSCOPE_API_KEY，请在 Netlify 后台设置。" }),
      };
    }

    const openai = new OpenAI({
      apiKey: apiKey,
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
            ? `请将以下文本转换为文字并标注拼音。
用户输入: "${speechText}"

请严格按照以下 JSON 格式返回:
{
  "text": "转换后的完整文字",
  "pinyin": "每个汉字对应的拼音，用空格隔开"
}`
            : `提取出用户想要查询的那个汉字。
用户输入: "${speechText}"

规则:
1. 如果用户是在询问某个汉字怎么写、读音、或者关于某个汉字的学习，提取该汉字。
2. 如果用户的输入与学习汉字无关（例如：闲聊、问天气、讲故事、数学题等），请将 isOffTopic 设置为 true。
3. 如果是查询汉字，请返回该汉字（必须是单个汉字）、其拼音，以及3-5个适合小朋友学习的常用词组。
4. 即使用户只说了一个词（如“老虎”），也请提取其中的核心汉字（如“虎”）。
5. 如果无法确定用户想查哪个字，或者用户说的是一段完整的话但没有明显的查字意图，请设置 isOffTopic 为 true。

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

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: response.choices[0].message.content || "{}",
    };
  } catch (error: any) {
    console.error("Netlify Function Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || "Internal Server Error" }),
    };
  }
};

export { handler };
