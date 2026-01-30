"""
4-Dimension Severity Estimator
"""
import re
class SeverityEstimator:
    def __init__(self):
        print("✅ SeverityEstimator initialized (4 dimensions)")
    
    def estimate(self, text):
        """
        Estimate severity on 4 dimensions with enhanced scoring:
        1. Human Impact (casualties, injuries)
        2. Geographic Scale (area affected)  
        3. Infrastructure Damage (buildings, roads)
        4. Temporal Urgency (time sensitivity)
        """
        text_lower = text.lower()
        
        # ===== ENHANCED: Human Impact with death/casualty detection =====
        human_keywords = [
            'injured', 'casualty', 'death', 'dead', 'killed', 'fatal',
            'people', 'person', 'family', 'children', 'victim', 'affected',
            'body', 'bodies', 'deceased', 'loss of life', 'lives lost',
            'stranded', 'trapped', 'missing', 'hospitalized', 'wounded'
        ]
        
        # Base human score
        human_score = self._calculate_dimension_score(text_lower, human_keywords)
        
        # ENHANCED: Count casualties from numbers in text
        numbers = re.findall(r'\b\d+\b', text)
        casualty_count = 0
        casualty_context_words = ['dead', 'killed', 'casualty', 'death', 'body', 
                                'bodies', 'injured', 'wounded', 'hospitalized']
        
        for i, num in enumerate(numbers):
            try:
                num_value = int(num)
                # Check if number is near casualty keywords
                words = text_lower.split()
                if num in words:
                    idx = words.index(num)
                    # Check 5 words before and after
                    context_start = max(0, idx - 5)
                    context_end = min(len(words), idx + 6)
                    context = ' '.join(words[context_start:context_end])
                    
                    if any(word in context for word in casualty_context_words):
                        casualty_count += num_value
            except ValueError:
                continue
        
        # Apply casualty multiplier
        if casualty_count > 0:
            if casualty_count > 100:
                human_score = min(0.98, human_score + 0.45)
            elif casualty_count > 50:
                human_score = min(0.95, human_score + 0.35)
            elif casualty_count > 10:
                human_score = min(0.90, human_score + 0.25)
            elif casualty_count > 0:
                human_score = min(0.85, human_score + 0.20)
        
        # ===== Dimension 2: Geographic Scale =====
        geo_keywords = [
            'area', 'region', 'city', 'multiple', 'widespread', 'extensive',
            'several', 'many', 'whole', 'entire', 'across', 'district',
            'province', 'state', 'country', 'nationwide', 'large scale'
        ]
        geo_score = self._calculate_dimension_score(text_lower, geo_keywords)
        
        # Boost for geographic indicators
        if any(word in text_lower for word in ['entire', 'whole', 'country', 'nationwide']):
            geo_score = min(0.95, geo_score + 0.25)
        elif any(word in text_lower for word in ['multiple', 'several', 'across']):
            geo_score = min(0.90, geo_score + 0.15)
        
        # ===== Dimension 3: Infrastructure Damage =====
        infra_keywords = [
            'building', 'road', 'hospital', 'school', 'bridge', 'house',
            'shop', 'market', 'damage', 'destroyed', 'collapsed', 'broken',
            'damaged', 'displaces', 'infrastructure', 'property', 'home',
            'structure', 'facility', 'power line', 'electricity', 'water supply'
        ]
        infra_score = self._calculate_dimension_score(text_lower, infra_keywords)
        
        # ===== Dimension 4: Temporal Urgency =====
        time_keywords = [
            'urgent', 'immediate', 'emergency', 'evacuate', 'evacuation',
            'now', 'critical', 'asap', 'quick', 'rush', 'ongoing',
            'continue', 'still', 'yet', 'remains', 'persisting'
        ]
        time_score = self._calculate_dimension_score(text_lower, time_keywords)
        
        # Overall severity (weighted average)
        overall = (
            human_score * 0.35 +    # Human impact most important
            geo_score * 0.25 +      # Geographic scale
            infra_score * 0.25 +    # Infrastructure damage  
            time_score * 0.15       # Time urgency
        )
        
        # Add bonus for large casualty numbers
        if casualty_count > 50:
            overall = min(0.99, overall + 0.1)
        elif casualty_count > 10:
            overall = min(0.95, overall + 0.05)
        
        return {
            "human_impact": round(human_score, 3),
            "geographic_scale": round(geo_score, 3),
            "infrastructure_damage": round(infra_score, 3),
            "temporal_urgency": round(time_score, 3),
            "overall": round(overall, 3),
            "explanation": self._generate_explanation(human_score, geo_score, infra_score, time_score, casualty_count)
        }
    
    def _calculate_dimension_score(self, text, keywords):
        """Calculate score for one dimension (0-1)"""
        # Count matching keywords
        matches = sum(1 for keyword in keywords if keyword in text)
        
        # Base score + bonus for matches
        score = min(0.95, 0.2 + (matches * 0.15))
        
        # Check for numbers (indicating scale)
        import re
        numbers = re.findall(r'\b\d+\b', text)
        if numbers:
            max_number = max(map(int, numbers))
            if max_number > 100:
                score = min(0.99, score + 0.3)
            elif max_number > 10:
                score = min(0.95, score + 0.2)
            elif max_number > 0:
                score = min(0.9, score + 0.1)
        
        return score
    
    def _generate_explanation(self, human, geo, infra, time, casualty_count=0):
        """Generate human-readable explanation"""
        explanations = []
        
        # Human impact explanation
        if casualty_count > 0:
            explanations.append(f"{casualty_count}+ casualties reported")
        elif human > 0.7:
            explanations.append("High human impact risk")
        elif human > 0.5:
            explanations.append("Moderate human impact")
        elif human > 0.3:
            explanations.append("Potential human impact")
        
        # Geographic scale
        if geo > 0.7:
            explanations.append("Widespread geographic area")
        elif geo > 0.5:
            explanations.append("Multiple locations affected")
        
        # Infrastructure
        if infra > 0.7:
            explanations.append("Significant infrastructure damage")
        elif infra > 0.5:
            explanations.append("Building/property damage")
        
        # Time urgency
        if time > 0.7:
            explanations.append("Time-sensitive situation")
        elif time > 0.5:
            explanations.append("Ongoing/developing situation")
        
        if explanations:
            return " | ".join(explanations)
        else:
            return "Limited severity indicators detected"