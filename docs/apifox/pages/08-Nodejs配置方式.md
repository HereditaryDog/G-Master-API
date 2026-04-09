# Node.js 配置方式

## OpenAI SDK

```javascript
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "sk-your-token",
  baseURL: "https://gmapi.fun/v1",
});

const resp = await client.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [
    { role: "system", content: "你是一个简洁的技术助手。" },
    { role: "user", content: "介绍一下 G-Master API。" },
  ],
});

console.log(resp.choices[0].message.content);
```

## Responses API 示例

```javascript
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "sk-your-token",
  baseURL: "https://gmapi.fun/v1",
});

const resp = await client.responses.create({
  model: "gpt-4.1-mini",
  input: "请总结 Responses API 的用法。",
});

console.log(resp.output_text);
```

## Embeddings 示例

```javascript
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "sk-your-token",
  baseURL: "https://gmapi.fun/v1",
});

const resp = await client.embeddings.create({
  model: "text-embedding-3-small",
  input: "G-Master API 是统一的 AI 模型接入网关",
});

console.log(resp.data[0].embedding.length);
```
