import { getSql } from "../../../src/util/sql";
import { AuthManager } from "../../../src/endpoints/webPortal/auth";
import { defineSiteUserModels } from "../../../src/endpoints/webPortal/models";

describe("authManager", () => {
  describe("authorize", () => {
    let authManager: AuthManager, userModels;
    beforeAll(async done => {
      const sql = getSql();
      authManager = new AuthManager(sql);
      userModels = defineSiteUserModels(sql);
      authManager.createUser("auth_test_user1", "password");
      authManager.createUser("auth_test_user2", "password");
      done();
    });

    afterAll(async done => {
      await Promise.all([
        authManager.deleteUser("auth_test_user1"),
        authManager.deleteUser("auth_test_user2"),
      ]);
      done();
    });

    it("rejects unauthorized users", async () => {
      expect(
        await authManager.authorize("auth_test_user1", "some_permission")
      ).toBe(false);
      expect(
        await authManager.authorize("auth_test_user2", "some_permission")
      ).toBe(false);
    });

    it("allows an authorized user", async () => {
      await authManager.grantPermission("auth_test_user1", "some_permission");
      expect(
        await authManager.authorize("auth_test_user1", "some_permission")
      ).toBe(true);
      expect(
        await authManager.authorize("auth_test_user1", "some_other_permission")
      ).toBe(false);
      expect(
        await authManager.authorize("auth_test_user2", "some_permission")
      ).toBe(false);
      await authManager.revokePermission("auth_test_user1", "some_permission");
    });

    it("reject an unknown user", async () => {
      expect(await authManager.authorize("fake_user", "some_permission")).toBe(
        false
      );
    });
  });
});
