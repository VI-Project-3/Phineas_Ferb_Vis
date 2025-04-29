// Store bust attempts data dynamically
let bustAttemptsPerEpisode = {}; 
let bustBubbleRootData = [];  
let phineasIdeasData = []; 
let doofenshmirtzData = [];
// Function to show episode details in a card
let showEpisodeDetails = (episode) => {
    // Create overlay
    const overlay = document.createElement("div");
    overlay.className = "episode-details-overlay";
    
    // Create card
    const episodeDetails = document.createElement("div");
    episodeDetails.className = "episode-details-card";
    
    const seasonNum = episode.id.slice(1, 2);
    const episodeNum = episode.id.slice(3);
    
    episodeDetails.innerHTML = `
      <div class="episode-card-header">
        <h3>S${seasonNum}E${episodeNum}</h3>
        <h3>${episode.name}</h3>
        <button class="close-card">×</button>
      </div>
      
      <div class="episode-card-content">
        <div class="episode-section">
          <h4>Phineas & Ferb's Big Idea</h4>
          ${episode.image1 ? `<img src="${episode.image1}" class="episode-image">` : ''}
          <p><strong>Big Idea: ${episode.phineasBigIdea || "No data available"}</strong></p>
          <p><strong>Disappearance:</strong> ${episode.phineasBigIdeaDisappearance || "Unknown"}</p>
          <p><strong>Notes:</strong> ${episode.phineasBigIdeaNotes || "No notes available"}</p>
        </div>
        
        <div class="episode-section">
          <h4>Doofenshmirtz's Scheme</h4>
          ${episode.image2 ? `<img src="${episode.image2}" class="episode-image">` : ''}
          <p><strong>Invention:</strong> ${episode.doofenshmirtzInvention || "Unknown"}</p>
          <p><strong>Scheme:</strong> ${episode.doofenshmirtzInventionScheme || "Unknown"}</p>
          <p><strong>Typical Failure:</strong> ${episode.doofenshmirtzInventionFailure || "Foiled by Perry the Platypus"}</p>
          
        </div>
        
        <div class="episode-section">
          <h4>Candace's Bust Attempts</h4>
          <div class="bust-meter">
            <div class="bust-meter-fill" style="width: ${(episode.bustAttempts/16)*100}%"></div>
            <span>${episode.bustAttempts} attempt${episode.bustAttempts !== 1 ? 's' : ''}</span>
          </div>
          <p class="bust-comment">${getBustComment(episode.bustAttempts)}</p>
        </div>
      </div>
    `;
  
    //close functionality
    const closeCard = () => {
      document.body.removeChild(overlay);
      document.body.removeChild(episodeDetails);
    };
  
    episodeDetails.querySelector(".close-card").addEventListener("click", closeCard);
    overlay.addEventListener("click", closeCard);
  
   
    document.body.appendChild(overlay);
    document.body.appendChild(episodeDetails);
  };
  
  // Helper function for bust attempt comments
  // function getBustComment(attempts) {
  //   const comments = [
  //     "Candace didn't even try this episode!",
  //     "Candace made a half-hearted attempt.",
  //     "Standard busting activity.",
  //     "Candace was particularly determined!",
  //     "Maximum busting intensity!",
  //     "Candace went all out this episode!"
  //   ];
  //   return comments[Math.min(attempts, 5)];
  // }

  function getBustComment(attempts) {
    const comments = [
      "Candace didn't even try this episode!",
      "Candace made a half-hearted attempt.",
      "Standard busting activity.",
      "Candace was particularly determined!",
      "Maximum busting intensity!",
      "Candace went all out this episode!"
    ];
  
    // Dynamically provide a more detailed comment based on bust attempts
    if (attempts === 0) {
      return comments[0]; // No attempts
    } else if (attempts <= 2) {
      return comments[1]; // One attempt
    } else if (attempts <= 3) {
      return comments[2]; // Some attempts
    } else if (attempts <= 4) {
      return comments[3]; // Above average busting
    } else if (attempts <= 6) {
      return comments[4]; // High intensity busting
    } else if (attempts >= 7) {
      return comments[5]; // Maximum effort, Candace is really trying!
    }
  
    return "Candace made multiple attempts, but couldn't get her brother!";
  }
  
// Function to get the year for a given season
let getYearForSeason = (season) => {
  const yearMap = { 
    "1": 2007,
    "2": 2008,
    "3": 2009,
    "4": 2010
  };
  return yearMap[season] || "Unknown";
};

function initEpisodeGridView() {
    // Check if data is loaded
    if (!bustBubbleRootData || bustBubbleRootData.length === 0) {
      // If not, initialize the tile layout first
      initTileLayout().then(() => {
        // After data is loaded, draw the grid
        drawEpisodeGridView();
      });
      return;
    }
    // If data is already loaded, draw the grid
    drawEpisodeGridView();
  }


