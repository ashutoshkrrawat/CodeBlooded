# models/crisis_detector.py 
import re
from typing import Dict, Any, List, Optional

try:
    import torch
    import torch.nn.functional as F
    from transformers import AutoModelForSequenceClassification, AutoTokenizer
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False

try:
    from ..utils.config import config
    from ..utils.logger import logger
except ImportError:
    # For direct execution
    import sys
    import os
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from utils.config import config
    from utils.logger import logger
import math

class CrisisDetector:
    """Step 3: Detect if text is about a crisis"""
    
    def __init__(self):
        self.crisis_keywords = config.CRISIS_KEYWORDS
        self.non_crisis_keywords = config.NON_CRISIS_KEYWORDS

        self.model_name = config.CRISIS_DETECTION_MODEL
        self.model = None
        self.tokenizer = None
        
        # Pre-compile regex patterns for exact word matching
        self.crisis_patterns = self._compile_keyword_patterns(self.crisis_keywords)
        self.non_crisis_patterns = self._compile_keyword_patterns(self.non_crisis_keywords)
    
    def _compile_keyword_patterns(self, keywords: List[str]) -> List[re.Pattern]:
        """Compile keyword patterns with word boundaries"""
        patterns = []
        for keyword in keywords:
            # Escape special regex characters and add word boundaries
            pattern = re.compile(r'\b{}\b'.format(re.escape(keyword)), re.IGNORECASE)
            patterns.append(pattern)
        return patterns
    
    def detect(self, text: str, threshold: Optional[float] = None) -> Dict[str, Any]:
        """Detect if text contains crisis information"""
        logger.info(f"Detecting crisis in text: {text[:50]}...")
        
        threshold = threshold or config.CRISIS_DETECTION_THRESHOLD
        
        # Clean and validate text
        cleaned_text = self._clean_text(text)
        if not self._validate_text(cleaned_text):
            return self._invalid_text_response(text)
        
        text_lower = cleaned_text.lower()
        
        # IMPROVED: Count crisis indicators with better scoring
        crisis_count = self._count_pattern_matches(text_lower, self.crisis_patterns)
        non_crisis_count = self._count_pattern_matches(text_lower, self.non_crisis_patterns)
        
        # IMPROVED: Check for strong crisis indicators
        strong_indicators = self._check_strong_indicators(text_lower)
        
        # Calculate base score with boost for strong indicators
        total_indicators = crisis_count + non_crisis_count
        if total_indicators == 0:
            base_score = 0.3  # Neutral
        else:
            base_score = crisis_count / total_indicators
        
        # Add bonus for strong indicators
        if strong_indicators:
            base_score = min(1.0, base_score + 0.3)
        
        # Adjust for keyword density
        text_length = len(text_lower.split())
        density_factor = self._calculate_density_factor(text_length, crisis_count)
        adjusted_score = min(1.0, base_score * (1 + density_factor))
        
        # Apply threshold
        is_crisis = adjusted_score >= threshold
        
        # Find exact evidence keywords
        found_keywords = self._find_keyword_matches(text_lower, self.crisis_patterns, self.crisis_keywords)
        
        return {
            "is_crisis": bool(is_crisis),
            "confidence": float(adjusted_score),
            "threshold": float(threshold),
            "keywords_found": found_keywords[:5],
            "keyword_counts": {
                "crisis_keywords": crisis_count,
                "non_crisis_keywords": non_crisis_count,
                "strong_indicators": strong_indicators
            },
            "explanation": self._generate_explanation(is_crisis, adjusted_score, found_keywords, threshold)
        }

    def _check_strong_indicators(self, text: str) -> int:
        """Check for strong crisis indicators"""
        strong_keywords = [
            # Fire
            "chemical fire", "factory fire", "industrial fire", "major fire",
            # Earthquake
            "earthquake magnitude", "magnitude", "epicenter", "seismic",
            # Cyclone
            "cyclone alert", "storm surge", "landfall", "wind speed",
            # General urgent
            "urgent", "emergency", "breaking", "alert", "warning"
        ]
        
        count = 0
        for keyword in strong_keywords:
            if keyword in text:
                count += 1
        
        return count
    
    def predict(self, text: str) -> Dict[str, Any]:
        """
        New method that uses HuggingFace model with better fallback
        """
        try:
            # Load model if not loaded
            if self.model is None:
                try:
                    self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
                    self.model = AutoModelForSequenceClassification.from_pretrained(self.model_name)
                except Exception as load_error:
                    logger.error(f"Failed to load HuggingFace model: {load_error}")
                    # IMMEDIATELY fallback to keyword-only
                    return self.detect(text)
            
            # Get neural network prediction
            inputs = self.tokenizer(
                text,
                truncation=True,
                max_length=256,
                padding=True,
                return_tensors="pt"
            )
            
            with torch.no_grad():
                outputs = self.model(**inputs)
                probabilities = F.softmax(outputs.logits, dim=-1)
                # For sentiment model: index 0 = negative (crisis), index 1 = positive
                crisis_prob = probabilities[0][0].item()
            
            # Also get keyword score
            keyword_result = self.detect(text)
            keyword_score = keyword_result["confidence"]
            
            # Use higher weight for keywords since model might be generic
            combined_score = (0.4 * crisis_prob) + (0.6 * keyword_score)  # 60% weight to keywords
            is_crisis = combined_score >= config.CRISIS_DETECTION_THRESHOLD
            
            return {
                "is_crisis": is_crisis,
                "confidence": combined_score,
                "score_breakdown": {
                    "neural_network": crisis_prob,
                    "keyword_score": keyword_score,
                    "keywords_found": keyword_result.get("keywords_found", [])
                },
                "model": self.model_name,
                "method": "hybrid"
            }
            
        except Exception as e:
            logger.error(f"HuggingFace model failed completely: {e}")
            # Fallback to keyword-only with boosted confidence
            keyword_result = self.detect(text)
            # Boost confidence for clear disaster keywords
            if any(word in text.lower() for word in ["landslide", "earthquake", "flood", "fire", "dead", "bodies"]):
                boosted_confidence = min(1.0, keyword_result["confidence"] + 0.3)
                return {
                    "is_crisis": True,
                    "confidence": boosted_confidence,
                    "score_breakdown": {
                        "neural_network": 0.0,
                        "keyword_score": boosted_confidence,
                        "keywords_found": keyword_result.get("keywords_found", [])
                    },
                    "model": "keyword_fallback",
                    "method": "keyword_boosted"
                }
            return self.detect(text)

    def _count_pattern_matches(self, text: str, patterns: List[re.Pattern]) -> int:
        """Count matches for compiled patterns"""
        count = 0
        for pattern in patterns:
            if pattern.search(text):
                count += 1
        return count
    
    def _find_keyword_matches(self, text: str, patterns: List[re.Pattern], keywords: List[str]) -> List[str]:
        """Find which keywords matched"""
        found = []
        for pattern, keyword in zip(patterns, keywords):
            if pattern.search(text):
                found.append(keyword)
        return found
    
    def _calculate_density_factor(self, text_length: int, keyword_count: int) -> float:
        """Calculate density factor with log scaling for longer texts"""
        if text_length == 0 or keyword_count == 0:
            return 0.0
        
        # Base density
        base_density = keyword_count / text_length
        
        # Apply log scaling for longer texts
        if text_length > 100:
            log_factor = math.log(text_length / 100 + 1) / 5
            return min(0.5, base_density + log_factor)
        else:
            return min(0.5, base_density)
    
    def _clean_text(self, text: str) -> str:
        """Clean input text"""
        if not isinstance(text, str):
            return ""
        
        # Remove extra whitespace
        text = ' '.join(text.split())
        
        # Remove URLs
        text = re.sub(r'http\S+|www\S+|https\S+', '', text)
        
        # Remove mentions and hashtags
        text = re.sub(r'@\w+|#\w+', '', text)
        
        return text.strip()
    
    def _validate_text(self, text: str) -> bool:
        """Validate text for processing"""
        if not text:
            return False
        
        if len(text.split()) < config.MIN_TEXT_LENGTH:
            logger.warning(f"Text too short: {len(text.split())} words")
            return False
        
        if len(text) > config.MAX_TEXT_LENGTH:
            logger.warning(f"Text too long: {len(text)} chars, truncating")
            return True  # We'll process truncated version
        
        return True
    
    def _invalid_text_response(self, text: str) -> Dict[str, Any]:
        """Response for invalid text"""
        return {
            "is_crisis": False,
            "confidence": 0.0,
            "threshold": config.CRISIS_DETECTION_THRESHOLD,
            "keywords_found": [],
            "error": "Invalid or insufficient text",
            "explanation": "Text is too short or invalid for crisis detection"
        }
    
    def _generate_explanation(self, is_crisis: bool, score: float, 
                            keywords: List[str], threshold: float) -> str:
        """Generate explanation for detection result"""
        if score >= 0.9:
            level = "Very high confidence"
        elif score >= 0.8:
            level = "High confidence"
        elif score >= threshold:
            level = "Moderate confidence"
        else:
            level = "Low confidence"
        
        if keywords:
            keyword_str = ", ".join(keywords[:3])
            explanation = f"{level}: Found crisis keywords ({keyword_str})"
        else:
            explanation = f"{level}: Limited crisis indicators found"
        
        if is_crisis:
            explanation += f". Score {score:.1%} exceeds threshold {threshold:.1%}."
        else:
            explanation += f". Score {score:.1%} below threshold {threshold:.1%}."
        
        return explanation
    
    def detect_batch(self, texts: List[str]) -> List[Dict[str, Any]]:
        """Detect crises in multiple texts"""
        return [self.detect(text) for text in texts]

    def _clean_text(self, text: str) -> str:
        """Clean input text - remove emojis and special characters"""
        if not isinstance(text, str):
            return ""
        
        # Remove emojis and special Unicode characters
        text = re.sub(r'[^\x00-\x7F]+', '', text)  # Remove non-ASCII
        
        # Remove URLs
        text = re.sub(r'http\S+|www\S+|https\S+', '', text)
        
        # Remove mentions and hashtags
        text = re.sub(r'@\w+|#\w+', '', text)
        
        # Remove extra whitespace
        text = ' '.join(text.split())
        
        return text.strip()
    
