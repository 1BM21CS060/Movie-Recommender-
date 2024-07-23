const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');

// MongoDB connection function
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

// Define schemas
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

// Define models
const Searches = mongoose.model('Searches', userInputSchema);
const Recommendations = mongoose.model('Recommendations', movieTitleSchema);

const app = express();

// Middleware to parse JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS
app.use(cors());

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Connect to MongoDB
connectDB();

// POST route to handle user input
app.post('/', async (req, res) => {
    const { query } = req.body;

    if (!query) {
        return res.status(400).send('Query is required');
    }

    try {
        const data = { keywords: query }; // Ensure 'keywords' field is used
        await Searches.create(data); // Use `create` to save document
        res.status(201).send('Data saved');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal server error');
    }
});

// Route to handle saving recommended movie titles
app.post('/save-recommendations', async (req, res) => {
    const { movieTitles } = req.body;

    if (!Array.isArray(movieTitles)) {
        return res.status(400).send('movieTitles is required');
    }

    try {
        // Remove duplicates from the movieTitles array
        const uniqueTitles = [...new Set(movieTitles)];

        // Prepare bulk operations
        const operations = uniqueTitles.map(title => ({
            updateOne: {
                filter: { title },
                update: { $setOnInsert: { title } },
                upsert: true
            }
        }));

        // Perform bulk write operation
        await Recommendations.bulkWrite(operations);

        res.status(201).send('Recommendations saved');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal server error');
    }
});

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(3001, () => {
    console.log('App is running on port 3001');
});

module.exports = { connectDB, Searches, Recommendations };
