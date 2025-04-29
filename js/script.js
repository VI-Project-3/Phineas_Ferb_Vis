const characterColors = {
  Phineas: "#ff9800",        // slightly muted bright orange
  Ferb: "#4caf50",           // classic fresh green
  Candace: "#f04a4a",        // soft but strong red
  Perry: "#26c6da",          // medium teal (Perry)
  Doofenshmirtz: "#7e57c2",  // softer dark purple
  Isabella: "#ec407a",       // rich pink
  Buford: "#827717",         // deep olive green
  Baljeet: "#3949ab",        // strong blue-violet
  Carl: "#42a5f5",           // nice sky blue
  MajorMonogram: "#00897b",  // teal-green serious
  Jeremy: "#fdd835",         // warm yellow
  Lawrence: "#ab47bc",       // violet
  Linda: "#8d6e63",          // soft brown
  Stacy: "#26a69a",          // calm teal 
  Vanessa: "#9575cd",        // soft lavender-violet

  // fallback
  default: "#4B8DF8"
};


const svg = d3.select("#timelineChart")
  .attr("width", 1200)  // Increased width
  .attr("height", 750); // Increased height
const margin = { top: 50, right: 30, bottom: 100, left: 150 };  // Increased bottom margin for better axis labels
const width = +svg.attr("width") - margin.left - margin.right;
const height = +svg.attr("height") - margin.top - margin.bottom;
const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

const filePaths = Array.from({ length: 4 }, (_, i) =>
  `data/phineas_and_ferb_transcripts_${i + 1}.csv`
);

let dotData = [];
let currentSeason = "all";
let currentCharacter = "all";
let filterMajorOnly = false;
let currentMetric = "words";
let majorCharacters = new Set();
let bustAttemptsPerEpisod = {};

