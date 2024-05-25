const request = require('supertest');
const express = require('express');
const app = require('./server.js'); 

jest.mock('axios');
const axios = require('axios');
const { createToken } = require('./helpers/tokens'); 

const mockUser = { username: 'testuser', password: 'password123' };
const mockToken = createToken(mockUser);

jest.mock('./auth', () => ({
  authenticateJWT: (req, res, next) => next(),
}));

jest.mock('./models.js', () => ({
  User: {
    authenticate: jest.fn().mockResolvedValue(mockUser),
    register: jest.fn().mockResolvedValue(mockUser),
    get: jest.fn().mockResolvedValue(mockUser),
    update: jest.fn().mockResolvedValue(mockUser),
    addFavoriteBreed: jest.fn().mockResolvedValue(true),
    removeFavoriteBreed: jest.fn().mockResolvedValue(true),
  },
  DogBreed: {
    get: jest.fn().mockResolvedValue({ breed: 'Labrador', info: 'Friendly dog' }),
  }
}));

describe('Express App', () => {
  describe('POST /users/token', () => {
    it('should return a token for valid user credentials', async () => {
      const res = await request(app)
        .post('/users/token')
        .send({ username: 'testuser', password: 'password123' });
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
    });

    it('should return 400 for invalid user credentials', async () => {
      const res = await request(app)
        .post('/users/token')
        .send({ username: 'invaliduser', password: 'wrongpassword' });
      
      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /users/register', () => {
    it('should register a new user and return a token', async () => {
      const res = await request(app)
        .post('/users/register')
        .send({ username: 'newuser', password: 'newpassword' });
      
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('token');
    });

    it('should return 400 for invalid user data', async () => {
      const res = await request(app)
        .post('/users/register')
        .send({ username: '', password: '' });
      
      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /users/:username', () => {
    it('should return user data for a valid username', async () => {
      const res = await request(app)
        .get('/users/testuser')
        .set('Authorization', `Bearer ${mockToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('user');
    });

    it('should return 401 for an unauthorized user', async () => {
      const res = await request(app)
        .get('/users/testuser');
      
      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /breeds/:breedname', () => {
    it('should return breed info for a valid breed name', async () => {
      const res = await request(app)
        .get('/breeds/Labrador');
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('breedinfo');
    });

    it('should return 500 for an invalid breed name', async () => {
      const res = await request(app)
        .get('/breeds/InvalidBreed');
      
      expect(res.statusCode).toBe(500);
    });
  });
  
});
