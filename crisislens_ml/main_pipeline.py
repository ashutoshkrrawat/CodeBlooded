"""
MAIN PIPELINE - Connects all Person A's models
"""
import string
import sys
import os
from typing import Dict, Any, Optional

# ====== FIXED IMPORTS ======
try:
    # Try relative imports first
    from crisislens_ml.models.crisis_detector import CrisisDetector
    from crisislens_ml.models.type_classifier import TypeClassifier as CrisisClassifier
    try:
        from crisislens_ml.scoring.explanation_generator import ExplanationGenerator
    except ImportError:
        from scoring.explanation_generator import ExplanationGenerator
    from crisislens_ml.models.credibility_estimator import CredibilityEstimator
    from crisislens_ml.models.severity_estimator import SeverityEstimator
    from crisislens_ml.models.urgency_estimator import UrgencyDetector
    from utils.config import config
    
except ImportError:
    # Fallback: Add parent directory
    current_dir = os.path.dirname(os.path.abspath(__file__))
    parent_dir = os.path.dirname(current_dir)
    sys.path.append(parent_dir)
    
    try:
        from crisislens_ml.models.crisis_detector import CrisisDetector
        from crisislens_ml.models.type_classifier import TypeClassifier
        from crisislens_ml.models.severity_estimator import SeverityEstimator
        from crisislens_ml.models.urgency_estimator import UrgencyDetector
        from crisislens_ml.scoring.explanation_generator import ExplanationGenerator
        from crisislens_ml.utils.config import config
    except ImportError as e:
        print(f"❌ CRITICAL: Cannot import modules: {e}")
        print("Please ensure all model files exist in the correct locations.")
        raise

