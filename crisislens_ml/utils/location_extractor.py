"""
Simple Location Extractor - Works without complex dependencies
"""

import re
from typing import Dict, List, Optional

class SimpleLocationExtractor:
    """Simple but effective location extractor"""
    
    def __init__(self):
        # Indian cities database with coordinates
        self.cities_db = {
            # Jharkhand
            "Jamshedpur": {"lat": 22.8046, "lon": 86.2029, "state": "Jharkhand", "type": "city"},
            "Ranchi": {"lat": 23.3441, "lon": 85.3096, "state": "Jharkhand", "type": "city"},
            
            # Tamil Nadu
            "Chennai": {"lat": 13.0827, "lon": 80.2707, "state": "Tamil Nadu", "type": "city"},
            "Coimbatore": {"lat": 11.0168, "lon": 76.9558, "state": "Tamil Nadu", "type": "city"},
            
            # Maharashtra
            "Mumbai": {"lat": 19.0760, "lon": 72.8777, "state": "Maharashtra", "type": "city"},
            "Pune": {"lat": 18.5204, "lon": 73.8567, "state": "Maharashtra", "type": "city"},
            
            # Other major cities
            "Delhi": {"lat": 28.7041, "lon": 77.1025, "state": "Delhi", "type": "city"},
            "Kolkata": {"lat": 22.5726, "lon": 88.3639, "state": "West Bengal", "type": "city"},
            "Bangalore": {"lat": 12.9716, "lon": 77.5946, "state": "Karnataka", "type": "city"},
            "Hyderabad": {"lat": 17.3850, "lon": 78.4867, "state": "Telangana", "type": "city"},
            "Ahmedabad": {"lat": 23.0225, "lon": 72.5714, "state": "Gujarat", "type": "city"},
            "Jaipur": {"lat": 26.9124, "lon": 75.7873, "state": "Rajasthan", "type": "city"},
            "Lucknow": {"lat": 26.8467, "lon": 80.9462, "state": "Uttar Pradesh", "type": "city"},
            "Patna": {"lat": 25.5941, "lon": 85.1376, "state": "Bihar", "type": "city"},
            
            # States (with approximate coordinates)
            "Jharkhand": {"lat": 23.6102, "lon": 85.2799, "state": "Jharkhand", "type": "state"},
            "Tamil Nadu": {"lat": 11.1271, "lon": 78.6569, "state": "Tamil Nadu", "type": "state"},
            "Maharashtra": {"lat": 19.7515, "lon": 75.7139, "state": "Maharashtra", "type": "state"},
            "Himachal Pradesh": {"lat": 31.1048, "lon": 77.1734, "state": "Himachal Pradesh", "type": "state"},
            "Odisha": {"lat": 20.9517, "lon": 85.0985, "state": "Odisha", "type": "state"},
            "Gujarat": {"lat": 22.2587, "lon": 71.1924, "state": "Gujarat", "type": "state"},
            "Rajasthan": {"lat": 27.0238, "lon": 74.2179, "state": "Rajasthan", "type": "state"},
            "Uttar Pradesh": {"lat": 26.8467, "lon": 80.9462, "state": "Uttar Pradesh", "type": "state"},
            "Bihar": {"lat": 25.0961, "lon": 85.3131, "state": "Bihar", "type": "state"},
            "West Bengal": {"lat": 22.9868, "lon": 87.8550, "state": "West Bengal", "type": "state"},
            "Karnataka": {"lat": 15.3173, "lon": 75.7139, "state": "Karnataka", "type": "state"},
            "Telangana": {"lat": 17.1232, "lon": 79.2088, "state": "Telangana", "type": "state"},
            
            # Country
            "India": {"lat": 20.5937, "lon": 78.9629, "country": "India", "type": "country"},
        }
        
        # All location names in lowercase for matching
        self.all_locations = {name.lower(): name for name in self.cities_db.keys()}
        
        print("✅ Simple Location Extractor initialized")
    
    def extract_locations(self, text: str) -> List[Dict]:
        """Extract locations from text using simple pattern matching"""
        text_lower = text.lower()
        found = []
        
        # Check for exact city/state names
        for loc_lower, loc_original in self.all_locations.items():
            if loc_lower in text_lower:
                # Make sure it's a word boundary match (not part of another word)
                pattern = r'\b' + re.escape(loc_lower) + r'\b'
                if re.search(pattern, text_lower):
                    city_data = self.cities_db[loc_original]
                    found.append({
                        "name": loc_original,
                        "type": city_data.get("type", "unknown"),
                        "confidence": 0.9,
                        "coordinates": {
                            "lat": city_data["lat"],
                            "lon": city_data["lon"],
                            "source": "database",
                            "state": city_data.get("state"),
                            "country": city_data.get("country", "India")
                        }
                    })
        
        # Also look for patterns like "in [City]" or "at [City]"
        patterns = [
            r'in\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)',  # "in Chennai"
            r'at\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)',  # "at Mumbai"
            r'near\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)', # "near Delhi"
            r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)',  # "Chennai, Tamil Nadu"
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, text)
            for match in matches:
                if isinstance(match, tuple):
                    potential_location = ' '.join(match)
                else:
                    potential_location = match
                
                # Check if this matches any known location
                for loc_lower, loc_original in self.all_locations.items():
                    if loc_lower in potential_location.lower():
                        # Avoid duplicates
                        if not any(loc["name"] == loc_original for loc in found):
                            city_data = self.cities_db[loc_original]
                            found.append({
                                "name": loc_original,
                                "type": city_data.get("type", "unknown"),
                                "confidence": 0.8,
                                "coordinates": {
                                    "lat": city_data["lat"],
                                    "lon": city_data["lon"],
                                    "source": "pattern_match",
                                    "state": city_data.get("state"),
                                    "country": city_data.get("country", "India")
                                }
                            })
                        break
        
        # Remove duplicates while preserving order
        unique_found = []
        seen = set()
        for loc in found:
            if loc["name"] not in seen:
                seen.add(loc["name"])
                unique_found.append(loc)
        
        return unique_found
    
    def get_primary_location(self, text: str) -> Optional[Dict]:
        """Get the most likely primary location from text"""
        locations = self.extract_locations(text)
        
        if not locations:
            return None
        
        # Prefer cities over states, higher confidence first
        cities = [loc for loc in locations if loc.get("type") == "city"]
        if cities:
            # Sort by confidence
            cities.sort(key=lambda x: x.get("confidence", 0), reverse=True)
            return cities[0]
        
        # Then states
        states = [loc for loc in locations if loc.get("type") == "state"]
        if states:
            states.sort(key=lambda x: x.get("confidence", 0), reverse=True)
            return states[0]
        
        # Return first found
        return locations[0]
    
    def extract_and_geocode(self, text: str) -> Dict:
        """Main function to extract and geocode locations"""
        locations = self.extract_locations(text)
        primary = self.get_primary_location(text)
        
        return {
            "entities": locations,
            "primary_location": primary,
            "text_preview": text[:100] + "..." if len(text) > 100 else text
        }

# Singleton instance
_simple_location_extractor = None

def get_simple_location_extractor() -> SimpleLocationExtractor:
    """Get or create extractor instance"""
    global _simple_location_extractor
    if _simple_location_extractor is None:
        _simple_location_extractor = SimpleLocationExtractor()
    return _simple_location_extractor

def extract_location_simple(text: str) -> Dict:
    """Convenience function"""
    extractor = get_simple_location_extractor()
    return extractor.extract_and_geocode(text)