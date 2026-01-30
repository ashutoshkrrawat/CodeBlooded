
#Test script for BaseModel class 


import os
import sys


sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


from models.base_model import BaseModel

def test_base_model():
    print(" Testing BaseModel class...")
    
    # Test with a simpler model first (distilbert loads faster)
    model = BaseModel("distilbert-base-uncased", max_length=128)
    print(f"✅ Model initialized: {model}")
    
    # Load model
    model.load()
    print("✅ Model loaded")
    
    # Test preprocessing
    text = "Test text for preprocessing"
    inputs = model.preprocess(text)
    print(f"✅ Preprocessing worked. Input shape: {inputs['input_ids'].shape}")
    
    return True

if __name__ == "__main__":
    test_base_model()