export interface User {
  id: string;
  phone: string;
  userid: string;
  fullName?: string;
  email?: string;
  avatar?: string;
  role: 'USER' | 'PLAYER' | 'COACH' | 'SCOUTER' | 'EDITOR' | 'ADMIN' | 'SUPER_USER';
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginCredentials {
  phone: string;
  password: string;
}

export interface RegisterData {
  fullName: string;
  phone: string;
  password: string;
  role: 'USER' | 'PLAYER' | 'COACH' | 'SCOUTER';
  provinceId: number;
  email?: string;
  playerProfile?: {
    positions?: string[];
    height?: string;
    weight?: string;
    preferredFoot?: string;
  };
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}
