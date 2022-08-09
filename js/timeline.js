import * as d3 from 'd3';
import rawEventData from './event-data';
import timespanData from './timespan-data';

function timeline() {
  const selector = '#timeline';
  const spaceBetweenMarkerAndEventName = 16;
  const spaceBetweenMarkerAndEventNameSmallScreen = 12;
  // axisLeft is the spacing between the y axis label (e.g. year) and y axis line
  const axisLeft = 100;
  const axisLeftSmallScreen = 75;
  // bottom margin keeps the last item in the timeline on the screen
  // top margin seems to affect the centering of the chart
  const spacingConfig = {
    smallScreenSize: 768,
    mediumScreenSize: 940,
    smallScreenMargin: {
      top: 60,
      right: 0,
      bottom: 50,
      left: 30,
    },
    normalMargin: {
      left: 60,
      right: 0,
      top: 10,
      bottom: 50,
    }
  };

  const marker = {
    radius: 4
  };

  // color configuration
  const markerDefaultColor = '#5598E2';
  const markerWarColor = '#c28080';
  const markerSelectedColor = '#c28080';
  const markerFadedColor = '#eedddd';
  const labelDefaultColor = '#093B72';
  const labelSelectedColor = '#5b1a1a';
  const labelFadedColor = '#eedddd';
  const labelWarColor = '#5b1a1a';

  const timeParser = d3.timeParse('%d %b %Y %I:%M%p');

  const eventData = rawEventData.map((d) => ({
    ...d,
    date: parseTime(d.date)
  }));

  function draw() {
    const containerWidth = parseInt(d3.select(selector).style('width'));
    const containerHeight = d3.max([
      parseInt(d3.select(selector).style('height')),
      (1783 - 1775) * 150
    ]);
    const width =
      containerWidth -
      spacingConfig.normalMargin.left -
      spacingConfig.normalMargin.right;
    const height =
      containerHeight -
      spacingConfig.normalMargin.top -
      spacingConfig.normalMargin.bottom;

    const plotArea = {
      x: spacingConfig.normalMargin.left,
      y: spacingConfig.normalMargin.top,
      width,
      height
    };

    // create the skeleton of the chart
    const svg = d3
      .select(selector)
      .append('svg')
      .attr('width', '100%')
      .attr('height', containerHeight)
      .append('g')
      .attr(
        'transform',
        'translate(' +
          spacingConfig.normalMargin.left +
          ', ' +
          spacingConfig.normalMargin.top +
          ')'
      );

    const chartBackground = svg
      .append('rect')
      .attr('id', 'chart-background')
      .attr('fill', '#fff') // fallback for CSS
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', width)
      .attr('height', height);

    const plot = svg
      .append('g')
      .attr('id', 'plot')
      .attr(
        'transform',
        `translate(${
          width >= spacingConfig.smallScreenSize
            ? plotArea.x
            : spacingConfig.smallScreenMargin.left
        }, ${plotArea.y})`
      );

    const y = d3
      .scaleUtc()
      .domain(d3.extent(eventData, (d) => d.date))
      .range([plotArea.y, plotArea.height]);
    
    const tickPaddingAndSize = width >= spacingConfig.smallScreenSize
      ? -axisLeft
      : -axisLeftSmallScreen;

    const yAxis = d3
      .axisRight(y)
      // would draw a line to the right of top and bottom of axis
      .tickSizeOuter(0)
      // creates the from the tick label to the y axis 
      .tickPadding(tickPaddingAndSize)
      .tickSizeInner(tickPaddingAndSize);

    const gy = plot
      .append('g')
      .attr('id', 'y-axis')
      .attr('class', 'axis')
      .call(yAxis)
      .attr('aria-hidden', 'true')
      .call((g) => {
        return g.selectAll('.tick text').call(halo);
      });

    const markers = plot
      .append('g')
      .attr('class', 'markers')
      .selectAll('circle')
      .data(eventData)
      .join('circle')
      .attr('transform', (d) => `translate(0, ${y(d.date)})`)
      .attr('aria-hidden', 'true')
      .attr('fill', (d) =>
        d.isWar
          ? markerWarColor
          : markerDefaultColor
      )
      .attr('stroke', (d) =>
        d.isWar
          ? markerWarColor
          : markerDefaultColor
      )
      .attr('cx', 0.5)
      .attr('cy', marker.radius / 2 + 0.5)
      .attr('r', marker.radius);

    const dodgedYValues = dodge(
      eventData.map((d) => y(d.date)),
      16
    );

    const eventLabels = plot
      .append('g')
      .attr('class', 'eventLabels')
      .selectAll('text')
      .data((d) => d3.zip(eventData, dodgedYValues))
      .join('text')
      .attr('class', 'event-title')
      .style('font-weight', '400')
      .style('fill', ([d]) =>
        d.isWar
          ? labelWarColor
          : labelDefaultColor
      )
      .attr(
        'x',
        width >= spacingConfig.smallScreenSize
          ? spaceBetweenMarkerAndEventName
          : spaceBetweenMarkerAndEventNameSmallScreen
      )
      .attr('y', ([, y]) => y)
      .attr('dy', '0.35em');

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
        .attr('fill', (d) =>
          d.isWar
            ? markerWarColor
            : markerDefaultColor
        )
        .attr('stroke', (d) =>
          d.isWar
            ? markerWarColor
            : markerDefaultColor
        );

      eventLabels.style('opacity', 1);
    });

    svg.on('touchmove mousemove', function (event) {
      const mouseY = d3.pointer(event, this)[1];
      const nearestEventY = rangeY.reduce((a, b) =>
        Math.abs(b - mouseY) < Math.abs(a - mouseY) ? b : a
      );
      const dodgedIndex = rangeY.indexOf(nearestEventY);
      const dataEvent = eventData[dodgedIndex];

      const distance = Math.abs(mouseY - nearestEventY);

      if (mouseY >= rangeY0 - fuzzyTextHeightAdjustment && distance < 10) {
        eventLabels.filter((d, i) => i !== dodgedIndex).style('opacity', 0.3);

        eventLabels.filter((d, i) => i === dodgedIndex).style('opacity', 1);

        markers
          .filter((d, i) => i !== dodgedIndex)
          .attr('fill', markerFadedColor)
          .attr('stroke', markerFadedColor);

        markers
          .filter((d, i) => i === dodgedIndex)
          .attr('fill', (d) =>
            d.isWar
              ? markerWarColor
              : markerDefaultColor
          )
          .attr('stroke', (d) =>
            d.isWar
              ? markerWarColor
              : markerDefaultColor
          )
          .raise();

        tooltip.style('opacity', 1);
        tooltip.style(
          'transform',
          `translate(${
            width >= spacingConfig.smallScreenSize ? plotArea.x + 8 : 0
          }px, calc(${nearestEventY - 7}px))`
        );
        tooltip
          .select('#date')
          .text(d3.timeFormat('%A, %e %B, %Y')(dataEvent.date));
        tooltip.select('#name').text(dataEvent.eventName);
        tooltip.select('#description').text(dataEvent.eventDescription);
      } else {
        markers
          .attr('fill', (d) =>
            d.isWar
              ? markerWarColor
              : markerDefaultColor
          )
          .attr('stroke', (d) =>
            d.isWar
              ? markerWarColor
              : markerDefaultColor
          );

        eventLabels.style('opacity', 1);

        tooltip.style('opacity', 0)
      }
    });

    svg.on('touchend mouseleave', () => tooltip.style('opacity', 0));
  }

  function halo(text) {
    const backgroundColor = '#FAF9FB';

    text
      .clone(true)
      .each(function () {
        this.parentNode.insertBefore(this, this.previousSibling);
      })
      .attr('aria-hidden', 'true')
      .attr('fill', 'none')
      .attr('stroke', backgroundColor)
      .attr('stroke-width', 24)
      .attr('stroke-linecap', 'round')
      .attr('stroke-linejoin', 'round')
      .style(
        'text-shadow',
        `-1px -1px 2px ${backgroundColor}, 1px 1px 2px ${backgroundColor}, -1px 1px 2px ${backgroundColor}, 1px -1px 2px ${backgroundColor}`
      );
  }

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

  function parseTime(date) {
    // adjusting to 6AM instead of midnight aligns first of month circles with axis tick markers
    return timeParser(`${date} 06:00AM`);
  }

  /**
   * generateAnnotations uses the timespanData to create a secondary line to the
   * right of the main timeline, referred to as an annotation. A line is drawn
   * spanning two points with a label. 
   */
  function generateAnnotations() {
    const annotationDefaultColor = '#CADFF7';
    const annotationPersonalColor = '#eedddd';
    const annotationsLeftMargin = plotArea.x + 240 + 24;

    const annotations = plot
      .append('g')
      .attr('class', 'annotations')
      .selectAll('g')
      .data(timespanData)
      .join('g');

    annotations
      .append('line')
      .attr('aria-hidden', 'true')
      .attr('stroke', annotationDefaultColor)
      .attr('stroke-width', 3)
      .attr('x1', annotationsLeftMargin)
      .attr('x2', annotationsLeftMargin)
      .attr('y1', (d) => y(d.startDate))
      .attr('y2', (d) => y(d.endDate));

    annotations
      .append('text')
      .attr('x', annotationsLeftMargin + 24)
      .attr('y', (d) => y(d.startDate))
      .attr('dy', '0.7em')
      .style('font-size', 16)
      .style('font-weight', 600)
      .text((d) => (width >= spacingConfig.mediumScreenSize ? d.name : ''));

    annotations
      .append('text')
      .attr('x', annotationsLeftMargin + 24)
      .attr('y', (d) => y(d.startDate))
      .attr('dy', '2.0em')
      .style('font-size', 16)
      .style('font-weight', 400)
      .text((d) =>
        width >= spacingConfig.mediumScreenSize
          ? d3.timeFormat('%e %b')(d.startDate) +
            ' – ' +
            d3.timeFormat('%e %b')(d.endDate)
          : ''
      );
  }

  return {
    draw
  };
}

export { timeline };
