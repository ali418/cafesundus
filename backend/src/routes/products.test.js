const request = require('supertest');
const app = require('../index');
const { Product, Category } = require('../models');

// Mock the Product and Category models
jest.mock('../models', () => ({
  Product: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  },
  Category: {
    findAll: jest.fn(),
  },
}));

// Mock authentication middleware
jest.mock('../middleware/auth', () => ({
  authenticate: (req, res, next) => {
    req.user = { id: 1, role: 'admin' };
    next();
  },
  authorize: (roles) => (req, res, next) => next(),
}));

describe('Products API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/products', () => {
    test('should return all products', async () => {
      // Mock data
      const mockProducts = [
        {
          id: 1,
          name: 'Product 1',
          description: 'Description 1',
          price: 10.99,
          categoryId: 1,
          stock: 100,
          barcode: '123456789',
          Category: { id: 1, name: 'Category 1' },
        },
        {
          id: 2,
          name: 'Product 2',
          description: 'Description 2',
          price: 20.99,
          categoryId: 2,
          stock: 50,
          barcode: '987654321',
          Category: { id: 2, name: 'Category 2' },
        },
      ];

      // Mock the Product.findAll method
      Product.findAll.mockResolvedValue(mockProducts);

      // Make the request
      const response = await request(app).get('/api/products');

      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].name).toBe('Product 1');
      expect(response.body[1].name).toBe('Product 2');
      expect(Product.findAll).toHaveBeenCalled();
    });

    test('should handle errors', async () => {
      // Mock the Product.findAll method to throw an error
      Product.findAll.mockRejectedValue(new Error('Database error'));

      // Make the request
      const response = await request(app).get('/api/products');

      // Assertions
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Error fetching products');
    });
  });

  describe('GET /api/products/:id', () => {
    test('should return a single product by ID', async () => {
      // Mock data
      const mockProduct = {
        id: 1,
        name: 'Product 1',
        description: 'Description 1',
        price: 10.99,
        categoryId: 1,
        stock: 100,
        barcode: '123456789',
        Category: { id: 1, name: 'Category 1' },
      };

      // Mock the Product.findByPk method
      Product.findByPk.mockResolvedValue(mockProduct);

      // Make the request
      const response = await request(app).get('/api/products/1');

      // Assertions
      expect(response.status).toBe(200);
      expect(response.body.id).toBe(1);
      expect(response.body.name).toBe('Product 1');
      expect(Product.findByPk).toHaveBeenCalledWith(1, expect.any(Object));
    });

    test('should return 404 if product not found', async () => {
      // Mock the Product.findByPk method to return null
      Product.findByPk.mockResolvedValue(null);

      // Make the request
      const response = await request(app).get('/api/products/999');

      // Assertions
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Product not found');
    });
  });

  describe('POST /api/products', () => {
    test('should create a new product', async () => {
      // Mock data
      const newProductData = {
        name: 'New Product',
        description: 'New Description',
        price: 15.99,
        categoryId: 1,
        stock: 75,
        barcode: '111222333',
      };

      const createdProduct = {
        id: 3,
        ...newProductData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock the Product.create method
      Product.create.mockResolvedValue(createdProduct);

      // Make the request
      const response = await request(app)
        .post('/api/products')
        .send(newProductData);

      // Assertions
      expect(response.status).toBe(201);
      expect(response.body.id).toBe(3);
      expect(response.body.name).toBe('New Product');
      expect(Product.create).toHaveBeenCalledWith(newProductData);
    });

    test('should handle validation errors', async () => {
      // Make the request with invalid data (missing required fields)
      const response = await request(app)
        .post('/api/products')
        .send({ name: 'Invalid Product' }); // Missing required fields

      // Assertions
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('PUT /api/products/:id', () => {
    test('should update an existing product', async () => {
      // Mock data
      const productId = 1;
      const updateData = {
        name: 'Updated Product',
        price: 25.99,
      };

      const existingProduct = {
        id: productId,
        name: 'Product 1',
        description: 'Description 1',
        price: 10.99,
        categoryId: 1,
        stock: 100,
        barcode: '123456789',
      };

      const updatedProduct = {
        ...existingProduct,
        ...updateData,
      };

      // Mock the Product.findByPk and Product.update methods
      Product.findByPk.mockResolvedValue(existingProduct);
      Product.update.mockResolvedValue([1, [updatedProduct]]);

      // Make the request
      const response = await request(app)
        .put(`/api/products/${productId}`)
        .send(updateData);

      // Assertions
      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Product');
      expect(response.body.price).toBe(25.99);
      expect(Product.update).toHaveBeenCalledWith(
        updateData,
        { where: { id: productId }, returning: true }
      );
    });

    test('should return 404 if product to update not found', async () => {
      // Mock the Product.findByPk method to return null
      Product.findByPk.mockResolvedValue(null);

      // Make the request
      const response = await request(app)
        .put('/api/products/999')
        .send({ name: 'Updated Product' });

      // Assertions
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Product not found');
    });
  });

  describe('DELETE /api/products/:id', () => {
    test('should delete an existing product', async () => {
      // Mock data
      const productId = 1;
      const existingProduct = {
        id: productId,
        name: 'Product 1',
      };

      // Mock the Product.findByPk and Product.destroy methods
      Product.findByPk.mockResolvedValue(existingProduct);
      Product.destroy.mockResolvedValue(1);

      // Make the request
      const response = await request(app).delete(`/api/products/${productId}`);

      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Product deleted successfully');
      expect(Product.destroy).toHaveBeenCalledWith({ where: { id: productId } });
    });

    test('should return 404 if product to delete not found', async () => {
      // Mock the Product.findByPk method to return null
      Product.findByPk.mockResolvedValue(null);

      // Make the request
      const response = await request(app).delete('/api/products/999');

      // Assertions
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Product not found');
    });
  });
});