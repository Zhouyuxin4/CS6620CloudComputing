const express = require('express');
const router = express.Router();
const journeyController = require('../controllers/journeyController');
const { authenticateToken } = require('../middleware/authMiddleware.js');

router.get('/:userName', authenticateToken, journeyController.getAllJourneys); //get all journeys of a user
router.get('/:userName/:journeyId', authenticateToken, journeyController.getJourneyId); //get a specific journey
router.post('/:userName', authenticateToken, journeyController.createJourney); //create a new journey
router.delete('/:userName/:journeyId', authenticateToken, journeyController.deleteJourney); //delete an existed journey
router.put('/:journeyId', authenticateToken, journeyController.updateJourney); //update an existed journey

module.exports = router;