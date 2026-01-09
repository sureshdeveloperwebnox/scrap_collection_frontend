/**
 * Centralized API configuration based on environment variables.
 * This ensures all API calls and resource URLs consistent.
 */

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7001/api/v1').replace(/\/$/, '');
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:7002').replace(/\/$/, '');

// Helper to get the base URL without the /api/v1 suffix if needed (for uploads, static files, etc.)
const GET_BASE_URL = () => {
    // If the URL contains /api/v1, strip it to get the server root
    if (API_BASE_URL.includes('/api/v1')) {
        return API_BASE_URL.split('/api/v1')[0];
    }
    return API_BASE_URL;
};

export const API_CONFIG = {
    // Frontend App URL (e.g., http://localhost:7002)
    APP_URL,

    // API Endpoint (e.g., http://localhost:7001/api/v1)
    BASE_URL: API_BASE_URL,

    // Server Root (e.g., http://localhost:7001)
    SERVER_URL: GET_BASE_URL(),

    // Uploads endpoint (e.g., http://localhost:7001/uploads)
    UPLOADS_URL: `${GET_BASE_URL()}/uploads`,

    // Version info
    VERSION: 'v1'
};

export default API_CONFIG;
