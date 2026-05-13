# 图片生成异步任务接口

G-Master API 保留同步 OpenAI Images 兼容接口：

- `POST /v1/images/generations`

对于 `gpt-image-2` 等可能耗时较长的图片模型，客户端可以改用异步任务接口，避免浏览器、Cloudflare、反向代理或 API Gateway 的长连接超时。

## 创建图片任务

```http
POST /v1/images/generations/async
Authorization: Bearer sk-your-token
Content-Type: application/json
```

请求体与 OpenAI Images 兼容：

```json
{
  "model": "gpt-image-2",
  "prompt": "一张干净的桌面编程助手产品图",
  "size": "1024x1024",
  "n": 1
}
```

成功时立即返回 `202 Accepted`：

```json
{
  "id": "task_xxx",
  "job_id": "task_xxx",
  "object": "image.generation.job",
  "status": "queued",
  "created": 1778580000,
  "model": "gpt-image-2",
  "poll_url": "/v1/images/jobs/task_xxx"
}
```

## 查询任务

```http
GET /v1/images/jobs/task_xxx
Authorization: Bearer sk-your-token
```

处理中：

```json
{
  "id": "task_xxx",
  "job_id": "task_xxx",
  "object": "image.generation.job",
  "status": "running",
  "created": 1778580000,
  "started_at": 1778580001,
  "model": "gpt-image-2",
  "poll_url": "/v1/images/jobs/task_xxx"
}
```

成功时，`result` 中返回原始 OpenAI Images 兼容响应：

```json
{
  "id": "task_xxx",
  "job_id": "task_xxx",
  "object": "image.generation.job",
  "status": "succeeded",
  "created": 1778580000,
  "started_at": 1778580001,
  "finished_at": 1778580042,
  "model": "gpt-image-2",
  "poll_url": "/v1/images/jobs/task_xxx",
  "result": {
    "created": 1778580042,
    "data": [
      {
        "url": "https://example.com/image.png"
      }
    ]
  }
}
```

失败时，`error` 保持机器可读结构：

```json
{
  "id": "task_xxx",
  "job_id": "task_xxx",
  "object": "image.generation.job",
  "status": "failed",
  "model": "gpt-image-2",
  "error": {
    "type": "image_generation_timeout",
    "code": "upstream_timeout",
    "message": "gpt-image-2 image generation timed out upstream",
    "upstream_status": 524,
    "channel_id": 12,
    "model": "gpt-image-2",
    "elapsed_ms": 123456,
    "request_id": "..."
  }
}
```

## 客户端建议

- Gaster Code 绘图页优先使用 `POST /v1/images/generations/async`。
- 创建任务后轮询 `poll_url`，建议初始间隔 1 到 2 秒，随后退避到 3 到 5 秒。
- `status=succeeded` 时读取 `result`；`status=failed` 时读取 `error.code`、`error.type`、`error.request_id`。
- 同步接口仍然可用，但长耗时图片生成不建议依赖同步长连接。

## 计费与退款

- 创建任务时按当前模型、分组、令牌和订阅策略预扣额度。
- 任务成功后按现有图片生成计费逻辑结算。
- 任务失败或超时后通过异步任务退款逻辑退回预扣额度。
