const express = require('express');
const multer = require('multer');
const router = express.Router();
const userController = require('../controllers/userController.js');
const { authenticateToken } = require('../middleware/authMiddleware.js');
const upload = multer({ storage: multer.memoryStorage() });

// Don't need the authentication
router.post('/', upload.single('profilePicture'), userController.createUser); //create a new user
router.post('/login', userController.login); //login

// // Need the authentication
router.get('/:userName', authenticateToken, userController.getuserName); //get a specific user
router.delete('/:userName', authenticateToken, userController.deleteUser); //delete an existed user
router.put('/:userName', authenticateToken, upload.single('profilePicture'), userController.updateUser); //update an existed user
router.get('/:userName/search', authenticateToken, userController.searchJourneys); //search in all journeys of a user

module.exports = router;