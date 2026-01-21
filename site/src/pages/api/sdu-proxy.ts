// site/src/pages/api/sdu-proxy.ts
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 从环境变量获取SDU AI配置（这不会暴露给前端）
    const apiKey = process.env.SDU_API_KEY;
    const apiUrl = process.env.SDU_API_URL;
    const model = process.env.SDU_MODEL;
    
    if (!apiKey || !apiUrl || !model) {
      return res.status(500).json({ error: 'SDU API configuration not complete' });
    }

    // 获取前端发送的消息数据
    const { messages, stream } = req.body;

    // 调用SDU AI API - 使用环境变量中的配置
    const response = await fetch(`${apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages,
        stream: stream,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json(errorData);
    }

    // 如果是流式响应，直接转发原始响应
    if (stream && response.body) {
      // 设置 SSE 必要的响应头
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no'); // 禁用 Nginx 缓冲
      
      // 直接转发流式响应体 - 原样传输每个 chunk
      const reader = response.body.getReader();
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            res.end();
            break;
          }
          
          // 直接写入原始字节，立即转发
          res.write(value);
        }
      } catch (streamError) {
        console.error('Stream error:', streamError);
        reader.releaseLock();
        if (!res.writableEnded) {
          res.end();
        }
      }
    } else {
      // 非流式响应，返回JSON数据
      const data = await response.json();
      return res.status(200).json(data);
    }
  } catch (error) {
    console.error('SDU AI proxy error:', error);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}

// 配置 API route
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // 增加请求体大小限制
    },
    responseLimit: false, // 禁用响应大小限制（流式传输需要）
  },
};