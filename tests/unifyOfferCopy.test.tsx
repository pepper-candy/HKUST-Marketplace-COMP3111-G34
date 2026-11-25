import {expect, test} from 'vitest'
import {unifyOfferCopy} from '../src/App.tsx'

var testcases = [
	["Propose: abcd1234", "Lend", "Propose: abcd1234"],
	["Proposed price: foobarbazFormal offer: ", "Sell", "Offer: foobarbazFormal offer: "],
	["Formal counter: Formal offer: Proposed price: Seller counter", "Sell", "Offer: Formal offer: Proposed price: Seller counter"],
	["Formal counter: Formal offer: Proposed price: Seller counter", "Lend", "Borrow request: Formal offer: Proposed price: Seller counter"]
]

test.for(testcases)('unifyOfferCopy(%s, %s) -> %s', ([val1, val2, expected]) => {
  expect(unifyOfferCopy(val1, val2)).toBe(expected)
})
