import { createServiceRoleClient } from "@/lib/supabase/service-role";

type DataAccessCheck = {
  select: "ok" | "error";
  message?: string;
};

const dataAccessChecks = [
  { key: "projects", table: "projects" },
  { key: "knowledge", table: "knowledge_notes" },
  { key: "skills", table: "skills" },
  { key: "documentCollections", table: "document_collections" }
] as const;

function sanitizeMessage(message: string | undefined) {
  const trimmed = message?.replace(/\s+/g, " ").trim();
  return trimmed ? trimmed.slice(0, 240) : "Select check failed.";
}

export async function getWorkstationDataAccessDiagnostics() {
  const supabase = createServiceRoleClient();

  if (!supabase) {
    return {
      configured: false as const,
      status: "unconfigured" as const,
      message: "Workstation API data access is not configured."
    };
  }

  const entries = await Promise.all(
    dataAccessChecks.map(async (check) => {
      const { error } = await supabase
        .from(check.table)
        .select("id")
        .limit(1);
      const result: DataAccessCheck = error
        ? { select: "error", message: sanitizeMessage(error.message) }
        : { select: "ok" };

      return [check.key, result] as const;
    })
  );
  const checks = Object.fromEntries(entries) as Record<typeof dataAccessChecks[number]["key"], DataAccessCheck>;
  const hasErrors = Object.values(checks).some((check) => check.select === "error");

  return {
    configured: true as const,
    status: hasErrors ? "degraded" as const : "ok" as const,
    checks
  };
}
