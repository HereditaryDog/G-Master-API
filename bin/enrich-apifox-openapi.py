#!/usr/bin/env python3

import json
import sys
from collections import OrderedDict
from pathlib import Path

TAG_ORDER = [
    "获取模型列表",
    "OpenAI格式(Chat)",
    "OpenAI格式(Responses)",
    "Claude格式(Messages)",
    "Gemini格式",
    "图片生成",
    "图片生成/OpenAI兼容格式",
    "图片生成/Qwen千问",
    "OpenAI音频(Audio)",
    "视频生成",
    "视频生成/Sora兼容格式",
    "视频生成/Kling格式",
    "视频生成/即梦格式",
    "OpenAI格式(Embeddings)",
    "文本补全(Completions)",
    "Moderations",
    "Realtime",
    "重排序(Rerank)",
    "系统",
    "用户登陆注册",
    "用户管理",
    "令牌管理",
    "数据统计",
    "日志",
    "任务",
    "两步验证",
    "安全验证",
    "充值",
]

TAG_DESCRIPTIONS = {
    "获取模型列表": "列出当前令牌可用的模型与能力，适合作为联调第一步。",
    "OpenAI格式(Chat)": "OpenAI Chat Completions 兼容接口，支持普通对话、流式输出、工具调用和多模态输入。",
    "OpenAI格式(Responses)": "OpenAI Responses API 兼容接口，适合统一推理、工具调用和网络搜索类场景。",
    "Claude格式(Messages)": "Anthropic Claude Messages 原生兼容接口。",
    "Gemini格式": "Google Gemini 原生兼容接口与模型列表。",
    "图片生成": "图片生成与编辑能力。",
    "图片生成/OpenAI兼容格式": "OpenAI 风格的图片生成接口。",
    "图片生成/Qwen千问": "千问风格图片接口。",
    "OpenAI音频(Audio)": "音频转写、语音合成等音频接口。",
    "视频生成": "统一视频生成接口。",
    "视频生成/Sora兼容格式": "Sora 风格视频生成接口。",
    "视频生成/Kling格式": "Kling 风格视频生成接口。",
    "视频生成/即梦格式": "即梦风格视频生成接口。",
    "OpenAI格式(Embeddings)": "向量化与 Embeddings 接口。",
    "文本补全(Completions)": "传统文本补全接口。",
    "Moderations": "内容安全审核接口。",
    "Realtime": "实时交互接口。",
    "重排序(Rerank)": "重排序与相关性打分接口。",
    "系统": "公开系统接口，如状态、模型与公告。",
    "用户登陆注册": "注册、登录、登出、支付与账户接入相关接口。",
    "用户管理": "用户侧个人信息与账户设置接口。",
    "令牌管理": "用户自助创建、修改、删除、查询令牌。",
    "数据统计": "用户侧仪表盘与统计数据接口。",
    "日志": "用户侧调用日志查询接口。",
    "任务": "异步任务与视频任务查询接口。",
    "两步验证": "2FA 状态、启用、禁用与备份码接口。",
    "安全验证": "附加验证流程接口。",
    "充值": "用户充值与支付相关接口。",
}

PARAMETER_EXAMPLES = {
    "p": 0,
    "page": 0,
    "page_size": 10,
    "size": 10,
    "id": 1,
    "token_id": 1,
    "task_id": "task_123456",
    "file_id": "file_123456",
    "fine_tune_id": "ft_123456",
    "model": "gpt-4o-mini",
    "Authorization": "Bearer sk-your-token",
    "New-Api-User": "1",
}

