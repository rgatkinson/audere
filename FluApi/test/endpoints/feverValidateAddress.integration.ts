import { anything, mock, instance, when } from "ts-mockito";
import { AddressInfo, AddressInfoUse } from "audere-lib/feverProtocol";
import { FeverValidateAddress } from "../../src/endpoints/feverValidateAddress";
import { createSplitSql, SplitSql } from "../../src/util/sql";
import { defineFeverModels, FeverModels } from "../../src/models/db/fever";
import { GeocodingService } from "../../src/services/geocodingService";
import { LazyAsync } from "../../src/util/lazyAsync";
import { feverSurveyPii, makeCSRUID } from "../util/sample_data";

const address: AddressInfo = {
  use: AddressInfoUse.Home,
  firstName: "Frasier",
  lastName: "Crane",
  line: ["123 Sesame St."],
  city: "Seattle",
  state: "WA",
  postalCode: "98109",
  country: "US"
};
const geocodedAddress = {
  canonicalAddress: "Home",
  address1: "123 SESAME ST",
  city: "SEATTLE",
  state: "WA",
  postalCode: "98109",
  latitude: 0,
  longitude: 0
};

describe("feverValidateAddress", () => {
  let sql: SplitSql;
  let fever: FeverModels;
  let endpoint: FeverValidateAddress;
  let mockGeocoder;

  beforeAll(async done => {
    sql = createSplitSql();
    fever = defineFeverModels(sql);
    mockGeocoder = mock(GeocodingService);
    endpoint = new FeverValidateAddress(
      sql,
      new LazyAsync(async () => instance(mockGeocoder))
    );

    const geocoderResponse = [
      {
        id: "1_home",
        use: AddressInfoUse.Home,
        address: geocodedAddress
      }
    ];
    when(mockGeocoder.geocodeAddresses(anything())).thenReturn(
      geocoderResponse
    );
    done();
  });

  it("finds duplicate addresses", async () => {
    const csruid = makeCSRUID("blah blah");
    const pii = feverSurveyPii(csruid);
    pii.survey.patient.address = [address];
    await fever.surveyPii.destroy({
      where: { csruid }
    });
    const survey = await fever.surveyPii.create(pii);

    const result = await endpoint.validateAndCheckDuplicates(
      {
        ...address,
        address: address.line[0]
      },
      ""
    );

    try {
      expect(result.duplicate).toBe(true);
    } finally {
      await survey.destroy();
    }
  });
});
