import React from "react";
import { render, screen } from "@testing-library/react";
import App from "../src/App";

jest.mock("../src/api/client", () => ({
  apiRequest: jest.fn()
}));

describe("App", () => {
  test("renders the product headline and login card", () => {
    render(<App />);
    expect(screen.getByText("IncidentFlow+")).toBeInTheDocument();
    expect(screen.getByText("Demo Access")).toBeInTheDocument();
    expect(screen.getByText("Smart Bus Tracking")).toBeInTheDocument();
  });
});
