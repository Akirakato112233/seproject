// constants/config.ts

const _baseUrl =
    process.env.EXPO_PUBLIC_BASE_URL?.trim()?.startsWith('http')
        ? process.env.EXPO_PUBLIC_BASE_URL.trim()
        : 'https://nonheritably-panpsychistic-joannie.ngrok-free.dev';

const ENV = {
    dev: {
        apiUrl: `${_baseUrl}/api`,
    },
    prod: {
        apiUrl: 'https://your-api-domain.com/api',
    },
};

export const Config = {
    API_URL: __DEV__ ? ENV.dev.apiUrl : ENV.prod.apiUrl,
};
