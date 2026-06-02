export function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function getOptionalString(formData: FormData, key: string) {
  const value = getString(formData, key);
  return value.length > 0 ? value : null;
}

export function getBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

export function getArrayFromText(formData: FormData, key: string) {
  return getString(formData, key)
    .split(/[\n,，]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function getStringArray(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);
}

export function encodeFormError(message: string) {
  return encodeURIComponent(message);
}

export function getFormError(searchParams: Record<string, string | string[] | undefined>) {
  const error = searchParams.error;

  if (Array.isArray(error)) {
    return error[0];
  }

  return error;
}
