# 常用 SDK 与客户端配置

## Python / OpenAI SDK

```python
from openai import OpenAI

client = OpenAI(
    api_key="sk-your-token",
    base_url="https://gmapi.fun/v1",
)

resp = client.chat.completions.create(
    model="your-chat-model",
    messages=[
        {"role": "user", "content": "你好"}
    ],
)

print(resp.choices[0].message.content)
```

## Node.js / OpenAI SDK

```javascript
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "sk-your-token",
  baseURL: "https://gmapi.fun/v1",
});

const resp = await client.chat.completions.create({
  model: "your-chat-model",
  messages: [{ role: "user", content: "你好" }],
});

console.log(resp.choices[0].message.content);
```

## Curl

```bash
curl https://gmapi.fun/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-your-token" \
  -d '{
    "model": "your-chat-model",
    "messages": [
      {
        "role": "user",
        "content": "你好"
      }
    ]
  }'
```

请将 `your-chat-model` 替换为控制台可见且令牌允许访问的模型名。

## Cherry Studio / ChatBox / 其他 OpenAI 兼容客户端

- Base URL：`https://gmapi.fun/v1`
- API Key：你的 `sk-` 令牌
- API 格式：选择 `OpenAI Compatible`

## Codex / Claude Code / 各类 Agent 工具

如果工具支持自定义 `base_url` 或 OpenAI 兼容协议，优先填写：

- `Base URL = https://gmapi.fun/v1`
- `API Key = sk-your-token`

如果工具要求单独填写模型名，请使用你在控制台可见且令牌允许访问的模型。
