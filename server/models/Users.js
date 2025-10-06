const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    userName: {
        type: String,
        required: true,
        unique: true
    },

    password: {
        type: String,
        required: true
    },

    profilePicture: {
        type: String,
        required: false
    },

    journeys: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Journeys'
    }]
}, {collection: 'Users'});

module.exports = mongoose.model('Users', UserSchema);