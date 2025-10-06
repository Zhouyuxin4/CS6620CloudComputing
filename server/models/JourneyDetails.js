const mongoose = require('mongoose');
const JourneyDetailsSchema = new mongoose.Schema({
    time: {
        type: Date,
        required: true
    },

    location: {
        type: {
            type: String,
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },

    journalText: {
        type: String,
        required: true
    },

    journalPhoto: {
        type: String,
        required: false
    },

    journeyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Journeys',
        required: true
    }
}, {collection: 'JourneyDetails'});

JourneyDetailsSchema.index({ location: '2dsphere'});
module.exports = mongoose.model('JourneyDetails', JourneyDetailsSchema);