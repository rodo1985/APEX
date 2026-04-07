import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";

// Ensure each test starts from a fresh DOM tree so page-level async effects
// do not leak rendered state into the next assertion.
afterEach(() => {
  cleanup();
});
