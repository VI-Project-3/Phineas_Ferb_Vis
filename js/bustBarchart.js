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

// Draw the Tile Layout
// function drawTileLayout() {
//   const tileContainer = document.getElementById("tileContainer");
  
//   if (!tileContainer) {
//     console.error("#tileContainer not found");
//     return; // Exit if the element doesn't exist
//   }

//   // Assuming bustBubbleRootData contains the real data
//   const tileWidth = 150;
//   const tileHeight = 150;

//   // Clear the existing tiles
//   tileContainer.innerHTML = '';

//   // Create and append each tile with real data
//   bustBubbleRootData.forEach(season => {
//     season.children.forEach(episode => {
//       const tile = document.createElement('div');
//       tile.classList.add('tile');
//       tile.innerHTML = `
//         <div class="tile-title">Season ${episode.id.slice(1, 2)} - Episode ${episode.id.slice(3)}</div>
        
//       `;

//       // Add a click event to the tile to open the sidebar
//       tile.addEventListener('click', () => openSidebar(episode));

//       tileContainer.appendChild(tile);
//     });
//   });
// }
// Draw the Tile Layout
// function drawTileLayout() {
//     const tileContainer = document.getElementById("tileContainer");
    
//     if (!tileContainer) {
//       console.error("#tileContainer not found");
//       return; // Exit if the element doesn't exist
//     }
  
//     // Assuming bustBubbleRootData contains the real data
//     const tileWidth = 150;
//     const tileHeight = 150;
  
//     // Clear the existing tiles
//     tileContainer.innerHTML = '';
  
//     // Calculate the max number of episodes in any season
//     const maxEpisodes = Math.max(...bustBubbleRootData.map(season => season.children.length));
  
//     // Set up scales for positioning the tiles
//     const xScale = d3.scaleBand()
//       .domain(["S1", "S2", "S3", "S4"])  // Season 1 to 4
//       .range([0, tileContainer.offsetWidth]) // Scale across container width
//       .padding(0.1); // Some padding between the seasons
  
//     const yScale = d3.scaleBand()
//       .domain(d3.range(1, maxEpisodes + 1))  // Scale episodes vertically
//       .range([0, tileContainer.offsetHeight]) // Scale across container height
//       .padding(0.1); // Some padding between the episodes
  
//     // Loop over the seasons and their episodes to create tiles
//     bustBubbleRootData.forEach(season => {
//       season.children.forEach(episode => {
//         const tile = document.createElement('div');
//         tile.classList.add('tile');
//         tile.innerHTML = `
//           <div class="tile-title">Season ${episode.id.slice(1, 2)} - Episode ${episode.id.slice(3)}</div>
          
//         `;
  
//         // Set the position of each tile using xScale (Season) and yScale (Episode)
//         tile.style.position = "absolute";
//         tile.style.left = `${xScale(season.id)}px`; // Position based on season
//         tile.style.top = `${yScale(episode.id.slice(3))}px`; // Position based on episode number
  
//         // Add a click event to the tile to open the sidebar
//         tile.addEventListener('click', () => openSidebar(episode));
  
//         tileContainer.appendChild(tile);
//       });
//     });
//   }
  
// Draw the Tile Layout
// function drawTileLayout() {
//     const tileContainer = document.getElementById("tileContainer");
  
//     if (!tileContainer) {
//       console.error("#tileContainer not found");
//       return; // Exit if the element doesn't exist
//     }
  
//     // Assuming bustBubbleRootData contains the real data
//     const tileWidth = 150;
//     const tileHeight = 150;
  
//     // Clear the existing tiles
//     tileContainer.innerHTML = '';
  
//     // Calculate the max number of episodes in any season
//     const maxEpisodes = Math.max(...bustBubbleRootData.map(season => season.children.length));
  
//     // Set up scales for positioning the tiles
//     const xScale = d3.scaleBand()
//       .domain(["S1", "S2", "S3", "S4"])  // Season 1 to 4
//       .range([0, tileContainer.offsetWidth]) // Scale across container width
//       .padding(0.1); // Some padding between the seasons
  
//     const yScale = d3.scaleBand()
//       .domain(d3.range(1, maxEpisodes + 1))  // Scale episodes vertically
//       .range([0, tileContainer.offsetHeight]) // Scale across container height
//       .padding(0.1); // Some padding between the episodes
  
