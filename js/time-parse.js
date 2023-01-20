import * as d3 from 'd3';

const timeParser = d3.timeParse('%d %b %Y %I:%M%p');

// adjusting to 6AM instead of midnight aligns first of month circles with axis tick markers
const parseTime = (date) => timeParser(`${date} 06:00AM`);

export { parseTime, timeParser };
