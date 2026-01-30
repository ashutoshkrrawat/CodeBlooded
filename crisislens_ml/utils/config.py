
# utils/config.py
from dataclasses import dataclass, field
from typing import Dict, List, Optional

@dataclass
class MLConfig:
    """Configuration for ML Pipeline"""

    # Disaster Categories (dataset-aligned)
    CRISIS_TYPES: List[str] = field(default_factory=lambda: [
        "Flood",
        "Cyclone", 
        "Earthquake",
        "Fire",
        "Epidemic",
        "Food Shortage",
        "Landslide",
        "Drought",
        "Storm",
        "Outbreak"
    ])

    # In config.py, update CRISIS_KEYWORDS:
    CRISIS_KEYWORDS: List[str] = field(default_factory=lambda: [
        # General crisis
        "emergency", "disaster", "crisis", "alert", "warning", "urgent","landslide"
        
        # Flood specific
        "flood", "waterlogging", "overflow", "deluge", "submerged", "monsoon",
        "heavy rain", "rainfall", "water level", "inundated","flooding"
        
        # Fire specific (ADD THESE)
        "fire", "blaze", "burning", "smoke", "arson", "incendiary",
        "inferno", "combustion", "flammable", "ignite", "ablaze",
        "chemical fire", "factory fire", "industrial fire",
        
        # Earthquake specific (ADD THESE)
        "earthquake", "quake", "tremor", "aftershock", "seismic",
        "epicenter", "magnitude", "shake", "shaking", "seismograph",
        "tremors felt", "seismic activity",
        
        # Cyclone specific (ADD THESE)
        "cyclone", "storm", "severe wind", "hurricane", "typhoon", "gale",
        "tempest", "whirlwind", "tornado", "supercell", "storm surge",
        "landfall", "coastal storm", "wind speed", "wind"
        
        # Epidemic specific
        "epidemic", "virus", "disease", "outbreak", "infect",
        "contagious", "pandemic", "illness", "sick", "plague",
        
        # Impact keywords
        "evacuate", "help needed", "rescue", "trapped", "injured",
        "dead", "casualty", "damage", "destroyed", "stranded",
        "affected", "displaced", "collapsed", "broken", "damaged",

        "landslide", "mudslide", "rockslide", "avalanche", "debris flow",
        "mud flow", "rock fall", "hill collapse", "slope failure",
        "soil erosion", "mountain slide", "geological disaster",
        
        # RESCUE/DEATH KEYWORDS (ADD THESE)
        "rescuers", "recover bodies", "still missing", "casualties",
        "fatalities", "death toll", "victims", "trapped", "buried",
    ])

    NON_CRISIS_KEYWORDS: List[str] = field(default_factory=lambda: [
        "normal", "routine", "planned", "regular", "daily operations", "scheduled", 
    "maintenance", "standard procedure", "protocol", "inspection",
    "exercise", "drill", "test", "practice", "simulation", "mock", "rehearsal", "training", "scenario", "fire drill", "emergency drill",
    "workshop", "seminar", "conference", "webinar", "lecture", "class", "training session", "orientation", "presentation", "meeting", "team building", "discussion",
    "announcement", "notice", "update", "information", "bulletin", "report", "newsletter", "press release",
    "scheduled maintenance", "routine check", "planned outage", "community event", "social gathering", "awareness campaign"
    ])
    
    TYPE_KEYWORDS: Dict[str, List[str]] = field(default_factory=lambda: {
        "Flood": ["flood", "water", "rain", "river", "submerged", "drowned", 
                "waterlogging", "overflow", "monsoon", "deluge", "inundated"],
        
        # ADD MORE KEYWORDS FOR FIRE:
        "Fire": ["fire", "blaze", "burn", "smoke", "arson", "incendiary",
                "inferno", "combustion", "flammable", "ignite", "ablaze",
                "chemical", "factory", "toxic", "smoke spreading"],
        
        # ADD MORE KEYWORDS FOR EARTHQUAKE:
        "Earthquake": ["earthquake", "quake", "tremor", "seismic", "shake",
                    "epicenter", "magnitude", "aftershock", "seismograph",
                    "tremors felt", "shaking", "seismic activity"],
        
        # ADD MORE KEYWORDS FOR CYCLONE:
        "Cyclone": ["cyclone", "storm", "wind", "hurricane", "typhoon",
                "gale", "tempest", "whirlwind", "tornado", "supercell",
                "storm surge", "landfall", "coastal storm", "wind speed"],
        
        "Epidemic": ["epidemic", "virus", "disease", "outbreak", "infect",
                    "contagious", "pandemic", "illness", "sick", "plague"],
        "Food Shortage": ["hunger", "famine", "starvation", "food", "ration",
                        "shortage", "scarcity", "malnutrition", "dearth"]
    })

    # HuggingFace Models
    CRISIS_DETECTION_MODEL: str = "distilbert-base-uncased-finetuned-sst-2-english"
    TYPE_CLASSIFICATION_MODEL: str = "roberta-base"

    # Thresholds
    CRISIS_DETECTION_THRESHOLD: float = 0.5
    TYPE_CLASSIFICATION_THRESHOLD: float = 0.3

    # Text Processing 
    MAX_TEXT_LENGTH: int = 50000
    MIN_TEXT_LENGTH: int = 5

    # Priority Weights
    WEIGHTS: Dict[str, float] = field(default_factory=lambda: {

        "severity": 0.35,
        "regional_risk": 0.25,
        "credibility": 0.4
    })

    # Priority Buckets
    PRIORITY_THRESHOLDS: Dict[str, float] = field(default_factory=lambda: {
        "low": 0.3,
        "medium": 0.6,
        "high": 0.8,
        "critical": 0.9
    })

    # Region Metadata (Chennai)
    CITY_COORDINATES: Dict[str, Dict[str, float]] = field(default_factory=lambda: {
        "Chennai": {"lat": 13.0827, "lon": 80.2707}
    })

        # Gemini API Config
    GEMINI_API_KEY: Optional[str] = None  # Will be read from environment
    
    # Explanation Generator 
    USE_GEMINI_FOR_EXPLANATIONS: bool = True 

config = MLConfig()
