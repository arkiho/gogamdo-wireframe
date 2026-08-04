import type { PathPattern } from "wouter";

/**
 * Top-level portal scope routes. Keep these aligned with Wouter's matching
 * semantics so nested detail pages reach their portal router.
 */
export const ADMIN_ROUTE_SCOPE: PathPattern = /^\/admin(?:\/.*)?$/;
export const OPS_ROUTE_SCOPE: PathPattern = /^\/ops(?:\/.*)?$/;