REQUEST_EXAMPLES = {
    ("post", "/v1/chat/completions"): {
        "model": "gpt-4o-mini",
        "messages": [
            {"role": "system", "content": "你是 G-Master API 的技术助手。"},
            {"role": "user", "content": "请用 3 句话介绍 G-Master API。"},
        ],
        "temperature": 0.7,
        "stream": False,
    },
    ("post", "/v1/responses"): {
        "model": "gpt-4.1-mini",
        "input": "请总结 OpenAI Responses API 与 Chat Completions 的区别。",
        "reasoning": {"effort": "medium"},
        "stream": False,
    },
    ("post", "/v1/responses/compact"): {
        "model": "gpt-4.1-mini",
        "input": "写一个简短的产品介绍。",
        "stream": False,
    },
    ("post", "/v1/messages"): {
        "model": "claude-3-5-sonnet-latest",
        "max_tokens": 1024,
        "messages": [
            {"role": "user", "content": "请介绍一下 Claude 接口调用方式。"}
        ],
    },
    ("post", "/v1/completions"): {
        "model": "gpt-3.5-turbo-instruct",
        "prompt": "请写一句欢迎语。",
        "max_tokens": 64,
        "temperature": 0.7,
    },
    ("post", "/v1/embeddings"): {
        "model": "text-embedding-3-small",
        "input": "G-Master API 是一个统一的 AI 模型中转网关。",
    },
    ("post", "/v1/engines/{model}/embeddings"): {
        "input": "G-Master API 是一个统一的 AI 模型中转网关。"
    },
    ("post", "/v1/audio/speech"): {
        "model": "gpt-4o-mini-tts",
        "input": "欢迎使用 G-Master API。",
        "voice": "alloy",
        "response_format": "mp3",
    },
    ("post", "/v1/audio/transcriptions"): {
        "file": "@speech.mp3",
        "model": "whisper-1",
        "language": "zh",
    },
    ("post", "/v1/audio/translations"): {
        "file": "@speech.mp3",
        "model": "whisper-1",
    },
    ("post", "/v1/images/generations"): {
        "model": "gpt-image-1",
        "prompt": "一张具有科技感的蓝紫色 AI 控制台首页横幅",
        "size": "1024x1024",
    },
    ("post", "/v1/images/edits"): {
        "model": "gpt-image-1",
        "prompt": "将背景改成蓝紫渐变，并增强科技感",
        "image": "@input.png",
    },
    ("post", "/v1/video/generations"): {
        "model": "sora",
        "prompt": "宇航员从飞船舱门走出，镜头缓慢推进",
        "duration": 5,
        "n": 1,
    },
    ("post", "/v1/videos"): {
        "model": "sora",
        "prompt": "宇航员从飞船舱门走出，镜头缓慢推进",
        "duration": 5,
        "n": 1,
    },
    ("post", "/kling/v1/videos/text2video"): {
        "model": "kling-v1",
        "prompt": "一只机械鸟在赛博朋克城市上空飞行",
        "duration": 5,
    },
    ("post", "/kling/v1/videos/image2video"): {
        "model": "kling-v1",
        "image": "https://example.com/input.png",
        "prompt": "让图片中的角色向前走一步",
        "duration": 5,
    },
    ("post", "/v1/rerank"): {
        "model": "rerank-english-v2.0",
        "query": "G-Master API 如何创建令牌？",
        "documents": [
            "在控制台的令牌管理页面可以创建新令牌。",
            "模型调用地址是 https://gmapi.fun/v1。",
            "嵌入接口兼容 OpenAI 格式。",
        ],
        "top_n": 2,
    },
    ("post", "/v1/moderations"): {
        "model": "text-moderation-latest",
        "input": "请帮我判断这段文本是否包含违规内容。",
    },
    ("post", "/api/user/register"): {
        "username": "demo_user",
        "password": "StrongPass123!",
        "password2": "StrongPass123!",
        "email": "demo@example.com",
        "verification_code": "123456",
    },
    ("post", "/api/user/login"): {
        "username": "demo_user",
        "password": "StrongPass123!",
    },
    ("post", "/api/user/login/2fa"): {
        "username": "demo_user",
        "password": "StrongPass123!",
        "code": "123456",
    },
    ("post", "/api/token/"): {
        "name": "默认业务令牌",
        "remain_quota": 500000,
        "expired_time": -1,
        "unlimited_quota": False,
    },
    ("put", "/api/token/"): {
        "id": 1,
        "name": "默认业务令牌",
        "remain_quota": 800000,
        "expired_time": -1,
        "unlimited_quota": False,
        "status": 1,
    },
    ("put", "/api/user/self"): {
        "display_name": "G-Master 用户",
        "password": "NewStrongPass123!",
        "original_password": "StrongPass123!",
    },
    ("put", "/api/user/setting"): {
        "email": "demo@example.com",
        "display_in_currency": True,
        "quota_display_type": "USD",
    },
    ("post", "/api/user/topup"): {"redemption_code": "GM-DEMO-CODE"},
    ("post", "/api/user/pay"): {"amount": 100, "top_up_code": "CNY100"},
    ("post", "/api/user/stripe/pay"): {"amount": 100, "top_up_code": "CNY100"},
    ("post", "/api/user/creem/pay"): {"amount": 100, "top_up_code": "CNY100"},
    ("post", "/api/user/2fa/enable"): {"code": "123456"},
    ("post", "/api/user/2fa/disable"): {"code": "123456"},
    ("post", "/api/token/batch"): {
        "name_prefix": "批量令牌",
        "count": 10,
        "remain_quota": 100000,
        "expired_time": -1,
    },
    ("post", "/v1/files"): {
        "purpose": "assistants",
        "file": "@knowledge.txt",
    },
    ("post", "/v1/fine-tunes"): {
        "model": "gpt-4o-mini",
        "training_file": "file_123456",
        "suffix": "gmaster-demo",
    },
}

