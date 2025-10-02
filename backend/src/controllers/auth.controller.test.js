const request = require('supertest');
const app = require('../index');
const { User } = require('../models');
const jwt = require('jsonwebtoken');

// Mock the User model and JWT
jest.mock('../models', () => ({
  User: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'test-token'),
  verify: jest.fn(),
}));

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(() => 'hashed-password'),
}));

describe('Auth Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/login', () => {
    test('should login a user with valid credentials', async () => {
      // Mock user data
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: 'hashed-password',
        role: 'admin',
        toJSON: () => ({
          id: 1,
          email: 'test@example.com',
          role: 'admin',
        }),
      };

      // Mock User.findOne to return our mock user
      User.findOne.mockResolvedValue(mockUser);
      
      // Mock bcryptjs.compare to return true (password matches)
      require('bcryptjs').compare.mockResolvedValue(true);

      // Make the request
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('test@example.com');
      expect(User.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(jwt.sign).toHaveBeenCalled();
    });

    test('should return 401 with invalid credentials', async () => {
      // Mock User.findOne to return a user
      User.findOne.mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        password: 'hashed-password',
      });
      
      // Mock bcryptjs.compare to return false (password doesn't match)
      require('bcryptjs').compare.mockResolvedValue(false);

      // Make the request
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrong-password',
        });

      // Assertions
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Invalid credentials');
    });

    test('should return 404 when user not found', async () => {
      // Mock User.findOne to return null (user not found)
      User.findOne.mockResolvedValue(null);

      // Make the request
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        });

      // Assertions
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('User not found');
    });
  });

  describe('POST /api/auth/register', () => {
    test('should register a new user successfully', async () => {
      // Mock User.findOne to return null (user doesn't exist yet)
      User.findOne.mockResolvedValue(null);
      
      // Mock User.create to return a new user
      const newUser = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
        toJSON: () => ({
          id: 1,
          name: 'Test User',
          email: 'test@example.com',
          role: 'user',
        }),
      };
      User.create.mockResolvedValue(newUser);

      // Make the request
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
        });

      // Assertions
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.name).toBe('Test User');
      expect(response.body.user.email).toBe('test@example.com');
      expect(User.create).toHaveBeenCalled();
      expect(jwt.sign).toHaveBeenCalled();
    });

    test('should return 409 if user already exists', async () => {
      // Mock User.findOne to return an existing user
      User.findOne.mockResolvedValue({
        id: 1,
        email: 'existing@example.com',
      });

      // Make the request
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Existing User',
          email: 'existing@example.com',
          password: 'password123',
        });

      // Assertions
      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('User already exists');
      expect(User.create).not.toHaveBeenCalled();
    });
  });
});