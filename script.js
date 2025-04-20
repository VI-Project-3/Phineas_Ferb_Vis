const characterColors = {
  Phineas: "#e6194b",
  Ferb: "#3cb44b",
  Candace: "#f58231",
  Perry: "#46f0f0",
  Doofenshmirtz: "#911eb4",
  Isabella: "#fabebe",
  Buford: "#808000",
  Baljeet: "#000075",
  default: "#4B8DF8"
};
const characterImages = {
  Phineas: "images/Phineas.png",
  // Ferb: "assets/avatars/Ferb.png",
  // Candace: "assets/avatars/Candace.png",
  // Perry: "assets/avatars/Perry.png",
  // Doofenshmirtz: "assets/avatars/Doofenshmirtz.png",
  // Isabella: "assets/avatars/Isabella.png",
  // Buford: "assets/avatars/Buford.png",
  // Baljeet: "assets/avatars/Baljeet.png"
};


const svg = d3.select("#timelineChart");
const margin = { top: 50, right: 30, bottom: 60, left: 150 };
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

Promise.all(filePaths.map(path => d3.csv(path))).then(all => {
  let transcripts = all.flat();

  // Parse and clean data
  transcripts.forEach(d => {
    d.season = parseInt(d.season);
    d.episode = parseInt(d.episode);

    if (isNaN(d.season) || isNaN(d.episode)) {
      d._skip = true;
    }

    d.words = d.line ? d.line.trim().split(/\s+/).length : 0;
    d.character = d.speaker?.replace(/\(.*?\)/g, "").trim();
  });

  transcripts = transcripts.filter(d => !d._skip);

  const totals = d3.rollups(transcripts, v => d3.sum(v, d => d.words), d => d.character);
  majorCharacters = new Set(totals.filter(d => d[1] > 3000).map(d => d[0]));

  // ✅ Grouped cleanly with proper key
  const grouped = d3.group(transcripts, d =>
    `${d.character}|${d.season}|${d.episode}`
  );

  dotData = Array.from(grouped, ([key, values]) => {
    const [character, season, episode] = key.split("|");
    const words = d3.sum(values, d => d.words);
    const lines = values.length;
    const title = values[0].title || "(Unknown)";
    return {
      character,
      season: +season,
      episode: +episode,
      episodeLabel: `S${season}E${episode.toString().padStart(2, '0')}`,
      episodeIndex: `S${season}E${episode.toString().padStart(2, '0')}`,
      title,
      words,
      lines
    };
  });

  populateDropdowns(transcripts);
  renderChart();
});

