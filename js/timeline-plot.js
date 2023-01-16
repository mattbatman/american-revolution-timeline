import * as Plot from '@observablehq/plot';
import * as d3 from 'd3';
import eventData from './event-data';

const timeParser = d3.timeParse('%d %b %Y %I:%M%p');
const parseTime = (date) => timeParser(`${date} 06:00AM`);

function wrangle(data) {
  const wrangled = data.map((d, i) => ({
    ...d,
    align: i % 2 ? 1 : -1,
    date: parseTime(d.date)
  }));

  const yearRange = d3
    .extent(wrangled.map(({ date }) => date))
    .map((d) => d.getFullYear());

  
  const yearsToMark = [...Array((yearRange[1] + 2) - (yearRange[0] - 1))]
  .reduce((acc, cv, i) => {
  if (acc.length === 0) {
    acc.push(yearRange[0]);
    
    return acc;
  }

  acc.push(acc[i - 1] + 1);
  
  return acc
}, [])
  .map(y => ({
    date: new Date(y, 0, 1, 6, 0, 0, 0),
    year: `${y}`
  }));

  return {
    wrangled,
    yearsToMark
  };
}

function timelinePlot() {
  const screenWidth = document.body.clientWidth;
  const screenHeight = document.body.clientHeight;
  const { wrangled, yearsToMark } = wrangle(eventData);

  const options = {
    marks: [
      Plot.dot(yearsToMark, { y: 'date', fill: '#5598E2', r: 15 }),
      Plot.text(yearsToMark, {
        y: 'date',
        text: 'year',
        fill: 'white',
        fontWeight: 'bold'
      }),
      Plot.dot(wrangled, { y: 'date', fill: '#c28080', r: 3 }),
      Plot.text(wrangled, {
        y: 'date',
        text: 'eventName',
        dx: 20,
        textAnchor: 'start',
        filter: (d) => d.align > 0
      }),
      Plot.text(wrangled, {
        y: 'date',
        text: 'eventName',
        dx: -20,
        textAnchor: 'end',
        filter: (d) => d.align < 0
      })
    ],
    y: {
      axis: null,
      reverse: true
    },
    x: {
      axis: null
    },
    width: screenWidth,
    height: Math.max(screenHeight, screen.width * 1.2),
    marginTop: 30,
    marginBottom: 20
  };

  return Plot.plot(options);
}

export { timelinePlot };
