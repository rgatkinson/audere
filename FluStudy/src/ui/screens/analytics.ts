// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { EventInfoKind } from "audere-lib/feverProtocol";
import { events } from "../../store";

let interacted = false;

export function timestampInteraction(refId: string) {
  console.log(`timestampInteraction: ${refId}`);
  events.fireNow(EventInfoKind.Interaction, refId);
  interacted = true;
}

// We only record the time of the first render after an interaction.
export function timestampRender(
  refId: string,
  element: JSX.Element
): JSX.Element {
  if (interacted) {
    console.log(`timestampRender: ${refId}`);
    events.fireNow(EventInfoKind.Render, refId);
    interacted = false;
  }
  return element;
}
