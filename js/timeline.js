import * as d3 from 'd3';

function twoSidedTimeline() {
  function draw({ eventData, yearsToMark, selector }) {
    const containerWidth = parseInt(d3.select(selector).style('width'));
    const containerHeight = d3.max([
      parseInt(d3.select(selector).style('height')),
      (1789 - 1775) * 175
    ]);

    const margin = {
      left: 0,
      right: 0,
      top: 10,
      bottom: 50
    };

    const width = containerWidth - margin.left - margin.right;

    const height = containerHeight - margin.top - margin.bottom;

    const plotArea = {
      x: margin.left,
      y: margin.top,
      width,
      height
    };

    const marker = {
      radius: 4,
      warColor: '#c28080',
      defaultColor: '#5598E2',
      fadedColor: '#eedddd',
      selectedColor: '#c28080'
    };

    const labelDefaultColor = '#093B72';
    const labelSelectedColor = '#5b1a1a';
    const labelFadedColor = '#eedddd';
    const labelWarColor = '#5b1a1a';

    // The dodge function takes an array of positions (e.g. X values along an X Axis) in floating point numbers
    // The dodge function optionally takes customisable separation, iteration, and error values.
    // The dodge function returns a similar array of positions, but slightly dodged from where they were in an attempt to separate them out. It restrains the result a little bit so that the elements don't explode all over the place and so they don't go out of bounds.
    function dodge(positions, separation = 100, maxiter = 10, maxerror = 1e-1) {
      // TODO: remove
      positions = Array.from(positions);

      let n = positions.length;

      // isFinite is a JS global
      // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/isFinite
      if (!positions.every(isFinite)) {
        throw new Error('invalid position');
      }

      if (!(n > 1)) {
        return positions;
      }

      let index = d3.range(positions.length);
      for (let iter = 0; iter < maxiter; ++iter) {
        index.sort((i, j) => d3.ascending(positions[i], positions[j]));

        let error = 0;
        for (let i = 1; i < n; ++i) {
          let delta = positions[index[i]] - positions[index[i - 1]];

          if (delta < separation) {
            delta = (separation - delta) / 2;
            error = Math.max(error, delta);
            positions[index[i - 1]] -= delta;
            positions[index[i]] += delta;
          }
        }

        if (error < maxerror) break;
      }

      return positions;
    } // end dodge fn

    // create the skeleton of the chart
    const svg = d3
      .select(selector)
      .append('svg')
      .attr('width', '100%')
      .attr('height', containerHeight)
      .append('g')
      .attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');

    const plot = svg
      .append('g')
      .attr('id', 'plot')
      .attr('transform', `translate(${plotArea.x}, ${plotArea.y})`);

    const y = d3
      .scaleUtc()
      .domain(d3.extent(yearsToMark, (d) => d.date))
      .range([plotArea.y, plotArea.height]);

    const dodgedYValues = dodge(
      eventData.map((d) => y(d.date)),
      16
    );

    const yearBackgrounds = plot
      .append('g')
      .attr('class', 'year-backgrounds')
      .selectAll('circle')
      .data(yearsToMark)
      .join('circle')
      // .attr(
      //   'transform',
      //   ({ date }) => `translate(${containerWidth / 2}, ${y(date)})`
      // )
      .attr('cx', containerWidth / 2)
      .attr('cy', ({ date }) => y(date))
      .attr('r', 15);

    const years = plot
      .append('g')
      .attr('class', 'years')
      .selectAll('text')
      .data(yearsToMark)
      .join('text')
      .text(({ year }) => year)
      // .attr('x', containerWidth / 2)
      // .attr('y', ({ date }) => y(date))
      .attr('y', '0.32em')
      .attr(
        'transform',
        (d) => `translate(${containerWidth / 2}, ${y(d.date)})`
      )
      .attr('text-anchor', 'middle')
      .attr('line-anchor', 'middle');

    const markers = plot
      .append('g')
      .attr('class', 'markers')
      .selectAll('circle')
      .data(eventData)
      .join('circle')
      .attr(
        'transform',
        (d) => `translate(${containerWidth / 2}, ${y(d.date)})`
      )
      .attr('aria-hidden', 'true')
      .attr('fill', (d) => (d.isWar ? marker.warColor : marker.defaultColor))
      .attr('stroke', (d) => (d.isWar ? marker.warColor : marker.defaultColor))
      .attr('cx', 0.5)
      .attr('cy', marker.radius / 2 + 0.5)
      .attr('r', marker.radius);

    const eventLabels = plot
      .append('g')
      .attr('class', 'eventLabels')
      .selectAll('text')
      .data((d) => d3.zip(eventData, dodgedYValues))
      .join('text')
      .attr('class', 'event-title')
      .style('font-weight', '400')
      .style('fill', ([d]) => (d.isWar ? labelWarColor : labelDefaultColor))
      .attr('x', containerWidth / 2)
      .attr('y', ([, y]) => y)
      .attr('dy', '0.5em')
      .attr('text-anchor', (d, i) => (i % 2 === 0 ? 'start' : 'end'))
      .attr('dx', (d, i) => (i % 2 === 0 ? 20 : -20));

    eventLabels.append('tspan').text(([d]) => d.eventName);

    const tooltip = d3.select('.tooltip').attr('aria-hidden', 'true').html(`
      <div class="tooltip-date">
        <span id="date"></span>
      </div>
      <div class="tooltip-name">
        <span id="name"></span>
      </div>
      <div class="tooltip-description">
        <span id="description"></span>
      </div>
    `);

    const rangeY = dodgedYValues.map((x) => x + plotArea.y);

    const rangeY0 = rangeY[0];

    const fuzzyTextHeightAdjustment = 16;

    svg.on('touchend mouseout', function (event) {
      markers
        .attr('fill', (d) => (d.isWar ? marker.warColor : marker.defaultColor))
        .attr('stroke', (d) =>
          d.isWar ? marker.warColor : marker.defaultColor
        );

      eventLabels.style('opacity', 1);
    });

    svg.on('touchmove mousemove', function (event) {
      const [mouseX, mouseY] = d3.pointer(event, this);
      const nearestEventY = rangeY.reduce((a, b) =>
        Math.abs(b - mouseY) < Math.abs(a - mouseY) ? b : a
      );
      const dodgedIndex = rangeY.indexOf(nearestEventY);
      const dataEvent = eventData[dodgedIndex];

      const distance = Math.abs(mouseY - nearestEventY);

      if (mouseY >= rangeY0 - fuzzyTextHeightAdjustment && distance < 10) {
        const h1 = d3.select('h1');
        const h1Height = h1 ? h1.node().getBoundingClientRect().height : 0;

        eventLabels.filter((d, i) => i !== dodgedIndex).style('opacity', 0.3);

        eventLabels.filter((d, i) => i === dodgedIndex).style('opacity', 1);

        markers
          .filter((d, i) => i !== dodgedIndex)
          .attr('fill', marker.fadedColor)
          .attr('stroke', marker.fadedColor);

        markers
          .filter((d, i) => i === dodgedIndex)
          .attr('fill', (d) =>
            d.isWar ? marker.warColor : marker.defaultColor
          )
          .attr('stroke', (d) =>
            d.isWar ? marker.warColor : marker.defaultColor
          )
          .raise();

        tooltip.attr('class', () =>
          dataEvent.isWar ? 'tooltip war' : 'tooltip'
        );

        tooltip
          .select('#date')
          .text(d3.timeFormat('%A, %e %B, %Y')(dataEvent.date));

        tooltip.select('#name').text(dataEvent.eventName);

        tooltip.select('#description').text(dataEvent.eventDescription);

        const tooltipHeight = tooltip.node().getBoundingClientRect().height;

        const translationYOffset =
          dodgedIndex < 3
            ? nearestEventY + h1Height + 65
            : nearestEventY + h1Height - tooltipHeight;

        const xOffset = getLeft({
          event,
          graphSelector: selector
        });

        tooltip.style(
          'transform',
          `translate(${xOffset}px, ${translationYOffset}px)`
        );

        tooltip.style('opacity', 1);
      } else {
        markers
          .attr('fill', (d) =>
            d.isWar ? marker.warColor : marker.defaultColor
          )
          .attr('stroke', (d) =>
            d.isWar ? marker.warColor : marker.defaultColor
          );

        eventLabels.style('opacity', 1);

        tooltip.style('opacity', 0);
      }
    });

    svg.on('touchend mouseleave', () => tooltip.style('opacity', 0));

    // call resize
    d3.select(window).on('resize', function () {
      const newContainerWidth = parseInt(d3.select(selector).style('width'));
      const half = newContainerWidth / 2;
      const plotSelection = d3.select('#plot');

      plotSelection
        .selectAll('.year-backgrounds')
        .selectAll('circle')
        .attr('cx', half);

      plotSelection
        .selectAll('.years')
        .selectAll('text')
        .attr('transform', (d) => `translate(${half}, ${y(d.date)})`);

      plotSelection
        .selectAll('.markers')
        .selectAll('circle')
        .attr('transform', (d) => `translate(${half}, ${y(d.date)})`);

      plotSelection.selectAll('.event-title').attr('x', half);
    });
  }

  function getLeft({ event }) {
    if (
      parseInt(
        `${event.pageX + 0.5 * parseInt(d3.select(`.tooltip`).style('width'))}`
      ) > parseInt(`${parseInt(d3.select('body').style('width'))}`)
    ) {
      return event.pageX - parseInt(d3.select(`.tooltip`).style('width'));
    }

    if (
      parseInt(
        `${event.pageX - 0.5 * parseInt(d3.select(`.tooltip`).style('width'))}`
      ) < 0
    ) {
      return event.pageX;
    }

    return event.pageX - 0.5 * parseInt(d3.select(`.tooltip`).style('width'));
  }

  return { draw };
}

export { twoSidedTimeline };
