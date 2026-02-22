import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarBadge,
  AvatarGroup,
  AvatarGroupCount,
} from "@/components/ui/avatar";

describe("Avatar", () => {
  it("renders Avatar with AvatarFallback", () => {
    render(
      <Avatar>
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>
    );
    expect(screen.getByText("AB")).toBeInTheDocument();
  });

  it("renders Avatar with AvatarImage and fallback", () => {
    render(
      <Avatar>
        <AvatarImage src="/test.png" alt="Test" />
        <AvatarFallback>FB</AvatarFallback>
      </Avatar>
    );
    expect(screen.getByText("FB")).toBeInTheDocument();
  });

  it("renders AvatarBadge", () => {
    render(
      <Avatar>
        <AvatarFallback>X</AvatarFallback>
        <AvatarBadge data-testid="badge">1</AvatarBadge>
      </Avatar>
    );
    expect(screen.getByTestId("badge")).toBeInTheDocument();
    expect(screen.getByTestId("badge")).toHaveTextContent("1");
  });

  it("renders AvatarGroup", () => {
    render(
      <AvatarGroup data-testid="group">
        <Avatar>
          <AvatarFallback>A</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarFallback>B</AvatarFallback>
        </Avatar>
      </AvatarGroup>
    );
    expect(screen.getByTestId("group")).toBeInTheDocument();
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
  });

  it("renders AvatarGroupCount", () => {
    render(
      <AvatarGroup>
        <Avatar>
          <AvatarFallback>X</AvatarFallback>
        </Avatar>
        <AvatarGroupCount data-testid="count">+5</AvatarGroupCount>
      </AvatarGroup>
    );
    expect(screen.getByTestId("count")).toBeInTheDocument();
    expect(screen.getByTestId("count")).toHaveTextContent("+5");
  });
});
