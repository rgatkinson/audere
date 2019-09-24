import { createSplitSql } from "../../../src/util/sql";
import { AuthManager, Permission } from "../../../src/endpoints/webPortal/auth";
import { defineSiteUserModels } from "../../../src/endpoints/webPortal/models";

const SOME_PERMISSION = Permission.COUGH_GIFTCARD_UPLOAD;
const SOME_OTHER_PERMISSION = Permission.COUGH_RDT_PHOTOS_ACCESS;

describe("authManager", () => {
  describe("authorize", () => {
    let authManager: AuthManager, userModels;
    beforeAll(async done => {
      const sql = createSplitSql();
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
        await authManager.authorize("auth_test_user1", SOME_PERMISSION)
      ).toBe(false);
      expect(
        await authManager.authorize("auth_test_user2", SOME_PERMISSION)
      ).toBe(false);
    });

    it("allows an authorized user", async () => {
      await authManager.grantPermission("auth_test_user1", SOME_PERMISSION);
      expect(
        await authManager.authorize("auth_test_user1", SOME_PERMISSION)
      ).toBe(true);
      expect(
        await authManager.authorize("auth_test_user1", SOME_OTHER_PERMISSION)
      ).toBe(false);
      expect(
        await authManager.authorize("auth_test_user2", SOME_PERMISSION)
      ).toBe(false);
      await authManager.revokePermission("auth_test_user1", SOME_PERMISSION);
    });

    it("reject an unknown user", async () => {
      expect(await authManager.authorize("fake_user", SOME_PERMISSION)).toBe(
        false
      );
    });
  });
});