//     // Loop over the seasons and their episodes to create tiles
//     bustBubbleRootData.forEach(season => {
//       season.children.forEach(episode => {
//         const tile = document.createElement('div');
//         tile.classList.add('tile');
//         tile.innerHTML = `
//           <div class="tile-title">Season ${episode.id.slice(1, 2)} - Episode ${episode.id.slice(3)}</div>
          
//         `;
  
//         // Set the position of each tile using xScale (Season) and yScale (Episode)
//         tile.style.position = "absolute";
//         tile.style.left = `${xScale(season.id)}px`; // Position based on season
//         tile.style.top = `${yScale(episode.id.slice(3))}px`; // Position based on episode number
  
//         // Add a click event to the tile to open the sidebar
//         tile.addEventListener('click', () => openSidebar(episode));
  
//         tileContainer.appendChild(tile);
//       });
//     });
//   }

// function drawTileLayout() {
//     const tileContainer = document.getElementById("tileContainer");

//     if (!tileContainer) {
//       console.error("#tileContainer not found");
//       return; // Exit if the element doesn't exist
//     }

//     // Get the container width and height dynamically
//     const containerWidth = tileContainer.offsetWidth;
//     const containerHeight = tileContainer.offsetHeight;

//     const tileWidth = 150;
//     const tileHeight = 150;

//     // Clear the existing tiles
//     tileContainer.innerHTML = '';

//     // Calculate the max number of episodes in any season
//     const maxEpisodes = Math.max(...bustBubbleRootData.map(season => season.children.length));

//     // Set up scales for positioning the tiles
//     const xScale = d3.scaleBand()
//       .domain(["S1", "S2", "S3", "S4"])  // Season 1 to 4
//       .range([0, containerWidth])  // Scale across container width
//       .padding(0.1);  // Padding between the seasons

//     const yScale = d3.scaleBand()
//       .domain(d3.range(1, maxEpisodes + 1))  // Scale episodes vertically
//       .range([0, containerHeight])  // Scale across container height
//       .padding(0.1);  // Padding between the episodes

//     // Loop over the seasons and their episodes to create tiles
//     bustBubbleRootData.forEach(season => {
//       season.children.forEach(episode => {
//         const tile = document.createElement('div');
//         tile.classList.add('tile');
//         tile.innerHTML = `
//           <div class="tile-title">Season ${episode.id.slice(1, 2)} - Episode ${episode.id.slice(3)}</div>
//         `;

//         // Set the position of each tile using xScale (Season) and yScale (Episode)
//         tile.style.position = "absolute";
//         tile.style.left = `${xScale(season.id)}px`; // Position based on season
//         tile.style.top = `${yScale(episode.id.slice(3))}px`; // Position based on episode number

//         // Add a click event to the tile to open the sidebar
//         tile.addEventListener('click', () => openSidebar(episode));

//         tileContainer.appendChild(tile);
//       });
//     });

//     // Now, let's add the X axis (season numbers)
//     const svg = d3.select(tileContainer)
//                   .append('svg')
//                   .attr('width', containerWidth)
//                   .attr('height', 40)  // Height for the axis
//                   .style('position', 'absolute')
//                   .style('bottom', 0)  // Place at the bottom of the tile container
//                   .style('left', 0);

//     const xAxis = d3.axisBottom(xScale)
//                     .tickFormat((d, i) => `Season ${i + 1}`);  // Display 'Season 1', 'Season 2', etc.

//     svg.append('g')
//        .attr('class', 'x-axis')
//        .attr('transform', `translate(0, 20)`)  // Adjust vertical positioning slightly
//        .call(xAxis);
// }

// function drawTileLayout() {
//     const tileContainer = document.getElementById("tileContainer");

//     if (!tileContainer) {
//       console.error("#tileContainer not found");
//       return; // Exit if the element doesn't exist
//     }

//     // Get the container width and height dynamically
//     const containerWidth = tileContainer.offsetWidth;
//     const containerHeight = tileContainer.offsetHeight;

//     const tileWidth = 150;
//     const tileHeight = 150;

//     // Clear the existing tiles
//     tileContainer.innerHTML = '';

//     // Limit to 10 episodes per season
//     const maxEpisodesPerSeason = 10;

