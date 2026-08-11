import api from './api.service';

export interface LoginPayload { email: string; password: string; }
export interface RegisterPayload { name: string; email: string; password: string; }
export interface AuthResponse {
  user: { id: string; email: string; name: string; role: string; createdAt: string };
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export const authService = {
  login: (payload: LoginPayload) =>
    api.post<{ data: AuthResponse }>('/auth/login', payload).then((r) => r.data.data),

  register: (payload: RegisterPayload) =>
    api.post<{ data: AuthResponse }>('/auth/register', payload).then((r) => r.data.data),

  logout: () => api.post('/auth/logout'),

  me: () => api.get('/auth/me').then((r) => r.data.data),

  refresh: (refreshToken: string) =>
    api.post<{ data: AuthResponse }>('/auth/refresh', { refreshToken }).then((r) => r.data.data),
};
