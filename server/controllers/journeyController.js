const Journeys = require('../models/Journeys.js');
const Users = require('../models/Users.js');

//Get a user's all journeys
exports.getAllJourneys = async (req, res) => {
    try {
        // find the user by username
        const user = await Users.findOne({"userName": req.params.userName });
        // if the user is not found, return a 404 error
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        // find all the journeys that belong to the user
        const journeys = await Journeys.find({ userName: user._id }); 
        if (!journeys) {
            return res.status(404).json({ message: "Journeys not found" });
        }
        // return the journeys
        res.status(200).json(journeys);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};


//Get Journey by ID
exports.getJourneyId = async (req, res) => {
    try {
        // find the journey by id
        const journey = await Journeys.findById(req.params.journeyId);
        // if the journey is not found, return a 404 error
        if (!journey) {
            return res.status(404).json({ message: 'Journey not found.' });
        }
        res.status(200).json(journey);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

//Create Journey
exports.createJourney = async (req, res) => {
    try {
        let journey = new Journeys(req.body);
        // find the user by username
        const user = await Users.findOne({"userName": req.params.userName});
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // set the journey's userName to the user's id and save the journey
        journey.userName = user._id;
        const newJourney = await journey.save();
        // add the journey id to the user's journeys array and save the user
        user.journeys.push(newJourney);
        const updatedUser = await user.save();
        console.log(updatedUser);
        res.status(201).json(newJourney);
    } catch (error) {
        console.error("Error creating journey:", error);
        res.status(500).json({ message: error.message });
    }
};


//Delete Journey
exports.deleteJourney = async (req, res) => {
    const userId = req.user.userId; // get the user id from the request
    try {
        // delete the journey
        const journey = await Journeys.findByIdAndDelete(req.params.journeyId);
        if (!journey) {
            return res.status(404).json({ message: 'Journey not found.'});
        }
        // delete the journey id from the user collection
        const updatedUser = await Users.findByIdAndUpdate(
            userId,
            { $pull: { journeys: req.params.journeyId } },
            { new: true }
        );
        if (!updatedUser) {
            return res.status(404).json({ message: 'User update failed.' })
        }
        res.status(200).json( {message: 'Journey deleted successfully.'} );
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

//Update Journey
exports.updateJourney = async (req, res) => {
    try {
        // get the journey id from the request
        const journeyId = req.params.journeyId;
        const updatedData = req.body;
        // update the journey
        const updatedJourney = await Journeys.findByIdAndUpdate(journeyId, updatedData, {new: true});
        if (!updatedJourney) {
            return res.status(404).json({ message: 'Journey not found.'});
        }
        res.status(200).json(updatedJourney);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

