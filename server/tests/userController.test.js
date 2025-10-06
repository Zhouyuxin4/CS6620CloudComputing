const request = require('supertest');
const express = require('express');
const userRoutes = require('../routes/userRoutes');
const Users = require('../models/Users');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

jest.mock('../models/Users');
jest.mock('jsonwebtoken');

const app = express();
app.use(express.json());
app.use(cookieParser());

app.use('/users', userRoutes);

describe('UserController Tests', () => {
  const mockUser = {
    userName: 'testUser',
    password: 'password123',
    profilePicture: undefined,
  };

  beforeEach(() => {
    Users.prototype.save = jest.fn().mockResolvedValue(mockUser);
    // Users.findOne = jest.fn().mockResolvedValue(mockUser);
    // Users.findOneAndUpdate = jest.fn().mockResolvedValue(mockUser);
    // Users.findOneAndDelete = jest.fn().mockResolvedValue(mockUser);
    jwt.verify.mockReturnValue({ userId: 'testUser' });
  });

  it('should create a new user', async () => {
    const response = await request(app).post('/users/').send(mockUser);
    console.log(response.body);
    expect(response.status).toBe(201);
    expect(response.body).toEqual({ message: 'User created successfully.' });
  });

  it('should return user by username', async () => {
    Users.findOne = jest.fn().mockResolvedValue(mockUser);

    const response = await request(app).get('/users/testUser').set('cookie', 'token=validToken');
    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockUser);
  });

  it('should authenticate a user and return a token', async () => {
    jwt.sign.mockReturnValue('fakeToken');
    const response = await request(app)
      .post('/users/login')
      .send({ userName: 'testUser', password: 'password123' });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      token: 'fakeToken',
      user: { userName: 'testUser', profilePicture: undefined },
    });
  });

  it('should delete a user', async () => {
    Users.findOneAndDelete = jest.fn().mockResolvedValue(mockUser);
    
    const response = await request(app).delete('/users/testUser').set('cookie', 'token=validToken');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'User deleted successfully.' });
  });

  it('should update a user', async () => {
    Users.findOneAndUpdate = jest.fn().mockResolvedValue({
        ...mockUser,
        userName: 'newUser',
      });
    
    const response = await request(app).put('/users/testUser').set('cookie', 'token=validToken').send({ userName: 'newUser' });
    expect(response.status).toBe(200);
    const updatedUser = { userName: 'newUser', password: 'password123', profilePicture: undefined };
    expect(response.body).toEqual(updatedUser);
  });
});
