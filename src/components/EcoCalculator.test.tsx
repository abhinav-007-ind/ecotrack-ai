import { render, screen } from "@testing-library/react";
import { describe, test, expect } from "vitest";
import EcoCalculator from "./EcoCalculator";

describe("EcoCalculator", () => {
  test("renders calculator heading", () => {
    render(<EcoCalculator />);
    expect(screen.getByText(/calculator/i)).toBeTruthy();
  });
});