//     // Calculate the max number of episodes in any season (for yScale)
//     const maxEpisodes = Math.min(
//         Math.max(...bustBubbleRootData.map(season => season.children.length)),
//         maxEpisodesPerSeason
//     );

//     // Set up scales for positioning the tiles
//     const xScale = d3.scaleBand()
//       .domain(["S1", "S2", "S3", "S4"])  // Season 1 to 4
//       .range([0, containerWidth])  // Scale across container width
//       .padding(0.1);  // Padding between the seasons

//     const yScale = d3.scaleBand()
//       .domain(d3.range(1, maxEpisodes + 1))  // Scale episodes vertically (limit to 10 episodes max)
//       .range([0, containerHeight])  // Scale across container height
//       .padding(0.1);  // Padding between the episodes

//     // Loop over the seasons and their episodes to create tiles
//     bustBubbleRootData.forEach(season => {
//       season.children.slice(0, maxEpisodesPerSeason).forEach(episode => {
//         const tile = document.createElement('div');
//         tile.classList.add('tile');
//         tile.innerHTML = `
//           <div class="tile-title">Episode ${episode.id.slice(3)}</div>
//         `;

//         // Set the position of each tile using xScale (Season) and yScale (Episode)
//         tile.style.position = "absolute";
//         tile.style.left = `${xScale(season.id)}px`; // Position based on season
//         tile.style.top = `${yScale(parseInt(episode.id.slice(3)))}px`; // Position based on episode number

//         // Add a click event to the tile to open the sidebar
//         tile.addEventListener('click', () => openSidebar(episode));

//         tileContainer.appendChild(tile);
//       });
//     });

//     // Now, let's add the X axis (season numbers)
//     const svg = d3.select(tileContainer)
//                   .append('svg')
//                   .attr('width', containerWidth)
//                   .attr('height', 40)  // Height for the axis
//                   .style('position', 'absolute')
//                   .style('bottom', 0)  // Place at the bottom of the tile container
//                   .style('left', 0);

//     const xAxis = d3.axisBottom(xScale)
//                     .tickFormat((d, i) => `Season ${i + 1}`);  // Display 'Season 1', 'Season 2', etc.

//     svg.append('g')
//        .attr('class', 'x-axis')
//        .attr('transform', `translate(0, 20)`)  // Adjust vertical positioning slightly
//        .call(xAxis);
// }
// Draw the Tile Layout
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
//     const maxEpisodesPerSeason = 10;

//     // Calculate the max number of episodes in any season (for yScale)
//     const maxEpisodes = Math.min(
//         Math.max(...bustBubbleRootData.map(season => season.children.length)),
//         maxEpisodesPerSeason
//     );

//     // Set up scales for positioning the tiles
//     const xScale = d3.scaleBand()
//         .domain(["S1", "S2", "S3", "S4"])  // Season 1 to 4
//         .range([0, containerWidth])  // Scale across container width
//         .padding(0.5);  // Padding between the seasons

//     const yScale = d3.scaleBand()
//         .domain(d3.range(1, maxEpisodes + 1))  // Scale episodes vertically (limit to 10 episodes max)
//         .range([0, containerHeight])  // Scale across container height
//         .padding(12);  // Padding between the episodes

//     // Loop over the seasons and their episodes to create tiles
//     bustBubbleRootData.forEach(season => {
//         season.children.slice(0, maxEpisodesPerSeason).forEach(episode => {
//             const tile = document.createElement('div');
//             tile.classList.add('tile');
//             tile.innerHTML = `
//                 <div class="tile-title">Season ${episode.id.slice(1, 2)} - Episode ${episode.id.slice(3)}</div>
//                 <div class="tile-content">Bust Attempts: ${episode.bustAttempts}</div>
//             `;

//             // Set the position of each tile using xScale (Season) and yScale (Episode)
//             tile.style.position = "absolute";
//             tile.style.left = `${xScale(season.id)}px`; // Position based on season
//             tile.style.top = `${yScale(parseInt(episode.id.slice(3)))}px`; // Position based on episode number

//             // Add a click event to the tile to open the sidebar
//             tile.addEventListener('click', () => openSidebar(episode));

//             tileContainer.appendChild(tile);
//         });
//     });

