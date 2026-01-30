"""
Type Classifier - Identifies Flood, Fire, Earthquake, etc.
"""
import re
from typing import Dict, Any, List, Optional

try:
    from ..utils.config import config
except ImportError:
    import sys
    import os
    import logger
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from utils.config import config

class TypeClassifier:
    """Step 4: Classify type of crisis with improved scoring"""
    
    def __init__(self):
        self.type_keywords = config.TYPE_KEYWORDS
        
        # Generic words → moderate weight
        self.generic_keywords = {
            "water": 0.10,    # Increased for better scoring
            "wind": 0.10,
            "heat": 0.10,
            "rain": 0.15,
            "storm": 0.18,
            "fire": 0.18      # "fire" is actually a strong indicator
        }
        
        # Strong indicators → high weight
        self.strong_indicators = {
            "submerged": 0.30,
            "inundated": 0.30,
            "magnitude": 0.30,
            "epicenter": 0.30,
            "aftershock": 0.30,
            "contagious": 0.30,
            "starvation": 0.30,
            "arson": 0.30,
            "incendiary": 0.30,
            "flood": 0.25,    # Moved from generic
            "earthquake": 0.25,
            "epidemic": 0.25,
            "cyclone": 0.25,
            "famine": 0.30
        }
        
        # Non-crisis contexts
        self.non_crisis_contexts = [
            "drinking water", "water supply", "water treatment",
            "normal rainfall", "light rain", "drizzle",
            "campfire", "fireplace", "fire drill", "fire exercise",
            "practice drill", "training exercise", "mock drill"
        ]
        
        # Compile keyword patterns
        self.keyword_patterns: Dict[str, List[tuple]] = {}
        for crisis_type, keywords in self.type_keywords.items():
            compiled = []
            for kw in keywords:
                pattern = re.compile(rf"\b{re.escape(kw)}\b", re.IGNORECASE)
                compiled.append((pattern, kw))
            self.keyword_patterns[crisis_type] = compiled
        
        # Compile phrase patterns
        self.regex_patterns: Dict[str, List[re.Pattern]] = {
            "Flood": [
                re.compile(r"heavy\s+rain", re.IGNORECASE),
                re.compile(r"river\s+overflow", re.IGNORECASE),
                re.compile(r"flash\s+flood", re.IGNORECASE),
                re.compile(r"urban\s+flooding", re.IGNORECASE),
                re.compile(r"water\s+level\s+rising", re.IGNORECASE)
            ],
            "Fire": [
                re.compile(r"fire\s+broke\s+out", re.IGNORECASE),
                re.compile(r"caught\s+fire", re.IGNORECASE),
                re.compile(r"industrial\s+fire", re.IGNORECASE),
                re.compile(r"forest\s+fire", re.IGNORECASE),
                re.compile(r"building\s+fire", re.IGNORECASE)
            ],
            "Earthquake": [
                re.compile(r"earthquake\s+of", re.IGNORECASE),
                re.compile(r"measuring\s+\d+\.?\d*", re.IGNORECASE),
                re.compile(r"tremors\s+felt", re.IGNORECASE),
                re.compile(r"seismic\s+activity", re.IGNORECASE)
            ]
        }
    
    def classify(self, text: str, is_crisis: bool = True) -> Dict[str, Any]:
        print(f"Classifying crisis type for text: {text[:50]}...")
        
        if not is_crisis:
            return self._non_crisis_response()
        
        text_lower = text.lower()
        
        # Check for non-crisis contexts
        for context in self.non_crisis_contexts:
            if context in text_lower:
                return {
                    "primary_type": "Other",
                    "confidence": 0.1,
                    "all_predictions": [],
                    "explanation": f"Context suggests routine issue, not crisis: '{context}'"
                }
        
        raw_scores: Dict[str, float] = {}
        matched: Dict[str, List[str]] = {}
        
        # Calculate scores
        for crisis_type, patterns in self.keyword_patterns.items():
            score = 0.0
            found = []
            
            # Keyword matches
            for pattern, keyword in patterns:
                if pattern.search(text_lower):
                    if keyword in self.strong_indicators:
                        score += self.strong_indicators[keyword]
                        found.append(f"**{keyword}**")  # Mark strong indicators
                    elif keyword in self.generic_keywords:
                        score += self.generic_keywords[keyword]
                        found.append(keyword)
                    else:
                        score += 0.20  # Standard weight increased
                        found.append(keyword)
            
            # Phrase matches
            for regex in self.regex_patterns.get(crisis_type, []):
                if regex.search(text_lower):
                    score += 0.25  # Increased from 0.20
                    found.append(regex.pattern)
            
            # Minimum evidence check
            if len(found) == 1 and found[0] in ["water", "wind", "rain"]:
                score *= 0.5  # Halve score for single generic keyword
            
            raw_scores[crisis_type] = min(1.0, score)
            matched[crisis_type] = found
        
        # Apply dynamic threshold
        threshold = self._calculate_dynamic_threshold(matched)
        
        predictions = [
            {
                "type": k,
                "confidence": v,
                "matched_keywords": matched[k][:5],
                "is_primary": False
            }
            for k, v in raw_scores.items()
            if v >= threshold
        ]
        
        # Fallback
        if not predictions:
            sorted_items = sorted(raw_scores.items(), key=lambda x: x[1], reverse=True)
            for k, v in sorted_items[:2]:
                if v > 0:
                    predictions.append({
                        "type": k,
                        "confidence": v,
                        "matched_keywords": matched[k][:5],
                        "is_primary": False
                    })
        
        if not predictions:
            return {
                "primary_type": "Other",
                "confidence": 0.5,
                "all_predictions": [],
                "explanation": "Insufficient evidence to classify crisis type"
            }
        
        # Sort & mark primary
        predictions.sort(key=lambda x: x["confidence"], reverse=True)
        predictions[0]["is_primary"] = True
        primary = predictions[0]
        
        # Generate confidence-enhanced explanation
        explanation = self._generate_enhanced_explanation(primary, predictions, threshold)
        
        return {
            "primary_type": primary["type"],
            "confidence": float(primary["confidence"]),
            "all_predictions": predictions,
            "explanation": explanation,
            "score_details": {
                k: {"score": float(v), "matched_keywords": matched[k]}
                for k, v in raw_scores.items() if v > 0
            }
        }
    
    def _non_crisis_response(self) -> Dict[str, Any]:
        return {
            "primary_type": "Non-Crisis",
            "confidence": 1.0,
            "all_predictions": [{"type": "Non-Crisis", "confidence": 1.0}],
            "explanation": "Text is not classified as a crisis"
        }
    
    def _calculate_dynamic_threshold(self, matched: Dict[str, List[str]]) -> float:
        """Calculate dynamic threshold based on evidence quality"""
        all_keywords = []
        for keywords in matched.values():
            all_keywords.extend(keywords)
        
        if not all_keywords:
            return config.TYPE_CLASSIFICATION_THRESHOLD
        
        # Count strong indicators
        strong_count = sum(1 for kw in all_keywords if kw.startswith("**"))
        
        if strong_count >= 2:
            return 0.1  # Very low threshold for strong evidence
        elif strong_count == 1:
            return 0.15
        elif any("\\s+" in kw for kw in all_keywords):  # Has phrase patterns
            return 0.2
        else:
            return config.TYPE_CLASSIFICATION_THRESHOLD  # Use config value
    
    def _generate_enhanced_explanation(self, primary: Dict, 
                                     predictions: List[Dict], 
                                     threshold: float) -> str:
        """Generate better explanation with confidence context"""
        base_explanation = (
            f"Primary type: {primary['type']} "
            f"(confidence: {primary['confidence']:.0%})"
        )
        
        if primary["matched_keywords"]:
            # Clean up keyword display
            clean_keywords = []
            for kw in primary["matched_keywords"][:3]:
                if kw.startswith("**"):
                    clean_keywords.append(kw[2:-2])  # Remove markdown
                else:
                    clean_keywords.append(kw)
            
            base_explanation += f" based on: {', '.join(clean_keywords)}"
        
        # Confidence assessment
        if primary["confidence"] >= 0.7:
            base_explanation += ". High confidence classification."
        elif primary["confidence"] >= 0.5:
            base_explanation += ". Moderate confidence."
        elif primary["confidence"] >= threshold:
            base_explanation += ". Low confidence — verification recommended."
        else:
            base_explanation += ". Very low confidence."
        
        # Strong alternatives
        strong_alts = [
            p for p in predictions[1:]
            if p["confidence"] > threshold * 1.5  # Significantly above threshold
        ]
        
        if strong_alts:
            alt_str = ", ".join(
                f"{p['type']} ({p['confidence']:.0%})"
                for p in strong_alts[:2]
            )
            base_explanation += f" Also considered: {alt_str}."
        
        return base_explanation
    
    def predict(self, text: str) -> Dict[str, Any]:
        """
        Alias for classify() to match main_pipeline.py expectations
        Uses the same logic as classify but simplifies output format
        """
        # Call your existing classify method
        result = self.classify(text, is_crisis=True)
        
        # Return simplified format that main_pipeline expects
        return {
            "type": result["primary_type"],
            "confidence": result["confidence"],
            "method": "keyword_enhanced",  # Add this field
            "matched_keyword": result.get("all_predictions", [{}])[0].get("matched_keywords", [""])[0] if result.get("all_predictions") else "",
            "all_predictions": result.get("all_predictions", []),
            "explanation": result.get("explanation", "")
        }