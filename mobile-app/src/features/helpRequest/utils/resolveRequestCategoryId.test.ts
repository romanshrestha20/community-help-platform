import { describe, expect, it } from "vitest";

import { resolveRequestCategoryId } from "./resolveRequestCategoryId";

describe("resolveRequestCategoryId", () => {
  it("prefers explicit categoryId, then category.id, then category slug lookup", () => {
    expect(
      resolveRequestCategoryId(
        { categoryId: "direct-id", category: { id: "cat-id", name: "Errands", slug: "errands" } },
        [{ id: "lookup-id", name: "Errands", slug: "errands" }]
      )
    ).toBe("direct-id");

    expect(
      resolveRequestCategoryId(
        { categoryId: "", category: { id: "cat-id", name: "Errands", slug: "errands" } },
        [{ id: "lookup-id", name: "Errands", slug: "errands" }]
      )
    ).toBe("cat-id");

    expect(
      resolveRequestCategoryId(
        { categoryId: null, category: { id: "", name: "Errands", slug: "errands" } },
        [{ id: "lookup-id", name: "Errands", slug: "errands" }]
      )
    ).toBe("lookup-id");

    expect(resolveRequestCategoryId({ categoryId: null, category: null }, [])).toBe("");
  });
});
