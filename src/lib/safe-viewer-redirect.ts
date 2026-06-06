const allowedViewerRoots = ["/", "/projects", "/publications", "/skills", "/knowledge"];

export function getSafeViewerRedirect(value: unknown) {
  const fallback = "/";

  if (typeof value !== "string" || value.length === 0) {
    return fallback;
  }

  if (!value.startsWith("/") || value.startsWith("//") || value.includes("://")) {
    return fallback;
  }

  return allowedViewerRoots.some((route) => value === route || (route !== "/" && value.startsWith(`${route}/`)))
    ? value
    : fallback;
}
