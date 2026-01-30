"""
Urgency Detector - Identifies time-sensitive crises
"""

class UrgencyDetector:
    def __init__(self):
        print("✅ UrgencyDetector initialized")
        
        # Time-sensitive keywords with weights
        self.urgent_keywords = {
            # High urgency
            'immediate': 0.9,
            'urgent': 0.9,
            'emergency': 0.8,
            'evacuate now': 0.9,
            'critical': 0.8,
            'asap': 0.85,
            
            # Medium urgency  
            'quick': 0.6,
            'rush': 0.6,
            'without delay': 0.7,
            'right now': 0.7,
            
            # Low urgency but time-related
            'soon': 0.4,
            'pending': 0.3,
            'monitor': 0.2,

                # Add rescue/response keywords
            'rescue': 0.7,
            'search and rescue': 0.85,
            'recover bodies': 0.8,
            'trapped': 0.75,
            'missing': 0.6,
            'rescuers': 0.7,
            'emergency response': 0.8,
            'rescue operations': 0.8,
            'evacuation': 0.7,
            
            # Time indicators
            'still missing': 0.65,
            'ongoing': 0.5,
            'continue to': 0.4,
        }
    
    def detect(self, text):
        """
        Detect urgency level in text
        
        Returns:
            {
                "urgency_score": 0.0-1.0,
                "is_urgent": True/False,
                "urgency_level": "low"/"medium"/"high"/"critical",
                "found_keywords": list,
                "explanation": str
            }
        """
        text_lower = text.lower()
        
        # Find matching keywords
        found_keywords = []
        total_weight = 0
        
        for keyword, weight in self.urgent_keywords.items():
            if keyword in text_lower:
                found_keywords.append(keyword)
                total_weight += weight
        
        # Calculate urgency score (0-1)
        if found_keywords:
            # Average weight of found keywords
            avg_weight = total_weight / len(found_keywords)
            
            # Boost if multiple keywords found
            multiplier = min(1.5, 1.0 + (len(found_keywords) * 0.1))
            urgency_score = min(0.99, avg_weight * multiplier)
        else:
            urgency_score = 0.1  # Base non-urgency
        
        # Determine urgency level
        if urgency_score >= 0.8:
            urgency_level = "critical"
            is_urgent = True
            explanation = "Critical time-sensitive situation requiring immediate response"
        elif urgency_score >= 0.6:
            urgency_level = "high"
            is_urgent = True
            explanation = "High urgency - rapid response needed"
        elif urgency_score >= 0.4:
            urgency_level = "medium"
            is_urgent = False
            explanation = "Medium urgency - monitor closely"
        else:
            urgency_level = "low"
            is_urgent = False
            explanation = "Low urgency - routine monitoring"
        
        # Check for time indicators
        time_indicators = self._check_time_indicators(text_lower)
        if time_indicators:
            explanation += f" | Time indicators: {time_indicators}"
        
        return {
            "urgency_score": round(urgency_score, 3),
            "is_urgent": is_urgent,
            "urgency_level": urgency_level,
            "found_keywords": found_keywords,
            "explanation": explanation,
            "time_indicators": time_indicators
        }
    
    def _check_time_indicators(self, text):
        """Check for specific time references"""
        time_words = [
            'minutes', 'hours', 'today', 'tonight', 'now', 
            'immediately', 'within', 'by', 'before', 'after'
        ]
        
        found = []
        for word in time_words:
            if word in text:
                found.append(word)
        
        return found if found else None