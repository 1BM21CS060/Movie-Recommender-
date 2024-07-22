const OMDB_API_KEY = 'ee4ab4f7';
const OPENAI_API_KEY = 'sk-proj-lBS2hiMZY7MuHRq3Lz4ZT3BlbkFJAwttK6oLwGqHL8nWYRvz';

let currentPage = 1;
let totalMovies = 0;
let isLoading = false;
let allMovies = new Set();
let lastQuery = '';

async function getRecommendations(isInitialLoad = true) {
    const query = document.getElementById('movie-query').value.trim();
    const recommendationsDiv = document.getElementById('recommendations');
    const errorDetailsDiv = document.getElementById('error-details');
    const loadingDiv = document.getElementById('loading');
    const maxResultsMessage = document.getElementById('max-results-message');
    const noResultsMessage = document.getElementById('no-results-message');

    if (!query) {
        showError('Please enter movie keywords.');
        return;
    }

    if (isInitialLoad) {
        recommendationsDiv.innerHTML = '';
        errorDetailsDiv.innerHTML = '';
        maxResultsMessage.classList.add('hidden');
        noResultsMessage.classList.add('hidden');
        currentPage = 1;
        totalMovies = 0;
        allMovies.clear();
        lastQuery = query;
    }

    if (query !== lastQuery) {
        showError('Please use the search button for a new query.');
        return;
    }

    loadingDiv.style.display = 'flex';
    isLoading = true;

    try {
        const openAIRecommendations = await getOpenAIRecommendations(query);
        const movieTitles = extractMovieTitles(openAIRecommendations);
        const movieDetails = await Promise.all(movieTitles.map(title => getOMDBDetails(title)));

        const uniqueMovies = movieDetails.filter(movie => movie.Response === "True" && !allMovies.has(movie.imdbID));
        uniqueMovies.forEach(movie => allMovies.add(movie.imdbID));

        if (uniqueMovies.length === 0) {
            if (isInitialLoad) {
                noResultsMessage.classList.remove('hidden');
            }
            return;
        }

        displayRecommendations(uniqueMovies);
        totalMovies += uniqueMovies.length;

        if (totalMovies >= 100) {
            maxResultsMessage.classList.remove('hidden');
            window.removeEventListener('scroll', handleScroll);
        }
    } catch (error) {
        console.error('Error:', error);
        showError(`An error occurred: ${error.message}`);
    } finally {
        loadingDiv.style.display = 'none';
        isLoading = false;
    }
}

async function getOpenAIRecommendations(query) {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content: "You are a knowledgeable movie recommendation assistant. Provide detailed, personalized movie recommendations based on the user's input. For each recommendation, include only the movie title and year. Recommend 20 unique movies. Do not use asterisks or any other special formatting in your response."
            },
            {
                role: "user",
                content: `Based on the following preferences, recommend 20 unique movies: ${query}`
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
        titles.push({ title: match[1].replace(/\*/g, '').trim(), year: match[2] });
    }
    return titles;
}

async function getOMDBDetails(movie) {
    const response = await axios.get(`https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&t=${encodeURIComponent(movie.title)}&y=${movie.year}&plot=full`);
    return response.data;
}

function displayRecommendations(movies) {
    const recommendationsDiv = document.getElementById('recommendations');

    movies.forEach((movie) => {
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
                </div>
            </div>
            <div class="movie-plot">
                <p><i class="fas fa-info-circle"></i> <strong>Plot:</strong> ${movie.Plot}</p>
            </div>
        `;
        recommendationsDiv.appendChild(movieDiv);
    });
    if (movieTitles.length > 0) {
        fetch('/save-recommendations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ movieTitles }),
        })
        .then(response => response.text())
        .then(data => console.log('Server Response:', data))
        .catch(error => console.error('Error:', error));
    }
}

function showError(message) {
    const errorDetailsDiv = document.getElementById('error-details');
    errorDetailsDiv.innerHTML = `<p><i class="fas fa-exclamation-circle"></i> ${message}</p>`;
}

function clearResults() {
    document.getElementById('movie-query').value = '';
    document.getElementById('recommendations').innerHTML = '';
    document.getElementById('error-details').innerHTML = '';
    document.getElementById('max-results-message').classList.add('hidden');
    document.getElementById('no-results-message').classList.add('hidden');
    currentPage = 1;
    totalMovies = 0;
    allMovies.clear();
    lastQuery = '';
    window.addEventListener('scroll', handleScroll);
}

function handleScroll() {
    if (isLoading || totalMovies >= 100) return;

    const scrollPosition = window.innerHeight + window.scrollY;
    const bodyHeight = document.body.offsetHeight;
    const tenthMoviePosition = document.querySelectorAll('.movie')[9]?.offsetTop;

    if (scrollPosition > tenthMoviePosition && scrollPosition >= bodyHeight - 1000) {
        currentPage++;
        getRecommendations(false);
    }
}

// Back to Top button functionality
const backToTopButton = document.getElementById("back-to-top");

window.onscroll = function() {
    if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
        backToTopButton.style.display = "block";
    } else {
        backToTopButton.style.display = "none";
    }
};

backToTopButton.onclick = function() {
    document.body.scrollTop = 0; // For Safari
    document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
};

window.addEventListener('scroll', handleScroll);
