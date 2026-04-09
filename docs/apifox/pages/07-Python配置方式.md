# Python 配置方式

## OpenAI 官方 SDK

```python
from openai import OpenAI

client = OpenAI(
    api_key="sk-your-token",
    base_url="https://gmapi.fun/v1",
)

resp = client.chat.completions.create(
    model="your-chat-model",
    messages=[
        {"role": "system", "content": "你是一个简洁的技术助手。"},
        {"role": "user", "content": "介绍一下 G-Master API。"},
    ],
)

print(resp.choices[0].message.content)
```

请将 `your-chat-model` 替换为控制台可见且令牌允许访问的模型名。

## Python Embeddings 示例

```python
from openai import OpenAI

client = OpenAI(
    api_key="sk-your-token",
    base_url="https://gmapi.fun/v1",
)

resp = client.embeddings.create(
    model="text-embedding-3-small",
    input="G-Master API 是统一的 AI 模型接入网关",
)

print(len(resp.data[0].embedding))
```

## Python 图片生成示例

```python
from openai import OpenAI

client = OpenAI(
    api_key="sk-your-token",
    base_url="https://gmapi.fun/v1",
)

resp = client.images.generate(
    model="gpt-image-1",
    prompt="一张蓝紫色的科技风 AI 控制台海报",
)

print(resp.data[0].url)
```