//     // Now, let's add the X axis (season numbers)
//     const svg = d3.select(tileContainer)
//                   .append('svg')
//                   .attr('width', containerWidth)
//                   .attr('height', 40)  // Height for the axis
//                   .style('position', 'absolute')
//                   .style('bottom', 0)  // Place at the bottom of the tile container
//                   .style('left', 0);

//     const xAxis = d3.axisBottom(xScale)
//                     .tickFormat((d, i) => `Season ${i + 1}`);  // Display 'Season 1', 'Season 2', etc.

//     svg.append('g')
//        .attr('class', 'x-axis')
//        .attr('transform', `translate(0, 20)`)  // Adjust vertical positioning slightly
//        .call(xAxis);

// }

// Draw the Tile Layout
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
//     const maxEpisodesPerSeason = 10;

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
//         .range([0, containerHeight])  // Scale across container height
//         .padding(0.25);  // Increased padding between the episodes (space between tiles vertically)

//     // Loop over the seasons and their episodes to create tiles
//     bustBubbleRootData.forEach(season => {
//         season.children.slice(0, maxEpisodesPerSeason).forEach(episode => {
//             const tile = document.createElement('div');
//             tile.classList.add('tile');
//             tile.innerHTML = `
//                 <div class="tile-title">Season ${episode.id.slice(1, 2)} - Episode ${episode.id.slice(3)}</div>
//                 <div class="tile-content">Bust Attempts: ${episode.bustAttempts}</div>
//             `;

//             // Set the position of each tile using xScale (Season) and yScale (Episode)
//             tile.style.position = "absolute";
//             tile.style.left = `${xScale(season.id)}px`; // Position based on season
//             tile.style.top = `${yScale(parseInt(episode.id.slice(3)))}px`; // Position based on episode number
//             tile.style.margin = '10px';  // Margin to give space around each tile

//             // Add a click event to the tile to open the sidebar
//             tile.addEventListener('click', () => openSidebar(episode));

//             tileContainer.appendChild(tile);
//         });
//     });

//     // Now, let's add the X axis (season numbers)
//     const svg = d3.select(tileContainer)
//                   .append('svg')
//                   .attr('width', containerWidth)
//                   .attr('height', 40)  // Height for the axis
//                   .style('position', 'absolute')
//                   .style('bottom', 0)  // Place at the bottom of the tile container
//                   .style('left', 0);

//     const xAxis = d3.axisBottom(xScale)
//                     .tickFormat((d, i) => `Season ${i + 1}`);  // Display 'Season 1', 'Season 2', etc.

//     svg.append('g')
//        .attr('class', 'x-axis')
//        .attr('transform', `translate(0, 20)`)  // Adjust vertical positioning slightly
//        .call(xAxis);
// }

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
//     const maxEpisodesPerSeason = 10;

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
//         .range([2, containerHeight])  // Scale across container height
//         .padding(15);  // Increased padding between the episodes (space between tiles vertically)

//     // Loop over the seasons and their episodes to create tiles
//     bustBubbleRootData.forEach(season => {
//         season.children.slice(0, maxEpisodesPerSeason).forEach(episode => {
//             const tile = document.createElement('div');
//             tile.classList.add('tile');
//             tile.innerHTML = `
//                 <div class="tile-title">Season ${episode.id.slice(1, 2)} - Episode ${episode.id.slice(3)}</div>
//                 <div class="tile-content">Bust Attempts: ${episode.bustAttempts}</div>
//             `;

//             // Set the position of each tile using xScale (Season) and yScale (Episode)
//             tile.style.position = "absolute";
//             tile.style.left = `${xScale(season.id)}px`; // Position based on season
//             tile.style.top = `${yScale(parseInt(episode.id.slice(3)))}px`; // Position based on episode number
//             tile.style.margin = '10px';  // Margin to give space around each tile

//             // Add a click event to the tile to open the sidebar
//             tile.addEventListener('click', () => openSidebar(episode));

//             tileContainer.appendChild(tile);
//         });
//     });

//     // Now, let's add the X axis (season numbers)
//     const svg = d3.select(tileContainer)
//                   .append('svg')
//                   .attr('width', containerWidth)
//                   .attr('height', 40)  // Height for the axis
//                   .style('position', 'absolute')
//                   .style('bottom', 0)  // Place at the bottom of the tile container
//                   .style('left', 0);

