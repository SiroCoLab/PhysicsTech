// Central API configuration (one place to change for a future Telegram Mini App deployment).
export type DataMode = 'local' | 'api' | 'mock';

const rawMode = String(import.meta.env.VITE_DATA_MODE ?? 'local').trim().toLowerCase();

export const DATA_MODE: DataMode = rawMode === 'api' || rawMode === 'mock' ? rawMode : 'local';
export const API_BASE_URL: string = String(import.meta.env.VITE_API_BASE_URL ?? '').trim().replace(/\/+$/, '');
export const DEV_USER: string = String(import.meta.env.VITE_DEV_USER ?? '').trim();

export const apiUrl = (path: string): string => API_BASE_URL + path;
