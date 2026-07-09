import { describe, expect, it } from "vitest";

import { DEFAULT_REQUEST_FORM } from "../types/requestForm.types";

import { validateRequestForm } from "./request.validation";

describe("validateRequestForm", () => {
  it("collects category and image errors alongside base request validation", () => {
    const result = validateRequestForm({
      form: {
        ...DEFAULT_REQUEST_FORM,
        title: "Help",
        description: "Short",
        budget: "-5",
      },
      location: null,
      selectedImages: [],
      requireAtLeastOneImage: true,
    });

    expect(result.isValid).toBe(false);
    expect(result.fieldErrors.title).toBe("Title must be at least 5 characters.");
    expect(result.fieldErrors.description).toBe("Description must be at least 20 characters.");
    expect(result.fieldErrors.categoryId).toBe("Please choose a category.");
    expect(result.fieldErrors.location).toBe("Please choose a location.");
    expect(result.fieldErrors.budget).toBe("Budget must be a valid number greater than 0.");
    expect(result.fieldErrors.images).toBe("Please add at least one photo.");
    expect(result.formError).toBe("Title must be at least 5 characters.");
  });

  it("passes when form content, category, location, and image requirements are satisfied", () => {
    const result = validateRequestForm({
      form: {
        ...DEFAULT_REQUEST_FORM,
        title: "Need grocery pickup",
        description: "Need help with grocery pickup and delivery later tonight.",
        categoryId: "errands-id",
        budget: "25",
      },
      location: {
        latitude: 60.17,
        longitude: 24.93,
        city: "Helsinki",
        country: "Finland",
      },
      selectedImages: [{ uri: "file://photo.jpg" }],
      requireAtLeastOneImage: true,
    });

    expect(result.isValid).toBe(true);
    expect(result.fieldErrors).toEqual({});
    expect(result.formError).toBeNull();
  });
});
