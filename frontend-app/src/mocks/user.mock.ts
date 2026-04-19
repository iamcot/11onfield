import { User, AuthResponse } from '@/types/auth';

// Mock user data for development
export const mockUsers = [
  {
    id: '1',
    email: 'player@11of.com',
    username: '0123456789',
    fullName: 'Nguyễn Văn A',
    role: 'USER' as const,
    isPlayer: true,
    positions: ['striker', 'midfielder'],
    height: '175',
    weight: '70',
    preferredFoot: 'right',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    email: 'admin@11of.com',
    username: '0987654321',
    fullName: 'Trần Thị B',
    role: 'ADMIN' as const,
    isPlayer: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    email: 'user@11of.com',
    username: '0111111111',
    fullName: 'Lê Văn C',
    role: 'USER' as const,
    isPlayer: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Mock tokens
const mockTokens = {
  accessToken: 'mock-access-token-' + Date.now(),
  refreshToken: 'mock-refresh-token-' + Date.now(),
  expiresIn: 3600,
};

// Mock login function
export const mockLogin = (phone: string, password: string): AuthResponse => {
  // Find user by phone
  const user = mockUsers.find(u => u.username === phone);

  if (!user) {
    throw new Error('Số điện thoại hoặc mật khẩu không đúng');
  }

  // In mock mode, any password works
  // In a real scenario, you'd check the password

  return {
    user: user as User,
    tokens: mockTokens,
  };
};

// Mock register function
export const mockRegister = (data: any): AuthResponse => {
  const newUser: User = {
    id: String(mockUsers.length + 1),
    email: data.email || '',
    username: data.phone,
    fullName: data.fullName,
    role: 'USER',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mockUsers.push(newUser as any);

  return {
    user: newUser,
    tokens: mockTokens,
  };
};

// Mock get current user
export const mockGetCurrentUser = (): User => {
  // Return the first user by default
  return mockUsers[0] as User;
};

// Helper to get mock user by ID
export const getMockUserById = (id: string): User | undefined => {
  return mockUsers.find(u => u.id === id) as User | undefined;
};

// Helper to get mock user by phone
export const getMockUserByPhone = (phone: string): User | undefined => {
  return mockUsers.find(u => u.username === phone) as User | undefined;
};