function populateDropdowns(transcripts) {

  const allChars = Array.from(new Set(transcripts.map(d => d.character))).sort();

["#char1", "#char2"].forEach(selectId => {
  const sel = d3.select(selectId);
  allChars.forEach(c => {
    sel.append("option").attr("value", c).text(c);
  });
});


  const allCharacters = Array.from(new Set(transcripts.map(d => d.character))).sort();
  const allSeasons = Array.from(new Set(transcripts.map(d => d.season))).sort((a, b) => a - b);

  const charSelect = d3.select("#characterSelect");
  allCharacters.forEach(c => {
    charSelect.append("option").attr("value", c).text(c);
  });
  charSelect.on("change", function () {
    currentCharacter = this.value;
    renderChart();
  });

  const seasonSelect = d3.select("#seasonSelect");
  allSeasons.forEach(s => {
    seasonSelect.append("option").attr("value", s).text(`Season ${s}`);
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

  d3.select("#characterSearch").on("input", function () {
    const query = this.value.toLowerCase();
    const match = Array.from(majorCharacters).find(c => c.toLowerCase().includes(query));
    if (match) {
      currentCharacter = match;
      d3.select("#characterSelect").property("value", match);
    } else {
      currentCharacter = "all";
      d3.select("#characterSelect").property("value", "all");
    }
    renderChart();
  });

  const legend = d3.select("#legend");
  legend.html("<strong>Legend:</strong>");
  majorCharacters.forEach(character => {
    const color = characterColors[character] || characterColors.default;
    const item = legend.append("div")
      .style("display", "flex")
      .style("align-items", "center")
      .style("margin-right", "12px");

    // item.append("div")
    //   .style("width", "12px")
    //   .style("height", "12px")
    //   .style("background-color", color)
    //   .style("margin-right", "6px")
    //   .style("border-radius", "3px");

    // item.append("span").text(character);

    item.append("img")
      .attr("src", characterImages[character] || "images/default.png")
      .style("width", "28px")
      .style("height", "28px")
      .style("border-radius", "50%")
      .style("margin-right", "8px")
      .style("object-fit", "cover");

    item.append("span").text(character);

  });
}

function renderChart() {
  g.selectAll("*").remove();

  let displayData = dotData;

  if (filterMajorOnly) {
    displayData = displayData.filter(d => majorCharacters.has(d.character));
  }
  if (currentCharacter !== "all") {
    displayData = displayData.filter(d => d.character === currentCharacter);
  }
  if (currentSeason !== "all") {
    displayData = displayData.filter(d => d.season === +currentSeason);
  }

  // ✅ Properly sorted episodes based on S1E01-style
  const episodes = Array.from(
    new Set(displayData.map(d => d.episodeIndex))
  ).sort((a, b) => {
    const [sa, ea] = a.slice(1).split("E").map(Number);
    const [sb, eb] = b.slice(1).split("E").map(Number);
    return sa - sb || ea - eb;
  });

  // Group episodes by season
const seasonGroups = d3.groups(episodes, e => e.split("E")[0]); // "S1", "S2", ...


  const characters = Array.from(new Set(displayData.map(d => d.character))).sort();

  const x = d3.scalePoint().domain(episodes).range([0, width]);
  const y = d3.scaleBand().domain(characters).range([0, height]).padding(0.1);

  g.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).tickFormat(d => d))
    .selectAll("text")
    .style("text-anchor", "end")
    .attr("dx", "-0.8em")
    .attr("dy", "0.15em")
    .attr("transform", "rotate(-45)");

  g.append("g").call(d3.axisLeft(y));

  // Add season labels below the axis
seasonGroups.forEach(([season, eps]) => {
  const xMid = (x(eps[0]) + x(eps[eps.length - 1])) / 2;
  g.append("text")
    .attr("x", xMid)
    .attr("y", height + 50)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .style("font-weight", "bold")
    .text(season);
});

  // Add background bands for each season
seasonGroups.forEach(([season, eps], i) => {
  const xStart = x(eps[0]);
  const xEnd = x(eps[eps.length - 1]);
  const widthBand = xEnd - xStart;

  g.append("rect")
    .attr("x", xStart - 10)
    .attr("y", 0)
    .attr("width", widthBand + 20)
    .attr("height", height)
    .attr("fill", i % 2 === 0 ? "#f9f9f9" : "#e9e9e9")
    .lower(); // Send it behind everything
});


  g.selectAll("circle")
    .data(displayData, d => `${d.character}-${d.episodeIndex}`)
    .join(
      enter => enter.append("circle")
        .attr("cx", d => x(d.episodeIndex))
        .attr("cy", d => y(d.character) + y.bandwidth() / 2)
        .attr("r", 0)
        .attr("fill", d => characterColors[d.character] || characterColors.default)
        .attr("opacity", 0.8)
        .on("mouseover", function (event, d) {
          d3.select("#tooltip")
            .style("display", "block")
            .html(`
              <strong>${d.character}</strong><br>
              S${d.season}E${d.episode.toString().padStart(2, '0')} • ${d[currentMetric] || 0} ${currentMetric}
            `);
        })
        .on("mousemove", function (event) {
          d3.select("#tooltip")
            .style("left", (event.pageX + 15) + "px")
            .style("top", (event.pageY - 30) + "px");
        })
        .on("mouseout", () => {
          d3.select("#tooltip").style("display", "none");
        })
        .transition()
        .duration(600)
        .attr("r", d => Math.sqrt(d[currentMetric]) * 0.5),

      update => update,
      exit => exit.transition().duration(400).attr("r", 0).remove()
    );
  


}

// function renderChart() {
//   g.selectAll("*").remove();

//   let displayData = dotData;

//   if (filterMajorOnly) {
//     displayData = displayData.filter(d => majorCharacters.has(d.character));
//   }
//   if (currentCharacter !== "all") {
//     displayData = displayData.filter(d => d.character === currentCharacter);
//   }
//   if (currentSeason !== "all") {
//     displayData = displayData.filter(d => d.season === +currentSeason);
//   }

//   const episodes = Array.from(
//     new Set(displayData.map(d => d.episodeIndex))
//   ).sort((a, b) => {
//     const [sa, ea] = a.slice(1).split("E").map(Number);
//     const [sb, eb] = b.slice(1).split("E").map(Number);
//     return sa - sb || ea - eb;
//   });

//   const seasonGroups = d3.groups(episodes, e => e.split("E")[0]);
//   const characters = Array.from(new Set(displayData.map(d => d.character))).sort();

//   const x = d3.scalePoint().domain(episodes).range([0, width]).padding(0.5);
//   const y = d3.scaleBand().domain(characters).range([0, height]).padding(0.1);

//   // X-axis (will zoom)
//   const xAxisGroup = g.append("g")
//     .attr("class", "x-axis")
//     .attr("transform", `translate(0,${height})`)
//     .call(d3.axisBottom(x).tickFormat(d => d));