class CrisisPipeline:
    """
    Main orchestrator - Chains all Person A's models
    
    Flow: Text → Crisis Detection → Type Classification → 
          Severity Estimation → Urgency Detection → Explanation → Output
    """
    
    def __init__(self, use_gemini: bool = False):
        print("=" * 60)
        print("🚀 INITIALIZING CRISISLENS AI PIPELINE")
        print("=" * 60)
        
        # Initialize all models
        self.crisis_detector = CrisisDetector()
        self.type_classifier = TypeClassifier()
        self.severity_estimator = SeverityEstimator()
        self.urgency_detector = UrgencyDetector()
        
        # Explanation generator (with optional Gemini)
        self.explanation_generator = ExplanationGenerator()

        # Initialize location info storage
        self._extracted_location_info = {
            "name": "Chennai",
            "extracted_from_text": False,
            "coordinates": config.CITY_COORDINATES["Chennai"],
            "confidence": "default",
            "all_locations": []
        }
        
        print(f"✅ All models initialized!")
        
        # PRELOAD MODELS to avoid lag on first request
        print("⏳ Pre-loading ML models (downloading if needed)...")
        try:
            # Trigger lazy loading by running a dummy prediction
            self.crisis_detector.predict("warmup text")
            print("✅ Crisis Detector model fully loaded.")
        except Exception as e:
            print(f"⚠️ Warning: Model preload failed (will retry on request): {e}")

        print(f"📍 Focus City: Chennai ({config.CITY_COORDINATES['Chennai']})")
        print(f"📊 Using weights: {config.WEIGHTS}")
        print("=" * 60)

    @staticmethod
    def remove_punctuation(text: str) -> str:
        """
        Removes all punctuation and collapses extra whitespace.
        """
        import re
        # Remove all punctuation
        text = re.sub(r'[^\w\s]', ' ', text)
        # Collapse multiple spaces to single space
        text = re.sub(r'\s+', ' ', text)
        return text.strip()
    
    def analyze(self, text: str, source: str = "unknown", 
                location: str = "Chennai") -> Dict[str, Any]:
        """
        Main analysis function - processes text through entire pipeline
        
        Args:
            text: Crisis report text
            source: Source of report (IMD, SACHET, etc.)
            location: Location mentioned
            
        Returns:
            Complete analysis with all scores
        """
        import re
        import time
        start_time = time.time()

            # Initialize with default values
        extracted_from_text = False
        extracted_coordinates = None
        location_confidence = "medium"
        all_locations_found = []
        primary_location_name = None

        self._extracted_location_info = {
            "name": "Chennai",
            "extracted_from_text": False,
            "coordinates": config.CITY_COORDINATES["Chennai"],
            "confidence": "default",
            "all_locations": []
        }
        
        # ===== STEP 0: EXTRACT LOCATION FROM TEXT =====
        print("0️⃣  Extracting location from text...")
        
        if location is None:
            try:
                # Use SIMPLE location extractor
                from ..utils.simple_location import extract_location_simple
                location_result = extract_location_simple(text)
                
                if location_result and location_result.get("primary_location"):
                    primary = location_result["primary_location"]
                    primary_location_name = primary.get("name")
                    coords = primary.get("coordinates")
                    
                    if primary_location_name:
                        print(f"   📍 Extracted location: {primary_location_name}")
                        print(f"      Type: {primary.get('type', 'unknown')}")
                        print(f"      Confidence: {primary.get('confidence', 0):.1%}")
                        
                        if coords:
                            print(f"      Coordinates: {coords.get('lat', 'N/A')}, {coords.get('lon', 'N/A')}")
                            if coords.get("state"):
                                print(f"      State: {coords['state']}")
                            print(f"      Source: {coords.get('source', 'database')}")
                        
                        location = primary_location_name
                        extracted_coordinates = coords
                        extracted_from_text = True
                        location_confidence = "high" if primary.get("confidence", 0) > 0.8 else "medium"
                        
                        # Store in instance variable
                        self._extracted_location_info = {
                            "name": primary_location_name,
                            "extracted_from_text": True,
                            "coordinates": coords,
                            "confidence": location_confidence,
                            "all_locations": [entity.get("name", "") for entity in location_result.get("entities", [])[:5]]
                        }
                    else:
                        print("   ⚠️  Could not extract location name")
                        self._handle_location_failure()
                        
                else:
                    print("   ⚠️  Could not extract location, using default: Chennai")
                    self._handle_location_failure()
                    
            except Exception as e:
                print(f"   ⚠️  Location extraction failed: {e}")
                print("   Using default: Chennai")
                self._handle_location_failure()
        else:
            print(f"   📍 Using provided location: {location}")
            # Handle provided location
            self._handle_provided_location(location)
        # ===== STEP 0: TEXT PREPROCESSING =====
        print("0️⃣  Preprocessing text (removing punctuation)...")
        cleaned_text = CrisisPipeline.remove_punctuation(text)  # Option 1: Call directly on class

        print(f"\n📥 ANALYZING REPORT: '{cleaned_text[:60]}...'")

        print("-" * 60)
        
        # ===== STEP 1: CRISIS DETECTION =====
        print("1️⃣  Detecting if this is a crisis...")
        crisis_result = self.crisis_detector.predict(cleaned_text)
        
        if not crisis_result["is_crisis"]:
            return {
                "is_crisis": False,
                "crisis_confidence": crisis_result["confidence"],
                "message": "Not identified as a crisis situation",
                "source": source,
                "location": location,
                "text_preview": text[:100] + "..." if len(text) > 100 else text
            }
        
        print(f"   ✅ CRISIS DETECTED")
        print(f"      Confidence: {crisis_result['confidence']:.2%}")
        print(f"      Method: {crisis_result.get('method', 'unknown')}")
        
        # ===== STEP 2: TYPE CLASSIFICATION =====
        print("2️⃣  Classifying crisis type...")
        type_result = self.type_classifier.predict(text)  # Uses keywords from config
        
        print(f"   ✅ Type: {type_result['type']}")
        print(f"      Confidence: {type_result['confidence']:.2%}")
        print(f"      Method: {type_result.get('method', 'unknown')}")
        
        # ===== STEP 3: SEVERITY ESTIMATION =====
        print("3️⃣  Estimating severity (4 dimensions)...")
        severity_result = self.severity_estimator.estimate(text)
        
        print(f"   ✅ Overall Severity: {severity_result['overall']:.2%}")
        print(f"      Breakdown: Human={severity_result['human_impact']:.2%}, "
              f"Infra={severity_result['infrastructure_damage']:.2%}")
        
        # ===== STEP 4: URGENCY DETECTION =====
        print("4️⃣  Detecting urgency level...")
        urgency_result = self.urgency_detector.detect(text)
        
        print(f"   ✅ Urgency: {urgency_result['urgency_level'].upper()}")
        print(f"      Score: {urgency_result['urgency_score']:.2%}")
        if urgency_result['found_keywords']:
            print(f"      Keywords: {', '.join(urgency_result['found_keywords'][:3])}")
        
        # ===== STEP 5: CALCULATE PRIORITY SCORE =====
        print("5️⃣  Calculating priority score...")
        priority_score = self._calculate_priority(
            crisis_confidence=crisis_result["confidence"],
            type_confidence=type_result["confidence"],
            severity=severity_result["overall"],
            urgency=urgency_result["urgency_score"],
            crisis_type=type_result["type"]
        )
        
        # Get priority level
        priority_level = self._get_priority_level(priority_score)
        print(f"   ✅ Priority: {priority_level} ({priority_score:.2%})")
        
        # ===== STEP 6: GENERATE EXPLANATION =====
        print("6️⃣  Generating explanation...")
        explanation_result = self.explanation_generator.generate(
            crisis_type=type_result["type"],
            severity=severity_result,
            urgency=urgency_result,
            info_gaps={"completeness_score": 0.7, "information_gaps": []},  # Mock since we skipped InfoGap
            priority_score=priority_score,
            text_snippet=text[:200],
            location=location
        )
        
        print(f"   ✅ Explanation generated")
        print(f"      Method: {explanation_result.get('method', 'unknown')}")
        
        # ===== STEP 7: COMPILE FINAL RESULTS =====
        print("7️⃣  Compiling final results...")
        
        result = {
            # Basic Info
            "is_crisis": True,
            "source": source,
            "original_text": text[:500],  # Keep more original text
            "text_preview": text[:100] + "..." if len(text) > 100 else text,
            
            # Location Information (FIXED with safe access)
            "location": {
                "name": self._extracted_location_info.get("name", location) if hasattr(self, '_extracted_location_info') else location,
                "extracted_from_text": self._extracted_location_info.get("extracted_from_text", False) if hasattr(self, '_extracted_location_info') else False,
                "coordinates": self._extracted_location_info.get("coordinates", config.CITY_COORDINATES.get(location, config.CITY_COORDINATES["Chennai"])) if hasattr(self, '_extracted_location_info') else config.CITY_COORDINATES.get(location, config.CITY_COORDINATES["Chennai"]),
                "confidence": self._extracted_location_info.get("confidence", "medium") if hasattr(self, '_extracted_location_info') else "medium",
                "all_possible_locations": self._extracted_location_info.get("all_locations", []) if hasattr(self, '_extracted_location_info') else [],
                "extraction_method": "simple_database"
            },
            
            # Crisis Detection
            "crisis_detection": {
                "confidence": round(crisis_result["confidence"], 3),
                "method": crisis_result.get("method", "unknown"),
                "model": crisis_result.get("model", "unknown"),
                "keywords_found": crisis_result.get("score_breakdown", {}).get("keywords_found", []),
                "score_breakdown": crisis_result.get("score_breakdown", {})
            },
            
            # Type Classification
            "type_classification": {
                "type": type_result["type"],
                "confidence": round(type_result["confidence"], 3),
                "method": type_result.get("method", "unknown"),
                "matched_keyword": type_result.get("matched_keyword", ""),
                "all_predictions": type_result.get("all_predictions", [])
            },
            
            # Severity Analysis
            "severity": {
                **severity_result,
                "dimensions": {
                    "human_impact": severity_result["human_impact"],
                    "infrastructure_damage": severity_result["infrastructure_damage"],
                    "geographic_scale": severity_result["geographic_scale"],
                    "temporal_urgency": severity_result["temporal_urgency"]
                },
                "overall": severity_result["overall"],
                "explanation": severity_result.get("explanation", "")
            },
            
            # Urgency Analysis
            "urgency": {
                "level": urgency_result["urgency_level"],
                "score": urgency_result["urgency_score"],
                "is_urgent": urgency_result.get("is_urgent", False),
                "keywords": urgency_result.get("found_keywords", []),
                "time_indicators": urgency_result.get("time_indicators", []),
                "explanation": urgency_result.get("explanation", "")
            },
            
            # Priority Score
            "priority": {
                "score": round(priority_score, 3),
                "level": priority_level,
                "thresholds": config.PRIORITY_THRESHOLDS,
                "calculation_factors": {
                    "crisis_confidence": crisis_result["confidence"],
                    "type_confidence": type_result["confidence"],
                    "severity": severity_result["overall"],
                    "urgency": urgency_result["urgency_score"],
                    "regional_risk": self._get_chennai_risk_factor(type_result["type"])
                }
            },
            
            # Explanation
            "explanation": {
                "content": explanation_result["explanation"],
                "method": explanation_result.get("method", "unknown"),
                "model": explanation_result.get("model", "rule_based"),
                "success": explanation_result.get("success", True)
            },
            
            # Text Analysis
            "text_analysis": {
                "word_count": len(text.split()),
                "has_numbers": any(char.isdigit() for char in text),
                "casualty_keywords_found": any(word in text.lower() for word in ["dead", "killed", "injured", "missing", "casualty"]),
                "time_keywords_found": any(word in text.lower() for word in ["now", "immediate", "urgent", "emergency"]),
                "has_casualties": "dead" in text.lower() or "killed" in text.lower() or "casualty" in text.lower(),
                "has_injuries": "injured" in text.lower() or "wounded" in text.lower() or "hurt" in text.lower()
            },
            
            # Metadata
            "metadata": {
                "pipeline_version": "1.0",
                "models_used": [
                    f"CrisisDetector ({crisis_result.get('method', 'unknown')})",
                    f"TypeClassifier ({type_result.get('method', 'unknown')})",
                    f"SeverityEstimator (4-dimension)",
                    f"UrgencyDetector (keyword-based)",
                    f"ExplanationGenerator ({explanation_result.get('method', 'unknown')})"
                ],
                "location_extraction_used": self._extracted_location_info.get("extracted_from_text", False) if hasattr(self, '_extracted_location_info') else False,
                "focus_city": "Chennai",
                "base_coordinates": config.CITY_COORDINATES["Chennai"],
                "person": "Person A (ML Pipeline)",
                "timestamp": self._get_timestamp(),
                "processing_time_ms": int((time.time() - start_time) * 1000)
            }
        }

        print("\n✅ ANALYSIS COMPLETE!")
        print(f"📍 Location: {location} ({'extracted' if extracted_from_text else 'provided'})")
        print(f"🎯 Priority: {priority_level} ({priority_score:.1%})")
        print(f"⚠️  Severity: {severity_result['overall']:.1%}")
        print(f"⚡ Urgency: {urgency_result['urgency_level'].upper()}")
        print("-" * 60)

        return result
    
    def _calculate_priority(self, crisis_confidence: float, type_confidence: float,
                           severity: float, urgency: float, crisis_type: str) -> float:
        """
        Calculate final priority score using config weights
        
        Uses weights from config.WEIGHTS:
        - crisis_probability: 0.35
        - severity: 0.30
        - credibility: 0.15 (using type confidence as proxy)
        - regional_risk: 0.20 (Chennai-specific risk)
        """
        weights = config.WEIGHTS
        
        # Get Chennai risk factor based on crisis type
        chennai_risk = self._get_chennai_risk_factor(crisis_type)
        
        # Calculate using config weights
        priority = (
            weights.get("crisis_probability", 0.35) * crisis_confidence +
            weights.get("severity", 0.30) * severity +
            weights.get("credibility", 0.15) * type_confidence +  # Using type confidence as credibility proxy
            weights.get("regional_risk", 0.20) * chennai_risk
        )
        
        # Add urgency bonus (not in original weights)
        priority += urgency * 0.1
        
        # Ensure within bounds
        return max(0.0, min(1.0, priority))
    
    def _get_chennai_risk_factor(self, crisis_type: str) -> float:
        """Get Chennai-specific risk factor"""
        # Simple hardcoded risks for Chennai
        chennai_risks = {
            "Flood": 0.85,      # Chennai is highly flood-prone
            "Cyclone": 0.75,    # Coastal vulnerability
            "Fire": 0.65,       # Urban fire risk
            "Earthquake": 0.40, # Moderate seismic risk
            "Epidemic": 0.80,   # High population density
            "Food Shortage": 0.55,
            "Landslide": 0.30,
            "Drought": 0.35,
            "Storm": 0.70,
            "Outbreak": 0.80,
            "Other": 0.50
        }
        
        return chennai_risks.get(crisis_type, 0.60)
    
    def _get_priority_level(self, score: float) -> str:
        """Convert score to priority level using config thresholds"""
        thresholds = config.PRIORITY_THRESHOLDS
        
        if score >= thresholds.get("critical", 0.9):
            return "CRITICAL"
        elif score >= thresholds.get("high", 0.8):
            return "HIGH"
        elif score >= thresholds.get("medium", 0.6):
            return "MEDIUM"
        elif score >= thresholds.get("low", 0.3):
            return "LOW"
        else:
            return "VERY LOW"
    
    def _get_timestamp(self) -> str:
        """Get current timestamp"""
        from datetime import datetime
        return datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    def analyze_batch(self, texts: list, sources: list = None, 
                     locations: list = None) -> list:
        """Analyze multiple texts"""
        results = []
        for i, text in enumerate(texts):
            source = sources[i] if sources and i < len(sources) else "unknown"
            location = locations[i] if locations and i < len(locations) else "Chennai"
            
            result = self.analyze(text, source, location)
            results.append(result)
        
        return results

    def _handle_location_failure(self):
        """Handle location extraction failure"""
        self._extracted_location_info = {
            "name": "Chennai",
            "extracted_from_text": False,
            "coordinates": config.CITY_COORDINATES["Chennai"],
            "confidence": "default",
            "all_locations": []
        }

    def _handle_provided_location(self, location: str):
        """Handle provided location"""
        try:
            from ..utils.simple_location import get_simple_location_extractor
            extractor = get_simple_location_extractor()
            
            # Check if location is in our database
            for loc_name, loc_data in extractor.cities_db.items():
                if (loc_name.lower() == location.lower() or 
                    location.lower() in loc_name.lower()):
                    self._extracted_location_info = {
                        "name": location,
                        "extracted_from_text": False,
                        "coordinates": {
                            "lat": loc_data.get("lat"),
                            "lon": loc_data.get("lon"),
                            "source": "database",
                            "state": loc_data.get("state"),
                            "country": loc_data.get("country", "India")
                        },
                        "confidence": "high",
                        "all_locations": [location]
                    }
                    return
            
            # If not found in database, use config
            self._extracted_location_info = {
                "name": location,
                "extracted_from_text": False,
                "coordinates": config.CITY_COORDINATES.get(
                    location, 
                    config.CITY_COORDINATES["Chennai"]
                ),
                "confidence": "provided",
                "all_locations": [location]
            }
            
        except Exception as e:
            print(f"   ⚠️  Could not process provided location: {e}")
            self._handle_location_failure()

