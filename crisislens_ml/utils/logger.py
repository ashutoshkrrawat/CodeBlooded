# utils/logger.py
import logging
import sys
import os
from datetime import datetime

def setup_logger(name: str = "crisislens_ml"):
    """Setup logging configuration"""

    # Ensure logs directory exists
    os.makedirs("logs", exist_ok=True)

    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)

     # Prevent duplicate handlers
    if logger.handlers:
        return logger
    
    # Create handlers
    console_handler = logging.StreamHandler(sys.stdout)
    file_handler = logging.FileHandler(f"logs/ml_pipeline_{datetime.now().strftime('%Y%m%d')}.log")
    
   # Formatter
    formatter = logging.Formatter(
        "%(asctime)s | %(name)s | %(levelname)s | %(message)s"
    )
    
    # Add formatters to handlers
    console_handler.setFormatter(formatter)
    file_handler.setFormatter(formatter)
    
    # Add handlers to logger
    logger.addHandler(console_handler)
    logger.addHandler(file_handler)
    
    return logger

def setup_logger(name: str = "crisislens_ml"):
    """Setup logging configuration with Unicode support"""
    
    # Ensure logs directory exists
    os.makedirs("logs", exist_ok=True)

    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)

    # Prevent duplicate handlers
    if logger.handlers:
        return logger
    
    # Create handlers with UTF-8 encoding
    console_handler = logging.StreamHandler(sys.stdout)
    
    # Fix for Windows: Use UTF-8 encoding for file handler
    file_handler = logging.FileHandler(
        f"logs/ml_pipeline_{datetime.now().strftime('%Y%m%d')}.log",
        encoding='utf-8'
    )
    
    # Formatter
    formatter = logging.Formatter(
        "%(asctime)s | %(name)s | %(levelname)s | %(message)s"
    )
    
    # Add formatters to handlers
    console_handler.setFormatter(formatter)
    file_handler.setFormatter(formatter)
    
    # Add handlers to logger
    logger.addHandler(console_handler)
    logger.addHandler(file_handler)
    
    return logger

logger = setup_logger()
logger.info("Logger initialized successfully")