//     const xAxis = d3.axisBottom(xScale)
//                     .tickFormat((d, i) => `Season ${i + 1}`);  // Display 'Season 1', 'Season 2', etc.

//     svg.append('g')
//        .attr('class', 'x-axis')
//        .attr('transform', `translate(0, 20)`)  // Adjust vertical positioning slightly
//        .call(xAxis);
// }
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
//     const maxEpisodesPerSeason = 10;

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
//         .range([0, containerHeight])  // Scale across container height
//         .padding(10);  // Increased padding between the episodes (space between tiles vertically)

//     // Loop over the seasons and their episodes to create tiles
//     bustBubbleRootData.forEach(season => {
//         season.children.slice(0, maxEpisodesPerSeason).forEach(episode => {
//             const tile = document.createElement('div');
//             tile.classList.add('tile');
//             tile.innerHTML = `
//                 <div class="tile-title">Season ${episode.id.slice(1, 2)} - Episode ${episode.id.slice(3)}</div>
                
//             `;

//             // Set the position of each tile using xScale (Season) and yScale (Episode)
//             tile.style.position = "absolute";
//             tile.style.left = `${xScale(season.id)}px`; // Position based on season
//             tile.style.top = `${yScale(parseInt(episode.id.slice(3)))}px`; // Position based on episode number
//             tile.style.margin = '10px';  // Margin to give space around each tile

//             // Add a click event to the tile to open the sidebar
//             tile.addEventListener('click', () => openSidebar(episode));

//             tileContainer.appendChild(tile);
//         });
//     });

//     // Now, let's add the X axis (season numbers)
//     const svg = d3.select(tileContainer)
//                   .append('svg')
//                   .attr('width', containerWidth)
//                   .attr('height', 40)  // Height for the axis
//                   .style('position', 'absolute')
//                   .style('bottom', 0)  // Place at the bottom of the tile container
//                   .style('left', 0);

//     const xAxis = d3.axisBottom(xScale)
//                     .tickFormat((d, i) => `Season ${i + 1}`);  // Display 'Season 1', 'Season 2', etc.

//     svg.append('g')
//        .attr('class', 'x-axis')
//        .attr('transform', `translate(0, 20)`)  // Adjust vertical positioning slightly
//        .call(xAxis);
// }

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
//     const maxEpisodesPerSeason = 10;

//     // Calculate the max number of episodes in any season (for yScale)
//     const maxEpisodes = Math.min(
//         Math.max(...bustBubbleRootData.map(season => season.children.length)),
//         maxEpisodesPerSeason
//     );

//     // Set up scales for positioning the tiles
//     const xScale = d3.scaleBand()
//         .domain(["S1", "S2", "S3", "S4"])  // Season 1 to 4
//         .range([0, containerWidth])  // Scale across container width
//         .padding(0.15);  // Padding between the seasons (space between tiles horizontally)

//     const yScale = d3.scaleBand()
//         .domain(d3.range(1, maxEpisodes + 1))  // Scale episodes vertically (limit to 10 episodes max)
//         .range([0, containerHeight])  // Scale across container height
//         .padding(0.15);  // Padding between the episodes (space between tiles vertically)

//     // Loop over the seasons and their episodes to create tiles
//     bustBubbleRootData.forEach(season => {
//         season.children.slice(0, maxEpisodesPerSeason).forEach(episode => {
//             const tile = document.createElement('div');
//             tile.classList.add('tile');
//             tile.innerHTML = `
//                 <div class="tile-title">Season ${episode.id.slice(1, 2)} - Episode ${episode.id.slice(3)}</div>
//             `;

//             // Set the position of each tile using xScale (Season) and yScale (Episode)
//             tile.style.position = "absolute";
//             tile.style.left = `${xScale(season.id)}px`; // Position based on season
//             tile.style.top = `${yScale(parseInt(episode.id.slice(3)))}px`; // Position based on episode number

//             // Add a click event to the tile to open the sidebar
//             tile.addEventListener('click', () => openSidebar(episode));

//             tileContainer.appendChild(tile);
//         });
//     });

//     // Now, let's add the X axis (season numbers)
//     const svg = d3.select(tileContainer)
//                   .append('svg')
//                   .attr('width', containerWidth)
//                   .attr('height', 40)  // Height for the axis
//                   .style('position', 'absolute')
//                   .style('bottom', 0)  // Place at the bottom of the tile container
//                   .style('left', 0);

