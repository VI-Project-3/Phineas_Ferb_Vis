function initTextAnalysis() {
  const filePaths = [
    "data/phineas_and_ferb_transcripts_1.csv",
    "data/phineas_and_ferb_transcripts_2.csv",
    "data/phineas_and_ferb_transcripts_3.csv",
    "data/phineas_and_ferb_transcripts_4.csv",
  ];

  let allLines = [];
  let currentCharacter = d3.select("#characterSelect").property("value");
  let currentSeason = d3.select("#seasonSelect").property("value");

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
  
    // Only set to Phineas if nothing is selected yet
    const selectedCharacter = d3.select("#characterSelect").property("value");
    currentCharacter = selectedCharacter && selectedCharacter !== "all" ? selectedCharacter : "Phineas";
    
    const selectedSeason = d3.select("#seasonSelect").property("value");
    currentSeason = selectedSeason && selectedSeason !== "all" ? selectedSeason : "all";
  
    // Update dropdowns to reflect this choice
    d3.select("#characterSelect").property("value", currentCharacter);
    d3.select("#seasonSelect").property("value", currentSeason);
  
    updateVisuals();
  }
  
  // 🔄 Reuse dropdown listeners
  d3.select("#characterSelect").on("change.textAnalysis", updateVisuals);
  d3.select("#seasonSelect").on("change.textAnalysis", updateVisuals);

  loadData(); // initial load


  function updateVisuals() {
    currentCharacter = d3.select("#characterSelect").property("value");
    currentSeason = d3.select("#seasonSelect").property("value");

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
    .range([14, 60]);

  const layout = d3.layout.cloud()
    .size([width, height])
    .words(data.map(([text, size]) => ({ text, size: fontScale(size) })))
    .padding(5)
    .rotate(() => 0)
    .fontSize(d => d.size)
    .on("end", draw);

  layout.start();

  // function draw(words) {
  //   d3.select("#wordCloud")
  //     .append("svg")
  //     .attr("width", width)
  //     .attr("height", height)
  //     .append("g")
  //     .attr("transform", `translate(${width / 2},${height / 2})`)
  //     .selectAll("text")
  //     .data(words)
  //     .enter().append("text")
  //     .style("font-size", d => `${d.size}px`)
  //     .style("fill", () => d3.schemeTableau10[Math.floor(Math.random() * 10)])
  //     .attr("text-anchor", "middle")
  //     .attr("transform", d => `translate(${d.x},${d.y})rotate(${d.rotate})`)
  //     .text(d => d.text)
  //     .style("cursor", "pointer")
  //     .on("mouseover", function () {
  //       d3.select(this)
  //         .transition()
  //         .duration(200)
  //         .style("font-size", d => `${d.size * 1.2}px`)
  //         .style("fill", "black");
  //     })
  //     .on("mouseout", function () {
  //       d3.select(this)
  //         .transition()
  //         .duration(200)
  //         .style("font-size", d => `${d.size}px`)
  //         .style("fill", () => d3.schemeTableau10[Math.floor(Math.random() * 10)]);
  //     })
  //     .on("click", function (event, d) {
  //       showPhrasesWithWord(d.text);
      
  //       // Remove highlight from all bars first
  //       d3.selectAll("#barChart rect").attr("fill", "#4B8DF8");
      
  //       // Highlight the clicked word's bar
  //       const wordClass = `.bar-${d.text.toLowerCase()}`;
  //       d3.select(wordClass).attr("fill", "#FF8800");
  //     });
      
  // }
  function draw(words) {
    const svgGroup = d3.select("#wordCloud")
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);
  
    svgGroup.selectAll("text")
      .data(words)
      .enter().append("text")
      .attr("text-anchor", "middle")
      .attr("transform", d => `translate(${d.x},${d.y})rotate(${d.rotate})`)
      .style("font-size", d => `${d.size}px`)
      .style("fill", () => d3.schemeTableau10[Math.floor(Math.random() * 10)])
      .style("cursor", "pointer")
      .attr("class", d => `word-${d.text.toLowerCase().replace(/[^a-z0-9]/g, "")}`)
      .style("transition", "all 0.3s ease")
      .text(d => d.text)
      .on("mouseover", function (event, d) {
        d3.selectAll("#wordCloud text")
          .style("opacity", 0.3);
  
        d3.select(this)
          .style("opacity", 1)
          .style("fill", "#000")
          .transition().duration(200)
          .style("font-size", `${d.size * 1.3}px`);
      })
      .on("mouseout", function (event, d) {
        d3.selectAll("#wordCloud text")
          .style("opacity", 1)
          .style("fill", () => d3.schemeTableau10[Math.floor(Math.random() * 10)])
          .transition().duration(200)
          .style("font-size", d => `${d.size}px`);
      })
      .on("click", function (event, d) {
        const selectedWord = d.text.toLowerCase();
  
        // 🔍 Highlight matching bar
        d3.selectAll("#barChart rect")
          .style("opacity", rectData => rectData[0] === selectedWord ? 1 : 0.3)
          .attr("fill", rectData => rectData[0] === selectedWord ? "#315fbd" : "#4B8DF8");
  
        // 💬 Update phrases box with matches
        const matchingLines = allLines.filter(line =>
          line.speaker === currentCharacter &&
          (currentSeason === "all" || line.season === +currentSeason) &&
          line.line.toLowerCase().includes(selectedWord)
        );
  
        const phraseCounts = {};
        matchingLines.forEach(line => {
          const words = line.line.toLowerCase().split(/\s+/);
          for (let i = 0; i < words.length - 2; i++) {
            const phrase = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
            if (phrase.includes(selectedWord)) {
              phraseCounts[phrase] = (phraseCounts[phrase] || 0) + 1;
            }
          }
        });
  
        const sortedPhrases = Object.entries(phraseCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5);
  
        const ul = document.getElementById("commonPhrases");
        ul.innerHTML = "";
        sortedPhrases.forEach(([phrase, count]) => {
          const li = document.createElement("li");
          li.textContent = `"${phrase}..." — ${count} times`;
          ul.appendChild(li);
        });
      });
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
  .attr("class", d => `bar-${d[0].toLowerCase()}`)
  .style("transition", "transform 0.3s ease, opacity 0.3s ease, fill 0.3s ease")
  .on("mouseover", function (event, d) {
    tooltip
      .style("opacity", 1)
      .html(`<strong>${d[0]}</strong>: ${d[1]} times`);

    d3.selectAll("rect")
      .transition()
      .duration(200)
      .style("opacity", 0.3)
      .style("transform", "scale(1)");

    d3.select(this)
      .transition()
      .duration(200)
      .style("opacity", 1)
      .style("transform", "scale(1.05)")
      .attr("fill", "#315fbd");
  })
  .on("mousemove", (event) => {
    tooltip
      .style("left", event.pageX + 15 + "px")
      .style("top", event.pageY - 20 + "px");
  })
  .on("mouseout", function () {
    tooltip.style("opacity", 0);

    d3.selectAll("rect")
      .transition()
      .duration(200)
      .style("opacity", 1)
      .style("transform", "scale(1)")
      .attr("fill", "#4B8DF8");
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

function showPhrasesWithWord(word) {
  const filtered = allLines.filter(d =>
    d.speaker === currentCharacter &&
    (currentSeason === "all" || d.season === +currentSeason)
  );

  const matching = filtered.filter(d =>
    d.line.toLowerCase().includes(word.toLowerCase())
  );

  const phrases = matching.map(d => d.line.trim()).slice(0, 5);

  const ul = document.getElementById("commonPhrases");
  ul.innerHTML = "";
  if (phrases.length === 0) {
    ul.innerHTML = "<li>No matching phrases found.</li>";
  } else {
    phrases.forEach(p => {
      const li = document.createElement("li");
      li.textContent = `"${p}"`;
      ul.appendChild(li);
    });
  }
}
}