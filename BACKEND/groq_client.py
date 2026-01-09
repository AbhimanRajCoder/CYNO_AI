"""
Groq LLM Client - Replacement for Ollama
Provides a unified interface for LLM calls using Groq API
"""
import os
from groq import Groq
from typing import Dict, Any, List, Optional

# Initialize Groq client
_client: Optional[Groq] = None


def get_groq_client() -> Groq:
    """Get or create the Groq client singleton."""
    global _client
    if _client is None:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY environment variable is not set")
        _client = Groq(api_key=api_key)
    return _client


def groq_chat(
    model: str,
    messages: List[Dict[str, str]],
    temperature: float = 0.1,
    max_tokens: int = 4096,
    response_format: Optional[Dict[str, str]] = None
) -> Dict[str, Any]:
    """
    Call Groq API with Ollama-compatible interface.
    
    Args:
        model: Model name (e.g., 'llama-3.3-70b-versatile', 'mixtral-8x7b-32768')
        messages: List of message dicts with 'role' and 'content'
        temperature: Sampling temperature (0.0-1.0)
        max_tokens: Maximum tokens to generate
        response_format: Optional format specification (e.g., {"type": "json_object"})
    
    Returns:
        Dict with 'message' containing 'content' key (Ollama-compatible format)
    """
    client = get_groq_client()
    
    # Build API call kwargs
    kwargs = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }
    
    # Add JSON mode if requested
    if response_format:
        kwargs["response_format"] = response_format
    
    # Make the API call
    response = client.chat.completions.create(**kwargs)
    
    # Return in Ollama-compatible format
    return {
        "message": {
            "content": response.choices[0].message.content,
            "role": response.choices[0].message.role
        }
    }


def list_models() -> Dict[str, Any]:
    """List available Groq models (static list since Groq doesn't have a list endpoint)."""
    return {
        "models": [
            {"name": "llama-3.3-70b-versatile"},
            {"name": "llama-3.1-8b-instant"},
            {"name": "mixtral-8x7b-32768"},
            {"name": "gemma2-9b-it"},
        ]
    }
