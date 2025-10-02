const request = require('supertest');
const express = require('express');
const productController = require('./product.controller');
const Product = require('../models/Product');
const Category = require('../models/category');
const auth = require('../middleware/auth');

// Mock dependencies
jest.mock('../models/Product');
jest.mock('../models/Category');
jest.mock('../middleware/auth');

// Create express app for testing
const app = express();
app.use(express.json());

// Setup routes for testing
app.get('/api/products', productController.getAllProducts);
app.get('/api/products/:id', productController.getProductById);
app.post('/api/products', auth, productController.createProduct);
app.put('/api/products/:id', auth, productController.updateProduct);
app.delete('/api/products/:id', auth, productController.deleteProduct);

describe('Product Controller', () => {
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

  describe('GET /api/products', () => {
    test('should return all products', async () => {
      // Mock Product.find to return sample products
      const mockProducts = [
        { 
          _id: '1', 
          name: 'Product 1', 
          description: 'Description 1',
          price: 99.99,
          category: { _id: '1', name: 'Category 1' },
          stock: 100,
          status: 'active'
        },
        { 
          _id: '2', 
          name: 'Product 2', 
          description: 'Description 2',
          price: 149.99,
          category: { _id: '2', name: 'Category 2' },
          stock: 50,
          status: 'active'
        },
      ];
      
      // Mock the query chain
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockProducts)
      };
      
      Product.find.mockReturnValue(mockQuery);
      Product.countDocuments.mockResolvedValue(2);

      const response = await request(app).get('/api/products');

      expect(response.status).toBe(200);
      expect(response.body.products).toHaveLength(2);
      expect(response.body.products[0].name).toBe('Product 1');
      expect(response.body.products[1].name).toBe('Product 2');
      expect(response.body.totalItems).toBe(2);
      expect(mockQuery.populate).toHaveBeenCalledWith('category');
    });

    test('should filter products by category', async () => {
      // Mock the query chain
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([
          { 
            _id: '1', 
            name: 'Product 1', 
            category: { _id: '1', name: 'Category 1' }
          }
        ])
      };
      
      Product.find.mockReturnValue(mockQuery);
      Product.countDocuments.mockResolvedValue(1);

      const response = await request(app).get('/api/products?category=1');

      expect(response.status).toBe(200);
      expect(response.body.products).toHaveLength(1);
      expect(Product.find).toHaveBeenCalledWith(expect.objectContaining({
        category: '1'
      }));
    });

    test('should filter products by search term', async () => {
      // Mock the query chain
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([
          { 
            _id: '1', 
            name: 'Test Product', 
            category: { _id: '1', name: 'Category 1' }
          }
        ])
      };
      
      Product.find.mockReturnValue(mockQuery);
      Product.countDocuments.mockResolvedValue(1);

      const response = await request(app).get('/api/products?search=test');

      expect(response.status).toBe(200);
      expect(response.body.products).toHaveLength(1);
      expect(Product.find).toHaveBeenCalledWith(expect.objectContaining({
        $or: [
          { name: expect.objectContaining({ $regex: 'test', $options: 'i' }) },
          { description: expect.objectContaining({ $regex: 'test', $options: 'i' }) }
        ]
      }));
    });

    test('should handle pagination', async () => {
      // Mock the query chain
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([
          { _id: '3', name: 'Product 3' },
          { _id: '4', name: 'Product 4' }
        ])
      };
      
      Product.find.mockReturnValue(mockQuery);
      Product.countDocuments.mockResolvedValue(10); // Total 10 products

      const response = await request(app).get('/api/products?page=2&limit=2');

      expect(response.status).toBe(200);
      expect(response.body.products).toHaveLength(2);
      expect(response.body.currentPage).toBe(2);
      expect(response.body.totalPages).toBe(5); // 10 products / 2 per page = 5 pages
      expect(mockQuery.skip).toHaveBeenCalledWith(2); // Skip first 2 products
      expect(mockQuery.limit).toHaveBeenCalledWith(2);
    });

    test('should handle sorting', async () => {
      // Mock the query chain
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([
          { _id: '1', name: 'Product A', price: 10 },
          { _id: '2', name: 'Product B', price: 20 }
        ])
      };
      
      Product.find.mockReturnValue(mockQuery);
      Product.countDocuments.mockResolvedValue(2);

      const response = await request(app).get('/api/products?sortBy=price&sortDirection=asc');

      expect(response.status).toBe(200);
      expect(mockQuery.sort).toHaveBeenCalledWith({ price: 1 });
    });

    test('should handle errors', async () => {
      // Mock Product.find to throw an error
      Product.find.mockImplementation(() => {
        throw new Error('Database error');
      });

      const response = await request(app).get('/api/products');

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Server Error');
    });
  });

  describe('GET /api/products/:id', () => {
    test('should return a product by ID', async () => {
      // Mock Product.findById to return a sample product
      const mockProduct = { 
        _id: '1', 
        name: 'Product 1', 
        description: 'Description 1',
        price: 99.99,
        category: { _id: '1', name: 'Category 1' },
        stock: 100,
        status: 'active'
      };
      
      const mockPopulate = jest.fn().mockResolvedValue(mockProduct);
      Product.findById.mockReturnValue({
        populate: mockPopulate
      });

      const response = await request(app).get('/api/products/1');

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Product 1');
      expect(response.body.price).toBe(99.99);
      expect(response.body.category.name).toBe('Category 1');
      expect(Product.findById).toHaveBeenCalledWith('1');
      expect(mockPopulate).toHaveBeenCalledWith('category');
    });

    test('should return 404 if product not found', async () => {
      // Mock Product.findById to return null
      const mockPopulate = jest.fn().mockResolvedValue(null);
      Product.findById.mockReturnValue({
        populate: mockPopulate
      });

      const response = await request(app).get('/api/products/999');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Product not found');
    });

    test('should handle invalid ID format', async () => {
      // Mock Product.findById to throw an error for invalid ID
      Product.findById.mockImplementation(() => {
        throw new Error('Invalid ID');
      });

      const response = await request(app).get('/api/products/invalid-id');

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Server Error');
    });
  });

  describe('POST /api/products', () => {
    test('should create a new product', async () => {
      // Mock Category.findById to return a valid category
      Category.findById.mockResolvedValue({ _id: '1', name: 'Category 1' });

      // Mock Product constructor and save method
      const mockProduct = {
        _id: '3',
        name: 'New Product',
        description: 'New Description',
        price: 199.99,
        category: '1',
        stock: 50,
        status: 'active',
        save: jest.fn().mockResolvedValue({
          _id: '3',
          name: 'New Product',
          description: 'New Description',
          price: 199.99,
          category: '1',
          stock: 50,
          status: 'active',
        }),
      };

      Product.mockImplementation(() => mockProduct);

      const productData = {
        name: 'New Product',
        description: 'New Description',
        price: 199.99,
        category: '1',
        stock: 50,
        status: 'active',
      };

      const response = await request(app)
        .post('/api/products')
        .send(productData);

      expect(response.status).toBe(201);
      expect(response.body.name).toBe('New Product');
      expect(response.body.price).toBe(199.99);
      expect(mockProduct.save).toHaveBeenCalledTimes(1);
    });

    test('should return 400 if category does not exist', async () => {
      // Mock Category.findById to return null (category not found)
      Category.findById.mockResolvedValue(null);

      const productData = {
        name: 'New Product',
        description: 'New Description',
        price: 199.99,
        category: '999', // Non-existent category
        stock: 50,
        status: 'active',
      };

      const response = await request(app)
        .post('/api/products')
        .send(productData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Category not found');
    });

    test('should return 400 if required fields are missing', async () => {
      const productData = {
        // Missing name and price
        description: 'New Description',
        category: '1',
        stock: 50,
      };

      const response = await request(app)
        .post('/api/products')
        .send(productData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Please provide all required fields');
    });

    test('should handle validation errors', async () => {
      // Mock Category.findById to return a valid category
      Category.findById.mockResolvedValue({ _id: '1', name: 'Category 1' });

      // Mock Product constructor and save method with validation error
      const mockProduct = {
        name: 'New Product',
        description: 'New Description',
        price: -10, // Invalid price (negative)
        category: '1',
        stock: 50,
        save: jest.fn().mockRejectedValue({
          name: 'ValidationError',
          message: 'Price must be positive',
        }),
      };

      Product.mockImplementation(() => mockProduct);

      const productData = {
        name: 'New Product',
        description: 'New Description',
        price: -10, // Invalid price
        category: '1',
        stock: 50,
      };

      const response = await request(app)
        .post('/api/products')
        .send(productData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Validation Error');
    });
  });

  describe('PUT /api/products/:id', () => {
    test('should update an existing product', async () => {
      // Mock Category.findById to return a valid category
      Category.findById.mockResolvedValue({ _id: '2', name: 'Category 2' });

      // Mock Product.findById and save method
      const mockProduct = {
        _id: '1',
        name: 'Product 1',
        description: 'Description 1',
        price: 99.99,
        category: '1',
        stock: 100,
        status: 'active',
        save: jest.fn().mockResolvedValue({
          _id: '1',
          name: 'Updated Product',
          description: 'Updated Description',
          price: 129.99,
          category: '2',
          stock: 75,
          status: 'active',
        }),
      };

      Product.findById.mockResolvedValue(mockProduct);

      const updateData = {
        name: 'Updated Product',
        description: 'Updated Description',
        price: 129.99,
        category: '2',
        stock: 75,
      };

      const response = await request(app)
        .put('/api/products/1')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Product');
      expect(response.body.price).toBe(129.99);
      expect(response.body.category).toBe('2');
      expect(mockProduct.save).toHaveBeenCalledTimes(1);
    });

    test('should return 404 if product not found', async () => {
      // Mock Product.findById to return null
      Product.findById.mockResolvedValue(null);

      const updateData = {
        name: 'Updated Product',
      };

      const response = await request(app)
        .put('/api/products/999')
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Product not found');
    });

    test('should return 400 if category does not exist', async () => {
      // Mock Product.findById to return a product
      const mockProduct = {
        _id: '1',
        name: 'Product 1',
      };

      Product.findById.mockResolvedValue(mockProduct);

      // Mock Category.findById to return null (category not found)
      Category.findById.mockResolvedValue(null);

      const updateData = {
        category: '999', // Non-existent category
      };

      const response = await request(app)
        .put('/api/products/1')
        .send(updateData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Category not found');
    });
  });

  describe('DELETE /api/products/:id', () => {
    test('should delete a product', async () => {
      // Mock Product.findById and remove method
      const mockProduct = {
        _id: '1',
        name: 'Product 1',
        remove: jest.fn().mockResolvedValue(true),
      };

      Product.findById.mockResolvedValue(mockProduct);

      const response = await request(app).delete('/api/products/1');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Product deleted successfully');
      expect(mockProduct.remove).toHaveBeenCalledTimes(1);
    });

    test('should return 404 if product not found', async () => {
      // Mock Product.findById to return null
      Product.findById.mockResolvedValue(null);

      const response = await request(app).delete('/api/products/999');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Product not found');
    });
  });

  describe('Authorization', () => {
    test('should deny access for non-admin users', async () => {
      // Mock auth middleware to set non-admin user
      auth.mockImplementation((req, res, next) => {
        req.user = { id: 2, role: 'user' };
        next();
      });

      const productData = {
        name: 'New Product',
        description: 'New Description',
        price: 199.99,
        category: '1',
        stock: 50,
      };

      const response = await request(app)
        .post('/api/products')
        .send(productData);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Access denied. Admin role required');
    });
  });
});