RESPONSE_EXAMPLES = {
    ("get", "/v1/models"): {
        "object": "list",
        "data": [
            {"id": "gpt-4o-mini", "object": "model", "owned_by": "g-master-api"},
            {"id": "claude-3-5-sonnet-latest", "object": "model", "owned_by": "g-master-api"},
        ],
    },
    ("post", "/v1/chat/completions"): {
        "id": "chatcmpl_demo_001",
        "object": "chat.completion",
        "created": 1775643000,
        "model": "gpt-4o-mini",
        "choices": [
            {
                "index": 0,
                "message": {
                    "role": "assistant",
                    "content": "G-Master API 是一个统一的 AI 模型中转网关。它兼容多种上游接口格式。你可以通过统一基址快速完成接入。"
                },
                "finish_reason": "stop",
            }
        ],
        "usage": {"prompt_tokens": 24, "completion_tokens": 33, "total_tokens": 57},
    },
    ("post", "/v1/responses"): {
        "id": "resp_demo_001",
        "object": "response",
        "status": "completed",
        "model": "gpt-4.1-mini",
        "output": [
            {
                "type": "message",
                "role": "assistant",
                "content": [
                    {
                        "type": "output_text",
                        "text": "Responses API 更适合统一处理推理、工具和多轮状态。",
                    }
                ],
            }
        ],
        "usage": {"input_tokens": 18, "output_tokens": 20, "total_tokens": 38},
    },
    ("post", "/v1/responses/compact"): {
        "id": "resp_demo_002",
        "model": "gpt-4.1-mini",
        "output_text": "这是一段简短的产品介绍。",
    },
    ("post", "/v1/messages"): {
        "id": "msg_demo_001",
        "type": "message",
        "role": "assistant",
        "model": "claude-3-5-sonnet-latest",
        "content": [{"type": "text", "text": "这是 Claude 原生格式响应示例。"}],
        "stop_reason": "end_turn",
        "usage": {"input_tokens": 18, "output_tokens": 22},
    },
    ("post", "/v1/completions"): {
        "id": "cmpl_demo_001",
        "object": "text_completion",
        "model": "gpt-3.5-turbo-instruct",
        "choices": [{"text": "欢迎使用 G-Master API。", "index": 0, "finish_reason": "stop"}],
    },
    ("post", "/v1/embeddings"): {
        "object": "list",
        "data": [{"object": "embedding", "index": 0, "embedding": [0.0123, -0.0456, 0.0789]}],
        "model": "text-embedding-3-small",
        "usage": {"prompt_tokens": 9, "total_tokens": 9},
    },
    ("post", "/v1/engines/{model}/embeddings"): {
        "object": "list",
        "data": [{"object": "embedding", "index": 0, "embedding": [0.0123, -0.0456, 0.0789]}],
        "model": "text-embedding-3-small",
        "usage": {"prompt_tokens": 9, "total_tokens": 9},
    },
    ("post", "/v1/audio/transcriptions"): {
        "text": "欢迎使用 G-Master API。"
    },
    ("post", "/v1/audio/translations"): {
        "text": "Welcome to G-Master API."
    },
    ("post", "/v1/images/generations"): {
        "created": 1775643000,
        "data": [
            {
                "url": "https://example.com/generated-image.png",
                "revised_prompt": "一张具有科技感的蓝紫色 AI 控制台首页横幅"
            }
        ],
    },
    ("post", "/v1/images/edits"): {
        "created": 1775643000,
        "data": [
            {
                "url": "https://example.com/edited-image.png",
                "revised_prompt": "将背景改成蓝紫渐变，并增强科技感"
            }
        ],
    },
    ("post", "/v1/video/generations"): {
        "id": "video_demo_001",
        "status": "queued",
        "model": "sora",
        "created_at": 1775643000,
    },
    ("get", "/v1/video/generations/{task_id}"): {
        "id": "video_demo_001",
        "status": "succeeded",
        "model": "sora",
        "output": ["https://example.com/output.mp4"],
    },
    ("post", "/v1/videos"): {
        "id": "video_demo_001",
        "status": "queued",
        "model": "sora",
        "created_at": 1775643000,
    },
    ("get", "/v1/videos/{task_id}"): {
        "id": "video_demo_001",
        "status": "succeeded",
        "model": "sora",
        "output": ["https://example.com/output.mp4"],
    },
    ("post", "/kling/v1/videos/text2video"): {
        "id": "kling_demo_001",
        "status": "queued",
        "model": "kling-v1",
    },
    ("get", "/kling/v1/videos/text2video/{task_id}"): {
        "id": "kling_demo_001",
        "status": "succeeded",
        "output": ["https://example.com/kling-output.mp4"],
    },
    ("post", "/kling/v1/videos/image2video"): {
        "id": "kling_demo_002",
        "status": "queued",
        "model": "kling-v1",
    },
    ("get", "/kling/v1/videos/image2video/{task_id}"): {
        "id": "kling_demo_002",
        "status": "succeeded",
        "output": ["https://example.com/kling-image2video.mp4"],
    },
    ("post", "/v1/rerank"): {
        "id": "rerank_demo_001",
        "results": [
            {"index": 0, "relevance_score": 0.993},
            {"index": 2, "relevance_score": 0.881},
        ],
    },
    ("post", "/v1/moderations"): {
        "id": "modr_demo_001",
        "model": "text-moderation-latest",
        "results": [{"flagged": False, "categories": {}, "category_scores": {}}],
    },
    ("get", "/v1beta/models"): {
        "models": [
            {"name": "models/gemini-2.5-flash", "displayName": "Gemini 2.5 Flash"},
            {"name": "models/gemini-2.5-pro", "displayName": "Gemini 2.5 Pro"},
        ]
    },
    ("post", "/v1beta/models/{model}:generateContent"): {
        "candidates": [
            {
                "content": {
                    "parts": [
                        {"text": "这是 Gemini 原生接口返回示例。"}
                    ]
                },
                "finishReason": "STOP",
            }
        ]
    },
    ("post", "/jimeng/"): {
        "task_id": "jimeng_demo_001",
        "status": "queued",
        "message": "任务已提交",
    },
    ("get", "/api/status"): {
        "success": True,
        "message": "",
        "data": {
            "system_name": "G-Master API",
            "server_address": "https://gmapi.fun",
            "version": "v0.12.1-gmaster.2",
            "top_up_link": "https://gmtoken.shop",
        },
    },
    ("get", "/api/status/test"): {
        "success": True,
        "message": "ok",
        "data": "pong",
    },
    ("get", "/api/notice"): {
        "success": True,
        "message": "",
        "data": [
            {"id": 1, "content": "公告板测试_Test_01", "type": "default"}
        ],
    },
    ("get", "/api/about"): {
        "success": True,
        "message": "",
        "data": {"content": "G-Master API 是一个统一的模型接入平台。"},
    },
    ("get", "/api/home_page_content"): {
        "success": True,
        "message": "",
        "data": {"hero_title": "G-Master API", "hero_subtitle": "统一模型接入与稳定调用"},
    },
    ("get", "/api/pricing"): {
        "success": True,
        "message": "",
        "data": [
            {"model_name": "gpt-4o-mini", "completion_ratio": 1.0, "prompt_ratio": 1.0}
        ],
    },
    ("get", "/api/models"): {
        "success": True,
        "message": "",
        "data": [
            {"id": 1, "model_name": "gpt-4o-mini", "enabled": True},
            {"id": 2, "model_name": "claude-3-5-sonnet-latest", "enabled": True},
        ],
    },
    ("post", "/api/user/register"): {
        "success": True,
        "message": "",
        "data": {"id": 1, "username": "demo_user"},
    },
    ("post", "/api/user/login"): {
        "success": True,
        "message": "",
        "data": {"access_token": "gm_access_token_demo", "user": {"id": 1, "username": "demo_user"}},
    },
    ("post", "/api/user/login/2fa"): {
        "success": True,
        "message": "",
        "data": {"access_token": "gm_access_token_demo", "user": {"id": 1, "username": "demo_user"}},
    },
    ("post", "/api/user/logout"): {"success": True, "message": "退出成功", "data": None},
    ("get", "/api/user/groups"): {"success": True, "message": "", "data": ["default", "vip"]},
    ("get", "/api/user/self/groups"): {"success": True, "message": "", "data": ["default"]},
    ("get", "/api/user/self"): {
        "success": True,
        "message": "",
        "data": {
            "id": 1,
            "username": "demo_user",
            "display_name": "G-Master 用户",
            "email": "demo@example.com",
            "quota": 500000,
            "used_quota": 12800,
            "request_count": 42,
        },
    },
    ("put", "/api/user/self"): {"success": True, "message": "更新成功", "data": True},
    ("get", "/api/user/models"): {"success": True, "message": "", "data": ["gpt-4o-mini", "claude-3-5-sonnet-latest"]},
    ("get", "/api/user/token"): {"success": True, "message": "", "data": "gm_access_token_demo"},
    ("put", "/api/user/setting"): {"success": True, "message": "设置已更新", "data": True},
    ("post", "/api/user/topup"): {"success": True, "message": "兑换成功", "data": {"quota": 600000}},
    ("get", "/api/user/topup/info"): {
        "success": True,
        "message": "",
        "data": {"enabled": True, "payment_methods": ["stripe", "creem"]},
    },
    ("get", "/api/user/topup/self"): {
        "success": True,
        "message": "",
        "data": [{"id": 1, "amount": 100, "status": "success"}],
    },
    ("post", "/api/user/pay"): {"success": True, "message": "", "data": {"pay_url": "https://example.com/pay/123"}},
    ("get", "/api/user/amount"): {"success": True, "message": "", "data": {"amount": 100, "currency": "CNY"}},
    ("post", "/api/user/stripe/pay"): {"success": True, "message": "", "data": {"checkout_url": "https://checkout.stripe.com/demo"}},
    ("get", "/api/user/stripe/amount"): {"success": True, "message": "", "data": {"amount": 100, "currency": "USD"}},
    ("post", "/api/user/creem/pay"): {"success": True, "message": "", "data": {"checkout_url": "https://pay.creem.io/demo"}},
    ("get", "/api/user/2fa/status"): {"success": True, "message": "", "data": {"enabled": False}},
    ("post", "/api/user/2fa/setup"): {"success": True, "message": "", "data": {"secret": "ABCDEF", "otpauth_url": "otpauth://totp/G-Master API:demo_user"}},
    ("post", "/api/user/2fa/enable"): {"success": True, "message": "2FA 已启用", "data": True},
    ("post", "/api/user/2fa/disable"): {"success": True, "message": "2FA 已关闭", "data": True},
    ("get", "/api/user/2fa/backup_codes"): {"success": True, "message": "", "data": ["ABCD-EFGH", "IJKL-MNOP"]},
    ("get", "/api/user/2fa/stats"): {"success": True, "message": "", "data": {"enabled_users": 12}},
    ("get", "/api/token/"): {
        "success": True,
        "message": "",
        "data": [
            {
                "id": 1,
                "name": "默认业务令牌",
                "key": "sk-demo-token",
                "status": 1,
                "remain_quota": 500000,
                "unlimited_quota": False,
            }
        ],
        "page": 0,
        "page_size": 10,
        "total": 1,
    },
    ("post", "/api/token/"): {"success": True, "message": "创建成功", "data": {"id": 2, "key": "sk-new-token"}},
    ("put", "/api/token/"): {"success": True, "message": "更新成功", "data": True},
    ("get", "/api/token/search"): {
        "success": True,
        "message": "",
        "data": [{"id": 1, "name": "默认业务令牌", "status": 1}],
    },
    ("delete", "/api/token/{id}"): {"success": True, "message": "删除成功", "data": True},
    ("post", "/api/token/batch"): {"success": True, "message": "批量创建成功", "data": {"count": 10}},
    ("post", "/v1/files"): {
        "id": "file_123456",
        "object": "file",
        "bytes": 2048,
        "purpose": "assistants",
        "filename": "knowledge.txt",
    },
    ("post", "/v1/fine-tunes"): {
        "id": "ft_123456",
        "object": "fine-tune",
        "model": "gpt-4o-mini",
        "status": "pending",
    },
    ("get", "/api/log/self/stat"): {
        "success": True,
        "message": "",
        "data": {"quota": 12800, "rpm": 0.12, "tpm": 9321, "request_count": 42},
    },
    ("get", "/api/log/self"): {
        "success": True,
        "message": "",
        "data": [{"id": 1, "model_name": "gpt-4o-mini", "token_name": "默认业务令牌", "quota": 120}],
    },
    ("get", "/api/log/self/search"): {
        "success": True,
        "message": "",
        "data": [{"id": 1, "model_name": "gpt-4o-mini", "token_name": "默认业务令牌", "quota": 120}],
    },
    ("get", "/api/data/self"): {
        "success": True,
        "message": "",
        "data": {
            "quota": 500000,
            "used_quota": 12800,
            "request_count": 42,
            "today_used_quota": 3200,
        },
    },
    ("get", "/api/mj/self"): {"success": True, "message": "", "data": []},
    ("get", "/api/task/self"): {
        "success": True,
        "message": "",
        "data": [{"id": 1, "type": "video", "status": "pending", "submit_time": 1775643000}],
    },
}

