const request = require('supertest');
const express = require('express');
const journeyRoutes = require('../routes/journeyRoutes');
const Journeys = require('../models/Journeys');
const Users = require('../models/Users');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

jest.mock('../models/Journeys');
jest.mock('../models/Users');
jest.mock('jsonwebtoken');

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/journeys', journeyRoutes);

describe('JourneyController Tests', () => {
  const mockUser = {
    _id: 'user1',
    userName: 'testUser',
    journeys: [],
  };

  const mockJourney = {
    _id: 'journey1',
    title: 'Test Journey',
    details: [],
    userName: mockUser._id,
  };

  beforeEach(() => {
    jwt.verify.mockReturnValue({ userId: 'user1' });
    Journeys.prototype.save = jest.fn().mockResolvedValue(mockJourney);
  });

  it('should get all journeys for a user', async () => {
    Users.findOne = jest.fn().mockResolvedValue(mockUser);
    Journeys.find = jest.fn().mockResolvedValue([mockJourney]);

    const response = await request(app)
      .get('/journeys/testUser')
      .set('cookie', 'token=validToken');
    expect(response.status).toBe(200);
    expect(response.body).toEqual([mockJourney]);
  });

  it('should get a specific journey by ID', async () => {
    Journeys.findById = jest.fn().mockResolvedValue(mockJourney);

    const response = await request(app)
      .get('/journeys/testUser/journey1')
      .set('cookie', 'token=validToken');
    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockJourney);
  });

  it('should create a new journey for a user', async () => {
    Users.findOne = jest.fn().mockResolvedValue({
        ...mockUser,
        save: jest.fn().mockResolvedValue({
            ...mockUser,
            journeys: ['journey1'],
        }),
    });    
    Journeys.prototype.save = jest.fn().mockResolvedValue(mockJourney);
    Users.prototype.save = jest.fn().mockResolvedValue({
        ...mockUser,
        journeys: ['journey1'],
    });

    const response = await request(app)
        .post('/journeys/testUser')
        .set('cookie', 'token=validToken')
        .send({ title: 'Test Journey', details: [] });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(mockJourney);
    });

  it('should update a journey', async () => {
    Journeys.findByIdAndUpdate = jest.fn().mockResolvedValue({
      ...mockJourney,
      title: 'Updated Journey',
    });

    const response = await request(app)
      .put('/journeys/journey1')
      .set('cookie', 'token=validToken')
      .send({ title: 'Updated Journey' });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ...mockJourney, title: 'Updated Journey' });
  });

  it('should delete a journey', async () => {
    Journeys.findByIdAndDelete = jest.fn().mockResolvedValue(mockJourney);
    Users.findByIdAndUpdate = jest.fn().mockResolvedValue({
      ...mockUser,
      journeys: [],
    });

    const response = await request(app)
      .delete('/journeys/testUser/journey1')
      .set('cookie', 'token=validToken');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Journey deleted successfully.' });
  });
});
