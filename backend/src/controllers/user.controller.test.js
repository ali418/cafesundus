const request = require('supertest');
const express = require('express');
const userController = require('./user.controller');
const User = require('../models/user');
const auth = require('../middleware/auth');

// Mock dependencies
jest.mock('../models/User');
jest.mock('../middleware/auth');

// Create express app for testing
const app = express();
app.use(express.json());

// Setup routes for testing
app.get('/api/users', auth, userController.getAllUsers);
app.get('/api/users/:id', auth, userController.getUserById);
app.post('/api/users', auth, userController.createUser);
app.put('/api/users/:id', auth, userController.updateUser);
app.delete('/api/users/:id', auth, userController.deleteUser);

describe('User Controller', () => {
  // Setup auth middleware mock
  beforeEach(() => {
    // Mock auth middleware to pass through
    auth.mockImplementation((req, res, next) => {
      req.user = { id: 1, role: 'admin' };
      next();
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/users', () => {
    test('should return all users', async () => {
      // Mock User.find to return sample users
      const mockUsers = [
        { _id: '1', name: 'User 1', email: 'user1@example.com', role: 'user' },
        { _id: '2', name: 'User 2', email: 'user2@example.com', role: 'admin' },
      ];
      
      User.find.mockResolvedValue(mockUsers);

      const response = await request(app).get('/api/users');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].name).toBe('User 1');
      expect(response.body[1].name).toBe('User 2');
      expect(User.find).toHaveBeenCalledTimes(1);
    });

    test('should handle errors', async () => {
      // Mock User.find to throw an error
      User.find.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/users');

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Server Error');
    });
  });

  describe('GET /api/users/:id', () => {
    test('should return a user by ID', async () => {
      // Mock User.findById to return a sample user
      const mockUser = { _id: '1', name: 'User 1', email: 'user1@example.com', role: 'user' };
      User.findById.mockResolvedValue(mockUser);

      const response = await request(app).get('/api/users/1');

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('User 1');
      expect(response.body.email).toBe('user1@example.com');
      expect(User.findById).toHaveBeenCalledWith('1');
    });

    test('should return 404 if user not found', async () => {
      // Mock User.findById to return null
      User.findById.mockResolvedValue(null);

      const response = await request(app).get('/api/users/999');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('User not found');
    });

    test('should handle invalid ID format', async () => {
      // Mock User.findById to throw an error for invalid ID
      User.findById.mockRejectedValue(new Error('Invalid ID'));

      const response = await request(app).get('/api/users/invalid-id');

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Server Error');
    });
  });

  describe('POST /api/users', () => {
    test('should create a new user', async () => {
      // Mock User constructor and save method
      const mockUser = {
        _id: '3',
        name: 'New User',
        email: 'newuser@example.com',
        role: 'user',
        save: jest.fn().mockResolvedValue({
          _id: '3',
          name: 'New User',
          email: 'newuser@example.com',
          role: 'user',
        }),
      };

      User.mockImplementation(() => mockUser);
      User.findOne.mockResolvedValue(null); // User doesn't exist yet

      const userData = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'password123',
        role: 'user',
      };

      const response = await request(app)
        .post('/api/users')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.name).toBe('New User');
      expect(response.body.email).toBe('newuser@example.com');
      expect(mockUser.save).toHaveBeenCalledTimes(1);
    });

    test('should return 400 if user already exists', async () => {
      // Mock User.findOne to return an existing user
      User.findOne.mockResolvedValue({ email: 'existing@example.com' });

      const userData = {
        name: 'Existing User',
        email: 'existing@example.com',
        password: 'password123',
        role: 'user',
      };

      const response = await request(app)
        .post('/api/users')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('User already exists');
    });

    test('should return 400 if required fields are missing', async () => {
      const userData = {
        // Missing name and password
        email: 'incomplete@example.com',
      };

      const response = await request(app)
        .post('/api/users')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Please provide all required fields');
    });
  });

  describe('PUT /api/users/:id', () => {
    test('should update an existing user', async () => {
      // Mock User.findById and save method
      const mockUser = {
        _id: '1',
        name: 'User 1',
        email: 'user1@example.com',
        role: 'user',
        save: jest.fn().mockResolvedValue({
          _id: '1',
          name: 'Updated User',
          email: 'updated@example.com',
          role: 'user',
        }),
      };

      User.findById.mockResolvedValue(mockUser);

      const updateData = {
        name: 'Updated User',
        email: 'updated@example.com',
      };

      const response = await request(app)
        .put('/api/users/1')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated User');
      expect(response.body.email).toBe('updated@example.com');
      expect(mockUser.save).toHaveBeenCalledTimes(1);
    });

    test('should return 404 if user not found', async () => {
      // Mock User.findById to return null
      User.findById.mockResolvedValue(null);

      const updateData = {
        name: 'Updated User',
      };

      const response = await request(app)
        .put('/api/users/999')
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('User not found');
    });

    test('should handle validation errors', async () => {
      // Mock User.findById and save method with validation error
      const mockUser = {
        _id: '1',
        name: 'User 1',
        email: 'user1@example.com',
        role: 'user',
        save: jest.fn().mockRejectedValue({
          name: 'ValidationError',
          message: 'Email is invalid',
        }),
      };

      User.findById.mockResolvedValue(mockUser);

      const updateData = {
        email: 'invalid-email',
      };

      const response = await request(app)
        .put('/api/users/1')
        .send(updateData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Validation Error');
    });
  });

  describe('DELETE /api/users/:id', () => {
    test('should delete a user', async () => {
      // Mock User.findById and remove method
      const mockUser = {
        _id: '1',
        name: 'User 1',
        email: 'user1@example.com',
        role: 'user',
        remove: jest.fn().mockResolvedValue(true),
      };

      User.findById.mockResolvedValue(mockUser);

      const response = await request(app).delete('/api/users/1');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('User deleted successfully');
      expect(mockUser.remove).toHaveBeenCalledTimes(1);
    });

    test('should return 404 if user not found', async () => {
      // Mock User.findById to return null
      User.findById.mockResolvedValue(null);

      const response = await request(app).delete('/api/users/999');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('User not found');
    });

    test('should prevent deleting the last admin user', async () => {
      // Mock User.findById to return an admin user
      const mockUser = {
        _id: '1',
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
      };

      User.findById.mockResolvedValue(mockUser);
      
      // Mock User.countDocuments to return 1 (last admin)
      User.countDocuments.mockResolvedValue(1);

      const response = await request(app).delete('/api/users/1');

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Cannot delete the last admin user');
    });
  });

  describe('Authorization', () => {
    test('should deny access for non-admin users', async () => {
      // Mock auth middleware to set non-admin user
      auth.mockImplementation((req, res, next) => {
        req.user = { id: 2, role: 'user' };
        next();
      });

      const response = await request(app).get('/api/users');

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Access denied. Admin role required');
    });
  });
});