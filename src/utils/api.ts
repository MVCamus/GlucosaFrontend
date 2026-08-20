const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
const API_KEY = import.meta.env.VITE_API_KEY || 'Polo-Key-Glucosa';

let refreshingPromise: Promise<string | null> | null = null;

async function doRefresh(): Promise<string | null> {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) return null;

  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) return null;

    const json = await response.json();
    const data = json && json.success === true && 'data' in json ? json.data : json;

    if (data?.accessToken && data?.refreshToken) {
      localStorage.setItem('jwt_token', data.accessToken);
      localStorage.setItem('refresh_token', data.refreshToken);
      return data.accessToken;
    }
    return null;
  } catch (e) {
    console.error('Token refresh failed:', e);
    return null;
  }
}

async function refreshAccessToken(): Promise<string | null> {
  if (refreshingPromise) return refreshingPromise;
  refreshingPromise = doRefresh().finally(() => {
    refreshingPromise = null;
  });
  return refreshingPromise;
}

async function buildHeaders(options: RequestInit): Promise<HeadersInit> {
  const token = localStorage.getItem('jwt_token');
  return {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };
}

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: Record<string, any>;

  constructor(status: number, message: string, code?: string, details?: Record<string, any>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseResponse<T = any>(json: any): T {
  if (json && typeof json === 'object' && json.success === true && 'data' in json) {
    return json.data as T;
  }
  return json as T;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function apiRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = await buildHeaders(options);
  let response: Response;
  try {
    response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  } catch (netErr: any) {
    throw new ApiError(
      0,
      'No se pudo conectar con el servidor. Verifica tu conexión a internet o la disponibilidad del backend.',
      'NETWORK_ERROR'
    );
  }

  if (response.status === 401) {
    const isAuthEndpoint =
      endpoint.includes('/auth/login') ||
      endpoint.includes('/auth/signup') ||
      endpoint.includes('/auth/refresh');

    if (!isAuthEndpoint) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        const retryHeaders = await buildHeaders(options);
        try {
          response = await fetch(`${API_URL}${endpoint}`, { ...options, headers: retryHeaders });
        } catch (netErr: any) {
          throw new ApiError(
            0,
            'Error de conexión al reintentar la solicitud.',
            'NETWORK_ERROR'
          );
        }
      } else {
        const { useAppStore } = await import('../stores/appStore');
        useAppStore.getState().logout();
        useAppStore.getState().addToast({
          message: 'Sesión expirada o no autorizada. Por favor, inicia sesión de nuevo.',
          type: 'error',
        });
        throw new ApiError(401, 'Sesión expirada', 'UNAUTHORIZED');
      }
    }
  }

  if (!response.ok) {
    let errorMessage = `Error del servidor (${response.status})`;
    let errorCode: string | undefined = undefined;
    let errorDetails: Record<string, any> | undefined = undefined;

    try {
      const errJson = await response.json();
      if (errJson?.error) {
        errorMessage = errJson.error.message || errorMessage;
        errorCode = errJson.error.code;
        errorDetails = errJson.error.details;
      } else if (errJson?.message) {
        errorMessage = Array.isArray(errJson.message) ? errJson.message.join(', ') : errJson.message;
      }
    } catch {
      // Si la respuesta no es JSON, mantener el mensaje por defecto
    }

    throw new ApiError(response.status, errorMessage, errorCode, errorDetails);
  }

  const json = await response.json();
  return parseResponse<T>(json);
}