BINARY_RESPONSE_PATHS = {
    "/v1/audio/speech": ("audio/mpeg", "<binary audio stream>"),
    "/v1/files/{file_id}/content": ("application/octet-stream", "<binary file content>"),
    "/v1/videos/{task_id}/content": ("video/mp4", "<binary video stream>"),
}


def set_media_example(content: dict, example):
    if not content:
        content["application/json"] = {"schema": {"type": "object"}}
    media_type = "application/json"
    if media_type not in content:
        media_type = next(iter(content.keys()))
    content[media_type].setdefault("schema", {"type": "object"})
    content[media_type]["example"] = example


def ensure_binary_response(response: dict, media_type: str, example: str):
    response["content"] = {
        media_type: {
            "schema": {"type": "string", "format": "binary"},
            "example": example,
        }
    }


def path_sort_key(path_item):
    path, methods = path_item
    tags = []
    for method in methods.values():
        tags.extend(method.get("tags", []))
    first_tag = tags[0] if tags else "zzz"
    tag_rank = TAG_ORDER.index(first_tag) if first_tag in TAG_ORDER else 999
    path_priority = {
        "/v1/models": 1,
        "/v1/chat/completions": 2,
        "/v1/responses": 3,
        "/v1/messages": 4,
        "/v1/embeddings": 5,
        "/v1/images/generations": 6,
        "/v1/audio/transcriptions": 7,
        "/v1/video/generations": 8,
        "/api/status": 101,
        "/api/models": 102,
        "/api/user/login": 103,
        "/api/token/": 104,
        "/api/user/self": 105,
    }.get(path, 500)
    return (tag_rank, path_priority, path)


