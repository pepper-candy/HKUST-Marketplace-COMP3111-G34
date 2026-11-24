import { expect, test } from 'vitest'
import { statusTone } from '../src/App.tsx'

const bad_strings: string[] = [
  "cancel",
  "removed",
  "reject",
  "declin",
  "deactivat",
  "not valid",
  "no longer",
  "not finished"
];

const wait_strings: string[] = [
  "pending",
  "in progress",
  "counter",
  "reserv",
//  "borrowed",
  "ready to collect"
];

const ok_strings: string[] = [
  "hello",
  "foo bar baz",
  "i go to school by bus"
]

var testcases = []
for (var i = 0; i < bad_strings.length; ++i) {
  var str = "abcd1234";
  str += bad_strings[i];
  str += "abcd1234";
  testcases.push([str, "bad"]);
}
for (var i = 0; i < wait_strings.length; ++i) {
  var str = "abcd1234";
  str += wait_strings[i];
  str += "abcd1234";
  testcases.push([str, "wait"]);
}
for (var i = 0; i < ok_strings.length; ++i) {
  testcases.push([ok_strings[i], "ok"]);
}
test.for(testcases)('statusTone(%s) -> %s', ([val, expected]) => {
  expect(statusTone(val)).toBe(expected)
})
