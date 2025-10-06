require("dotenv").config();
const express = require('express');
const mongoose = require('mongoose');

const app = express();
const cookieParser = require('cookie-parser');

let cors = require("cors");

app.use(cors({
  origin: 'http://localhost:3001', 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

app.use(cookieParser());

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(error =>{
    console.log('Error connecting to MongoDB', error.message);
});

const userRoutes = require('./routes/userRoutes');
const journeyRoutes = require('./routes/journeyRoutes');
const journeyDetailRoutes = require('./routes/journeyDetailRoutes');

app.use('/users', userRoutes);
app.use('/journeys', journeyRoutes);
app.use('/details', journeyDetailRoutes);


app.get('/', (req, res) => {
  res.send('Welcome to the YOP API.');

});
app.use(express.json());
const customHeadersAppLevel = function (req, res, next) {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3001');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  );
    next();
};
app.all('*', customHeadersAppLevel);
app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
});
