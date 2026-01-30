"""
Explanation Generator - Creates human-readable crisis explanations
Uses Gemini API for dynamic explanations
"""

import json
from typing import Dict, Any, Optional
import random

try:
    from ..utils.gemini_client import get_gemini_client, GeminiClient
    HAS_GEMINI = True
except ImportError:
    HAS_GEMINI = False
    print("⚠️  Gemini client not available, using rule-based explanations")

class ExplanationGenerator:
    """Generates explanations for crisis analysis results"""
    
    def __init__(self, use_gemini: bool = True):
        """
        Initialize explanation generator
        
        Args:
            use_gemini: Whether to use Gemini API or rule-based
        """
        self.use_gemini = use_gemini and HAS_GEMINI
        
        if self.use_gemini:
            try:
                self.gemini_client = get_gemini_client()
                print("✅ ExplanationGenerator using Google Gemini API")
            except Exception as e:
                print(f"⚠️  Gemini API not available: {e}")
                self.use_gemini = False
        
        if not self.use_gemini:
            print("✅ ExplanationGenerator using rule-based explanations")
    
    def generate(self, crisis_type: str, severity: Dict[str, float], 
                urgency: Dict[str, Any], info_gaps: Dict[str, Any],
                priority_score: float, text_snippet: str, 
                location: str = "Chennai") -> Dict[str, Any]:
        """
        Generate explanation for crisis analysis
        
        Args:
            crisis_type: Type of crisis (Flood, Fire, Earthquake, etc.)
            severity: Severity scores dictionary
            urgency: Urgency scores dictionary
            info_gaps: Information gaps dictionary
            priority_score: Overall priority score (0-1)
            text_snippet: Original text snippet for context
            location: Location of crisis
            
        Returns:
            Dictionary with explanation and method
        """
        if self.use_gemini:
            return self._generate_with_gemini(
                crisis_type, severity, urgency, info_gaps,
                priority_score, text_snippet, location
            )
        else:
            return self._generate_rule_based(
                crisis_type, severity, urgency, info_gaps,
                priority_score, text_snippet, location
            )
    
    def _generate_with_gemini(self, crisis_type: str, severity: Dict[str, float],
                             urgency: Dict[str, Any], info_gaps: Dict[str, Any],
                             priority_score: float, text_snippet: str,
                             location: str) -> Dict[str, Any]:
        """Generate explanation using Gemini API"""
        print("   🤖 Calling Gemini API...")
        
        # Get priority level
        priority_level = self._get_priority_level(priority_score)
        
        # Format severity metrics
        severity_metrics = {
            "Human Impact": f"{severity.get('human_impact', 0):.1%}",
            "Infrastructure Damage": f"{severity.get('infrastructure_damage', 0):.1%}",
            "Geographic Scale": f"{severity.get('geographic_scale', 0):.1%}",
            "Temporal Urgency": f"{severity.get('temporal_urgency', 0):.1%}",
            "Overall Severity": f"{severity.get('overall', 0):.1%}"
        }
        
        # Create dynamic prompt
        prompt = f"""
        CRISIS INTELLIGENCE ANALYSIS REQUEST

        Generate a professional crisis assessment report based on the following data:

        **CRISIS DETAILS:**
        • Type: {crisis_type}
        • Location: {location}
        • Priority Level: {priority_level} ({priority_score:.1%})
        • Urgency Level: {urgency.get('urgency_level', 'unknown').upper()}

        **SEVERITY METRICS (0-100%):**
        {json.dumps(severity_metrics, indent=2)}

        **SITUATION CONTEXT:**
        "{text_snippet[:300]}"

        **GENERATE A REPORT WITH THIS EXACT STRUCTURE:**
        {crisis_type.upper()} ANALYSIS COMPLETE
        Priority: {priority_level} ({priority_score:.1%})
        Location: {location}

        Assessment: [Provide 2-3 sentence situation summary specific to {crisis_type}]

        Key Factors:
        • [Factor 1: Most critical risk factor based on metrics]
        • [Factor 2: Secondary risk factor]
        • [Factor 3: Geographic/contextual factor for {location}]

        Recommendations:
        1. [Primary action based on {priority_level} priority]
        2. [Secondary action]
        3. [Monitoring/preparation action]

        **IMPORTANT INSTRUCTIONS:**
        1. Be SPECIFIC to {crisis_type} disasters
        2. Reference the actual severity metrics provided
        3. Mention {location} context if relevant
        4. Keep response concise (200-250 words)
        5. Use professional emergency management language
        6. DO NOT use markdown formatting except for the header line
        7. DO NOT mention that you're an AI or mention this prompt
        8. Base recommendations on the actual priority level: {priority_level}
        """
        
        try:
            # Call Gemini API
            result = self.gemini_client.generate_content(prompt)
            
            if result["success"]:
                explanation = result["text"].strip()
                
                # Clean up any unwanted formatting
                explanation = explanation.replace("```", "")
                explanation = explanation.replace("**", "")
                
                return {
                    "explanation": explanation,
                    "method": "gemini_api",
                    "model": result.get("model", "unknown"),
                    "success": True
                }
            else:
                print(f"   ⚠️  Gemini API failed: {result.get('error')}")
                # Fallback to rule-based
                return self._generate_rule_based(
                    crisis_type, severity, urgency, info_gaps,
                    priority_score, text_snippet, location
                )
                
        except Exception as e:
            print(f"   ⚠️  Gemini API error: {e}")
            # Fallback to rule-based
            return self._generate_rule_based(
                crisis_type, severity, urgency, info_gaps,
                priority_score, text_snippet, location
            )
    
    def _generate_rule_based(self, crisis_type: str, severity: Dict[str, float],
                            urgency: Dict[str, Any], info_gaps: Dict[str, Any],
                            priority_score: float, text_snippet: str,
                            location: str) -> Dict[str, Any]:
        """Generate dynamic rule-based explanation"""
        
        priority_level = self._get_priority_level(priority_score)
        urgency_level = urgency.get('urgency_level', 'low').upper()
        
        # Get dynamic metrics
        human_impact = severity.get('human_impact', 0)
        infra_damage = severity.get('infrastructure_damage', 0)
        geo_scale = severity.get('geographic_scale', 0)
        temp_urgency = severity.get('temporal_urgency', 0)
        
        # Human impact description
        if human_impact > 0.8:
            human_desc = "CRITICAL human impact with potential for significant casualties"
        elif human_impact > 0.6:
            human_desc = "HIGH human impact requiring immediate medical response"
        elif human_impact > 0.4:
            human_desc = "MODERATE human impact with some injuries reported"
        else:
            human_desc = "LIMITED human impact reported"
        
        # Infrastructure description
        if infra_damage > 0.7:
            infra_desc = "EXTENSIVE infrastructure damage with buildings affected"
        elif infra_damage > 0.5:
            infra_desc = "SIGNIFICANT infrastructure damage reported"
        elif infra_damage > 0.3:
            infra_desc = "LIMITED infrastructure damage"
        else:
            infra_desc = "MINIMAL infrastructure impact"
        
        # Geographic scale description
        if geo_scale > 0.7:
            geo_desc = "WIDESPREAD geographic area affected"
        elif geo_scale > 0.5:
            geo_desc = "MULTIPLE locations impacted"
        elif geo_scale > 0.3:
            geo_desc = "LOCALIZED area affected"
        else:
            geo_desc = "SPECIFIC location impacted"
        
        # Crisis-specific dynamic templates
        crisis_templates = {
            "Landslide": f"""
    ⛰️ LANDSLIDE ANALYSIS COMPLETE
    Priority: {priority_level} ({priority_score:.1%})
    Location: {location}

    Assessment: {human_desc.lower()}. Mud and debris flow pose immediate danger.

    Key Factors:
    • {human_desc} (Score: {human_impact:.1%})
    • {infra_desc} (Score: {infra_damage:.1%})
    • {geo_desc} (Score: {geo_scale:.1%})
    • Urgency Level: {urgency_level}

    Recommendations:
    1. Deploy search and rescue teams immediately
    2. Evacuate nearby slopes and valleys
    3. Monitor rainfall and soil stability
    4. Establish emergency shelters

    [CRISISLENS AI Analysis • Based on real-time metrics]
    """,
            
            "Earthquake": f"""
    🌍 EARTHQUAKE ANALYSIS COMPLETE
    Priority: {priority_level} ({priority_score:.1%})
    Location: {location}

    Assessment: {human_desc.lower()}. Aftershocks possible.

    Key Factors:
    • {human_desc} (Score: {human_impact:.1%})
    • {infra_desc} (Score: {infra_damage:.1%})
    • {geo_desc} (Score: {geo_scale:.1%})
    • Urgency Level: {urgency_level}

    Recommendations:
    1. Conduct building safety inspections
    2. Prepare emergency medical response
    3. Monitor for aftershocks
    4. Check utility lines

    [CRISISLENS AI Analysis • Based on real-time metrics]
    """,
            
            "Flood": f"""
    🌊 FLOOD ANALYSIS COMPLETE
    Priority: {priority_level} ({priority_score:.1%})
    Location: {location}

    Assessment: {human_desc.lower()}. Water levels rising.

    Key Factors:
    • {human_desc} (Score: {human_impact:.1%})
    • {infra_desc} (Score: {infra_damage:.1%})
    • {geo_desc} (Score: {geo_scale:.1%})
    • Urgency Level: {urgency_level}

    Recommendations:
    1. Activate flood warning systems
    2. Deploy water pumps to critical areas
    3. Evacuate low-lying zones
    4. Monitor water levels

    [CRISISLENS AI Analysis • Based on real-time metrics]
    """,
            
            "Fire": f"""
    🔥 FIRE ANALYSIS COMPLETE
    Priority: {priority_level} ({priority_score:.1%})
    Location: {location}

    Assessment: {human_desc.lower()}. Fire spreading rapidly.

    Key Factors:
    • {human_desc} (Score: {human_impact:.1%})
    • {infra_desc} (Score: {infra_damage:.1%})
    • {geo_desc} (Score: {geo_scale:.1%})
    • Urgency Level: {urgency_level}

    Recommendations:
    1. Deploy firefighting resources
    2. Evacuate nearby areas if necessary
    3. Monitor wind conditions
    4. Establish firebreaks

    [CRISISLENS AI Analysis • Based on real-time metrics]
    """
        }
        
        # Default template for other crisis types
        default_template = f"""
    🚨 {crisis_type.upper()} ANALYSIS COMPLETE
    Priority: {priority_level} ({priority_score:.1%})
    Location: {location}

    Assessment: {crisis_type} incident detected. {human_desc.lower()}.

    Key Metrics:
    • Human Impact: {human_impact:.1%} ({human_desc.split()[0].lower()} level)
    • Infrastructure Damage: {infra_damage:.1%} ({infra_desc.split()[0].lower()} level)
    • Geographic Scale: {geo_scale:.1%} ({geo_desc.split()[0].lower()} level)
    • Temporal Urgency: {temp_urgency:.1%}
    • Urgency Level: {urgency_level}

    Recommended Actions:
    1. Deploy emergency response teams
    2. Assess on-ground situation
    3. Monitor situation development
    4. Coordinate with local authorities

    [CRISISLENS AI Analysis • Based on real-time metrics]
    """
        
        # Use crisis-specific template or default
        explanation = crisis_templates.get(crisis_type, default_template)
        
        # Add context from text snippet if available
        if text_snippet and len(text_snippet) > 20:
            # Extract key phrases (simple approach)
            key_phrases = []
            words = text_snippet.lower().split()
            
            crisis_words = ["landslide", "earthquake", "flood", "fire", "missing", 
                        "dead", "injured", "collapsed", "damaged", "evacuated"]
            
            for word in crisis_words:
                if word in text_snippet.lower() and word not in explanation.lower():
                    key_phrases.append(word)
            
            if key_phrases and len(key_phrases) <= 3:
                # Add context line
                explanation = explanation.replace("[CRISISLENS AI Analysis", 
                    f"Context indicators: {', '.join(key_phrases)}\n\n[CRISISLENS AI Analysis")
        
        return {
            "explanation": explanation.strip(),
            "method": "rule_based_dynamic",
            "success": True
        }
    
    def _get_priority_level(self, score: float) -> str:
        """Convert score to priority level"""
        if score >= 0.9:
            return "CRITICAL"
        elif score >= 0.8:
            return "HIGH"
        elif score >= 0.6:
            return "MEDIUM"
        elif score >= 0.3:
            return "LOW"
        else:
            return "VERY LOW"
    
    def batch_generate(self, analyses: list) -> list:
        """Generate explanations for multiple analyses"""
        return [self.generate(**analysis) for analysis in analyses]