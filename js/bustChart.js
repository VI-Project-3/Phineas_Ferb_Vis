let bustNeedleGroup;
let bustValueText;
let bustMarker;

function initBustMeter() {
  const bustMeterSvg = d3.select("#bustMeter")
    .attr("viewBox", "-150 -150 300 220") // little taller
    .style("width", "100%")
    .style("height", "100%");

  const bustMeterGroup = bustMeterSvg.append("g").attr("class", "bust-arc-group");
  const bustTicksGroup = bustMeterSvg.append("g").attr("class", "bust-ticks-group");
  bustNeedleGroup = bustMeterSvg.append("g").attr("class", "bust-needle-group");

  // Gradient
  const defs = bustMeterSvg.append("defs");
  const gradient = defs.append("linearGradient")
    .attr("id", "bustGradient")
    .attr("x1", "0%").attr("x2", "100%")
    .attr("y1", "0%").attr("y2", "0%");
  gradient.append("stop").attr("offset", "0%").attr("stop-color", "#ff6b6b");
  gradient.append("stop").attr("offset", "100%").attr("stop-color", "#7c4dff");

  // Arc
  const bustArc = d3.arc()
    .innerRadius(70)
    .outerRadius(100)
    .startAngle(-Math.PI / 2)
    .endAngle(Math.PI / 2);

  bustMeterGroup.append("path")
    .attr("d", bustArc)
    .attr("fill", "url(#bustGradient)");

  // Ticks
  setupBustTicks(bustTicksGroup);

  // Needle
  bustNeedleGroup.append("line")
    .attr("x1", 0)
    .attr("y1", 0)
    .attr("x2", 0)
    .attr("y2", -65)
    .attr("stroke", "black")
    .attr("stroke-width", 5)
    .attr("stroke-linecap", "round");

  bustNeedleGroup.append("circle")
    .attr("r", 6)
    .attr("fill", "black");

  // Red Marker (moved a little higher)
  bustMarker = bustNeedleGroup.append("path")
    .attr("d", d3.symbol().type(d3.symbolTriangle).size(100))
    .attr("fill", "red")
    .attr("transform", "translate(0,-90) rotate(180)");

  // Center Percentage Text
  bustValueText = bustMeterSvg.append("text")
    .attr("y", 40) // MOVED UP
    .attr("text-anchor", "middle")
    .attr("font-size", "28px")
    .attr("font-weight", "bold")
    .attr("fill", "#333")
    .text("0%");
}

function setupBustTicks(group) {
  const ticks = [0, 25, 50, 75, 100];
  const angleScale = d3.scaleLinear().domain([0, 100]).range([-90, 90]);

  group.selectAll("text")
    .data(ticks)
    .join("text")
    .attr("x", d => 120 * Math.cos(angleScale(d) * Math.PI / 180))
    .attr("y", d => 120 * Math.sin(angleScale(d) * Math.PI / 180))
    .attr("text-anchor", d => {
      if (d === 0) return "start";
      if (d === 100) return "end";
      return "middle";
    })
    .attr("alignment-baseline", "middle")
    .style("font-size", "14px")
    .style("font-weight", "bold")
    .style("fill", "#333")
    .text(d => `${d}%`);
}

function updateBustMeter(percentage) {
  const clamped = Math.max(0, Math.min(100, percentage));
  const angle = -90 + (clamped * 180 / 100);

  bustNeedleGroup.transition()
    .duration(1000)
    .ease(d3.easeElasticOut.amplitude(1.2).period(0.5))
    .attr("transform", `rotate(${angle})`);

  bustValueText.transition()
    .duration(1000)
    .tween("text", function () {
      const i = d3.interpolateNumber(+this.textContent.replace('%', ''), clamped);
      return function (t) {
        this.textContent = `${Math.round(i(t))}%`;
      };
    });
}
