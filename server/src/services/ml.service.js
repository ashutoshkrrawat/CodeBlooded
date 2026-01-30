import axios from 'axios';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

export const analyzeCrisis = async (
    text,
    source = 'manual',
    location = 'Unknown'
) => {
    try {
        const response = await axios.post(`${ML_SERVICE_URL}/analyze_crisis`, {
            text,
            source,
            location,
        });
        return response.data;
    } catch (error) {
        console.error('Error connecting to ML service:', error.message);
        // Return null or throw depending on how we want to handle failures
        return null;
    }
};
