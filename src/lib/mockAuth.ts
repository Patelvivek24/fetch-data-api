/**
 * Mock Authentication for Development
 * 
 * This file provides a mock authentication system that works without a backend.
 * Set NEXT_PUBLIC_USE_MOCK_AUTH=true in your .env.local to enable this.
 * 
 * WARNING: This is for development only. Never use in production!
 */

export interface MockAuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock user database (in-memory, resets on page refresh)
const mockUsers: Array<{
  id: string;
  name: string;
  email: string;
  password: string;
}> = [];

// Generate a simple JWT-like token (not a real JWT, just for mock)
const generateMockToken = (userId: string): string => {
  const payload = {
    userId,
    iat: Date.now(),
  };
  return `mock_token_${btoa(JSON.stringify(payload))}`;
};

export const mockAuth = {
  async login(email: string, password: string): Promise<MockAuthResponse> {
    await delay(800); // Simulate network delay

    const user = mockUsers.find(u => u.email === email && u.password === password);
    
    if (!user) {
      throw {
        message: 'Invalid email or password',
      };
    }

    return {
      token: generateMockToken(user.id),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  },

  async signup(name: string, email: string, password: string): Promise<MockAuthResponse> {
    await delay(1000); // Simulate network delay

    // Check if user already exists
    if (mockUsers.find(u => u.email === email)) {
      throw {
        message: 'Email already registered',
      };
    }

    // Create new user
    const newUser = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      email,
      password, // In real app, this would be hashed
    };

    mockUsers.push(newUser);

    return {
      token: generateMockToken(newUser.id),
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
      },
    };
  },
};

