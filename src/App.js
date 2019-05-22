import {
  axisBottom,
  axisLeft,
  brush,
  brushSelection,
  csv,
  extent,
  json,
  keys,
  scaleLinear,
  scaleOrdinal,
  schemeCategory10,
  select,
} from 'd3';


const SIZE = 230
const PADDING = 20

const x = scaleLinear()
  .range([PADDING / 2, SIZE - PADDING / 2]);

const y = scaleLinear()
  .range([SIZE - PADDING / 2, PADDING / 2]);

let brushCell;
const brushFx = brush()
  .extent([[0, 0], [SIZE, SIZE]])

const xAxis = axisBottom()
  .scale(x)
  .ticks(6);

const yAxis = axisLeft()
  .scale(y)
  .ticks(6);

const color = scaleOrdinal().range(schemeCategory10)


export default async function App() {
  // const data = await json('data.json')
  const data = await csv('data-setosa.csv')
  const metrics = ['sepal width', 'sepal length']
  // const metrics = keys(data[0]).filter(d => d !== 'species')
  scatterplotMatrix(data, metrics)
}

function scatterplotMatrix(data, metrics) {
  brushFx
    .on('start', brushStart)
    .on('brush', brushmove)
    .on('end', brushend)

  const metricsDomain = {}

  const n = metrics.length

  metrics.forEach(metric => {
    metricsDomain[metric] = extent(data, d => d[metric]);
  });

  xAxis.tickSize(SIZE * n);
  yAxis.tickSize(-SIZE * n);

  const svg = select('#app').append('svg')
    .attr('width', SIZE * n + PADDING)
    .attr('height', SIZE * n + PADDING)
    .append('g')
    .attr('transform', 'translate(' + PADDING + ',' + PADDING / 2 + ')');

  svg.selectAll('.x.axis')
    .data(metrics)
    .enter().append('g')
    .attr('class', 'x axis')
    .attr('transform', (d, i) => 'translate(' + (n - i - 1) * SIZE + ',0)')
    .each(d => {
      x.domain(metricsDomain[d]);
      select(this).call(xAxis);
    });

  svg.selectAll('.y.axis')
    .data(metrics)
    .enter().append('g')
    .attr('class', 'y axis')
    .attr('transform', (d, i) => 'translate(0,' + i * SIZE + ')')
    .each(d => {
      y.domain(metricsDomain[d]);
      select(this).call(yAxis);
    });

  const cell = svg.selectAll('.cell')
    .data(cross(metrics, metrics))
    .enter().append('g')
    .attr('class', 'cell')
    .attr('transform', d => 'translate(' + (n - d.i - 1) * SIZE + ',' + d.j * SIZE + ')')
    .each(plot);

  // Titles for the diagonal.
  cell.filter(d => d.i === d.j).append('text')
    .attr('x', PADDING)
    .attr('y', PADDING)
    .attr('dy', '.71em')
    .text(d => d.x);

  cell.call(brushFx);

  function plot(p) {
    const cell = select(this);

    x.domain(metricsDomain[p.x]);
    y.domain(metricsDomain[p.y]);

    cell.append('rect')
      .attr('class', 'frame')
      .attr('x', PADDING / 2)
      .attr('y', PADDING / 2)
      .attr('width', SIZE - PADDING)
      .attr('height', SIZE - PADDING);

    cell.selectAll('circle')
      .data(data)
      .enter().append('circle')
      .attr('cx', d => x(d[p.x]))
      .attr('cy', d => y(d[p.y]))
      .attr('r', 4)
      .style('fill', d => color(d.species));
  }

  // Clear the previously-active brush, if any.
  function brushStart(p) {
    if (brushCell !== this) {
      select(brushCell).call(brushFx.move, null);
      brushCell = this;
      x.domain(metricsDomain[p.x]);
      y.domain(metricsDomain[p.y]);
    }
  }

  // Highlight the selected circles.
  function brushmove(p) {
    const e = brushSelection(this);
    svg.selectAll('circle').classed('hidden', d =>
      e && (
        e[0][0] > x(+d[p.x]) || x(+d[p.x]) > e[1][0]
        || e[0][1] > y(+d[p.y]) || y(+d[p.y]) > e[1][1]
      )
    );
  }

  // If the brush is empty, select all circles.
  function brushend() {
    const e = brushSelection(this);
    if (!e) svg.selectAll('.hidden').classed('hidden', false);
  }
}

function cross(a, b) {
  const c = [], n = a.length, m = b.length;
  let i, j;
  for (i = -1; ++i < n;) for (j = -1; ++j < m;)
    c.push({ x: a[i], i: i, y: b[j], j: j });

  console.log(a, b, c)
  return c;
}