//     const xAxis = d3.axisBottom(xScale)
//                     .tickFormat((d, i) => `Season ${i + 1}`);  // Display 'Season 1', 'Season 2', etc.

//     svg.append('g')
//        .attr('class', 'x-axis')
//        .attr('transform', `translate(0, 20)`)  // Adjust vertical positioning slightly
//        .call(xAxis);
// }

// function drawTileLayout() {
//     const tileContainer = document.getElementById("tileContainer");

//     if (!tileContainer) {
//         console.error("#tileContainer not found");
//         return; // Exit if the element doesn't exist
//     }

//     // Clear the existing tiles
//     tileContainer.innerHTML = '';

//     // Limit to 10 episodes per season
//     const maxEpisodesPerSeason = 10;

//     // Loop over the seasons and their episodes to create tiles
//     bustBubbleRootData.forEach(season => {
//         season.children.slice(0, maxEpisodesPerSeason).forEach(episode => {
//             const tile = document.createElement('div');
//             tile.classList.add('tile');
//             tile.innerHTML = `
//                 <div class="tile-title">Season ${episode.id.slice(1, 2)} - Episode ${episode.id.slice(3)}</div>
//             `;

//             // Add a click event to the tile to open the sidebar
//             tile.addEventListener('click', () => openSidebar(episode));

//             tileContainer.appendChild(tile);
//         });
//     });

//     // Add the X axis (season numbers)
//     const svg = d3.select(tileContainer)
//                   .append('svg')
//                   .attr('width', tileContainer.offsetWidth)
//                   .attr('height', 40)  // Height for the axis
//                   .style('position', 'absolute')
//                   .style('bottom', 0)  // Place at the bottom of the tile container
//                   .style('left', 0);

//     const xAxis = d3.axisBottom(d3.scaleBand().domain(["S1", "S2", "S3", "S4"]).range([0, tileContainer.offsetWidth]));

//     svg.append('g')
//        .attr('class', 'x-axis')
//        .attr('transform', `translate(0, 20)`)  // Adjust vertical positioning slightly
//        .call(xAxis);
// }

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
//     const maxEpisodesPerSeason = 10;

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
//         .range([0, containerHeight])  // Scale across container height
//         .padding(10);  // Increased padding between the episodes (space between tiles vertically)

//     // Loop over the seasons and their episodes to create tiles
//     bustBubbleRootData.forEach(season => {
//         season.children.slice(0, maxEpisodesPerSeason).forEach(episode => {
//             const tile = document.createElement('div');
//             tile.classList.add('tile');
//             tile.innerHTML = `
//                 <div class="tile-title">Season ${episode.id.slice(1, 2)} - Episode ${episode.id.slice(3)}</div>
//             `;

//             // Add a click event to the tile to open the sidebar
//             tile.addEventListener('click', () => openSidebar(episode));

//             tileContainer.appendChild(tile);
//         });
//     });

//     // Add the X axis (season numbers)
//     const svg = d3.select(tileContainer)
//                   .append('svg')
//                   .attr('width', containerWidth)
//                   .attr('height', 40)  // Height for the axis
//                   .attr('class', 'x-axis')
//                   .style('position', 'absolute')
//                   .style('bottom', '0px')  // Place at the bottom of the tile container
//                   .style('left', '0');

//     const xAxis = d3.axisBottom(d3.scaleBand().domain(["S1", "S2", "S3", "S4"]).range([0, containerWidth]));

//     svg.append('g')
//        .attr('class', 'x-axis')
//        .attr('transform', `translate(0, 20)`)  // Adjust vertical positioning slightly
//        .call(xAxis);
// }


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
//     const maxEpisodesPerSeason = 10;

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
//         .range([0, containerHeight])  // Scale across container height
//         .padding(10);  // Increased padding between the episodes (space between tiles vertically)

//     // Loop over the seasons and their episodes to create tiles
//     bustBubbleRootData.forEach(season => {
//         season.children.slice(0, maxEpisodesPerSeason).forEach(episode => {
//             const tile = document.createElement('div');
//             tile.classList.add('tile');
//             tile.innerHTML = `
//                 <div class="tile-title">Season ${episode.id.slice(1, 2)} - Episode ${episode.id.slice(3)}</div>
//             `;