function drawEpisodeGridView() {
    // Clear existing content
    const container = document.getElementById("episodeGridView");
    container.innerHTML = "";
  
    // Create control panel
    container.innerHTML = `
      <div class="controls">
        <div class="filter-group">
          <label>Season:</label>
          <select id="seasonelect">
            <option value="all">All Seasons</option>
            <option value="S1">Season 1</option>
            <option value="S2">Season 2</option>
            <option value="S3">Season 3</option>
            <option value="S4">Season 4</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label>Year:</label>
          <select id="yearSelect">
            <option value="all">All Years</option>
            <option value="2007">2007</option>
            <option value="2008">2008</option>
            <option value="2009">2009</option>
            <option value="2010">2010</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label>Sort:</label>
          <select id="sortSelect">
            <option value="default">Default</option>
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="year-asc">Year (Oldest)</option>
            <option value="year-desc">Year (Newest)</option>
            <option value="bust-asc">Bust Attempts (Low)</option>
            <option value="bust-desc">Bust Attempts (High)</option>
          </select>
        </div>
        
        <div class="filter-group">
          <button id="toggleFavorites">Show Favorites Only</button>
        </div>
        
        <div class="filter-group">
          <input type="text" id="searchInput" placeholder="Search episodes...">
        </div>
      </div>
      
      <div id="episodeGrid" class="episode-grid"></div>
    `;
  
    // Get DOM elements
    const grid = document.getElementById("episodeGrid");
    const seasonelect = document.getElementById("seasonelect");
    const yearSelect = document.getElementById("yearSelect");
    const sortSelect = document.getElementById("sortSelect");
    const toggleFavorites = document.getElementById("toggleFavorites");
    const searchInput = document.getElementById("searchInput");
  
    // Track favorites
    let showFavoritesOnly = false;
    const favorites = JSON.parse(localStorage.getItem('phineasFavorites')) || {};
  
    // Function to render episodes with all filters applied
    const renderEpisodes = () => {
      // Get current filter values
      const seasonFilter = seasonelect.value;
      const yearFilter = yearSelect.value;
      const searchQuery = searchInput.value.toLowerCase();
      const sortValue = sortSelect.value;
      
      // Flatten all episodes
      let episodes = [];
      bustBubbleRootData.forEach(season => {
        season.children.forEach(episode => {
          episodes.push({
            ...episode,
            seasonId: season.id,
            year: getYearForSeason(episode.id.slice(1, 2)),
            isFavorite: !!favorites[episode.id]
          });
        });
      });
      
      // Apply filters
      let filteredEpisodes = episodes.filter(episode => {
        // Season filter
        if (seasonFilter !== 'all' && episode.seasonId !== seasonFilter) return false;
        
        // Year filter
        if (yearFilter !== 'all' && episode.year !== yearFilter) return false;
        
        // Favorite filter
        if (showFavoritesOnly && !episode.isFavorite) return false;
        
        // Search filter
        if (searchQuery && 
            !episode.name.toLowerCase().includes(searchQuery) && 
            !episode.phineasBigIdea.toLowerCase().includes(searchQuery) &&
            !episode.doofenshmirtzInvention.toLowerCase().includes(searchQuery)) {
          return false;
        }
        
        return true;
      });
      
      // Apply sorting
      filteredEpisodes.sort((a, b) => {
        switch(sortValue) {
          case 'name-asc': return a.name.localeCompare(b.name);
          case 'name-desc': return b.name.localeCompare(a.name);
          case 'year-asc': return a.year - b.year;
          case 'year-desc': return b.year - a.year;
          case 'bust-asc': return a.bustAttempts - b.bustAttempts;
          case 'bust-desc': return b.bustAttempts - a.bustAttempts;
          default: return 0; // Default order
        }
      });
      
      // Render episodes
      grid.innerHTML = '';
      filteredEpisodes.forEach(episode => {
        const tile = document.createElement('div');
        tile.className = `episode-tile ${episode.isFavorite ? 'favorite' : ''}`;
        tile.innerHTML = `
          <div class="tile-header">
            <span class="favorite-star" data-id="${episode.id}">${episode.isFavorite ? '★' : '☆'}</span>
            <span class="tile-title">${episode.id}</span>
          </div>
          <div class="tile-image-container">
            <img src="${episode.image1}" 
                 alt="${episode.name}"
                 onerror="this.onerror=null;this.src='images/default-thumb.jpg';">
          </div>
          <div class="tile-name">${episode.name}</div>
          <div class="tile-year">${episode.year}</div>
          <div class="tile-busts">Busts: ${episode.bustAttempts}</div>
        `;
        
        tile.addEventListener('click', () => showEpisodeDetails(episode));
        tile.querySelector('.favorite-star').addEventListener('click', (e) => {
          e.stopPropagation();
          toggleFavorite(episode.id);
        });
        
        grid.appendChild(tile);
      });
    };
  
    // Toggle favorite status
    const toggleFavorite = (episodeId) => {
      favorites[episodeId] = !favorites[episodeId];
      localStorage.setItem('phineasFavorites', JSON.stringify(favorites));
      renderEpisodes();
    };
  
    // Toggle favorites filter
    toggleFavorites.addEventListener('click', () => {
      showFavoritesOnly = !showFavoritesOnly;
      toggleFavorites.textContent = showFavoritesOnly ? 
        'Show All Episodes' : 'Show Favorites Only';
      renderEpisodes();
    });
  
    seasonelect.addEventListener('change', renderEpisodes);
    yearSelect.addEventListener('change', renderEpisodes);
    sortSelect.addEventListener('change', renderEpisodes);
    searchInput.addEventListener('input', renderEpisodes);
  
    // Initial render
    renderEpisodes();
  }

  // Modify initTileLayout to return a Promise
  function initTileLayout() {
    return new Promise((resolve, reject) => {
      Promise.all([
        d3.csv("data/inventions/pf/phineas_big_ideas_season1.csv"),
        d3.csv("data/inventions/pf/phineas_big_ideas_season2.csv"),
        d3.csv("data/inventions/pf/phineas_big_ideas_season3.csv"),
        d3.csv("data/inventions/pf/phineas_big_ideas_season4.csv"),
        d3.csv("data/inventions/doof/doofenshmirtz_season1.csv"),
        d3.csv("data/inventions/doof/doofenshmirtz_season2.csv"),
        d3.csv("data/inventions/doof/doofenshmirtz_season3.csv"),
        d3.csv("data/inventions/doof/doofenshmirtz_season4.csv"),
      ])
      .then(([phin1, phin2, phin3, phin4, doof1, doof2, doof3, doof4]) => {
        phineasIdeasData = [...phin1, ...phin2, ...phin3, ...phin4];
        doofenshmirtzData = [...doof1, ...doof2, ...doof3, ...doof4];
  
        // Prepare the data structure
        bustAttemptsPerEpisode = {};

        
  
        phineasIdeasData.forEach(item => {
          const episodeKey = `S${item.Season}E${item.EpisodeNumber}`;
          const epKey = `S${item.Season}E${item.EpisodeNumber.toString().padStart(2, '0')}`;
          bustAttemptsPerEpisode[episodeKey] = {
            bustAttempts: bustAttemptsPerEpisod[epKey] || 0,  // Math.floor(Math.random() * 5),
            episodeName: item.Episode,
            phineasBigIdea: item.BigIdea,
            phineasBigIdeaDisappearance: item.Disappearance,
            phineasBigIdeaNotes: item.Notes,
            doofenshmirtzInvention: doofenshmirtzData.find(d => d.Season === item.Season && d.EpisodeNumber === item.EpisodeNumber)?.Inventions || "Unknown",
            doofenshmirtzInventionScheme: doofenshmirtzData.find(d => d.Season === item.Season && d.EpisodeNumber === item.EpisodeNumber)?.Scheme || "Unknown",
            doofenshmirtzInventionFailure: doofenshmirtzData.find(d => d.Season === item.Season && d.EpisodeNumber === item.EpisodeNumber)?.Failure || "Unknown",
            image1: `images/pf/Season${item.Season}/${item.EpisodeNumber}.webp`, // Standardized image path
            image2: `images/doof/Season${item.Season}/${item.EpisodeNumber}.webp` // Standardized image path

          };
        });
  
        // Group the episodes by season
        const seasonGroups = d3.group(Object.entries(bustAttemptsPerEpisode), ([epKey]) => epKey.slice(0, 2));
  
        bustBubbleRootData = Array.from(seasonGroups, ([season, episodes]) => ({
          id: season,
          type: "season",
          children: episodes.map(([epKey, attempts]) => ({
            id: epKey,
            type: "episode",
            name: attempts.episodeName,
            bustAttempts: attempts.bustAttempts,
            phineasBigIdea: attempts.phineasBigIdea,
            phineasBigIdeaDisappearance: attempts.phineasBigIdeaDisappearance,
            phineasBigIdeaNotes: attempts.phineasBigIdeaNotes,
            doofenshmirtzInvention: attempts.doofenshmirtzInvention,
            doofenshmirtzInventionScheme: attempts.doofenshmirtzInventionScheme,
            doofenshmirtzInventionFailure: attempts.doofenshmirtzInventionFailure,
            image1: attempts.image1,
            image2: attempts.image2
          }))
        }));
  
        resolve(); // Resolve the promise when data is ready
        })
      .catch(error => {
        console.log("Error loading data: ", error);
        reject(error);
      });
    });
  }