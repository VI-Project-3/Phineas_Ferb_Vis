// textAnalysis.js

document.addEventListener("DOMContentLoaded", () => {
  loadData();
});

const filePaths = [
  "data/phineas_and_ferb_transcripts_1.csv",
  "data/phineas_and_ferb_transcripts_2.csv",
  "data/phineas_and_ferb_transcripts_3.csv",
  "data/phineas_and_ferb_transcripts_4.csv",
];

let allLines = [];
let currentCharacter = "Phineas";
let currentSeason = "all";

const stopWords = new Set([
  "the", "and", "if", "was", "a", "to", "of", "in", "is", "it", "on", "for", "with",
  "that", "at", "by", "an", "be", "this", "have", "from", "i", "s", "t", "you", "we",
  "he", "she", "they", "my", "me", "do", "did", "has", "had", "his", "her", "not", "are"
]);

const allowedShortWords = new Set(["no", "oh", "go", "ok", "yes"]);

async function loadData() {
  const rawData = await Promise.all(filePaths.map(path => d3.csv(path)));
  allLines = rawData.flat().map(d => ({
    season: +d.season,
    episode: +d.episode,
    speaker: d.speaker?.replace(/\(.*?\)/g, "").trim(),
    line: d.line || ""
  }));

  populateCharacterOptions();
  updateVisuals();
}

function populateCharacterOptions() {
  const characters = [...new Set(allLines.map(d => d.speaker).filter(Boolean))].sort();
  const select = document.getElementById("characterSelect");
  characters.forEach(char => {
    const option = document.createElement("option");
    option.value = char;
    option.textContent = char;
    if (char === currentCharacter) option.selected = true;
    select.appendChild(option);
  });

  select.addEventListener("change", e => {
    currentCharacter = e.target.value;
    updateVisuals();
  });

  const seasonSelect = document.getElementById("seasonSelect");
seasonSelect.innerHTML = ""; // ✅ clear existing options
["all", 1, 2, 3, 4].forEach(season => {
  const opt = document.createElement("option");
  opt.value = season;
  opt.textContent = season === "all" ? "All Seasons" : `Season ${season}`;
  seasonSelect.appendChild(opt);
});

  seasonSelect.addEventListener("change", e => {
    currentSeason = e.target.value;
    updateVisuals();
  });
}

function updateVisuals() {
  const filtered = allLines.filter(d =>
    d.speaker === currentCharacter &&
    (currentSeason === "all" || d.season === +currentSeason)
  );

  const allText = filtered.map(d => d.line.toLowerCase()).join(" ");
  const words = allText.match(/\b[\w']+\b/g) || [];

  const cleaned = words.filter(w => {
    const word = w.replace(/[^a-zA-Z']/g, "");
    return (
      (word.length > 2 || allowedShortWords.has(word)) &&
      !stopWords.has(word)
    );
  });

  const wordFreq = d3.rollup(
    cleaned,
    v => v.length,
    w => w
  );

  const sortedWords = Array.from(wordFreq.entries()).sort((a, b) => b[1] - a[1]);
  renderWordCloud(sortedWords.slice(0, 50));
  renderBarChart(sortedWords.slice(0, 10));
  renderPhrases(filtered);
}

function renderWordCloud(data) {
  d3.select("#wordCloud").selectAll("*").remove();

  if (data.length === 0) {
    d3.select("#wordCloud")
      .append("div")
      .style("text-align", "center")
      .style("color", "#999")
      .style("padding", "2rem")
      .text("No significant words found.");
    return;
  }

  const width = 600, height = 300;

  const fontScale = d3.scaleLinear()
    .domain([d3.min(data, d => d[1]), d3.max(data, d => d[1])])
    .range([14, 60]); // min and max font sizes

  const layout = d3.layout.cloud()
    .size([width, height])
    .words(data.map(([text, size]) => ({ text, size: fontScale(size) })))
    .padding(5)
    .rotate(() => 0)
    .fontSize(d => d.size)
    .on("end", draw);

  layout.start();

  function draw(words) {
    d3.select("#wordCloud")
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`)
      .selectAll("text")
      .data(words)
      .enter().append("text")
      .style("font-size", d => `${d.size}px`)
      .style("fill", () => d3.schemeTableau10[Math.floor(Math.random() * 10)])
      .attr("text-anchor", "middle")
      .attr("transform", d => `translate(${d.x},${d.y})rotate(${d.rotate})`)
      .text(d => d.text);
  }
}

function renderBarChart(data) {
  d3.select("#barChart").selectAll("*").remove();

  const margin = { top: 20, right: 30, bottom: 50, left: 100 };
  const width = 600 - margin.left - margin.right;
  const height = 300 - margin.top - margin.bottom;

  const svg = d3.select("#barChart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear()
    .domain([0, d3.max(data, d => d[1])])
    .nice()
    .range([0, width]);

  const y = d3.scaleBand()
    .domain(data.map(d => d[0]))
    .range([0, height])
    .padding(0.1);

  // Tooltip
  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip-bar")
    .style("position", "absolute")
    .style("padding", "6px 12px")
    .style("background", "#222")
    .style("color", "#fff")
    .style("border-radius", "6px")
    .style("font-size", "0.9rem")
    .style("pointer-events", "none")
    .style("opacity", 0);

  // Bars
  svg.selectAll("rect")
    .data(data)
    .enter().append("rect")
    .attr("y", d => y(d[0]))
    .attr("x", 0)
    .attr("height", y.bandwidth())
    .attr("width", d => x(d[1]))
    .attr("fill", "#4B8DF8")
    .on("mouseover", (event, d) => {
      tooltip
        .style("opacity", 1)
        .html(`<strong>${d[0]}</strong>: ${d[1]} times`);
      d3.select(event.currentTarget).attr("fill", "#315fbd");
    })
    .on("mousemove", (event) => {
      tooltip
        .style("left", event.pageX + 15 + "px")
        .style("top", event.pageY - 20 + "px");
    })
    .on("mouseout", (event) => {
      tooltip.style("opacity", 0);
      d3.select(event.currentTarget).attr("fill", "#4B8DF8");
    });

  // Y-axis
  svg.append("g")
    .call(d3.axisLeft(y));

  // X-axis
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).ticks(5));

  // X Label
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height + 40)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .text("Frequency");

  // Y Label
  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -80)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .text("Top Words");
}


function renderPhrases(lines) {
  const phrases = {};
  lines.forEach(d => {
    const text = d.line.toLowerCase();
    if (text.length < 10) return;

    const start = text.split(" ").slice(0, 3).join(" ");
    if (!stopWords.has(start.split(" ")[0])) {
      phrases[start] = (phrases[start] || 0) + 1;
    }
  });

  const sorted = Object.entries(phrases).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const ul = document.getElementById("commonPhrases");
  ul.innerHTML = "";
  sorted.forEach(([phrase, count]) => {
    const li = document.createElement("li");
    li.textContent = `"${phrase}..." — ${count} times`;
    ul.appendChild(li);
  });
}
