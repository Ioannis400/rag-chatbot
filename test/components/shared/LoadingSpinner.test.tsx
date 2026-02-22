import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

describe("LoadingSpinner", () => {
  it("renders", () => {
    render(<LoadingSpinner />);
    const el = document.querySelector(".animate-spin");
    expect(el).toBeInTheDocument();
  });

  it("accepts className", () => {
    render(<LoadingSpinner className="custom" />);
    const el = document.querySelector(".custom");
    expect(el).toBeInTheDocument();
  });
});
