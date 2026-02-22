import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChatMessage } from "@/components/chat/ChatMessage";

describe("ChatMessage", () => {
  it("renders user message", () => {
    render(<ChatMessage content="Hallo" role="user" />);
    expect(screen.getByText("Hallo")).toBeInTheDocument();
  });

  it("renders assistant message with markdown", () => {
    render(<ChatMessage content="**Fett**" role="assistant" />);
    expect(screen.getByText("Fett")).toBeInTheDocument();
  });

  it("shows streaming cursor when isStreaming", () => {
    render(<ChatMessage content="..." role="assistant" isStreaming />);
    const cursor = document.querySelector(".animate-pulse");
    expect(cursor).toBeInTheDocument();
  });
});