def enrich_parameters(operation):
    for parameter in operation.get("parameters", []):
        name = parameter.get("name")
        if name in PARAMETER_EXAMPLES:
            parameter.setdefault("schema", {})
            parameter["schema"]["example"] = PARAMETER_EXAMPLES[name]


def maybe_attach_request_example(method, path, operation):
    request_body = operation.get("requestBody")
    if not request_body:
        return
    content = request_body.get("content", {})
    if not content:
        return
    example = REQUEST_EXAMPLES.get((method, path))
    if example is None:
        return
    media_type = "application/json" if "application/json" in content else next(iter(content.keys()))
    content[media_type]["example"] = example


def maybe_attach_response_example(method, path, operation):
    response = operation.setdefault("responses", {}).setdefault("200", {"description": "成功"})
    if path in BINARY_RESPONSE_PATHS:
        media_type, example = BINARY_RESPONSE_PATHS[path]
        ensure_binary_response(response, media_type, example)
        return

    example = RESPONSE_EXAMPLES.get((method, path))
    if example is None:
        if method == "delete":
            example = {"success": True, "message": "操作成功", "data": True}
        elif path.startswith("/api/"):
            example = {"success": True, "message": "", "data": {}}
        elif path.startswith("/v1/"):
            example = {"id": "demo_id", "object": "response"}
        else:
            return

    content = response.setdefault("content", {})
    set_media_example(content, example)