//             // Add a click event to the tile to open the sidebar
//             tile.addEventListener('click', () => openSidebar(episode));

//             tileContainer.appendChild(tile);
//         });
//     });

//     // Add the X axis (season numbers)
//     const svg = d3.select(tileContainer)
//                   .append('svg')
//                   .attr('width', containerWidth)
//                   .attr('height', 40)  // Height for the axis
//                   .attr('class', 'x-axis')
//                   .style('position', 'relative')
//                   .style('bottom', '0px')  // Place at the bottom of the tile container
//                   .style('left', '0');

//     const xAxis = d3.axisBottom(d3.scaleBand().domain(["S1", "S2", "S3", "S4"]).range([0, containerWidth]));

//     svg.append('g')
//        .attr('class', 'x-axis')
//        .attr('transform', `translate(0, 20)`)  // Adjust vertical positioning slightly
//        .call(xAxis);
// }


// function drawTileLayout() {
//     const tileContainer = document.getElementById("tileContainer");

//     if (!tileContainer) {
//         console.error("#tileContainer not found");
//         return; // Exit if the element doesn't exist
//     }

//     // Get the container width and height dynamically
//     const containerWidth = tileContainer.offsetWidth;
//     const containerHeight = tileContainer.offsetHeight;

//     // Clear the existing tiles
//     tileContainer.innerHTML = '';

//     // Limit to 10 episodes per season
//     const maxEpisodesPerSeason = 10;

//     // Calculate the max number of episodes in any season (for yScale)
//     const maxEpisodes = Math.min(
//         Math.max(...bustBubbleRootData.map(season => season.children.length)),
//         maxEpisodesPerSeason
//     );

//     // Set up scales for positioning the tiles
//     const xScale = d3.scaleBand()
//         .domain(["S1", "S2", "S3", "S4"])  // Season 1 to 4
//         .range([0, containerWidth])  // Scale across container width
//         .padding(0.15);  // Padding between the seasons

//     const yScale = d3.scaleBand()
//         .domain(d3.range(1, maxEpisodes + 1))  // Scale episodes vertically (limit to 10 episodes max)
//         .range([0, containerHeight])  // Scale across container height
//         .padding(10);  // Padding between the episodes

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

//         // Append the season container to the tileContainer
//         tileContainer.appendChild(seasonContainer);
//     });

//     // Now, let's add the X axis (season numbers)
//     const svg = d3.select(tileContainer)
//                   .append('svg')
//                   .attr('width', containerWidth)
//                   .attr('height', 40)  // Height for the axis
//                   .attr('class', 'x-axis')
//                   .style('position', 'relative')
//                   .style('bottom', '0px')  // Place at the bottom of the tile container
//                   .style('left', '0');

//     const xAxis = d3.axisBottom(d3.scaleBand().domain(["S1", "S2", "S3", "S4"]).range([0, containerWidth]));

//     svg.append('g')
//        .attr('class', 'x-axis')
//        .attr('transform', `translate(0, 20)`)  // Adjust vertical positioning slightly
//        .call(xAxis);
// }

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
//     const maxEpisodesPerSeason = 5;

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
//         .range([0, containerHeight])  // Scale across container height
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

//         // Append the season container to the tileContainer
//         tileContainer.appendChild(seasonContainer);
//     });

//     // Now, let's add the X axis (season numbers)
//     const svg = d3.select(tileContainer)
//                   .append('svg')
//                   .attr('width', containerWidth)
//                   .attr('height', 40)  // Height for the axis
//                   .attr('class', 'x-axis')
//                   .style('position', 'absolute')
//                   .style('bottom', '0')  // Position at the bottom of the tile container
//                   .style('left', '0')
//                   .style('display', 'block');

//     const xAxis = d3.axisBottom(xScale)
//                     .tickFormat((d, i) => `Season ${i + 1}`);  // Display 'Season 1', 'Season 2', etc.

//     svg.append('g')
//        .attr('class', 'x-axis')
//        .attr('transform', `translate(0, 20)`)  // Adjust vertical positioning slightly
//        .call(xAxis);
// }

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
//     const maxEpisodesPerSeason = 10;

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
//         .range([0, containerHeight])  // Scale across container height
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

//         // Append the season container to the tileContainer
//         tileContainer.appendChild(seasonContainer);
//     });

