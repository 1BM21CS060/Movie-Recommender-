const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
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
        const data = { keywords: query };
        await collections.create(data);
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
        const uniqueTitles = [...new Set(movieTitles)];

        const operations = uniqueTitles.map(title => ({
            updateOne: {
                filter: { title },
                update: { $setOnInsert: { title } },
                upsert: true,
            },
        }));

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
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`App is running on port ${PORT}`);
});
