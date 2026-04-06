import { describe, expect, it } from "vitest";

import { resolveApiBaseUrl } from "./lib/api";

describe("resolveApiBaseUrl", () => {
  it("prefers an explicit environment override", () => {
    expect(resolveApiBaseUrl("https://api.apex.test/v1", null)).toBe("https://api.apex.test/v1");
  });

  it("reuses the active browser hostname for local development", () => {
    const location = {
      protocol: "http:",
      hostname: "127.0.0.1",
    } as Location;

    expect(resolveApiBaseUrl(undefined, location)).toBe("http://127.0.0.1:8000/v1");
  });
});