//     // Now, let's add the X axis (season numbers)
//     const svg = d3.select(tileContainer)
//                   .append('svg')
//                   .attr('width', containerWidth)
//                   .attr('height', 40)  // Height for the axis
//                   .attr('class', 'x-axis')
//                   .style('position', 'absolute')
//                   .style('left', '0')
//                   .style('bottom', '0px') // Position at the bottom of the tile container
//                   .style('display', 'block');

//     const xAxis = d3.axisBottom(xScale)
//                     .tickFormat((d, i) => `Season ${i + 1}`);  // Display 'Season 1', 'Season 2', etc.

//     svg.append('g')
//        .attr('class', 'x-axis')
//        .attr('transform', `translate(0, 20)`)  // Adjust vertical positioning slightly
//        .call(xAxis);
// }

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
//     const maxEpisodesPerSeason = 10;

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
//         .range([0, containerHeight])  // Scale across container height
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

//         // Append the season container to the tileContainer
//         tileContainer.appendChild(seasonContainer);
//     });

//     // Now, let's add the X axis (season numbers)
//     const svg = d3.select(tileContainer)
//                   .append('svg')
//                   .attr('width', containerWidth)
//                   .attr('height', 40)  // Height for the axis
//                   .attr('class', 'x-axis')
//                   .style('position', 'absolute')
//                   .style('left', '0')
//                   .style('bottom', '0px');  // Place at the bottom of the tile container

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
        return; // Exit if the element doesn't exist
    }

    // Get the container width and height dynamically
    const containerWidth = tileContainer.offsetWidth;
    const containerHeight = tileContainer.offsetHeight;

    const tileWidth = 150;
    const tileHeight = 150;

    // Clear the existing tiles
    tileContainer.innerHTML = '';

    // Limit to 10 episodes per season
    const maxEpisodesPerSeason = 10;

    // Calculate the max number of episodes in any season (for yScale)
    const maxEpisodes = Math.min(
        Math.max(...bustBubbleRootData.map(season => season.children.length)),
        maxEpisodesPerSeason
    );

    // Set up scales for positioning the tiles
    const xScale = d3.scaleBand()
        .domain(["S1", "S2", "S3", "S4"])  // Season 1 to 4
        .range([0, containerWidth])  // Scale across container width
        .padding(0.15);  // Increased padding between the seasons (space between tiles horizontally)

    const yScale = d3.scaleBand()
        .domain(d3.range(1, maxEpisodes + 1))  // Scale episodes vertically (limit to 10 episodes max)
        .range([0, containerHeight - 40])  // Adjust the Y range to leave space for the X-axis at the bottom
        .padding(10);  // Increased padding between the episodes (space between tiles vertically)

    // Loop over the seasons and their episodes to create tiles
    bustBubbleRootData.forEach(season => {
        const seasonContainer = document.createElement('div');
        seasonContainer.classList.add('season-container');

        // Create a container for each season to hold its episodes
        season.children.slice(0, maxEpisodesPerSeason).forEach(episode => {
            const tile = document.createElement('div');
            tile.classList.add('tile');
            tile.innerHTML = `
                <div class="tile-title">Season ${episode.id.slice(1, 2)} - Episode ${episode.id.slice(3)}</div>
            `;

            // Add a click event to the tile to open the sidebar
            tile.addEventListener('click', () => openSidebar(episode));

            seasonContainer.appendChild(tile);
        });

        // Append the season container to the tileContainer
        tileContainer.appendChild(seasonContainer);
    });

    // Now, let's add the X axis (season numbers) and ensure it's at the bottom
    const svg = d3.select(tileContainer)
                  .append('svg')
                  .attr('width', containerWidth)
                  .attr('height', 40)  // Height for the axis
                  .attr('class', 'x-axis')
                  .style('position', 'relative')
                  .style('margin-top', `${containerHeight - 40}px`); // Correctly move the X-axis to the bottom

    const xAxis = d3.axisBottom(xScale)
                    .tickFormat((d, i) => `Season ${i + 1}`);  // Display 'Season 1', 'Season 2', etc.

    svg.append('g')
       .attr('class', 'x-axis')
       .attr('transform', `translate(0, 20)`)  // Adjust vertical positioning slightly
       .call(xAxis);
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
