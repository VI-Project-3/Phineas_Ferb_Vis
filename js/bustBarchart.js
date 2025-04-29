// Store bust attempts data dynamically
let bustAttemptsPerEpisode = {}; 
let bustBubbleRootData = []; 
let phineasIdeasData = []; 
let doofenshmirtzData = []; 

// Initialize Tile Layout
function initTileLayout() {
  // Fetch actual CSV data
  Promise.all([
    d3.csv("data/inventions/pf/phineas_big_ideas_season1.csv"),
    d3.csv("data/inventions/pf/phineas_big_ideas_season2.csv"),
    d3.csv("data/inventions/pf/phineas_big_ideas_season3.csv"),
    d3.csv("data/inventions/pf/phineas_big_ideas_season4.csv"),
    d3.csv("data/inventions/doof/doofenshmirtz_season1.csv"),
    d3.csv("data/inventions/doof/doofenshmirtz_season2.csv"),
    d3.csv("data/inventions/doof/doofenshmirtz_season3.csv"),
    d3.csv("data/inventions/doof/doofenshmirtz_season4.csv")
  ])
  .then(([phin1, phin2, phin3, phin4, doof1, doof2, doof3, doof4]) => {
    phineasIdeasData = [...phin1, ...phin2, ...phin3, ...phin4];
    doofenshmirtzData = [...doof1, ...doof2, ...doof3, ...doof4];

    // Prepare the data structure for episodes with bust attempts and associated info
    bustAttemptsPerEpisode = {};

    phineasIdeasData.forEach(item => {
      const episodeKey = `S${item.Season}E${item.EpisodeNumber}`;
      bustAttemptsPerEpisode[episodeKey] = {
        bustAttempts: Math.floor(Math.random() * 5),  // Example: Random bust attempts (replace with actual logic)
        phineasBigIdea: item.BigIdea,
        doofenshmirtzInvention: doofenshmirtzData.find(d => d.Season === item.Season && d.EpisodeNumber === item.EpisodeNumber)?.Inventions || "Unknown",
        image: item.ImageURL
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
        bustAttempts: attempts.bustAttempts,
        phineasBigIdea: attempts.phineasBigIdea,
        doofenshmirtzInvention: attempts.doofenshmirtzInvention,
        image: attempts.image
      }))
    }));

    drawTileLayout();  // Now draw the tiles with real data
  })
  .catch(error => {
    console.log("Error loading data: ", error);
  });
}

// function drawTileLayout() {
//     const tileContainer = document.getElementById("tileContainer");

//     if (!tileContainer) {
//         console.error("#tileContainer not found");
//         return; // Exit if the element doesn't exist
//     }

//     // Get the container width and height dynamically
//     const containerWidth = tileContainer.offsetWidth;
//     const containerHeight = tileContainer.offsetHeight;

//     const tileWidth = 150;
//     const tileHeight = 150;

//     // Clear the existing tiles
//     tileContainer.innerHTML = '';

//     // Limit to 10 episodes per season
//     const maxEpisodesPerSeason = 40;

//     // Calculate the max number of episodes in any season (for yScale)
//     const maxEpisodes = Math.min(
//         Math.max(...bustBubbleRootData.map(season => season.children.length)),
//         maxEpisodesPerSeason
//     );

//     // Set up scales for positioning the tiles
//     const xScale = d3.scaleBand()
//         .domain(["S1", "S2", "S3", "S4"])  // Season 1 to 4
//         .range([0, containerWidth])  // Scale across container width
//         .padding(0.15);  // Increased padding between the seasons (space between tiles horizontally)

//     const yScale = d3.scaleBand()
//         .domain(d3.range(1, maxEpisodes + 1))  // Scale episodes vertically (limit to 10 episodes max)
//         .range([0, containerHeight - 40])  // Adjust the Y range to leave space for the X-axis at the bottom
//         .padding(10);  // Increased padding between the episodes (space between tiles vertically)

//     // Loop over the seasons and their episodes to create tiles
//     bustBubbleRootData.forEach(season => {
//         const seasonContainer = document.createElement('div');
//         seasonContainer.classList.add('season-container');
        

//         // Create a container for each season to hold its episodes
//         season.children.slice(0, maxEpisodesPerSeason).forEach(episode => {
//             const tile = document.createElement('div');
//             tile.classList.add('tile');
//             tile.innerHTML = `
//                 <div class="tile-title">Season ${episode.id.slice(1, 2)} - Episode ${episode.id.slice(3)}</div>
//             `;

            

//             // Add a click event to the tile to open the sidebar
//             tile.addEventListener('click', () => openSidebar(episode));

//             seasonContainer.appendChild(tile);
//         });
//         // Inside drawTileLayout(), right after:
// // const seasonContainer = document.createElement('div');
// seasonContainer.style.display     = 'flex';
// seasonContainer.style.flexWrap    = 'wrap';
// seasonContainer.style.gap         = '16px';   // horizontal & vertical gap between tiles
// seasonContainer.style.marginBottom= '24px';   // space between seasons


//         // Append the season container to the tileContainer
//         tileContainer.appendChild(seasonContainer);
//     });
// // … right after your tiles are appended and xScale is in scope …

