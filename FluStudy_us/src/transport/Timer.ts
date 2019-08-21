// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

export class Timer {
  private readonly callback: () => void;
  private readonly duration: number;
  private id: NodeJS.Timeout | null;

  constructor(callback: () => void, duration: number) {
    this.callback = callback;
    this.duration = duration;
    this.id = null;
  }

  public start(): void {
    if (this.id == null) {
      this.id = global.setTimeout(this.fire, this.duration);
    }
  }

  public cancel(): void {
    if (this.id != null) {
      clearTimeout(this.id);
      this.id = null;
    }
  }

  private fire = () => {
    this.id = null;
    this.callback();
  };
}
