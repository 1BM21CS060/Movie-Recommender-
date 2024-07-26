const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB, UserInput, MovieTitle } = require('./db');

const app = express();

// Middleware to parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS
app.use(cors());

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Connect to MongoDB
connectDB();

// POST route to handle user input
app.post('/save-user-input', async (req, res) => {
    const { query } = req.body;

    if (!query) {
        console.error('Error: Query is required');
        return res.status(400).send('Query is required');
    }

    try {
        const userInput = new UserInput({ keywords: query });
        await userInput.save();
        console.log('User input saved:', userInput);
        res.status(201).send('User input saved');
    } catch (error) {
        console.error('Error saving user input:', error.message);
        res.status(500).send('Internal server error');
    }
});

// Route to handle saving recommended movie titles
app.post('/save-recommendations', async (req, res) => {
    const { movieTitles } = req.body;

    if (!Array.isArray(movieTitles) || movieTitles.length === 0) {
        console.error('Error: movieTitles is required and should be an array');
        return res.status(400).send('movieTitles is required and should be an array');
    }

    try {
        const uniqueTitles = [...new Set(movieTitles)];
        const operations = uniqueTitles.map(title => ({
            updateOne: {
                filter: { title },
                update: { $setOnInsert: { title } },
                upsert: true,
            },
        }));

        await MovieTitle.bulkWrite(operations);
        console.log('Recommendations saved:', uniqueTitles);
        res.status(201).send('Recommendations saved');
    } catch (error) {
        console.error('Error saving recommendations:', error.message);
        res.status(500).send('Internal server error');
    }
});

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`App is running on port ${PORT}`);
});
