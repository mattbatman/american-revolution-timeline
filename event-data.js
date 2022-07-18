import * as d3 from 'd3';

const timeParser = d3.timeParse("%d %b %Y %I:%M%p"); 

const data = [
		{
		date: timeParser('4 Jul 1775' + ' 06:00AM'),
		eventName: "THE START",
		eventDescription: "The fire in Mogo cut all communication in the regi… heard nothing from my family there for 25 hours.",
		sharedOrPersonal: "Shared"
	},
	{
		date: timeParser('4 Jul 1776' + ' 06:00AM'),
		eventName: "Bushfires over New Years",
		eventDescription: "The fire in Mogo cut all communication in the regi… heard nothing from my family there for 25 hours.",
		sharedOrPersonal: "Shared"
	},
		{
		date: timeParser('4 Jul 1783' + ' 06:00AM'),
		eventName: "THE END",
		eventDescription: "My second event",
		sharedOrPersonal: "Personal"
	},
];

export default data;