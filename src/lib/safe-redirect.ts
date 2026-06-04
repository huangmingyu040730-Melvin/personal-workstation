const allowedDashboardRoutes = [
  "/dashboard",
  "/calendar",
  "/documents",
  "/profile",
  "/settings",
  "/automations"
];

export function getSafeDashboardRedirect(value: unknown) {
  if (typeof value !== "string") {
    return "/dashboard";
  }

  const candidate = value.trim();

  if (
    !candidate.startsWith("/") ||
    candidate.startsWith("//") ||
    candidate.includes("\\") ||
    /^[a-z][a-z0-9+.-]*:/i.test(candidate)
  ) {
    return "/dashboard";
  }

  try {
    const url = new URL(candidate, "http://localhost");

    if (url.origin !== "http://localhost") {
      return "/dashboard";
    }

    const isAllowed = allowedDashboardRoutes.some((route) => url.pathname === route || url.pathname.startsWith(`${route}/`));

    if (!isAllowed) {
      return "/dashboard";
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/dashboard";
  }
}
