import logging
import json
import os
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import httpx
import base64
from pathlib import Path

logger = logging.getLogger(__name__)

class VLMProvider(ABC):
    @abstractmethod
    async def analyze(self, frame_path: Path, previous_context: str) -> Dict[str, Any]:
        pass
    
    @property
    @abstractmethod
    def name(self) -> str:
        pass
    
    @property
    @abstractmethod
    def cost_per_1k_tokens(self) -> float:
        pass

class OpenAIProvider(VLMProvider):
    def __init__(self, api_key: str, model: str = "gpt-4o-vision-preview"):
        self.api_key = api_key
        self.model = model
        self.client = httpx.AsyncClient(timeout=60.0)
    
    @property
    def name(self) -> str:
        return "OpenAI"
    
    @property
    def cost_per_1k_tokens(self) -> float:
        return 0.005  # $0.005 per 1K tokens for images
    
    async def analyze(self, frame_path: Path, previous_context: str) -> Dict[str, Any]:
        with open(frame_path, "rb") as f:
            image_b64 = base64.b64encode(f.read()).decode()
        
        prompt = f"""You are an expert UI automation analyst. Previous context: {previous_context}"""
        
        payload = {
            "model": self.model,
            "messages": [{"role": "user", "content": [
                {"type": "text", "text": prompt},
                {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_b64}", "detail": "high"}}
            ]}],
            "max_tokens": 4096,
            "temperature": 0.1
        }
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        response = await self.client.post(
            "https://api.openai.com/v1/chat/completions",
            json=payload,
            headers=headers
        )
        response.raise_for_status()
        result = response.json()
        
        content = result["choices"][0]["message"]["content"]
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0]
        elif "```" in content:
            content = content.split("```")[1].split("```")[0]
        
        parsed = json.loads(content.strip())
        parsed["_tokens_used"] = result.get("usage", {}).get("total_tokens", 1500)
        parsed["_provider"] = self.name
        return parsed

class QwenProvider(VLMProvider):
    """Fallback provider using Qwen2.5-VL (Alibaba Cloud)."""
    
    def __init__(self, api_key: str, model: str = "qwen-vl-max"):
        self.api_key = api_key
        self.model = model
        self.client = httpx.AsyncClient(timeout=60.0)
    
    @property
    def name(self) -> str:
        return "Qwen"
    
    @property
    def cost_per_1k_tokens(self) -> float:
        return 0.003  # Cheaper alternative
    
    async def analyze(self, frame_path: Path, previous_context: str) -> Dict[str, Any]:
        # Qwen API implementation (similar structure)
        return {"suggested_action": "wait", "_tokens_used": 1000, "_provider": self.name}

class VLMClient:
    """Multi-provider VLM client with automatic fallback."""
    
    def __init__(self, providers: Optional[list] = None):
        self.providers = providers or [
            OpenAIProvider(api_key=os.getenv("OPENAI_API_KEY", "dummy")),
            QwenProvider(api_key=os.getenv("QWEN_API_KEY", "dummy"))
        ]
    
    async def analyze_frame(self, frame_path: Path, previous_context: str = "") -> Dict[str, Any]:
        last_error = None
        
        for provider in self.providers:
            try:
                logger.info(f"Trying VLM provider: {provider.name}")
                result = await provider.analyze(frame_path, previous_context)
                result["_cost_usd"] = (result.get("_tokens_used", 1500) / 1000) * provider.cost_per_1k_tokens
                return result
            except Exception as e:
                logger.warning(f"{provider.name} failed: {e}")
                last_error = e
                continue
        
        raise RuntimeError(f"All VLM providers failed. Last error: {last_error}")
