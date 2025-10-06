const jwt = require('jsonwebtoken');
const Users = require('../models/Users.js');
const Journeys = require('../models/Journeys.js');
const JourneyDetails = require('../models/JourneyDetails.js');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});


//Get User by Name
exports.getuserName = async (req, res) => {
    try {
        // find the user by username
        const user = await Users.findOne({ userName: req.params.userName });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        // return the user
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

//Create User
exports.createUser = async (req, res) => {
    try {
        //get the data from the request
        const { userName, password } =  req.body;
        const profilePicture = req.file;

        //upload the photo to s3 bucket
        let profilePictureUrl = null;
        if(profilePicture){
            const bucketName = process.env.AWS_BUCKET_NAME;
            const key = `${Date.now()}-${profilePicture.originalname}`;
            const command = new PutObjectCommand({
                Bucket: bucketName,
                Key: key,
                Body: profilePicture.buffer,
                ContentType: profilePicture.mimetype,
            });
            await s3Client.send(command);
            profilePictureUrl = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
        }

        //create and save a new user
        const newUser = new Users({
            userName,
            password, 
            profilePicture: profilePictureUrl,
          });
        await newUser.save();
        res.status(201).json({message: 'User created successfully.'});
    } catch (error) {
        console.error('Error in createUser:', error.message);
        res.status(500).json({ message: error.message });
    }
};

//Log in
exports.login = async (req, res) => {
    try {
        const { userName, password } = req.body;
        const user = await Users.findOne({ userName: userName });
        // If the user name doesn't exist
        if (!user || user.password !== password) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }
        // If match, create a token
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRATION });
        res.status(200).json({ token, user: { userName: user.userName, profilePicture: user.profilePicture } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

//Delete User
exports.deleteUser = async (req, res) => {
    try {
        // Get the user name from the request
        const userName = req.params.userName;
        const filter = {userName};
        // Delete the user
        const user = await Users.findOneAndDelete(filter);
        if (!user) res.status(404).json( {message: 'User not found.'} );
        res.status(200).json({ message: 'User deleted successfully.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

//Update User
exports.updateUser = async (req, res) => {
    try {
        const userName = req.params.userName;
        const updatedData = {};
        const profilePicture = req.file;
        const filter = {userName};
        let profilePictureUrl = null;

        // Update the user data
        if (req.body.password) {
            updatedData.password = req.body.password; 
        }
        if(profilePicture){
            console.log('updated image')
            const bucketName = process.env.AWS_BUCKET_NAME;
            const key = `${Date.now()}-${profilePicture.originalname}`;
            const command = new PutObjectCommand({
                Bucket: bucketName,
                Key: key,
                Body: profilePicture.buffer,
                ContentType: profilePicture.mimetype, 
            });
            await s3Client.send(command);
            profilePictureUrl = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
            updatedData.profilePicture = profilePictureUrl;
            console.log("updated image url",updatedData.profilePicture)
        }

        // Update the user
        const updatedUser = await Users.findOneAndUpdate(filter, updatedData, { new: true });
        if (!updatedUser) {
            res.status(404).json({ message: 'User not found.' });
        }
        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

//Search Journey
exports.searchJourneys = async (req, res) => {
    try {
        const userName = req.params.userName; //get the user userName
        const keyword = req.query.keyword; //get the keyword

        const regex = new RegExp(keyword, 'i'); //create a regex to search for the keyword

        const findUser = await Users.findOne({ //find the user by userName
            userName: userName
        })
        const requiredJourneysOne = await Journeys.find({
            userName: findUser._id,
            title: regex
        }); // search in all journey titles
        const requiredJourneysOneIds = requiredJourneysOne.map(journey => journey._id.toString());

        const allUserJourneys = await Journeys.find({ userName: findUser._id });
        const allJourneyId = allUserJourneys.map(journey => journey._id); //get the journey IDs
        const journeyDetails = await JourneyDetails.find({ // search in all journey details text
            journeyId: { $in: allJourneyId },
            journalText: regex
        });
        // find which journeys these journey details belong
        const requiredJourneysTwoIds = journeyDetails.map(detail => detail.journeyId.toString());
        
        // get all qualified ids
        const qualifiedIds = new Set([...requiredJourneysOneIds, ...requiredJourneysTwoIds]);
        const requiredJourneys = await Journeys.find({ _id: {$in: Array.from(qualifiedIds) } }).populate('details');
        
        res.status(200).json(requiredJourneys);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