Promise.all(filePaths.map(path => d3.csv(path))).then(all => {
  let transcripts = all.flat();

  transcripts.forEach(d => {
    if (d.speaker === "Candace" && d.line) {
       const lowerLine = d.line.toLowerCase();
 
       if (lowerLine.includes("mom") || 
           lowerLine.includes("phineas and ferb") || 
           lowerLine.includes("come and see") ||
           lowerLine.includes("look what they're doing")) {
 
         const epKey = `S${d.season}E${d.episode.toString().padStart(2, '0')}`;
 
         bustAttemptsPerEpisod[epKey] = (bustAttemptsPerEpisod[epKey] || 0) + 1;
       }
     }
    
    d.season = parseInt(d.season);
    d.episode = parseInt(d.episode);
    if (isNaN(d.season) || isNaN(d.episode)) d._skip = true;

    d.words = d.line ? d.line.trim().split(/\s+/).length : 0;

    let name = d.speaker?.replace(/\(.*?\)/g, "").trim().toLowerCase();
    if (name) {
      name = name.replace(/\s+/g, " ");
      name = name.replace(/\b\w/g, c => c.toUpperCase());
    }
    // Special case corrections
    const corrections = {
      "Doofenshimrtz": "Doofenshmirtz",
      "All": " ",
      "Blay'N": " ",
      "Tv Announcer": "Announcer",
      "Background Singer": " ",
      "Background Singers": " ",
      "Both": " ",
      "Dan": "Dan Povenmire",
      "Danny": "Danny Jacob",
      "Doofenshmirtz'S Date": " ",
      "Farmer'S Wife": " ",
      "Lindana": "Linda",
      "Male Singer": " ",
      "Party Members": " ",
      "Phineas And Ferb": " ",
      "Radio Dj": " ",
      "Voice": " ",
      "Woman": " ",
      "Worker": " ",
    };
    
    if (corrections[name]) {
      name = corrections[name];
    }
    d.character = name;
  });

  transcripts = transcripts.filter(d =>
    !d._skip &&
    d.character &&
    /^[a-zA-Z\s.'-]{2,30}$/.test(d.character) // remove weird characters
  );

  // STEP 1: Count episodes per character
  const charEpisodeMap = d3.rollups(
    transcripts,
    v => new Set(v.map(d => `${d.season}-${d.episode}`)).size,
    d => d.character
  );
  const episodeCounts = Object.fromEntries(charEpisodeMap);

  // STEP 2: Remove any character with < 50 words in **all** episodes they appear in
  const episodeWordMap = d3.rollup(
    transcripts,
    v => d3.sum(v, d => d.words),
    d => `${d.character}|${d.season}|${d.episode}`
  );

  const keepCharacters = new Set();

  transcripts.forEach(d => {
    const key = `${d.character}|${d.season}|${d.episode}`;
    const totalWords = episodeWordMap.get(key);
    const episodes = episodeCounts[d.character];

    if (episodes > 1 && totalWords >= 50) {
      keepCharacters.add(d.character);
    }
  });

  transcripts = transcripts.filter(d => keepCharacters.has(d.character));

  // Recalculate major characters
  const totals = d3.rollups(transcripts, v => d3.sum(v, d => d.words), d => d.character);
  majorCharacters = new Set(totals.filter(d => d[1] > 3000).map(d => d[0]));

  // Group by character + episode
  const grouped = d3.group(transcripts, d =>
    `${d.character}|${d.season}|${d.episode}`
  );

  dotData = Array.from(grouped, ([key, values]) => {
    const [character, season, episode] = key.split("|");
    return {
      character,
      season: +season,
      episode: +episode,
      episodeIndex: `S${season}E${episode.toString().padStart(2, '0')}`,
      title: values[0].title || "(Unknown)",
      words: d3.sum(values, d => d.words),
      lines: values.length
    };
  });

  populateDropdowns(transcripts);
  renderChart();
});

function populateDropdowns(transcripts) {
  const uniqueCharacters = Array.from(
    new Set(
      transcripts.map(d => d.character)
        .filter(c => c && c.length <= 30 && /^[a-zA-Z\s'-]+$/.test(c))
    )
  ).sort();

  const charSelect = d3.select("#characterSelect");
  charSelect.selectAll("option").remove();
  charSelect.append("option").attr("value", "all").text("All Characters");

  uniqueCharacters.forEach(c => {
    charSelect.append("option").attr("value", c).text(c);
  });


  // Show modal if major character is selected
  charSelect.on("change", function () {
    const selected = this.value;
  
    if (filterMajorOnly && selected !== "all" && !majorCharacters.has(selected)) {
      const modal = document.getElementById("modal");
      const list = document.getElementById("majorCharactersList");
  
      list.innerHTML = ""; // clear old items
  
      Array.from(majorCharacters).sort().forEach(c => {
        const li = document.createElement("li");
        li.textContent = c;
        list.appendChild(li);
      });

      //Show the modal popup
      document.getElementById("modal").style.display = "block";
      
      // Reset dropdown back to 'all'
      d3.select(this).property("value", "all");
      currentCharacter = "all";

      // Reset the character search input
      d3.select("#characterSearch").property("value", "");
    } else {
      currentCharacter = selected;
    }
  
    renderChart();
  });
  
  // // Close modal when button clicked
  document.getElementById("closeModal").addEventListener("click", function() {
    document.getElementById("modal").style.display = "none";
  });

  const seasonSelect = d3.select("#seasonSelect");
  seasonSelect.selectAll("option").remove();
  seasonSelect.append("option").attr("value", "all").text("All Seasons");

  Array.from(new Set(transcripts.map(d => d.season)))
    .sort((a, b) => a - b)
    .forEach(s => {
      seasonSelect.append("option")
        .attr("value", s)
        .text(`Season ${s}`);
    });

  seasonSelect.on("change", function () {
    currentSeason = this.value;
    renderChart();
  });

  d3.select("#majorOnlyToggle").on("change", function () {
    filterMajorOnly = this.checked;
    renderChart();
  });

  d3.select("#metricSelect").on("change", function () {
    currentMetric = this.value;
    renderChart();
  });

  // Character search input
  d3.select("#characterSearch").on("input", function () {
    const query = this.value.trim().toLowerCase();
  
    var exactMatch = Array.from(uniqueCharacters).find(c => c.toLowerCase().includes(query));
    
    if(filterMajorOnly){
      exactMatch = Array.from(uniqueCharacters).find(c => c.toLowerCase() === query);
    }
  
    if (exactMatch) {
      if (filterMajorOnly && !majorCharacters.has(exactMatch)) {
        // Show popup if not a major character
        const modal = document.getElementById("modal");
        const list = document.getElementById("majorCharactersList");
  
        list.innerHTML = "";
        Array.from(majorCharacters).sort().forEach(c => {
          const li = document.createElement("li");
          li.textContent = c;
          list.appendChild(li);
        });
  
        modal.style.display = "block";
  
        // Reset dropdown and search
        currentCharacter = "all";
        d3.select("#characterSelect").property("value", "all");
        d3.select(this).property("value", "");
      } else {
        currentCharacter = exactMatch;
        d3.select("#characterSelect").property("value", exactMatch);
      }
    } else {
      currentCharacter = "all";
      d3.select("#characterSelect").property("value", "all");
    }
  
    renderChart();
  if (typeof updateVisuals === "function") {
    updateVisuals();
  }
  });
  

  const legend = d3.select("#legend");
  legend.html("<strong>Legend:</strong>");
  majorCharacters.forEach(character => {
    const color = characterColors[character] || characterColors.default;
    const item = legend.append("div")
      .style("display", "flex")
      .style("align-items", "center")
      .style("margin-right", "12px");

    item.append("div")
      .style("width", "12px")
      .style("height", "12px")
      .style("background-color", color)
      .style("margin-right", "6px")
      .style("border-radius", "3px");

    item.append("span").text(character);
  });
}

function renderChart() {
  g.selectAll("*").remove();

  let displayData = dotData;
  if (filterMajorOnly) displayData = displayData.filter(d => majorCharacters.has(d.character));
  if (currentCharacter !== "all") displayData = displayData.filter(d => d.character === currentCharacter);
  if (currentSeason !== "all") displayData = displayData.filter(d => d.season === +currentSeason);
  const allEpisodes = Array.from(
    new Set(displayData.map(d => d.episodeIndex))
  ).sort((a, b) => {
    const [sa, ea] = a.slice(1).split("E").map(Number);
    const [sb, eb] = b.slice(1).split("E").map(Number);
    return sa - sb || ea - eb;
  });

  const seasonGroups = d3.groups(allEpisodes, e => e.split("E")[0]);

  const characters = Array.from(new Set(displayData.map(d => d.character))).sort();
  const x = d3.scaleBand().domain(allEpisodes).range([0, width]).padding(0.2);
  const y = d3.scaleBand().domain(characters).range([0, height]).padding(0.1);

  // X Axis
  g.append("g")
  .attr("transform", `translate(0,${height})`)
  .call(d3.axisBottom(x).tickFormat(d => d))
  .selectAll("text")
  .style("text-anchor", "end")
  .style("font-size", "12px") // Larger font
  .attr("dx", "-0.8em")
  .attr("dy", "0.15em")
  .attr("transform", "rotate(-45)");

  // Y Axis - make text larger
  g.append("g")
  .call(d3.axisLeft(y))
  .selectAll("text")
  .style("font-size", "12px"); // Larger font

  // Background season bands
  seasonGroups.forEach(([season, eps], i) => {
    const xStart = x(eps[0]);
    const xEnd = x(eps[eps.length - 1]);
    const widthBand = xEnd - xStart + x.bandwidth();

    g.append("rect")
      .attr("x", xStart - 10)
      .attr("y", 0)
      .attr("width", widthBand + 20)
      .attr("height", height)
      .attr("fill", i % 2 === 0 ? "#f9f9f9" : "#e9e9e9")
      .lower();
  });


  seasonGroups.forEach(([season, eps]) => {
    const xMid = (x(eps[0]) + x(eps[eps.length - 1])) / 2;
    g.append("text")
      .attr("x", xMid)
      .attr("y", height + 80) 
      .attr("text-anchor", "middle")
      .style("font-size", "14px") // Larger font
      .style("font-weight", "bold")
      .style("fill", "black")
      .text(season);
  });

  // Circles
  g.selectAll("circle")
    .data(displayData)
    .join(
      enter => enter.append("circle")
        .attr("cx", d => (x(d.episodeIndex) ?? 0) + x.bandwidth() / 2)
        .attr("cy", d => y(d.character) + y.bandwidth() / 2)
        .attr("r", 0)
        .attr("fill", d => characterColors[d.character] || characterColors.default)
        .attr("opacity", 0.8)
        .on("mouseover", function (event, d) {
          d3.selectAll("circle").transition().duration(200).style("opacity", 0.3);
          d3.select(this).transition().duration(200)
            .attr("r", d => currentMetric === "lines" ? 
              Math.sqrt(d[currentMetric]) * 2 :  // Larger multiplier for lines
              Math.sqrt(d[currentMetric]) * 0.8) // Larger multiplier for words
            .attr("stroke", "grey")
            .attr("stroke-width", 2)
            .style("opacity", 0.8);
          d3.select("#tooltip")
            .style("display", "block")
            .html(`
              <strong>${d.character}</strong><br>
              Season: ${d.season}<br>
              Episode: ${d.episode.toString().padStart(2, '0')}<br>
              ${d[currentMetric] || 0} ${currentMetric}
            `);

        })
        .on("mousemove", function (event) {
          d3.select("#tooltip")
            .style("left", (event.pageX + 15) + "px")
            .style("top", (event.pageY - 30) + "px");
        })
        .on("mouseout", function () {
          d3.selectAll("circle").transition().duration(200).style("opacity", 0.8);
          d3.select(this).transition().duration(200)
            .attr("r", d => currentMetric === "lines" ? 
              Math.sqrt(d[currentMetric]) * 2 :  // Larger multiplier for lines
              Math.sqrt(d[currentMetric]) * 0.8) // Larger multiplier for words
            .attr("stroke", "none");
          d3.select("#tooltip").style("display", "none");
        })
        .transition()
        .duration(600)
        .attr("r", d => currentMetric === "lines" ? 
          Math.sqrt(d[currentMetric]) * 2 :  // Larger multiplier for lines
          Math.sqrt(d[currentMetric]) * 0.8), // Larger multiplier for words
      
      update => update,
      exit => exit.transition().duration(400).attr("r", 0).remove()
    );
}

d3.select("#replayBtn").on("click", () => {
  // Reset everything
  currentCharacter = "all";
  d3.select("#characterSelect").property("value", "all");

  currentSeason = "all";
  d3.select("#seasonSelect").property("value", "all");

  currentMetric = "words";
  d3.select("#metricSelect").property("value", "words"); 

  filterMajorOnly = false; 
  d3.select("#majorOnlyToggle").property("checked", false); // Uncheck toggle

  d3.select("#characterSearch").property("value", ""); // Clear search input

  renderChart(); // Re-render fresh
  switchView('timeline');

});



d3.select("#compareBtn").on("click", () => {
  const comparison = d3.rollups(dotData, v => {
    const chars = new Set(v.map(d => d.character));
    return {
      both: chars.has("Candace") && chars.has("Linda"),
      hasPerry: chars.has("Candace"),
      hasDoof: chars.has("Linda")
    };
  }, d => d.episodeIndex);

  const sharedEpisodes = new Set(
    comparison.filter(([_, v]) => v.both).map(([ep]) => ep)
  );

  d3.selectAll("circle")
    .attr("stroke", d => sharedEpisodes.has(d.episodeIndex) ? "#FF0" : null)
    .attr("stroke-width", d => sharedEpisodes.has(d.episodeIndex) ? 2 : null);
});

d3.select("#replayDuoBtn").on("click", () => {
  const char1 = d3.select("#char1").property("value");
  const char2 = d3.select("#char2").property("value");

  // Find shared episodes between the two characters
  const sharedEpisodes = new Set(
    dotData.filter(d => d.character === char1).map(d => d.episodeIndex)
      .filter(ep => dotData.some(d => d.character === char2 && d.episodeIndex === ep))
  );

  // Filter and sort just the dots we care about
  const replayDots = dotData.filter(d =>
    sharedEpisodes.has(d.episodeIndex) &&
    (d.character === char1 || d.character === char2)
  ).sort((a, b) => {
    const [sa, ea] = a.episodeIndex.slice(1).split("E").map(Number);
    const [sb, eb] = b.episodeIndex.slice(1).split("E").map(Number);
    return sa - sb || ea - eb;
  });

  // Reset all
  d3.selectAll(".dot-avatar, circle")
    .transition().duration(200)
    .attr("opacity", 0.05);

  let i = 0;
  const interval = setInterval(() => {
    if (i >= replayDots.length) {
      clearInterval(interval);
      return;
    }

    const d = replayDots[i];
    d3.selectAll(".dot-avatar, circle")
      .filter(cd => cd.character === d.character && cd.episodeIndex === d.episodeIndex)
      .transition().duration(300)
      .attr("opacity", 1);

    i++;
  }, 100);
});


let textAnalysisInitialized = false;

function switchView(view) {
  const views = ['timelineView', 'textAnalysisView', 'episodeGridView', 'barRaceView','networkView'];
  views.forEach(id => {
    document.getElementById(id).style.display = (id === view + 'View') ? 'block' : 'none';
  });

  if (view === "textAnalysis" && !textAnalysisInitialized) {
    initTextAnalysis();
    textAnalysisInitialized = true;
  }
  if (view === "timeline") {
    renderChart();
  }
  if (view === "episodeGrid") {
    initEpisodeGridView();
  }
  if (view === "barRace") {
    initBarRace();
  }
  if (view === "network") {
    loadNetworkData();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const bar = document.getElementById('overviewBar');
  const btn = document.getElementById('toggleOverview');

  btn.addEventListener('click', () => {
    if (bar.classList.toggle('hidden')) {
      btn.textContent = 'Show Overview ▼';
    } else {
      btn.textContent = 'Hide Overview ▲';
    }
  });

  // start closed
  bar.classList.add('hidden');
});

// Character data 
const charactersData = [
  {
    name: "Phineas Flynn",
    description: "The inventive and optimistic stepbrother of Ferb and Candace.",
    image: "images/characters/phineas.png",
    links: [
      { text: "Wikipedia", url: "https://en.wikipedia.org/wiki/Phineas_Flynn" },
      { text: "Disney Wiki", url: "https://disney.fandom.com/wiki/Phineas_Flynn" }
    ]
  },
  {
    name: "Ferb Fletcher",
    description: "Phineas's quiet but equally inventive British stepbrother.",
    image: "images/characters/ferb.png",
    links: [
      { text: "Wikipedia", url: "https://en.wikipedia.org/wiki/Ferb_Fletcher" },
      { text: "Disney Wiki", url: "https://disney.fandom.com/wiki/Ferb_Fletcher" }
    ]
  },
  {
    name: "Candace Flynn",
    description: "Phineas and Ferb's older sister who constantly tries to bust them.",
    image: "images/characters/candace.png",
    links: [
      { text: "Wikipedia", url: "https://en.wikipedia.org/wiki/Candace_Flynn" },
      { text: "Disney Wiki", url: "https://disney.fandom.com/wiki/Candace_Flynn" }
    ]
  },
  {
    name: "Perry the Platypus",
    description: "The Flynn-Fletcher family pet who is secretly a secret agent.",
    image: "images/characters/perry.png",
    links: [
      { text: "Wikipedia", url: "https://en.wikipedia.org/wiki/Perry_the_Platypus" },
      { text: "Disney Wiki", url: "https://disney.fandom.com/wiki/Perry_the_Platypus" }
    ]
  },
  {
    name: "Dr. Heinz Doofenshmirtz",
    description: "An evil scientist and Perry the Platypus's nemesis.",
    image: "images/characters/doofenshmirtz.png",
    links: [
      { text: "Wikipedia", url: "https://en.wikipedia.org/wiki/Dr._Doofenshmirtz" },
      { text: "Disney Wiki", url: "https://disney.fandom.com/wiki/Heinz_Doofenshmirtz" }
    ]
  },
  {
    name: "Isabella Garcia-Shapiro",
    description: "Leader of the Fireside Girls and Phineas's admirer.",
    image: "images/characters/isabella.png",
    links: [
      { text: "Wikipedia", url: "https://en.wikipedia.org/wiki/Isabella_Garcia-Shapiro" },
      { text: "Disney Wiki", url: "https://disney.fandom.com/wiki/Isabella_Garcia-Shapiro" }
    ]
  },
  {
    name: "Stacy Hirano",
    description: "The best friend of Candace Flynn and good friends with Jeremy and Jenny.",
    image: "images/characters/stacy.png",
    links: [
      { text: "Wikipedia", url: "https://phineasandferb.fandom.com/wiki/Stacy_Hirano" },
      { text: "Disney Wiki", url: "https://phineasandferb.fandom.com/wiki/Stacy_Hirano" }
    ]
  },
  {
    name: "Baljeet Tjinder",
    description: "Timid, yet intelligent Indian friend of Phineas Flynn and Ferb Fletcher",
    image: "images/characters/balijeet.png",
    links: [
      { text: "Wikipedia", url: "https://disney.fandom.com/wiki/Baljeet_Tjinder" },
      { text: "Disney Wiki", url: "https://disney.fandom.com/wiki/Baljeet_Tjinder" }
    ]
  },
  {
    name: "Buford Van Stomm",
    description: "Local bully with a high sense of rudeness, but is not exactly evil. ",
    image: "images/characters/buford.png",
    links: [
      { text: "Wikipedia", url: "https://disney.fandom.com/wiki/Buford_Van_Stomm" },
      { text: "Disney Wiki", url: "https://disney.fandom.com/wiki/Buford_Van_Stommo" }
    ]
  }
];

// Function to show character cards
function showCharacterCards() {
  const overlay = document.getElementById('characterOverlay');
  const characterGrid = document.querySelector('.character-grid');
  
  // Clear previous content
  characterGrid.innerHTML = '';
  
  charactersData.forEach(character => {
    const characterItem = document.createElement('div');
    characterItem.className = 'character-item';
    
    characterItem.innerHTML = `
      <img src="${character.image}" alt="${character.name}" class="character-image" 
           onerror="this.onerror=null;this.src='images/default-character.webp';">
      <div class="character-name">${character.name}</div>
      <div class="character-description">${character.description}</div>
      <div class="character-links">
        ${character.links.map(link => 
          `<a href="${link.url}" target="_blank" class="character-link">${link.text}</a>`
        ).join(' | ')}
      </div>
    `;
    
    characterGrid.appendChild(characterItem);
  });
  
  // Show the overlay
  overlay.style.display = 'flex';
}

// Function to hide character cards
function hideCharacterCards() {
  document.getElementById('characterOverlay').style.display = 'none';
}

function setupCharacterButton() {
  document.getElementById('showCharacters').addEventListener('click', showCharacterCards);
  document.querySelector('.close-character-card').addEventListener('click', hideCharacterCards);
  document.getElementById('characterOverlay').addEventListener('click', (e) => {
    if (e.target === document.getElementById('characterOverlay')) {
      hideCharacterCards();
    }
  });
}

// Set up the character button
setupCharacterButton();


let barRaceData = [];
let currentFrame = 0;
let raceInterval;
let isPlaying = false;

function initBarRace() {
  // Prepare cumulative data - accumulate totals up to each episode
  const characterTotals = new Map();
  barRaceData = [];
  
  // Sort all episodes chronologically
  const sortedEpisodes = [...dotData]
    .sort((a, b) => a.season - b.season || a.episode - b.episode);
  
  // Process each episode to build cumulative totals
  sortedEpisodes.forEach(episode => {
    const { character, season, episode: epNum, episodeIndex, words, lines } = episode;
    const value = currentMetric === "words" ? words : lines;
    
    // Update cumulative totals for this character
    const currentTotal = characterTotals.get(character) || 0;
    characterTotals.set(character, currentTotal + value);
    
    // Only record data at the end of each episode
    if (!barRaceData.some(d => d.episodeIndex === episodeIndex)) {
      barRaceData.push({
        season,
        episode: epNum,
        episodeIndex,
        characters: Array.from(characterTotals.entries())
          .map(([name, total]) => ({ name, value: total }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 10) // Top 10 characters
      });
    }
  });

  // Set up the chart container as a flex column
  const container = d3.select("#barRaceChart")
    .style("display", "flex")
    .style("flex-direction", "column")
    .style("position", "relative");  
  
  container.selectAll("*").remove();
  

  d3.select("#playRace").on("click", playRace);
  d3.select("#pauseRace").on("click", pauseRace);
  d3.select("#resetRace").on("click", resetRace);

  // Show first frame
  updateBarRace(0);
}

function updateBarRace(frameIndex) {
  const frameData = barRaceData[frameIndex];
  if (!frameData) return;

  // Update time display
  d3.select("#currentSeason").text(frameData.season);
  d3.select("#currentEpisode").text(String(frameData.episode).padStart(2, "0"));

  const container = d3.select("#barRaceChart")
    .style("display", "flex")
    .style("flex-direction", "column");

  const maxVal = d3.max(frameData.characters, d => d.value);
  const widthScale = d3.scaleLinear()
    .domain([0, maxVal])
    .range([0, container.node().clientWidth - 200]);

  // DATA JOIN
  const bars = container.selectAll(".bar-race-bar")
    .data(frameData.characters, d => d.name);

  // EXIT
  bars.exit()
    .transition()
    .duration(300)
    .style("opacity", 0)
    .style("width", "0px")
   .remove();

  // ENTER
  const barsEnter = bars.enter()
    .append("div")
    .attr("class", "bar-race-bar")
    .style("position", "absolute")
    .style("height", "30px")
    .style("margin", "5px 0")
    .style("background", d => characterColors[d.name] || characterColors.default)
    .style("width", "0px") // Start at 0 width
    .style("left", "0")
    .style("top", (d, i) => `${i * 35}px`)
    .style("opacity", 0)
    .style("display", "flex")
    .style("align-items", "center")
    .style("border-radius", "4px");
  barsEnter.append("span")
      .attr("class", "character-name")
      .text(d => d.name)
      .style("margin-right", "8px");

  barsEnter.append("span")
      .attr("class", "value")
      .text(d => d.value)
      .style("position", "absolute")
      .style("left", "100%")
      .style("margin-left", "8px")
      .style("top", "50%")
      .style("transform", "translateY(-50%)");

  const barsAll = barsEnter.merge(bars);

  barsAll.select(".character-name").text(d => d.name);
  barsAll.select(".value").text(d => d.value);

  // clear any ongoing transforms
  barsAll.interrupt().style("transform", "translateY(0px)");

  // MERGE enter and update selections
  const barsUpdate = barsEnter.merge(bars);

  // Update all elements
  const speed = parseInt(d3.select("#speedControl").property("value"), 10);

  // Calculate new positions based on sorted data
  const sortedData = frameData.characters.sort((a, b) => b.value - a.value);
  const yPositions = {};
  sortedData.forEach((d, i) => {
    yPositions[d.name] = i * 35;
  });

  // Animate to new positions (vertical movement and width change)
  barsUpdate.transition()
    .duration(speed)
    .ease(d3.easeCubic)
    .style("opacity", 1)
    .style("width", d => `${widthScale(d.value)}px`)  // Correct width scaling
    .style("top", d => `${yPositions[d.name]}px`)  // Correct positioning based on rank
    .style("z-index", d => sortedData.findIndex(c => c.name === d.name));

  // Update text values
  barsUpdate.select(".character-name").text(d => d.name);
  barsUpdate.select(".value").text(d => d.value);
}


function pauseRace() {
  clearInterval(raceInterval);
  isPlaying = false;
}

function resetRace() {
  pauseRace();
  currentFrame = 0;
  updateBarRace(currentFrame);
}

function playRace() {
  if (isPlaying) return;
  isPlaying = true;
  const speed = parseInt(d3.select("#speedControl").property("value"), 10);
  
  raceInterval = setInterval(() => {
    currentFrame = (currentFrame + 1) % barRaceData.length;
    updateBarRace(currentFrame);
    if (currentFrame === barRaceData.length - 1) pauseRace();
  }, speed);
}

const visibleCharacters = filterMajorOnly ? 
  Array.from(majorCharacters) : 
  Array.from(new Set(dotData.map(d => d.character)));
