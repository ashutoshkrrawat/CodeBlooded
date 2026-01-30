#this is the foundation of all Model class

import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer
import logging
from typing import Dict, Any

# Setting up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class BaseModel:
    
    def __init__(self, model_name: str, max_length: int = 256):
        """
        Initializing a base model
        
        Args:
            model_name: HuggingFace model path 
            max_length: Maximum token length for input text
        """
        self.model_name = model_name
        self.max_length = max_length
        self.model = None
        self.tokenizer = None
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        logger.info(f"Initialized {self.__class__.__name__} with model: {model_name}")
        
    def load(self) -> 'BaseModel':
        """
        Lazy load the model and tokenizer from HuggingFace
        
        Returns:
            self: For method chaining
        """
        if self.model is None:
            try:
                logger.info(f"Loading model: {self.model_name}")
                
                # Load tokenizer
                self.tokenizer = AutoTokenizer.from_pretrained(
                    self.model_name,
                    use_fast=True
                )
                
                # Load model
                self.model = AutoModelForSequenceClassification.from_pretrained(
                    self.model_name,
                    num_labels=2  # Default, can be overridden in child classes
                )
                
                # Move to GPU if available
                self.model.to(self.device)
                self.model.eval()  # Set to evaluation mode
                
                logger.info(f"Successfully loaded {self.model_name} on {self.device}")
                
            except Exception as e:
                logger.error(f"Failed to load model {self.model_name}: {str(e)}")
                raise RuntimeError(f"Model loading failed: {str(e)}")
        
        return self
    
    def preprocess(self, text: str) -> Dict[str, torch.Tensor]:
        """
        Preprocess text for model input
        
        Args:
            text: Input text to process
            
        Returns:
            Dictionary of tokenized inputs
        """
        if self.tokenizer is None:
            self.load()
            
        try:
            # Tokenize the text
            inputs = self.tokenizer(
                text,
                truncation=True,
                max_length=self.max_length,
                padding='max_length',
                return_tensors="pt"
            )
            
            # Move to same device as model
            inputs = {key: value.to(self.device) for key, value in inputs.items()}
            
            return inputs
            
        except Exception as e:
            logger.error(f"Text preprocessing failed: {str(e)}")
            raise ValueError(f"Text preprocessing error: {str(e)}")
    
    def predict(self, text: str) -> Dict[str, Any]:
        """
        Abstract prediction method - must be implemented by child classes
        
        Args:
            text: Input text
            
        Returns:
            Dictionary with prediction results
            
        Raises:
            NotImplementedError: Must be implemented in child class
        """
        raise NotImplementedError("Child classes must implement predict() method")
    
    def batch_predict(self, texts: list) -> list:
        """
        Predict on multiple texts (optional, for efficiency)
        
        Args:
            texts: List of input texts
            
        Returns:
            List of prediction results
        """
        results = []
        for text in texts:
            try:
                result = self.predict(text)
                results.append(result)
            except Exception as e:
                logger.error(f"Failed to process text: {text[:50]}... Error: {str(e)}")
                results.append({"error": str(e), "text": text[:100]})
        
        return results
    
    def __call__(self, text: str) -> Dict[str, Any]:
        """Make the model callable like a function"""
        return self.predict(text)
    
    def __repr__(self) -> str:
        """String representation of the model"""
        status = "loaded" if self.model is not None else "not loaded"
        return f"{self.__class__.__name__}(model={self.model_name}, status={status})"