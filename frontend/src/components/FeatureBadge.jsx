import React from "react";
import { formatModuleState } from "./appConstants";

export function FeatureBadge({ enabled }) {
  return <span className={`feature-badge ${enabled ? "enabled" : "disabled"}`}>{formatModuleState(enabled)}</span>;
}