//   xAxisGroup.selectAll("text")
//     .style("text-anchor", "end")
//     .attr("dx", "-0.8em")
//     .attr("dy", "0.15em")
//     .attr("transform", "rotate(-45)");

//   // Y-axis (static)
//   g.append("g")
//     .attr("class", "y-axis")
//     .call(d3.axisLeft(y));

//   // Layer to zoom
//   const zoomLayer = g.append("g").attr("class", "zoomLayer");

//   // Background bands
//   const bands = zoomLayer.selectAll("rect")
//     .data(seasonGroups)
//     .enter()
//     .append("rect")
//     .attr("x", d => x(d[1][0]) - 10)
//     .attr("y", 0)
//     .attr("width", d => x(d[1][d[1].length - 1]) - x(d[1][0]) + 20)
//     .attr("height", height)
//     .attr("fill", (d, i) => i % 2 === 0 ? "#f9f9f9" : "#e9e9e9");

//   // Circles
//   const dots = zoomLayer.selectAll("circle")
//     .data(displayData)
//     .enter()
//     .append("circle")
//     .attr("cx", d => x(d.episodeIndex))
//     .attr("cy", d => y(d.character) + y.bandwidth() / 2)
//     .attr("r", d => Math.sqrt(d[currentMetric]) * 0.5)
//     .attr("fill", d => characterColors[d.character] || characterColors.default)
//     .attr("opacity", 0.8)
//     .on("mouseover", function (event, d) {
//       d3.select("#tooltip")
//         .style("display", "block")
//         .html(`
//           <strong>${d.character}</strong><br>
//           S${d.season}E${d.episode.toString().padStart(2, '0')} • ${d[currentMetric] || 0} ${currentMetric}
//         `);
//     })
//     .on("mousemove", function (event) {
//       d3.select("#tooltip")
//         .style("left", (event.pageX + 15) + "px")
//         .style("top", (event.pageY - 30) + "px");
//     })
//     .on("mouseout", () => {
//       d3.select("#tooltip").style("display", "none");
//     });

//   // Season labels
//   const seasonLabels = zoomLayer.selectAll("text.season")
//     .data(seasonGroups)
//     .enter()
//     .append("text")
//     .attr("class", "season")
//     .attr("x", d => {
//       const start = x(d[1][0]);
//       const end = x(d[1][d[1].length - 1]);
//       return (start + end) / 2;
//     })
//     .attr("y", height + 50)
//     .attr("text-anchor", "middle")
//     .style("font-size", "12px")
//     .style("font-weight", "bold")
//     .text(d => d[0]);

//   // ✅ Zoom: scale x-axis and chart layer only
//   const zoom = d3.zoom()
//     .scaleExtent([1, 5])
//     .on("zoom", function (event) {
//       const transform = event.transform;
//       const newX = transform.rescaleX(x);

//       // Update circles
//       dots.attr("cx", d => newX(d.episodeIndex));

//       // Update background bands
//       bands
//         .attr("x", d => newX(d[1][0]) - 10)
//         .attr("width", d => newX(d[1][d[1].length - 1]) - newX(d[1][0]) + 20);

//       // Update season labels
//       seasonLabels
//         .attr("x", d => {
//           const start = newX(d[1][0]);
//           const end = newX(d[1][d[1].length - 1]);
//           return (start + end) / 2;
//         });

//       // Update x-axis
//       xAxisGroup.call(d3.axisBottom(newX))
//         .selectAll("text")
//         .style("text-anchor", "end")
//         .attr("dx", "-0.8em")
//         .attr("dy", "0.15em")
//         .attr("transform", "rotate(-45)");
//     });

//   svg.call(zoom);
// }

// Replay button
d3.select("#replayBtn").on("click", () => {
  let index = 0;
  const sortedDots = dotData
    .filter(d => (currentSeason === "all" || d.season === +currentSeason) &&
                 (currentCharacter === "all" || d.character === currentCharacter) &&
                 (!filterMajorOnly || majorCharacters.has(d.character)))
    .sort((a, b) => {
      const sa = +a.season, sb = +b.season;
      const ea = +a.episode, eb = +b.episode;
      return sa - sb || ea - eb;
    });

  const visibleCircles = d3.selectAll("circle").attr("opacity", 0.05);

  const interval = setInterval(() => {
    if (index >= sortedDots.length) {
      clearInterval(interval);
      return;
    }

    const d = sortedDots[index];
    d3.selectAll("circle")
      .filter(cd => cd.character === d.character && cd.episodeIndex === d.episodeIndex)
      .transition().duration(300)
      .attr("opacity", 1)
      .attr("r", Math.sqrt(d[currentMetric]) * 0.6);

    index++;
  }, 80);
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

