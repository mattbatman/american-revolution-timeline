import * as d3 from 'd3';
import rawEventData from './event-data';
import { parseTime } from './time-parse';

import { twoSidedTimeline } from './timeline';

import '../styles/main.css';

function main() {
  const eventData = rawEventData.map((d) => ({
    ...d,
    date: parseTime(d.date)
  }));

  const yearRange = d3
    .extent(eventData.map(({ date }) => date))
    .map((d) => d.getFullYear());

  const yearsToMark = [...Array(yearRange[1] + 2 - (yearRange[0] - 1))]
    .reduce((acc, cv, i) => {
      if (acc.length === 0) {
        acc.push(yearRange[0]);

        return acc;
      }

      acc.push(acc[i - 1] + 1);

      return acc;
    }, [])
    .map((y) => ({
      date: new Date(y, 0, 1, 6, 0, 0, 0),
      year: `${y}`
    }));

  const americanRevolutionTimeline = twoSidedTimeline();
  americanRevolutionTimeline.draw({
    eventData,
    yearsToMark,
    selector: '#timeline'
  });
}

main();