def enrich_operation(method, path, operation):
    enrich_parameters(operation)
    maybe_attach_request_example(method, path, operation)
    maybe_attach_response_example(method, path, operation)

    if path.startswith("/v1/") or path.startswith("/kling/"):
        operation.setdefault(
            "description",
            "使用 `Authorization: Bearer sk-xxxxxx` 进行鉴权。",
        )
    elif path.startswith("/api/"):
        operation.setdefault(
            "description",
            "公开系统接口或用户中心接口。需要登录的接口请在 Apifox 环境中配置 `access_token` 和 `new_api_user`。",
        )


def rebuild_tags(spec):
    used_tags = []
    for methods in spec.get("paths", {}).values():
        for operation in methods.values():
            for tag in operation.get("tags", []):
                if tag not in used_tags:
                    used_tags.append(tag)

    def tag_rank(tag):
        return TAG_ORDER.index(tag) if tag in TAG_ORDER else 999

    sorted_tags = sorted(used_tags, key=lambda tag: (tag_rank(tag), tag))
    spec["tags"] = [
        {"name": tag, "description": TAG_DESCRIPTIONS.get(tag, "")}
        for tag in sorted_tags
    ]


def main():
    if len(sys.argv) != 2:
        raise SystemExit("usage: enrich-apifox-openapi.py <openapi-json>")

    path = Path(sys.argv[1])
    spec = json.loads(path.read_text())

    ordered_paths = OrderedDict()
    for route, methods in sorted(spec.get("paths", {}).items(), key=path_sort_key):
        ordered_methods = OrderedDict()
        for method_name, operation in methods.items():
            enrich_operation(method_name, route, operation)
            ordered_methods[method_name] = operation
        ordered_paths[route] = ordered_methods
    spec["paths"] = ordered_paths

    rebuild_tags(spec)

    path.write_text(json.dumps(spec, ensure_ascii=False, indent=2) + "\n")


if __name__ == "__main__":
    main()