// // 1. Create a <svg> for the axis, absolutely positioned at the bottom
// const axisSvg = d3.select('#tileContainer')
//   .append('svg')
//     .attr('width', containerWidth)
//     .attr('height', 40)
//     .style('position', 'absolute')
//     .style('left', '0px')
//     .style('bottom', '0px');

// // 2. Add a bottom‐axis using the same xScale
// axisSvg.append('g')
//     .attr('transform', 'translate(0, 20)')   // push down to center it in the 40px tall svg
//     .call(
//       d3.axisBottom(xScale)
//         .tickFormat((d, i) => `Season ${i + 1}`)
//     );

    

//     const xAxis = d3.axisBottom(xScale)
//                     .tickFormat((d, i) => `Season ${i + 1}`);  // Display 'Season 1', 'Season 2', etc.

//     svg.append('g')
//        .attr('class', 'x-axis')
//        .attr('transform', `translate(0, 20)`)  // Adjust vertical positioning slightly
//        .call(xAxis);
// }

function drawTileLayout() {
  const tileContainer = document.getElementById("tileContainer");
  if (!tileContainer) {
    console.error("#tileContainer not found");
    return;
  }

  // === CONFIG ===
  const seasons = bustBubbleRootData.map(d => d.id);  // ["S1","S2","S3","S4"]
  const maxEps  = 5;                                // exactly 10 eps per column
  const W       = tileContainer.clientWidth;
  const H       = tileContainer.clientHeight;
  const axisH   = 40;    // space for the x axis

  // clear & set up flex container
  tileContainer.innerHTML = "";
  tileContainer.style.display        = "flex";
  tileContainer.style.justifyContent = "space-between";
  tileContainer.style.alignItems     = "flex-start";
  tileContainer.style.position       = "relative";  

  // compute each column width
  const colW = W / seasons.length;

  // build one column per season
  bustBubbleRootData.forEach(season => {
    const col = document.createElement("div");
    col.style.display        = "flex";
    col.style.flexDirection  = "column";
    col.style.alignItems     = "center";
    col.style.gap            = "8px";
    col.style.width          = `${colW}px`;
    col.style.minHeight      = `${H - axisH}px`;
    col.style.boxSizing      = "border-box";

    // add up to maxEps tiles
    season.children.slice(0, maxEps).forEach(ep => {
      const episodeNum = parseInt(ep.id.slice(3), 10);
      const tile = document.createElement("div");
      tile.classList.add("tile");
      tile.style.width       = `${colW * 0.8}px`;
      tile.style.cursor      = "pointer";
      tile.innerHTML = `
        <div class="tile-title">
          Season ${season.id.slice(1)} – Episode ${episodeNum}
        </div>
      `;
      tile.addEventListener("click", () => openSidebar(ep));
      col.appendChild(tile);
    });

    tileContainer.appendChild(col);
  });

  // === X-AXIS ===
  const xScale = d3.scaleBand()
    .domain(seasons)
    .range([colW/2, W - colW/2])
    .padding(0);

  const axisSvg = d3.select(tileContainer)
    .append("svg")
      .attr("width",  W)
      .attr("height", axisH)
      .style("position", "absolute")
      .style("left",     "0px")
      .style("bottom",   "0px");

  axisSvg.append("g")
    .attr("transform", `translate(0, ${axisH/2})`)
    .call(
      d3.axisBottom(xScale)
        .tickFormat((d,i) => `Season ${i+1}`)
    );
}


// Open the Sidebar with Episode Details
function openSidebar(episode) {
  const sidebar = document.getElementById("episodeSidebar");

  const seasonNumber = episode.id.slice(1, 2);
  const episodeNumber = episode.id.slice(3);

  document.getElementById("sidebarTitle").innerText = `Season ${seasonNumber} - Episode ${episodeNumber}`;
  document.getElementById("sidebarBustAttempts").innerHTML = `<strong>Candace Bust Attempts:</strong> ${episode.bustAttempts}`;

  // Find matching Phineas Big Idea
  const phinIdea = phineasIdeasData.find(item => 
    item.Season === seasonNumber && item.EpisodeNumber === episodeNumber
  ) || {};

  document.getElementById("sidebarPhineasIdea").innerHTML = `<strong>Big Idea:</strong> ${phinIdea.BigIdea || "Unknown"}`;
  document.getElementById("sidebarPhineasDisappearance").innerHTML = `<strong>Disappearance:</strong> ${phinIdea.Disappearance || "Unknown"}`;
  document.getElementById("sidebarPhineasNotes").innerHTML = `<strong>Notes:</strong> ${phinIdea.Notes || "Unknown"}`;

  // Find matching Doofenshmirtz Invention
  const doofIdea = doofenshmirtzData.find(item => 
    item.Season === seasonNumber && item.EpisodeNumber === episodeNumber
  ) || {};

  document.getElementById("sidebarDoofInvention").innerHTML = `<strong>Invention:</strong> ${doofIdea.Inventions || "Unknown"}`;
  document.getElementById("sidebarDoofScheme").innerHTML = `<strong>Scheme:</strong> ${doofIdea.Scheme || "Unknown"}`;
  document.getElementById("sidebarDoofFailure").innerHTML = `<strong>Failure/Destruction:</strong> ${doofIdea.Failure || "Unknown"}`;

  // Show the sidebar
  sidebar.classList.add("active");
}

// Run the initialization when the page is ready
document.addEventListener("DOMContentLoaded", initTileLayout);