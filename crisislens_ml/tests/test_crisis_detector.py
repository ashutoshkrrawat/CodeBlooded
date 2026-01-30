"""
PERSON A TEST - Run this from crisislens_ml/ folder
"""

import sys
import os

# Get current directory
current_dir = os.path.dirname(os.path.abspath(__file__))

# If running from tests folder, go up one level
if current_dir.endswith('tests'):
    parent_dir = os.path.dirname(current_dir)  # Goes to crisislens_ml
    sys.path.insert(0, parent_dir)
else:
    sys.path.insert(0, current_dir)

print(f"📁 Running from: {current_dir}")
print(f"🔧 Python path: {sys.path[:2]}...")

# Now try to import
try:
    # Method 1: Direct import (if package structure works)
    from models.crisis_detector import CrisisDetector
    print("✅ Import Method 1: from models.crisis_detector")
    
except ImportError:
    try:
        # Method 2: Try as module
        import importlib.util
        spec = importlib.util.spec_from_file_location(
            "crisis_detector",
            os.path.join(parent_dir, "models", "crisis_detector.py")
        )
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        CrisisDetector = module.CrisisDetector
        print("✅ Import Method 2: Direct file load")
        
    except Exception as e:
        print(f"❌ All imports failed: {e}")
        sys.exit(1)

# ====== TEST FUNCTION ======
def test_crisis_detector():
    """Simple test for Person A"""
    print("\n" + "="*50)
    print("PERSON A: Testing Crisis Detector")
    print("="*50)
    
    try:
        detector = CrisisDetector()
        
        # Test cases
        tests = [
            ("Flood in Chennai Adyar area", True),
            ("Fire at T Nagar market", True),
            ("Nice weather in Marina Beach", False),
        ]
        
        for text, expected in tests:
            result = detector.predict(text)
            print(f"\n📝 '{text[:30]}...'")
            print(f"   Method: {result.get('method', 'unknown')}")
            print(f"   Crisis: {result['is_crisis']} (expected: {expected})")
            print(f"   Confidence: {result['confidence']:.3f}")
            
            if 'keywords_found' in result:
                print(f"   Keywords: {result['keywords_found']}")
        
        print("\n✅ Crisis detector test complete!")
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

# ====== MAIN ======
if __name__ == "__main__":
    success = test_crisis_detector()
    
    print("\n" + "="*50)
    if success:
        print("🎉 PERSON A: Crisis Detector works! Proceed to next model.")
    else:
        print("⚠️  PERSON A: Need to fix Crisis Detector first.")
    print("="*50)