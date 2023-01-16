import '../styles/main.css';

// import { timeline } from './timeline';
import { timelinePlot } from './timeline-plot';

function main() {
  // const americanRevolutionTimeline = timeline();
  // americanRevolutionTimeline.draw();
  const chart = document.getElementById('timeline');

  chart.append(timelinePlot())
}

main();
