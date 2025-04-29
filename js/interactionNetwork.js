const networkFilePaths = [
  "data/phineas_and_ferb_transcripts_1.csv",
  "data/phineas_and_ferb_transcripts_2.csv",
  "data/phineas_and_ferb_transcripts_3.csv",
  "data/phineas_and_ferb_transcripts_4.csv"
];

let lockedCharacter = null;
let majorNetworkThreshold = 300;
let allNetworkLines = [];
let majorNetworkCharacters = new Set();
let characterChoices = null;
let currentColorTheme = d3.interpolateBlues;
let globalInteractionMap = new Map();
const BAD_SPEAKERS = new Set(["(song", "crowd", "background", "kids", "man", "woman","(cut to", "all","man #2"]);


const networkColorMap = {
  Phineas: "#e6194b",
  Ferb: "#3cb44b",
  Candace: "#f58231",
  Perry: "#46f0f0",
  Doofenshmirtz: "#911eb4",
  Isabella: "#fabebe",
  Buford: "#808000",
  Baljeet: "#000075"
};

const STATIC_MAJOR_CHARACTERS = new Set([
  "phineas",
  "ferb",
  "candace",
  "perry",
  "doofenshmirtz",
  "isabella",
  "baljeet",
  "buford",
  "stacy",
  "jeremy",
  "vanessa",
  "monogram",
  "carl"
]);


// Load Data
document.addEventListener("DOMContentLoaded", () => {
  loadNetworkData();
});

async function loadNetworkData() {
  const BAD_SPEAKERS = new Set(["(song", "crowd", "background", "kids", "man", "woman","(cut to", "All","man #2"]);

  const raw = await Promise.all(networkFilePaths.map(path => d3.csv(path)));
  
  allNetworkLines = raw.flat()
    .map(d => ({
      season: +d.season,
      episode: +d.episode,
      speaker: d.speaker?.replace(/\(.*?\)/g, "").trim().toLowerCase()
    }))
    .filter(d => 
      d.season && 
      d.episode && 
      d.speaker && 
      !BAD_SPEAKERS.has(d.speaker) // Important: filter here
    );

  d3.select("#networkSeasonSelect").on("change", () => { populateCharacterMultiSelect(); renderNetwork(); });
  d3.select("#showMajorOnlyNetwork").on("change", () => { populateCharacterMultiSelect(); renderNetwork(); });

  d3.select("#networkSeasonSelect").property("value", "1");
  d3.select("#showMajorOnlyNetwork").property("checked", true);

  populateCharacterMultiSelect();
  renderNetwork();
}


function populateCharacterMultiSelect() {
  const majorOnly = d3.select("#showMajorOnlyNetwork").property("checked");
  const selectedSeason = d3.select("#networkSeasonSelect").property("value");

  let filteredLines = allNetworkLines;
  if (selectedSeason !== "all") {
    filteredLines = allNetworkLines.filter(d => d.season == +selectedSeason);
  }

  let characters = Array.from(new Set(filteredLines.map(d => d.speaker))).sort();
  if (majorOnly) characters = characters.filter(c => STATIC_MAJOR_CHARACTERS.has(c.toLowerCase()));



  const select = d3.select("#characterMultiSelect");
  select.selectAll("option").remove();

  characters.forEach(c => {
    select.append("option").attr("value", c).text(capitalize(c));
  });

  if (characterChoices) characterChoices.destroy();

  characterChoices = new Choices("#characterMultiSelect", {
    removeItemButton: true,
    shouldSort: false,
    placeholder: true,
    placeholderValue: `${characters.length} characters available`,
    searchEnabled: true,
    searchPlaceholderValue: "Type to search character..."
  });

  document.getElementById("characterMultiSelect").addEventListener("change", renderNetwork);
}

let hoveredCharacter = null;

function updateHighlight() {
  rects.transition().duration(200)
    .attr("opacity", d => {
      if (lockedCharacter) {
        return (d.a === lockedCharacter || d.b === lockedCharacter) ? 1 : 0.1;
      } else if (hoveredCharacter) {
        return (d.a === hoveredCharacter || d.b === hoveredCharacter) ? 1 : 0.2;
      }
      return 1;
    });

  xAxis
    .style("fill", d => d === lockedCharacter ? "#e6194b" : (d === hoveredCharacter ? "#0077b6" : "black"))
    .style("font-weight", d => (d === lockedCharacter || d === hoveredCharacter) ? "bold" : "normal");

  yAxis
    .style("fill", d => d === lockedCharacter ? "#e6194b" : (d === hoveredCharacter ? "#0077b6" : "black"))
    .style("font-weight", d => (d === lockedCharacter || d === hoveredCharacter) ? "bold" : "normal");
}

