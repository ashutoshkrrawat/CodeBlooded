"""
Gemini API Client using NEW google-genai package
"""

import google.genai as genai  # NEW IMPORT
import os
from typing import Dict, Any, Optional

class GeminiClient:
    """Client for Gemini API using new google-genai package"""
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize Gemini client
        
        Args:
            api_key: Gemini API key. If None, tries GEMINI_API_KEY env var
        """
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        
        if not self.api_key:
            raise ValueError(
                "Gemini API key not provided. "
                "Set GEMINI_API_KEY environment variable or pass api_key parameter."
            )
        
        # Initialize client with NEW SYNTAX
        self.client = genai.Client(api_key=self.api_key)
        
        # Use gemini-2.0-flash or gemini-1.5-flash
        self.model_name = "gemini-2.0-flash"  # Fast and capable
        
        print(f"✅ Gemini API configured with {self.model_name}")
        print(f"   Key: {self.api_key[:12]}...{self.api_key[-4:]}")
    
    def generate_content(self, prompt: str) -> Dict[str, Any]:
        """
        Generate content using Gemini API
        
        Args:
            prompt: Text prompt to send
            
        Returns:
            Dictionary with response and metadata
        """
        try:
            # NEW SYNTAX for generate_content
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt
            )
            
            return {
                "success": True,
                "text": response.text,
                "model": self.model_name,
                "usage": getattr(response, 'usage_metadata', {}),
                "full_response": response
            }
            
        except Exception as e:
            error_msg = str(e)
            
            # Try fallback model if first fails
            if "404" in error_msg or "not found" in error_msg:
                try:
                    self.model_name = "gemini-1.5-flash"
                    response = self.client.models.generate_content(
                        model=self.model_name,
                        contents=prompt
                    )
                    
                    return {
                        "success": True,
                        "text": response.text,
                        "model": self.model_name,
                        "usage": getattr(response, 'usage_metadata', {}),
                        "full_response": response
                    }
                    
                except Exception as e2:
                    error_msg = f"Primary model failed: {error_msg}. Fallback failed: {str(e2)}"
            
            return {
                "success": False,
                "error": error_msg,
                "model": self.model_name
            }
    
    def list_models(self) -> list:
        """List available models"""
        try:
            models = self.client.models.list()
            return [model.name for model in models]
        except:
            return []

# Singleton instance
_gemini_client = None

def get_gemini_client(api_key: Optional[str] = None) -> GeminiClient:
    """Get or create Gemini client instance"""
    global _gemini_client
    if _gemini_client is None:
        _gemini_client = GeminiClient(api_key=api_key)
    return _gemini_client