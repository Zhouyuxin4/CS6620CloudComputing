const JourneyDetails = require('../models/JourneyDetails.js');
const Journeys = require('../models/Journeys.js');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

//Get details by the journey ID
exports.getDetailsByJourneyId = async (req, res) => {
    try {
        const journeyId = req.params.journeyId;
        const details = await JourneyDetails.find({ journeyId }).select(
            'time location journalText journalPhoto');
        res.status(200).json(details);
    } catch (error) {
        res.status(500).json( {message: error.message} );
    }
};

//Get detail by ID
exports.getDetailId = async (req, res) => {
    try {
        const detail = await JourneyDetails.findById(req.params.detailId);
        res.status(200).json(detail);
    } catch (error) {
        res.status(500).json( {message: error.message} );
    }
};

//Create a new detail
exports.createDetail = async (req, res) => {
    try {
        //get the data from the request
        const { time, location, journalText, journeyId} =  req.body;
        const journalPhoto = req.file
        let journalPhotoUrl = null;

        //upload the photo to s3 bucket
        if(journalPhoto){
            const bucketName = process.env.AWS_BUCKET_NAME;
            const key = `${Date.now()}-${journalPhoto.originalname}`;
            const command = new PutObjectCommand({
                Bucket: bucketName,
                Key: key,
                Body: journalPhoto.buffer,
                ContentType: journalPhoto.mimetype,
            });
            await s3Client.send(command);
            journalPhotoUrl = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
            console.log("finish creating s3 bucket url")
        }
        
        //create and save a new journeydetail
        const newDetail = new JourneyDetails({
            time,
            location: JSON.parse(location),
            journalText,
            journeyId,
            journalPhoto: journalPhotoUrl,
          });

        await newDetail.save();

        //save the new detail's id into the journey collection
        await Journeys.findByIdAndUpdate(
            journeyId,
            { $push: { details: newDetail._id } },
            { new: true }
        )
        //return the result
        res.status(201).json(newDetail);
    } catch (error) {
        res.status(500).json( {message: error.message} );
    }
};

// Delete a detail
exports.deleteDetail = async (req, res) => {
    try {
        // Get the detailId from the request
        const { detailId } = req.params;

        // Delete the detail from JourneyDetails collection
        const detail = await JourneyDetails.findByIdAndDelete(detailId);
        if (!detail) {
            return res.status(404).json({ message: 'Journey Detail not found.' });
        }

        // Delete the detail's id from the Journeys collection
        const updatedJourney = await Journeys.findByIdAndUpdate(
            detail.journeyId,
            { $pull: { details: detailId } },
            { new: true }
        );

        // Return 404 if the journey is not found
        if (!updatedJourney) {
            return res.status(404).json({ message: 'Journey update failed.' });
        }
        // Return 200 if the detail is deleted successfully
        res.status(200).json({ message: 'Journey Detail deleted successfully.' });
    } catch (error) {
        console.error(error); // Log the error for debugging purposes
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

//Update a detail
exports.updateDetail = async (req, res) => {
    try {
        // Get the detailId from the request
        const id = req.params.detailId;
        const updatedData = req.body;
        // Update the detail
        const updatedDetail = await JourneyDetails.findByIdAndUpdate(id, updatedData, { new: true });

        if (!updatedDetail) {
            res.status(404).json({ message:'Journey detail not found.' });
        }
        res.status(200).json(updatedDetail);
    } catch (error) {
        res.status(500).json( {message: error.message} );
    }
};
