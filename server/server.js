const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path'); // Import path module
const { connectDB, collections, collections1 } = require('./db');

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
        await collections.create(data); // Use `create` to save document
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
        await collections1.bulkWrite(operations);

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
