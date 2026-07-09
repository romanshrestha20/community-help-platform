import { describe, expect, it } from "vitest";

import { APP_ROUTES } from "./routes";

describe("APP_ROUTES", () => {
  it("returns stable route strings for static paths", () => {
    expect(APP_ROUTES.HOME).toBe("/home");
    expect(APP_ROUTES.PROFILE_REQUESTS).toBe("/profile/requests");
    expect(APP_ROUTES.AUTH_LOGIN).toBe("/(auth)/login");
  });

  it("builds dynamic request detail and edit paths", () => {
    expect(APP_ROUTES.HOME_REQUEST_DETAILS("req-1")).toBe("/home/requests/req-1");
    expect(APP_ROUTES.HOME_REQUEST_EDIT("req-1")).toBe("/home/requests/req-1/edit");
    expect(APP_ROUTES.FAVORITES_REQUEST_DETAILS("req-1")).toBe("/favorites/requests/req-1");
    expect(APP_ROUTES.PROFILE_REQUEST_DETAILS("req-1")).toBe("/profile/requests/req-1");
    expect(APP_ROUTES.PROFILE_REQUEST_EDIT("req-1")).toBe("/profile/requests/req-1/edit");
  });
});
