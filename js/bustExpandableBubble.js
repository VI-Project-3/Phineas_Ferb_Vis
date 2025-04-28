let bustBubbleSvg;
let bustBubbleSimulation;
let bustBubbleRootData;
let bustBubbleNodes;
let bustBubbleExpandedSeason = null;

// 📦 Data from your invention CSVs
let phineasIdeasData = [];
let doofenshmirtzData = [];

function initBustExpandableBubbleChart() {
  bustBubbleSvg = d3.select("#bustBubble")
    .attr("viewBox", "-400 -300 800 600")
    .style("width", "100%")
    .style("height", "100%");

  const seasonGroups = d3.group(Object.entries(bustAttemptsPerEpisode), ([epKey]) => epKey.slice(0, 2));

  bustBubbleRootData = Array.from(seasonGroups, ([season, episodes]) => ({
    id: season,
    type: "season",
    children: episodes.map(([epKey, attempts]) => ({
      id: epKey,
      type: "episode",
      bustAttempts: attempts
    }))
  }));

  Promise.all([
    d3.csv("data/inventions/doof/doofenshmirtz_season1.csv"),
    d3.csv("data/inventions/doof/doofenshmirtz_season2.csv"),
    d3.csv("data/inventions/doof/doofenshmirtz_season3.csv"),
    d3.csv("data/inventions/doof/doofenshmirtz_season4.csv"),
    d3.csv("data/inventions/pf/phineas_big_ideas_season1.csv"),
    d3.csv("data/inventions/pf/phineas_big_ideas_season2.csv"),
    d3.csv("data/inventions/pf/phineas_big_ideas_season3.csv"),
    d3.csv("data/inventions/pf/phineas_big_ideas_season4.csv")
  ]).then(([doof1, doof2, doof3, doof4, phin1, phin2, phin3, phin4]) => {
    doofenshmirtzData = [...doof1, ...doof2, ...doof3, ...doof4];
    phineasIdeasData = [...phin1, ...phin2, ...phin3, ...phin4];

    drawBustBubbleChart();
  });
}

function drawBustBubbleChart() {
  bustBubbleSvg.selectAll("*").remove();

  bustBubbleNodes = bustBubbleRootData.map(season => ({
    id: season.id,
    type: "season",
    radius: 60,
    children: season.children
  }));

  // bustBubbleSimulation = d3.forceSimulation(bustBubbleNodes)
  //   .force("charge", d3.forceManyBody().strength(-30))
  //   .force("center", d3.forceCenter(0, 0))
  //   .force("collision", d3.forceCollide().radius(d => d.radius + 8))
  //   .force("x", d3.forceX(0).strength(0.1))
  //   .force("y", d3.forceY(0).strength(0.1))
  //   .on("tick", tickedBustBubbles);

  bustBubbleSimulation = d3.forceSimulation(bustBubbleNodes)
  .force("charge", d3.forceManyBody().strength(-5))      // 🛠 Much softer repulsion
  .force("center", d3.forceCenter(0, 0))
  .force("collision", d3.forceCollide().radius(d => d.radius + 4)) // 🛠 Smaller padding
  .force("x", d3.forceX(0).strength(0.02))                // 🛠 Gentle pull to center
  .force("y", d3.forceY(0).strength(0.02))                // 🛠 Gentle pull to center
  .alphaDecay(0.02)                                       // 🛠 Slower "cooldown" so it feels floaty
  .on("tick", tickedBustBubbles);


  updateBustBubbleCircles();
}

function updateBustBubbleCircles() {
  const bubbles = bustBubbleSvg.selectAll("g.bubble")
    .data(bustBubbleNodes, d => d.id);

  const bubblesEnter = bubbles.enter()
    .append("g")
    .attr("class", "bubble")
    .style("cursor", "pointer")
    .on("click", handleBustBubbleClick);

  bubblesEnter.append("circle")
    .attr("r", 0)
    .attr("fill", d => d.type === "season" ? "#ff6b6b" : "#7c4dff")
    .attr("stroke", "#333").attr("stroke-width", 2)
    .attr("opacity", 0.85)
    .transition()
    .duration(800)
    .ease(d3.easeElasticOut.amplitude(1.2).period(0.5))
    .attr("r", d => d.radius);

  bubblesEnter.append("text")
    .text(d => d.type === "season" ? d.id : d.id.slice(2))
    .attr("text-anchor", "middle")
    .attr("alignment-baseline", "middle")
    .attr("font-size", d => d.type === "season" ? "18px" : "12px")
    .attr("fill", "white")
    .attr("pointer-events", "none");

  bubbles.exit().remove();
}

function tickedBustBubbles() {
  bustBubbleSvg.selectAll("g.bubble")
    .attr("transform", d => `translate(${d.x},${d.y})`);
}

function handleBustBubbleClick(event, d) {
  if (d.type === "season") {
    if (bustBubbleExpandedSeason === d.id) {
      bustBubbleExpandedSeason = null;
      drawBustBubbleChart();
    } else {
      bustBubbleExpandedSeason = d.id;
      expandBustSeason(d);
    }
  } else if (d.type === "episode") {
    showEpisodeSidebar(d);
  }
}

