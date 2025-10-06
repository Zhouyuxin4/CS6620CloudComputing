const mongoose = require('mongoose');
const JourneySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },

    details: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'JourneyDetails'
    }],

    userName: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users'
    }
}, {collection: 'Journeys'});

module.exports = mongoose.model('Journeys', JourneySchema);