# ====== GLOBAL INSTANCE & CONVENIENCE FUNCTION ======
_pipeline_instance = None

def get_pipeline() -> CrisisPipeline:
    """Get or create pipeline instance (singleton)"""
    global _pipeline_instance
    if _pipeline_instance is None:
        _pipeline_instance = CrisisPipeline()
    return _pipeline_instance

def analyze_crisis(text: str, **kwargs) -> Dict[str, Any]:
    """
    Convenience function for easy access
    
    Usage:
        result = analyze_crisis("Flood in Chennai", source="IMD", location="Chennai")
    """
    pipeline = get_pipeline()
    return pipeline.analyze(text, **kwargs)




# ====== DEMO/MAIN EXECUTION ======
if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("🧪 RUNNING CRISISLENS PIPELINE DEMO")
    print("=" * 60)
    
    # Chennai test scenario
    test_scenarios = [
        {
            "text": "Heavy rainfall causes severe flooding in Chennai Adyar area. "
                   "50 homes submerged, major roads impassable. "
                   "IMD issues red alert, urgent evacuation ordered.",
            "source": "IMD Alert",
            "location": "Chennai, Tamil Nadu"
        },
        {
            "text": "Fire breaks out at T Nagar market complex. "
                   "5 shops affected, fire department responding. "
                   "No casualties reported.",
            "source": "Fire Department",
            "location": "Chennai"
        },
        {
            "text": "Beautiful weather in Chennai today. "
                   "Perfect conditions for beach visits and outdoor activities.",
            "source": "Weather Update",
            "location": "Chennai"
        }
    ]
    
    pipeline = get_pipeline()
    
    for i, scenario in enumerate(test_scenarios, 1):
        print(f"\n{'='*60}")
        print(f"SCENARIO {i}: {scenario['text'][:50]}...")
        print("=" * 60)
        
        result = pipeline.analyze(**scenario)
        
        if result["is_crisis"]:
            print(f"🚨 CRISIS ALERT")
            print(f"   Type: {result['type_classification']['type']}")
            print(f"   Location: {result['location']}")
            print(f"   Priority: {result['priority']['level']} ({result['priority']['score']:.2%})")
            print(f"   Severity: {result['severity']['overall']:.2%}")
            print(f"   Urgency: {result['urgency']['urgency_level'].upper()}")
            print(f"\n📝 Explanation: {result['explanation']}")
        else:
            print(f"✅ NOT A CRISIS")
            print(f"   Message: {result.get('message', 'No crisis detected')}")
            print(f"   Confidence: {result.get('crisis_confidence', 0):.2%}")
    
    print("\n" + "=" * 60)
    print("🎉 PERSON A: ML PIPELINE COMPLETE & READY!")
    print("=" * 60)