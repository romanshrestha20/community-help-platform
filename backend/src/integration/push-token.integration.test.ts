import { describe, expect, it } from "vitest";

import {
  deletePushTokenForUser,
  getPushTokensForUser,
  upsertPushTokenForUser,
} from "../services/push-token.service.js";
import { createUser } from "./test-helpers.js";

describe("push-token integration", () => {
  it("stores, reassigns, lists, and deletes push tokens using the real database", async () => {
    const firstUser = await createUser();
    const secondUser = await createUser();
    const token = "ExponentPushToken[integration-token]";

    await upsertPushTokenForUser({
      userId: firstUser.id,
      token: ` ${token} `,
      platform: "ios",
    });

    expect(await getPushTokensForUser(firstUser.id)).toEqual([{ token }]);

    await upsertPushTokenForUser({
      userId: secondUser.id,
      token,
      platform: "android",
    });

    expect(await getPushTokensForUser(firstUser.id)).toEqual([]);
    expect(await getPushTokensForUser(secondUser.id)).toEqual([{ token }]);

    await deletePushTokenForUser(secondUser.id, token);
    expect(await getPushTokensForUser(secondUser.id)).toEqual([]);
  });
});
