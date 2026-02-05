// services/apiClient.ts
// Helper สำหรับ API calls ที่ต้องใช้ Token

import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'auth_token';

/**
 * Fetch with Authorization header
 * ใช้แทน fetch() ปกติสำหรับ API ที่ต้อง login
 */
export const authFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const token = await AsyncStorage.getItem(TOKEN_KEY);

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    return fetch(url, {
        ...options,
        headers,
    });
};

/**
 * GET request with auth
 */
export const authGet = async (url: string): Promise<Response> => {
    return authFetch(url, { method: 'GET' });
};

/**
 * POST request with auth
 */
export const authPost = async (url: string, body: object): Promise<Response> => {
    return authFetch(url, {
        method: 'POST',
        body: JSON.stringify(body),
    });
};

/**
 * PATCH request with auth
 */
export const authPatch = async (url: string, body: object): Promise<Response> => {
    return authFetch(url, {
        method: 'PATCH',
        body: JSON.stringify(body),
    });
};