function renderNetwork() {
  const selectedSeason = d3.select("#networkSeasonSelect").property("value");
  const majorOnly = d3.select("#showMajorOnlyNetwork").property("checked");
  const selectedCharacters = Array.from(d3.select("#characterMultiSelect").property("selectedOptions")).map(opt => opt.value);

  if (lockedCharacter) {
    selectedCharacters.length = 0;
    selectedCharacters.push(lockedCharacter);
  }

  const episodeGroups = d3.groups(allNetworkLines, d => `S${d.season}E${d.episode}`);
  const interactionMap = new Map();

  episodeGroups.forEach(([epKey, lines]) => {
    if (selectedSeason !== "all" && !epKey.startsWith(`S${selectedSeason}`)) return;
    
    let characters = Array.from(
      new Set(
        lines.map(d => d.speaker).filter(s => !BAD_SPEAKERS.has(s))  // << important
      )
    );

    if (majorOnly) {
      characters = characters.filter(c => STATIC_MAJOR_CHARACTERS.has(c.toLowerCase()));
    }

    for (let i = 0; i < characters.length; i++) {
      for (let j = i + 1; j < characters.length; j++) {
        const [a, b] = [characters[i], characters[j]].sort();
        const key = `${a}|${b}`;
        interactionMap.set(key, (interactionMap.get(key) || 0) + 1);
      }
    }
  });

  globalInteractionMap = interactionMap;

  let allCharacters = Array.from(
    new Set(
      [...interactionMap.keys()]
        .flatMap(d => d.split("|"))
        .filter(c => !BAD_SPEAKERS.has(c))  
    )
  );
  
  if (majorOnly) {
    allCharacters = allCharacters.filter(c => STATIC_MAJOR_CHARACTERS.has(c.toLowerCase()));
  }

  let charactersToShow = [];

  if (selectedCharacters.length > 0) {
    const partnerCounts = {};
    interactionMap.forEach((count, key) => {
      const [a, b] = key.split("|");
      selectedCharacters.forEach(sel => {
        if (a === sel) partnerCounts[b] = (partnerCounts[b] || 0) + count;
        if (b === sel) partnerCounts[a] = (partnerCounts[a] || 0) + count;
      });
    });

    const topPartners = Object.entries(partnerCounts)
      .sort((a, b) => b[1] - a[1])
      .map(d => d[0])
      .filter(c => !selectedCharacters.includes(c))
      .slice(0, 20 - selectedCharacters.length);

    charactersToShow = Array.from(new Set([...selectedCharacters, ...topPartners]));
  } else {
    const interactionCounts = {};
    interactionMap.forEach((count, key) => {
      const [a, b] = key.split("|");
      interactionCounts[a] = (interactionCounts[a] || 0) + count;
      interactionCounts[b] = (interactionCounts[b] || 0) + count;
    });

    charactersToShow = allCharacters
      .sort((a, b) => (interactionCounts[b] || 0) - (interactionCounts[a] || 0))
      .slice(0, 20);
  }

  const filteredInteractionMap = new Map();
  interactionMap.forEach((count, key) => {
    const [a, b] = key.split("|");
    if (charactersToShow.includes(a) && charactersToShow.includes(b)) {
      filteredInteractionMap.set(key, count);
    }
  });

  drawMatrixView(charactersToShow, filteredInteractionMap);

  // Optionally if you have season grouping logic
  // const seasonGroups = groupEpisodesBySeason(interactionMap);
  // createCollapsiblePanel(seasonGroups);
}


