// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { EventInfoKind } from "audere-lib/feverProtocol";
import { events } from "../../store";

export function timestampInteraction(refId: string) {
  events.fireNow(EventInfoKind.Interaction, refId);
}

export function timestampRender(
  refId: string,
  element: JSX.Element
): JSX.Element {
  events.fireNow(EventInfoKind.Render, refId);
  return element;
}
