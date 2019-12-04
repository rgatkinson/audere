// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import {
  ChillsModels,
  defineChillsModels,
  ShippedKitAttributes,
} from "../../models/db/chills";
import { generateRandomKey, pbkdf2 } from "../../util/crypto";
import { SplitSql } from "../../util/sql";
import { ShippedKit } from "../../external/evidationKitClient";

// Referred to as AchievementInfo in the client app
export interface KitInfo {
  email: string;
  emailHash: string;
  emailSalt: string;
  state: string;
  city: string;
}

/**
 * Data access for shipped kits in the Chills project
 */
export class ChillsKits {
  private readonly FILLER_CHAR = "*";
  private readonly models: ChillsModels;
  private readonly sql: SplitSql;

  constructor(sql: SplitSql) {
    this.models = defineChillsModels(sql);
    this.sql = sql;
  }

  private maskEmail(email: string): string {
    const atIndex = email.indexOf("@");
    if (atIndex > 0) {
      const start = atIndex > 1 ? email[0] : this.FILLER_CHAR;
      const middle = atIndex > 2 ? this.FILLER_CHAR.repeat(atIndex - 2) : "";
      const end =
        atIndex > 3 ? email[atIndex - 1] : atIndex > 1 ? this.FILLER_CHAR : "";
      const hint = start + middle + end + email.substring(atIndex);

      return hint;
    } else {
      throw Error("Can not mask email address, no at symbol was present");
    }
  }

  /**
   * Save shipped kits to the database.
   *
   * @param kits
   * @param demoKits
   */
  public async importKits(
    kits: ShippedKit[],
    demoKits: ShippedKit[]
  ): Promise<void> {
    const merged: ShippedKitAttributes[] = [];

    kits.forEach(kit => {
      const attributes = {
        evidationId: kit.identifier,
        barcode: kit.accessionNumber,
        email: kit.email,
        birthdate: kit.birthdate,
        sex: kit.sex,
        city: kit.city,
        state: kit.state,
        postalCode: kit.postalCode,
        orderedAt: kit.orderedAt,
        demo: false,
      };

      merged.push(attributes);
    });

    demoKits.forEach(kit => {
      const attributes = {
        evidationId: kit.identifier,
        barcode: kit.accessionNumber,
        email: kit.email,
        birthdate: kit.birthdate,
        sex: kit.sex,
        city: kit.city,
        state: kit.state,
        postalCode: kit.postalCode,
        orderedAt: kit.orderedAt,
        demo: true,
      };

      merged.push(attributes);
    });

    await this.sql.nonPii.transaction(async t => {
      await this.models.shippedKits.destroy({ where: {}, transaction: t });
      await this.models.shippedKits.bulkCreate(merged, { transaction: t });
    });
  }

  /**
   * Searches for a shipped kit by barcode and matches to an id by writing a
   * matching record in the database.
   *
   * @param barcode Barcode input by the user.
   * @param identifier Document id for the user's survey.
   * @param demo Whether the survey is for demonstration purposes.
   */
  public async matchKit(
    barcode: string,
    identifier: string,
    demo: boolean
  ): Promise<KitInfo> {
    const kit = await this.models.shippedKits.findOne({
      where: {
        barcode,
        demo,
      },
    });

    if (kit != null) {
      // Match the input to the kit data for posterity
      await this.models.matchedKits.upsert({
        barcode: barcode,
        identifier: identifier,
      });

      const salt = await generateRandomKey(16);
      const hash = await pbkdf2(kit.email.toLowerCase(), salt);

      return {
        email: this.maskEmail(kit.email),
        emailHash: hash,
        emailSalt: salt,
        state: kit.state,
        city: kit.city,
      };
    } else {
      return null;
    }
  }
}
