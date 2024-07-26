const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI;
        if (!mongoURI) {
            throw new Error('MONGODB_URI is not defined in environment variables');
        }
        await mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('MongoDB connected');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error.message);
        process.exit(1);
    }
};

const userInputSchema = new mongoose.Schema({
    keywords: {
        type: String,
        required: true,
    },
});

const movieTitleSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
});

const UserInput = mongoose.model('UserInput', userInputSchema);
const MovieTitle = mongoose.model('recommendedmovienames', movieTitleSchema);

module.exports = { connectDB, UserInput, MovieTitle };
