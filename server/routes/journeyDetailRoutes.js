const express = require('express');
const multer = require('multer');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const JourneyDetailController = require('../controllers/journeyDetailController');
const upload = multer({ storage: multer.memoryStorage() });

router.get('/:journeyId/allDetails', authenticateToken, JourneyDetailController.getDetailsByJourneyId); //get all details of a journey
router.get('/:username/:journeyId/:detailId', authenticateToken, JourneyDetailController.getDetailId); //get a specific detail
router.post('/:journeyId/createDetails', authenticateToken, upload.single('journalPhoto'), JourneyDetailController.createDetail); //create a new detail
router.delete('/:journeyId/:detailId', authenticateToken, JourneyDetailController.deleteDetail); //delete an existed detail
router.put('/:journeyId/:detailId/update', authenticateToken, JourneyDetailController.updateDetail); //update an existed detail

module.exports = router;
