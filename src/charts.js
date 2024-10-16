export function renderRadarChart(data, labels, containerSelector) {
  const svg = d3.select(containerSelector);
  const dimensions = svg.node().getBoundingClientRect();
  const radius = Math.min(dimensions.width, dimensions.height) / 2 - 60;

  const scale = d3.scaleLinear().domain([0, d3.max(data)]).range([20, radius]);
  const angleSlice = (Math.PI * 2) / labels.length;

  svg.attr('width', '100%')
     .attr('height', '100%')
     .attr('viewBox', `0 0 ${dimensions.width} ${dimensions.height}`)
     .selectAll('*').remove(); // Clear previous content

  const group = svg.append('g').attr('transform', `translate(${dimensions.width / 2}, ${dimensions.height / 2})`);

  for (let i = 0; i < 5; i++) {
    group.append('circle')
         .attr('r', radius / 5 * (i + 1))
         .attr('fill', 'Crimson')
         .attr('fill-opacity', 0.2);
  }

  const radarLine = d3.lineRadial()
    .radius(d => scale(d))
    .angle((d, i) => i * angleSlice);

  group.append('path')
       .datum(data)
       .attr('d', radarLine)
       .attr('fill', 'rgba(0, 255, 127, 0.5)')
       .attr('stroke', 'rgba(200, 250, 120, 1)');

  const labelsGroup = group.append('g').attr('class', 'axisLabels');
  labelsGroup.selectAll('.axisLabel')
    .data(labels)
    .enter()
    .append('text')
    .attr('x', (d, i) => scale(d3.max(data) * 1.1) * Math.cos(angleSlice * i - Math.PI / 2))
    .attr('y', (d, i) => scale(d3.max(data) * 1.1) * Math.sin(angleSlice * i - Math.PI / 2))
    .attr('font-size', '10px')
    .attr('text-anchor', 'middle')
    .attr('fill', 'white') // Label color
    .text(d => d);
}

export function createProgressBar(selector, percentage, color) {
  const svg = d3.select(selector);
  const width = svg.node().getBoundingClientRect().width;
  const height = 20;

  svg.attr('width', width).attr('height', height).selectAll('*').remove();
  svg.append('rect').attr('width', width).attr('height', height).attr('fill', '#e0e0e0'); // Background
  svg.append('rect').attr('width', (percentage / 100) * width).attr('height', height).attr('fill', color); // Foreground
}