function expandBustSeason(seasonNode) {
  bustBubbleSvg.selectAll("*").remove();

  const seasonNum = parseInt(seasonNode.id.slice(1)); // "S1" → 1

  bustBubbleNodes = seasonNode.children.map(ep => {
    const episodeNum = parseInt(ep.id.slice(3)); // "S1E02" → 2
    return {
      id: ep.id,
      type: "episode",
      bustAttempts: ep.bustAttempts,
      radius: ep.bustAttempts ? Math.max(20, ep.bustAttempts * 5) : 25,
      season: seasonNum,
      episode: episodeNum
    };
  });

  // bustBubbleSimulation = d3.forceSimulation(bustBubbleNodes)
  //   .force("charge", d3.forceManyBody().strength(-30))
  //   .force("center", d3.forceCenter(0, 0))
  //   .force("collision", d3.forceCollide().radius(d => d.radius + 10))
  //   .force("x", d3.forceX(0).strength(0.1))
  //   .force("y", d3.forceY(0).strength(0.1))
  //   .on("tick", tickedBustBubbles);
  bustBubbleSimulation = d3.forceSimulation(bustBubbleNodes)
    .force("charge", d3.forceManyBody().strength(-5))      // 🛠 Much softer repulsion
    .force("center", d3.forceCenter(0, 0))
    .force("collision", d3.forceCollide().radius(d => d.radius + 4)) // 🛠 Smaller padding
    .force("x", d3.forceX(0).strength(0.02))                // 🛠 Gentle pull to center
    .force("y", d3.forceY(0).strength(0.02))                // 🛠 Gentle pull to center
    .alphaDecay(0.02)                                       // 🛠 Slower "cooldown" so it feels floaty
    .on("tick", tickedBustBubbles);
  

  const bubbles = bustBubbleSvg.selectAll("g.bubble")
    .data(bustBubbleNodes, d => d.id)
    .join(enter => {
      const g = enter.append("g")
        .attr("class", "bubble")
        .style("cursor", "pointer")
        .on("click", handleBustBubbleClick);

      g.append("circle")
        .attr("r", 0)
        .attr("fill", "#4B8DF8")
        .attr("stroke", "#333")
        .attr("stroke-width", 2)
        .attr("opacity", 0.85)
        .transition()
        .duration(800)
        .ease(d3.easeElasticOut.amplitude(1.2).period(0.5))
        .attr("r", d => d.radius);

      g.append("text")
        .text(d => `E${d.episode}`)
        .attr("text-anchor", "middle")
        .attr("alignment-baseline", "middle")
        .attr("font-size", "12px")
        .attr("fill", "white")
        .attr("pointer-events", "none");

      return g;
    });
}

document.addEventListener("DOMContentLoaded", function() {
  const closeBtn = document.getElementById("closeSidebar");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      const sidebar = document.getElementById("episodeSidebar");
      if (sidebar) sidebar.classList.remove("active");
    });
  }
});

function showEpisodeSidebar(d) {
  const sidebar = document.getElementById("episodeSidebar");

  const seasonNumber = d.season;
  const episodeNumber = d.episode;

  document.getElementById("sidebarTitle").innerText = `Season ${seasonNumber} - Episode ${episodeNumber}`;
  document.getElementById("sidebarBustAttempts").innerHTML = `<strong>Candace Bust Attempts:</strong> ${d.bustAttempts}`;

  // 🔎 Find matching Phineas Big Idea
  const phinIdea = phineasIdeasData.find(item => 
    Number(item["Season"]) === seasonNumber && Number(item["EpisodeNumber"]) === episodeNumber
  ) || {};

  document.getElementById("sidebarPhineasIdea").innerHTML = `<strong>Big Idea:</strong> ${phinIdea["BigIdea"] || "Unknown"}`;
  document.getElementById("sidebarPhineasDisappearance").innerHTML = `<strong>Disappearance:</strong> ${phinIdea["Disappearance"] || "Unknown"}`;
  document.getElementById("sidebarPhineasNotes").innerHTML = `<strong>Notes:</strong> ${phinIdea["Notes"] || "Unknown"}`;

  // 🔎 Find matching Doofenshmirtz Invention
  const doofIdea = doofenshmirtzData.find(item => 
    Number(item["Season"]) === seasonNumber && Number(item["EpisodeNumber"]) === episodeNumber
  ) || {};

  const phinImageUrl = phinIdea["ImageURL"] || "";
const doofImageUrl = doofIdea["InventionImageURL"] || "";

const phineasImage = document.getElementById("sidebarPhineasImage");
const doofImage = document.getElementById("sidebarDoofImage");

if (phinImageUrl) {
  phineasImage.src = proxiedImage(phinImageUrl);
  phineasImage.style.display = "block";
} else {
  phineasImage.style.display = "none";
}

if (doofImageUrl) {
  doofImage.src = proxiedImage(doofImageUrl);
  doofImage.style.display = "block";
} else {
  doofImage.style.display = "none";
}
  document.getElementById("sidebarDoofInvention").innerHTML = `<strong>Invention:</strong> ${doofIdea["Inventions"] || "Unknown"}`;
  document.getElementById("sidebarDoofScheme").innerHTML = `<strong>Scheme:</strong> ${doofIdea["Scheme"] || "Unknown"}`;
  document.getElementById("sidebarDoofFailure").innerHTML = `<strong>Failure/Destruction:</strong> ${doofIdea["Failure/Destruction"] || "Unknown"}`;

  sidebar.classList.add("active");
}

function proxiedImage(url) {
  return `https://images.weserv.nl/?url=${encodeURIComponent(url.replace(/^https?:\/\//, ''))}`;
}

