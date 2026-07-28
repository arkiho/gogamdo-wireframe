import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Route, Router, Switch } from "wouter";
import {
  ADMIN_ROUTE_SCOPE,
  OPS_ROUTE_SCOPE,
} from "../client/src/lib/portalRouteScopes";

function marker(text: string) {
  return React.createElement("span", null, text);
}

function renderPortalScope(path: string) {
  return renderToStaticMarkup(
    React.createElement(
      Router,
      { ssrPath: path },
      React.createElement(
        Switch,
        null,
        React.createElement(Route, { path: ADMIN_ROUTE_SCOPE }, marker("admin-portal")),
        React.createElement(Route, { path: OPS_ROUTE_SCOPE }, marker("ops-portal")),
        React.createElement(Route, null, marker("public-site")),
      ),
    ),
  );
}

describe("top-level portal route scopes", () => {
  it.each(["/admin", "/admin/", "/admin/portfolios", "/admin/portfolio/1"])(
    "routes %s through the admin portal",
    (path) => {
      expect(renderPortalScope(path)).toContain("admin-portal");
    },
  );

  it.each(["/ops", "/ops/", "/ops/projects", "/ops/project/1"])(
    "routes %s through the ops portal",
    (path) => {
      expect(renderPortalScope(path)).toContain("ops-portal");
    },
  );

  it.each([
    "/portfolio/p/1",
    "/administrator",
    "/admin-x",
    "/ops-preview",
    "/opsx",
  ])("keeps unrelated path %s in the public site", (path) => {
    expect(renderPortalScope(path)).toContain("public-site");
  });
});
