const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect('mongodb+srv://shashankvasista0:3z2GbJGilfXVDOID@cluster0.xt8dcep.mongodb.net/movieRecommender?retryWrites=true&w=majority&appName=Cluster0', {
            useNewUrlParser: true,
            useUnifiedTopology: true
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
        required: true
    }
});

const movieTitleSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    }
});

const Searches = mongoose.model('Searches', userInputSchema);
const Recommendations = mongoose.model('Recommendations', movieTitleSchema);

module.exports = { connectDB, Searches, Recommendations };
