import { expect, test } from 'vitest'
import { chatOffersForListing } from '../src/App.tsx'

var listing_giveaway = {type: "Sell"};
var listing_sell = {type: "Sell"};

const message_offer1 = {kind: "offer", sender: "buyer", body: "body1", id:0};
const message_offer2 = {kind: "offer", sender: "seller", body: "body2", id:1};
const message_nonoffer1 = {kind: "chat", sender: "buyer", body: "body3", id:2};
const message_nonoffer2 = {kind: "chat", sender: "seller", body: "body4", id:3};

var testcases = [
  [
    listing_sell,
    [],
    "foobar123",
    "seller",
    []
  ],
  [
    listing_giveaway,
    [message_offer1, message_nonoffer1, message_nonoffer2],
    "pootis.spencer",
    "buyer",
    [{buyer: "pootis.spencer", detail: "body1", id: "chat-0", status: "Pending", type: "Offer"}]
  ],
  [
    listing_giveaway,
    [message_offer1, message_nonoffer1, message_nonoffer2, message_offer2],
    "bucket.of.chicken",
    "seller",
    [{buyer: "bucket.of.chicken", detail: "body1", id: "chat-0", status: "Pending", type: "Offer"}, {buyer: "bucket.of.chicken", detail: "body2", id: "chat-1", status: "Pending", type: "Offer"}]
  ]
];

test.for(testcases)('chatOffersForListing(%s, %s, %s, %s) -> %s', ([v1, v2, v3, v4, expected]) => {
  expect(chatOffersForListing(v1, v2, v3, v4)).toEqual(expected)
})
