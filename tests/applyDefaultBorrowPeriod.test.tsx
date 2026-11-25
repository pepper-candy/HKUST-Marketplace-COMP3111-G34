import { expect, test } from 'vitest'
import * as api from "../src/lib/api";
import { applyDefaultBorrowPeriod } from '../src/App.tsx'
import Listing from "../src/App.tsx"
type Listing = api.Listing;

var s;
var e;

function set_s(val: any)
{
	s = val;
}

function set_e(val: any)
{
	e = val;
}



function wrapper(input?: Listing)
{
	var s;
	var e;

	applyDefaultBorrowPeriod(
		function(val: string){s = val;},
		function(val: string){e = val;},
		input
	);

	return [s, e];
}

function date2str(d: Date)
{
	var str = "";

	str += d.getFullYear();
	str += "-";
	var m = d.getMonth()+1;
	str += m >= 10 ? "" : "0";
	str += m;
	str += "-";
	var dt = d.getDate();
	str += dt >= 10 ? "" : "0";
	str += dt;
	str += "T";
	var h = d.getHours();
	str += h >= 10 ? "" : "0";
	str += h;
	str += ":";
	var min = d.getMinutes();
	str += min >= 10 ? min : "00";
	str += ":00";

	return str;
}

var today = new Date();
today.setSeconds(0);
today.setMinutes(Math.floor((today.getMinutes() + 10)/10)*10);
today.setHours(today.getHours() + 1);

var tomorrow = structuredClone(today);
tomorrow.setDate(tomorrow.getDate() + 1);

test('applyDefaultBorrowPeriod', () => {
  expect(wrapper()).toEqual([date2str(today), date2str(tomorrow)])
})
