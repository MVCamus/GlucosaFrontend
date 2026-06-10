const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
const API_KEY = import.meta.env.VITE_API_KEY || 'Polo-Key-Glucosa';

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem("jwt_token");

  const headers = {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  if (response.status === 401) {
    if (!endpoint.includes('/auth/login')) {
      const { useAppStore } = await import('../stores/appStore');
      useAppStore.getState().logout();
      useAppStore.getState().addToast({
        message: "Sesión expirada o no autorizada. Por favor, inicia sesión de nuevo.",
        type: "error"
      });
    }
    throw new Error(`API Error: 401`);
  }
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }
  const json = await response.json();
  if (json && typeof json === 'object' && json.success === true && 'data' in json) {
    return json.data;
  }
  return json;
}
