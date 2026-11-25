import { expect, test } from 'vitest'
import { isStaleOfferBubble } from '../src/App.tsx'


var message_non_offer = {kind: "chat"};
var message_declined = {kind: "offer", offerStatus: "Declined"};
var message_neither = {kind: "offer", offerStatus: "Pending", id: 0, body: "body"};

var message_branch = {kind: "message", body: "__HKUST_OFFER_DECLINED__:body"};

var dummy_msg = [message_neither];
var dummy_msg2 = [message_neither, message_branch];

function wrapper(v1: any, v2: any)
{
  return isStaleOfferBubble(v1, v2);
}

var testcases = [
  [message_non_offer, [], false],
  [message_declined, [], true],
  [message_neither, dummy_msg, false],
  [message_neither, dummy_msg2, true],
]

test.for(testcases)('isStaleOfferBubble(%s, %s) -> %s', ([v1, v2, expected]) => {
  expect(wrapper(v1, v2)).toEqual(expected)
})

