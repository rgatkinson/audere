// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

export class LazyAsync<T> {
  private readonly init: () => Promise<T>;
  private instance: Promise<T>;

  constructor(fn: () => Promise<T>) {
    this.init = fn;
  }

  public get(): Promise<T> {
    const existing = this.instance;
    if (existing != null) {
      return existing;
    }

    const created = this.init();
    this.instance = created;
    return created;
  }
}