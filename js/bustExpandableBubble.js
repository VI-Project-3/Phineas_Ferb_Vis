let bustBubbleSvg;
let bustBubbleSimulation;
let bustBubbleRootData;
let bustBubbleNodes;
let bustBubbleExpandedSeason = null;

function initBustExpandableBubbleChart() {
  bustBubbleSvg = d3.select("#bustBubble") // ID mismatch fix here
    .attr("viewBox", "-400 -300 800 600")
    .style("width", "100%")
    .style("height", "100%");

  const seasonGroups = d3.group(Object.entries(bustAttemptsPerEpisode), ([epKey, attempts]) => epKey.slice(0, 2));

  bustBubbleRootData = Array.from(seasonGroups, ([season, episodes]) => ({
    id: season,
    type: "season",
    children: episodes.map(([epKey, attempts]) => ({
      id: epKey,
      type: "episode",
      bustAttempts: attempts
    }))
  }));

  drawBustBubbleChart();
}

function drawBustBubbleChart() {
  bustBubbleSvg.selectAll("*").remove();

  bustBubbleNodes = bustBubbleRootData.map(season => ({
    id: season.id,
    type: "season",
    radius: 60,
    children: season.children
  }));

  bustBubbleSimulation = d3.forceSimulation(bustBubbleNodes)
  .force("charge", d3.forceManyBody().strength(-30))
  .force("center", d3.forceCenter(0, 0))
  .force("collision", d3.forceCollide().radius(d => d.radius + 8))
  .force("x", d3.forceX(0).strength(0.1))
  .force("y", d3.forceY(0).strength(0.1))
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

// function handleBustBubbleClick(event, d) {
//   event.stopPropagation();

//   if (d.type === "season") {
//     if (bustBubbleExpandedSeason === d.id) {
//       bustBubbleExpandedSeason = null;
//       drawBustBubbleChart();
//     } else {
//       bustBubbleExpandedSeason = d.id;
//       expandBustSeason(d);
//     }
//   } else if (d.type === "episode") {
//     alert(`${d.id}: ${d.bustAttempts} bust attempts!`);
//   }
// }

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
      // 🎯 Instead of alert → show popup
      document.getElementById("bustPopupTitle").innerText = `Episode ${d.id.slice(2)}`;
      document.getElementById("bustPopupText").innerText = `${d.bustAttempts} Bust Attempts by Candace!`;
      document.getElementById("bustPopup").style.display = "flex";
    }
  }
  

function expandBustSeason(seasonNode) {
  bustBubbleSvg.selectAll("*").remove();

  bustBubbleNodes = seasonNode.children.map(ep => ({
    id: ep.id,
    type: "episode",
    bustAttempts: ep.bustAttempts,
    radius: Math.max(20, ep.bustAttempts * 5) // Bigger pop factor
  }));

  bustBubbleSimulation = d3.forceSimulation(bustBubbleNodes)
  .force("charge", d3.forceManyBody().strength(-30)) // 🧲 SOFTER
  .force("center", d3.forceCenter(0, 0))             // 🏹 Center in SVG
  .force("collision", d3.forceCollide().radius(d => d.radius + 10))
  .force("x", d3.forceX(0).strength(0.1))             // ✨ New: X "gravity"
  .force("y", d3.forceY(0).strength(0.1))             // ✨ New: Y "gravity"
  .on("tick", tickedBustBubbles);


  const bubbles = bustBubbleSvg.selectAll("g.bubble")
    .data(bustBubbleNodes, d => d.id)
    .join(
      enter => {
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
          .text(d => d.id.slice(2))
          .attr("text-anchor", "middle")
          .attr("alignment-baseline", "middle")
          .attr("font-size", "12px")
          .attr("fill", "white")
          .attr("pointer-events", "none");

        return g;
      }
    );
}

// Make sure popup event listeners are attached after page fully loads
window.addEventListener("DOMContentLoaded", function() {
    const closeBtn = document.getElementById("bustPopupClose");
    const popup = document.getElementById("bustPopup");
  
    if (closeBtn && popup) {
      closeBtn.addEventListener("click", function() {
        popup.style.display = "none";
      });
  
      window.addEventListener("click", function(event) {
        if (event.target === popup) {
          popup.style.display = "none";
        }
      });
    }
  });
  
  