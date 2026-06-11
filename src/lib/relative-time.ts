import { formatRelative } from "./format";

export function formatDistanceToNow(value: string | null | undefined) {
  return formatRelative(value);
}