function drawMatrixView(characters, interactionMap) {
  d3.select("#interactionNetwork").selectAll("*").remove();

  const numCharacters = characters.length;
  const cellSize = Math.max(20, Math.min(40, (window.innerWidth - 300) / numCharacters));
  const size = cellSize * numCharacters;
  const margin = { top: 100, right: 20, bottom: 70, left: 100 };

  const svg = d3.select("#interactionNetwork")
    .append("svg")
    .attr("width", size + margin.left + margin.right)
    .attr("height", size + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleBand().domain(characters).range([0, size]);
  const y = d3.scaleBand().domain(characters).range([0, size]);

  const maxInteraction = d3.max(Array.from(interactionMap.values())) || 1;
  const color = d3.scaleSequential(currentColorTheme).domain([0, maxInteraction]);


  const tooltip = d3.select("#matrixTooltip");

  const rects = svg.selectAll("rect")
    .data(characters.flatMap(a => characters.map(b => ({ a, b }))), d => `${d.a}|${d.b}`)
    .join("rect")
    .attr("x", d => x(d.a))
    .attr("y", d => y(d.b))
    .attr("width", cellSize)
    .attr("height", cellSize)
    .attr("fill", d => {
      const key = [d.a, d.b].sort().join("|");
      return interactionMap.has(key) ? color(interactionMap.get(key)) : "#f0f0f0";
    })
     .on("mouseover", (event, d) => {
      const key = [d.a, d.b].sort().join("|");
      const value = interactionMap.get(key) || 0;
      tooltip.style("display", "block")
        .html(`<strong>${capitalize(d.a)} & ${capitalize(d.b)}</strong><br>Interactions: ${value}`)
        .style("left", (event.pageX + 15) + "px")
        .style("top", (event.pageY - 20) + "px");
    })
    .on("mouseout", () => tooltip.style("display", "none"))
    .on("click", (event, d) => showInteractionDetails(d.a, d.b));

  // X-axis label formatting
const xAxis = svg.append("g")
.call(d3.axisTop(x).tickFormat(capitalize))
.selectAll("text")
.style("text-anchor", "start")
.style("font-size", "12px")
.attr("transform", "rotate(-45)")  // Rotate labels by 45 degrees
.style("font-weight", "bold")      // Make text bold
.style("fill", "black")            // Set text color
.style("cursor", "pointer")
.on("click", (event, d) => {
  lockedCharacter = (lockedCharacter === d) ? null : d;
  renderNetwork();
})
.on("mouseover", (event, d) => {
  hoveredCharacter = d;
  updateHighlight();
})
.on("mouseout", () => {
  hoveredCharacter = null;
  updateHighlight();
});

// Y-axis label formatting
const yAxis = svg.append("g")
.call(d3.axisLeft(y).tickFormat(capitalize))
.selectAll("text")
.style("cursor", "pointer")
.style("font-size", "12px")
.style("fill", "black")
.style("font-weight", "bold")
.style("padding", "5px")
.on("click", (event, d) => {
  lockedCharacter = (lockedCharacter === d) ? null : d;
  renderNetwork();
})
.on("mouseover", (event, d) => {
  hoveredCharacter = d;
  updateHighlight();
})
.on("mouseout", () => {
  hoveredCharacter = null;
  updateHighlight();
});


  function updateHighlight() {
    rects.transition().duration(200)
      .attr("opacity", d => {
        if (lockedCharacter) {
          return (d.a === lockedCharacter || d.b === lockedCharacter) ? 1 : 0.1;
        } else if (hoveredCharacter) {
          return (d.a === hoveredCharacter || d.b === hoveredCharacter) ? 1 : 0.2;
        }
        return 1;
      });

    xAxis
      .style("fill", d => d === lockedCharacter ? "#e6194b" : (d === hoveredCharacter ? "#0077b6" : "black"))
      .style("font-weight", d => (d === lockedCharacter || d === hoveredCharacter) ? "bold" : "normal");

    yAxis
      .style("fill", d => d === lockedCharacter ? "#e6194b" : (d === hoveredCharacter ? "#0077b6" : "black"))
      .style("font-weight", d => (d === lockedCharacter || d === hoveredCharacter) ? "bold" : "normal");
  }

  updateHighlight();

  drawLegend(svg, size, margin, color, maxInteraction);
}


function showInteractionDetails(charA, charB) {
  const selectedSeason = d3.select("#networkSeasonSelect").property("value");
  const detailDiv = d3.select("#interactionDetail");

  const episodeGroups = d3.groups(allNetworkLines, d => `S${d.season}E${d.episode}`);

  const episodeList = [];
  const interactionCount = { 1: 0, 2: 0, 3: 0, 4: 0 };

  episodeGroups.forEach(([epKey, lines]) => {
    const seasonNumber = +epKey.match(/^S(\d+)/)[1];
    
    // Check if selected season matches or if "All Seasons" is selected
    if (selectedSeason !== "all" && seasonNumber != selectedSeason) return;
    const speakers = new Set(lines.map(d => d.speaker));
    if (speakers.has(charA) && speakers.has(charB)) {
       episodeList.push(epKey);
      interactionCount[seasonNumber]++;
    }
  });

  if (selectedSeason === "all") {
    const totalInteractions =
      (interactionCount[1] || 0) +
      (interactionCount[2] || 0) +
      (interactionCount[3] || 0) +
      (interactionCount[4] || 0);

    detailDiv.html(`
      <strong>${capitalize(charA)} & ${capitalize(charB)}</strong><br><br>
      Season 1: ${interactionCount[1] || 0} interactions<br>
      Season 2: ${interactionCount[2] || 0} interactions<br>
      Season 3: ${interactionCount[3] || 0} interactions<br>
      Season 4: ${interactionCount[4] || 0} interactions<br><br>
      <strong style="color: #e6194b;">Total Interactions: ${totalInteractions}</strong>
    `);
  } else {
    detailDiv.html(`
      <strong>${capitalize(charA)} & ${capitalize(charB)}</strong><br><br>
      Season ${selectedSeason}: ${interactionCount[selectedSeason] || 0} interactions<br><br>
      ${episodeList.length > 0 ? `
      <u>Episodes:</u><br>
     <div style="line-height: 1.5; white-space: normal;">
  ${episodeList.sort((a, b) => {
    const getEp = ep => parseInt(ep.split('E')[1]);
    return getEp(a) - getEp(b);
  }).map(ep => `<span class="badge badge-${selectedSeason}">${ep}</span>`).join(" ")}
</div>
    ` : ''}
    `);
  }
}





// // Sample function to create the collapsible/accordion panel in the right details section
// function createCollapsiblePanel(ranges) {
//   const panel = d3.select("#interactionDetail");

//   // Create a collapsible section for each season group
//   Object.keys(ranges).forEach(range => {
//     const group = ranges[range];

//     // Create a collapsible button for each season range
//     const groupSection = panel.append("div")
//       .attr("class", "season-group");

//     // Create a collapsible button for this group (e.g., Season 1)
//     groupSection.append("button")
//       .attr("class", "collapsible")
//       .text(range)  // Range name (Season 1, Season 2, etc.)
//       .on("click", function () {
//         const content = d3.select(this).next();
//         const isCollapsed = content.style("display") === "none";
//         content.style("display", isCollapsed ? "block" : "none");
//         d3.select(this).classed("collapsed", !isCollapsed); // Toggle the collapsed class
//       });

//     // Create the list of episodes inside the collapsible section
//     const episodeList = groupSection.append("div")
//       .attr("class", "content");

//     group.forEach(episode => {
//       episodeList.append("div").text(episode);  // Add episode to list
//     });
//   });
// }

// // Group Episodes by Season or Interaction Ranges
// function groupEpisodesBySeason(interactionMap) {
//   const seasonGroups = {};

//   interactionMap.forEach((count, key) => {
//     const season = parseInt(key.split("E")[0].replace("S", ""));  // Extract season from the episode string
//     if (!seasonGroups[season]) seasonGroups[season] = [];
//     seasonGroups[season].push(key);  // Add episode to the correct season group
//   });

//   return seasonGroups;
// }





function drawLegend(svg, size, margin, color, maxInteraction) {
  const legendWidth = 200;
  const legendHeight = 12;
  const legendMarginTop = 30;

  const defs = svg.append("defs");
  const linearGradient = defs.append("linearGradient").attr("id", "legend-gradient");

  linearGradient.selectAll("stop")
    .data([
      { offset: "0%", color: color(0) },
      { offset: "100%", color: color(maxInteraction) }
    ])
    .enter().append("stop")
    .attr("offset", d => d.offset)
    .attr("stop-color", d => d.color);

  svg.append("rect")
    .attr("x", (size - legendWidth) / 2)
    .attr("y", size + legendMarginTop)
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", "url(#legend-gradient)")
    .attr("stroke", "#555");

  const legendScale = d3.scaleLinear()
    .domain([0, maxInteraction])
    .range([(size - legendWidth) / 2, (size + legendWidth) / 2]);

  svg.append("g")
    .attr("transform", `translate(0,${size + legendMarginTop + legendHeight})`)
    .call(d3.axisBottom(legendScale).ticks(5).tickFormat(d3.format("d")))
    .selectAll("text")
    .style("font-size", "10px");

  // Add the text indicating that the legend is based on interactions
  svg.append("text")
    .attr("x", (size) / 2)  // Center the text
    .attr("y", size + legendMarginTop + legendHeight + 28)  // Increase y-value to avoid overlap
    .attr("text-anchor", "middle")  // Align the text in the center
    .style("font-size", "12px")  // Adjust font size
    .style("fill", "black")  // Text color
    .text("Based on interactions");  // Text content
}



function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function changeColorTheme(theme) {
  if (theme === "blue") currentColorTheme = d3.interpolateBlues;
  if (theme === "green") currentColorTheme = d3.interpolateGreens;
  if (theme === "red") currentColorTheme = d3.interpolateReds;
  renderNetwork();
}