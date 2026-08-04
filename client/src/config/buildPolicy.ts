export function isManusDevelopmentToolingEnabled(mode: string) {
  return mode === "development";
}

/** Keep route-only libraries attached to their lazy route. */
export function getProductionManualChunks() {
  return {
    vendor: ["react", "react-dom"],
  };
}
