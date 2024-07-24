const mongoose = require('mongoose');

// Load environment variables from a .env file if available
require('dotenv').config();

const connectDB = async () => {
    try {
        // Retrieve MongoDB URI from environment variables
        const mongoURI = process.env.MONGODB_URI;
        if (!mongoURI) {
            throw new Error('MONGODB_URI is not defined in environment variables');
        }
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
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
    title: String,
});

const collections = mongoose.model('userInputs', userInputSchema);
const collections1 = mongoose.model('recommendedMovieNames', movieTitleSchema);

module.exports = { connectDB, collections, collections1 };
