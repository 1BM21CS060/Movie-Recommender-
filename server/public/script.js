const OMDB_API_KEY = 'ee4ab4f7';
const OPENAI_API_KEY = 'sk-proj-lBS2hiMZY7MuHRq3Lz4ZT3BlbkFJAwttK6oLwGqHL8nWYRvz';

let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let watched = JSON.parse(localStorage.getItem('watched')) || [];

async function getRecommendations() {
    const query = document.getElementById('movie-query').value.trim();
    const recommendationsDiv = document.getElementById('recommendations');
    const errorDetailsDiv = document.getElementById('error-details');
    const loadingDiv = document.getElementById('loading');

    if (!query) {
        showError('Please enter movie keywords.');
        return;
    }

    recommendationsDiv.innerHTML = '';
    errorDetailsDiv.innerHTML = '';
    loadingDiv.style.display = 'flex';

    try {
        // Save user input to the server
        await axios.post('http://localhost:3001/', { query });

        const openAIRecommendations = await getOpenAIRecommendations(query);
        const movieTitles = extractMovieTitles(openAIRecommendations);
        const movieDetails = await Promise.all(movieTitles.map(title => getOMDBDetails(title)));
        displayRecommendations(openAIRecommendations, movieDetails);
    } catch (error) {
        console.error('Error:', error);
        showError(`An error occurred: ${error.message}`);
    } finally {
        loadingDiv.style.display = 'none';
    }
}

async function getOpenAIRecommendations(query) {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content: "You are a knowledgeable movie recommendation assistant. Provide detailed, personalized movie recommendations based on the user's input. For each recommendation, include the movie title, year, and a brief explanation of why it's recommended. Recommend 15 movies. Do not use asterisks or any other special formatting in your response."
            },
            {
                role: "user",
                content: `Based on the following preferences, recommend 15 movies: ${query}`
            }
        ],
        temperature: 0.7,
        max_tokens: 2000,
    }, {
        headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
        }
    });

    return response.data.choices[0].message.content;
}

function extractMovieTitles(recommendations) {
    const regex = /\d+\.\s*(.*?)\s*\((\d{4})\)/g;
    const titles = [];
    let match;
    while ((match = regex.exec(recommendations)) !== null) {
        titles.push({ title: match[1].replace(/\*/g, ''), year: match[2] });
    }
    return titles;
}

async function getOMDBDetails(movie) {
    const response = await axios.get(`https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&t=${encodeURIComponent(movie.title)}&y=${movie.year}`);
    return response.data;
}

function displayRecommendations(aiRecommendations, movieDetails) {
    const recommendationsDiv = document.getElementById('recommendations');
    const recommendations = aiRecommendations.split(/\d+\./);

    movieDetails.forEach((movie, index) => {
        if (movie.Response === "True" && index < recommendations.length - 1) {
            const aiRecommendation = recommendations[index + 1].trim().replace(/\*/g, '');
            const movieDiv = document.createElement('div');
            movieDiv.className = 'movie';
            movieDiv.innerHTML = `
                <div class="movie-header">
                    <div class="movie-poster">
                        <img src="${movie.Poster !== 'N/A' ? movie.Poster : 'https://via.placeholder.com/150x225.png?text=No+Poster'}" alt="${movie.Title} Poster">
                    </div>
                    <div class="movie-title">
                        <h2>${movie.Title} (${movie.Year})</h2>
                        <p><i class="fas fa-user-tie"></i> <strong>Director:</strong> ${movie.Director}</p>
                        <p><i class="fas fa-film"></i> <strong>Genre:</strong> ${movie.Genre}</p>
                        <p><i class="fas fa-star"></i> <strong>IMDb Rating:</strong> ${movie.imdbRating}</p>
                        <a href="https://www.imdb.com/title/${movie.imdbID}" target="_blank"><i class="fab fa-imdb"></i> View on IMDb</a>
                        <button onclick="toggleFavorite('${movie.imdbID}')"><i class="fas fa-heart"></i> ${favorites.includes(movie.imdbID) ? 'Remove from Favorites' : 'Add to Favorites'}</button>
                        <button onclick="toggleWatched('${movie.imdbID}')"><i class="fas fa-eye"></i> ${watched.includes(movie.imdbID) ? 'Mark as Unwatched' : 'Mark as Watched'}</button>
                    </div>
                </div>
                <p><i class="fas fa-ai"></i> <strong>AI Recommendation:</strong> ${aiRecommendation}</p>
                <p><i class="fas fa-info-circle"></i> <strong>Plot:</strong> ${movie.Plot}</p>
            `;
            recommendationsDiv.appendChild(movieDiv);
        } else {
            console.error(`Movie not found or no AI recommendation: ${movie.Error || 'Unknown error'}`);
        }
    });
}

function toggleFavorite(imdbID) {
    const index = favorites.indexOf(imdbID);
    if (index > -1) {
        favorites.splice(index, 1);
    } else {
        favorites.push(imdbID);
    }
    localStorage.setItem('favorites', JSON.stringify(favorites));
    getRecommendations(); // Refresh the display
}

function toggleWatched(imdbID) {
    const index = watched.indexOf(imdbID);
    if (index > -1) {
        watched.splice(index, 1);
    } else {
        watched.push(imdbID);
    }
    localStorage.setItem('watched', JSON.stringify(watched));
    getRecommendations(); // Refresh the display
}

function showError(message) {
    const errorDetailsDiv = document.getElementById('error-details');
    errorDetailsDiv.innerHTML = `<p class="error"><i class="fas fa-exclamation-circle"></i> ${message}</p>`;
}

function clearResults() {
    document.getElementById('movie-query').value = '';
    document.getElementById('recommendations').innerHTML = '';
    document.getElementById('error-details').innerHTML = '';
}
