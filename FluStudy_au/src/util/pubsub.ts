// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import PubSub from "pubsub-js";

// You should put all PubSub events here, as opposed to just using naked
// strings, so that we avoid subtle bugs that come out of typos.  By default,
// events are asynchronously processed;  if you introduce a synchronous event
// (via publishSync(), which calls event handlers synchronously),
// please start the event name with SYNC_ so that it's clear to subscribers
// that they need to think through the implications.
export enum PubSubEvents {
  TITLE_PRESSED = "title_pressed",
}

export type PubSubHandler = (event: PubSubEvents, data?: any) => void;
export type PubSubToken = any;

export class PubSubHub {
  static initialize() {
    if (process.env.NODE_ENV === "development") {
      // @ts-ignore  We set this so that exceptions are thrown inline during
      // development, so that you have a hope of catching the spot in the code
      // that threw.
      PubSub.immediateExceptions = true;
    }
  }

  static subscribe(event: PubSubEvents, handler: PubSubHandler): PubSubToken {
    if (process.env.DEBUG_PUB_SUB_SUBSCRIPTIONS === "true") {
      console.log(`PubSub: Subscribing to ${event}`);
    }
    return PubSub.subscribe(event, handler);
  }

  static unsubscribe(tokenOrFunction: PubSubToken | PubSubHandler) {
    if (process.env.DEBUG_PUB_SUB_SUBSCRIPTIONS === "true") {
      console.log(`PubSub: Unsubscribing ${tokenOrFunction}`);
    }
    PubSub.unsubscribe(tokenOrFunction);
  }

  static publish(event: PubSubEvents, data?: any) {
    if (process.env.DEBUG_PUB_SUB_EVENTS === "true") {
      console.log(`PubSub: Event ${event}, data: ${data}`);
    }
    PubSub.publish(event, data);
  }

  static publishSync(event: PubSubEvents, data?: any) {
    if (process.env.DEBUG_PUB_SUB_EVENTS === "true") {
      console.log(`PubSub: Synchronous Event ${event}, data: ${data}`);
    }
    PubSub.publishSync(event, data);
  }
}
