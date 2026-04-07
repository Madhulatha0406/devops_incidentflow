import React from "react";
import { render, screen } from "@testing-library/react";
import App from "../src/App";

jest.mock("../src/api/client", () => ({
  apiRequest: jest.fn()
}));

describe("App", () => {
  beforeEach(() => {
    window.localStorage.clear();
    global.fetch = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue({
        status: "ok",
        databaseMode: "mongo",
        activeColor: "blue",
        featureFlags: {
          incidents: true,
          busTracking: true,
          aiCorrection: true
        }
      })
    });
  });

  test("renders the product headline and login card", () => {
    render(<App />);
    expect(screen.getByText("IncidentFlow")).toBeInTheDocument();
    expect(screen.getByText("Platform Status")).toBeInTheDocument();
    expect(screen.getByText("Access Portal")).toBeInTheDocument();
  });
});
