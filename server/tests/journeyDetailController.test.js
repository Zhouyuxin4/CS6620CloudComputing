const mongoose = require('mongoose');
const JourneyDetails = require('../models/JourneyDetails');
const Journeys = require('../models/Journeys');
const { 
    getDetailsByJourneyId, 
    getDetailId, 
    createDetail, 
    deleteDetail, 
    updateDetail 
} = require('../controllers/journeyDetailController');

// Mock dependencies
jest.mock('@aws-sdk/client-s3', () => ({
    S3Client: jest.fn().mockImplementation(() => ({
        send: jest.fn().mockResolvedValue({})
    })),
    PutObjectCommand: jest.fn()
}));

describe('Journey Details Controller', () => {
    let mockReq, mockRes, mockNext;

    beforeEach(() => {
        mockReq = {
            params: {},
            body: {},
            file: null
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        mockNext = jest.fn();
    });

    describe('getDetailsByJourneyId', () => {
        it('should retrieve details for a specific journey', async () => {
            const mockJourneyId = '674ecf4b6de7d4713c324e6d';
            const mockDetails = [
                { 
                    _id: new mongoose.Types.ObjectId(),
                    journeyId: mockJourneyId,
                    time: new Date('2024-12-03T09:28:43.461Z'),
                    location: { type: 'Point', coordinates: [0, 0] },
                    journalText: 'New Journal Entry',
                    journalPhoto: 'https://updatedpicturebucket.s3.ca-central-1.amazonaws.com/1733218123463-test.jpg'
                }
            ];

            mockReq.params.journeyId = mockJourneyId;

            // Modify the mock to ensure it selects the specified fields
            jest.spyOn(JourneyDetails, 'find').mockImplementation(() => ({
                select: jest.fn().mockResolvedValue(mockDetails)
            }));

            await getDetailsByJourneyId(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(mockDetails);
        });

        it('should handle errors when retrieving journey details', async () => {
            const mockJourneyId = '674ecf4b6de7d4713c324e6d';
            mockReq.params.journeyId = mockJourneyId;

            // Modify the mock to throw an error
            jest.spyOn(JourneyDetails, 'find').mockImplementation(() => ({
                select: jest.fn().mockRejectedValue(new Error('Database error'))
            }));

            await getDetailsByJourneyId(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Database error'
            }));
        });
    });

    describe('getDetailId', () => {
        it('should retrieve a specific journey detail', async () => {
            const mockDetailId = new mongoose.Types.ObjectId();
            const mockDetail = { 
                _id: mockDetailId,
                journeyId: new mongoose.Types.ObjectId(),
                time: new Date(),
                location: { type: 'Point', coordinates: [0, 0] },
                journalText: 'Specific Journal Entry'
            };

            mockReq.params.detailId = mockDetailId;

            jest.spyOn(JourneyDetails, 'findById').mockResolvedValue(mockDetail);

            await getDetailId(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(mockDetail);
        });

        it('should handle errors when retrieving a specific journey detail', async () => {
            jest.spyOn(JourneyDetails, 'findById').mockRejectedValue(new Error('Not found'));

            await getDetailId(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Not found'
            }));
        });
    });

    describe('createDetail', () => {
        it('should create a new journey detail with photo', async () => {
            const mockJourneyId = new mongoose.Types.ObjectId();
            mockReq.body = {
                time: new Date(),
                location: JSON.stringify({ type: 'Point', coordinates: [0, 0] }),
                journalText: 'New Journal Entry',
                journeyId: mockJourneyId
            };
            mockReq.file = {
                originalname: 'test.jpg',
                buffer: Buffer.from('test'),
                mimetype: 'image/jpeg'
            };

            const mockNewDetail = {
                _id: new mongoose.Types.ObjectId(),
                ...mockReq.body,
                location: JSON.parse(mockReq.body.location),
                journalPhoto: expect.any(String)
            };

            jest.spyOn(JourneyDetails.prototype, 'save').mockResolvedValue(mockNewDetail);
            jest.spyOn(Journeys, 'findByIdAndUpdate').mockResolvedValue({});

            await createDetail(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                journalText: 'New Journal Entry',
                journalPhoto: expect.any(String)
            }));
        });

        it('should create a new journey detail without photo', async () => {
            const mockJourneyId = new mongoose.Types.ObjectId();
            mockReq.body = {
                time: new Date(),
                location: JSON.stringify({ type: 'Point', coordinates: [0, 0] }),
                journalText: 'New Journal Entry',
                journeyId: mockJourneyId
            };

            const mockNewDetail = {
                _id: new mongoose.Types.ObjectId(),
                ...mockReq.body,
                location: JSON.parse(mockReq.body.location),
                journalPhoto: null
            };

            jest.spyOn(JourneyDetails.prototype, 'save').mockResolvedValue(mockNewDetail);
            jest.spyOn(Journeys, 'findByIdAndUpdate').mockResolvedValue({});

            await createDetail(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                journalText: 'New Journal Entry',
                journalPhoto: null
            }));
        });
    });

    describe('deleteDetail', () => {
        it('should delete a journey detail successfully', async () => {
            const mockDetailId = new mongoose.Types.ObjectId();
            const mockJourneyId = new mongoose.Types.ObjectId();
            mockReq.params = { 
                detailId: mockDetailId,
                journeyId: mockJourneyId 
            };

            const mockDetail = {
                _id: mockDetailId,
                journeyId: mockJourneyId
            };

            jest.spyOn(JourneyDetails, 'findByIdAndDelete').mockResolvedValue(mockDetail);
            jest.spyOn(Journeys, 'findByIdAndUpdate').mockResolvedValue({});

            await deleteDetail(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Journey Detail deleted successfully.'
            });
        });

        it('should handle detail not found during deletion', async () => {
            const mockDetailId = new mongoose.Types.ObjectId();
            mockReq.params = { detailId: mockDetailId };

            jest.spyOn(JourneyDetails, 'findByIdAndDelete').mockResolvedValue(null);

            await deleteDetail(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Journey Detail not found.'
            });
        });
    });

    describe('updateDetail', () => {
        it('should update a journey detail successfully', async () => {
            const mockDetailId = new mongoose.Types.ObjectId();
            mockReq.params.detailId = mockDetailId;
            mockReq.body = {
                journalText: 'Updated Journal Entry'
            };

            const mockUpdatedDetail = {
                _id: mockDetailId,
                ...mockReq.body
            };

            jest.spyOn(JourneyDetails, 'findByIdAndUpdate').mockResolvedValue(mockUpdatedDetail);

            await updateDetail(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(mockUpdatedDetail);
        });

        it('should handle detail not found during update', async () => {
            const mockDetailId = new mongoose.Types.ObjectId();
            mockReq.params.detailId = mockDetailId;
            mockReq.body = {
                journalText: 'Updated Journal Entry'
            };

            jest.spyOn(JourneyDetails, 'findByIdAndUpdate').mockResolvedValue(null);

            await updateDetail(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Journey detail not found.'
            });
        });
    });
});