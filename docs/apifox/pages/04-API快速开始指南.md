# API 快速开始指南

## 1. 准备令牌

先在 `G-Master API` 控制台创建一个可用令牌，记下形如 `sk-xxxxxx` 的密钥。

## 2. 确认基址

- OpenAI 兼容调用：`https://gmapi.fun/v1`
- 用户中心接口：`https://gmapi.fun/api`

## 3. 测试模型列表

```bash
curl https://gmapi.fun/v1/models \
  -H "Authorization: Bearer sk-your-token"
```

## 4. 发起一次聊天请求

```bash
curl https://gmapi.fun/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-your-token" \
  -d '{
    "model": "your-chat-model",
    "messages": [
      {
        "role": "user",
        "content": "你好，介绍一下你自己"
      }
    ]
  }'
```

## 5. 流式调用示例

```bash
curl https://gmapi.fun/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-your-token" \
  -d '{
    "model": "your-chat-model",
    "stream": true,
    "messages": [
      {
        "role": "user",
        "content": "请用 3 句话总结 G-Master API"
      }
    ]
  }'
```

建议先通过 `GET /v1/models` 确认可用模型，再把 `your-chat-model` 替换为实际模型名。

## 6. 常见错误

- `401`：令牌无效或未传 `Authorization`
- `429`：请求频率或额度受限
- `500`：上游或网关内部错误，建议检查模型名和请求参数
