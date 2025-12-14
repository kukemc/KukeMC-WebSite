import axios from 'axios';

const baseURL = typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_BASE 
  ? process.env.NEXT_PUBLIC_API_BASE 
  : (import.meta.env ? import.meta.env.VITE_API_BASE : 'https://api.kuke.ink');

const api = axios.create({
  baseURL: baseURL || 'https://api.kuke.ink',
  timeout: 60000,
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const AUTH_ERROR_EVENT = 'auth_error';

export const verifyToken = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    // 使用新的axios实例请求，避免触发拦截器的无限循环
    // Use the same base URL logic as the main api instance
    const baseURL = api.defaults.baseURL;
    const response = await axios.get(`${baseURL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.status === 200;
  } catch (error) {
    return false;
  }
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // 用户提到的301错误，以及常见的401/403鉴权错误
    if (error.response && (error.response.status === 401 || error.response.status === 403 || error.response.status === 301)) {
      // 不直接退出，而是先验证Token是否真的过期
      const isTokenValid = await verifyToken();
      
      if (!isTokenValid) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event(AUTH_ERROR_EVENT));
        
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login?expired=true';
        }
      }
    }
    return Promise.reject(error);
  }
);

// --- Security Utils ---
// In a real world, keeping secret in frontend is not secure.
// But per user request for "website encryption algorithm", we implement it here.
// Ideally, we should fetch a signed upload URL from backend.
// But for this task, we follow the instruction to calculate on frontend.

const UPLOAD_SECRET = "kuke_upload_secret_2024"; 

export const generateUploadHeaders = async () => {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const payload = `${timestamp}${UPLOAD_SECRET}`;
  
  // Calculate SHA-256
  const msgBuffer = new TextEncoder().encode(payload);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return {
    'X-Upload-Signature': signature,
    'X-Upload-Timestamp': timestamp
  };
};

export default api;
