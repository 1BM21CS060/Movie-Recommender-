const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect('mongodb+srv://user:123@cluster0.sxs5sms.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0');
        console.log('Mongodb connected');
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

const userInputSchema = new mongoose.Schema({
    keywords: {
        type: String,
        required:true
    }
});

const movieTitleSchema = new mongoose.Schema({
    title: String,
});

const collections = mongoose.model('userInputs', userInputSchema);
const collections1 = mongoose.model('recommendedMovieNames', movieTitleSchema);

module.exports = { connectDB, collections, collections1};