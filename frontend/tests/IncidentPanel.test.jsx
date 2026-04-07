import React from "react";
import { render, screen } from "@testing-library/react";
import { IncidentPanel } from "../src/components/IncidentPanel";

const baseProps = {
  featureEnabled: true,
  incidents: [],
  technicians: [],
  onCreateIncident: jest.fn(),
  onAssign: jest.fn(),
  onUpdateStatus: jest.fn(),
  actionBusy: false
};

describe("IncidentPanel", () => {
  test("shows the report form for students", () => {
    render(
      <IncidentPanel
        {...baseProps}
        session={{
          user: {
            _id: "student-1",
            role: "student"
          }
        }}
      />
    );

    expect(screen.getByRole("button", { name: "Report incident" })).toBeInTheDocument();
  });

  test("hides the report form for admins", () => {
    render(
      <IncidentPanel
        {...baseProps}
        session={{
          user: {
            _id: "admin-1",
            role: "admin"
          }
        }}
      />
    );

    expect(screen.queryByRole("button", { name: "Report incident" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show previous issues" })).toBeInTheDocument();
  });
});
