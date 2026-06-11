export const APP_DISPLAY_TIME_ZONE = "Asia/Shanghai";
export const APP_DISPLAY_TIME_ZONE_LABEL = "北京时间";

const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;

const displayDateFormatter = new Intl.DateTimeFormat("zh-CN", {
  timeZone: APP_DISPLAY_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
});

const displayDateTimeFormatter = new Intl.DateTimeFormat("zh-CN", {
  timeZone: APP_DISPLAY_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false
});

const displayDateTimeSecondsFormatter = new Intl.DateTimeFormat("zh-CN", {
  timeZone: APP_DISPLAY_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false
});

const displayTimeFormatter = new Intl.DateTimeFormat("zh-CN", {
  timeZone: APP_DISPLAY_TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false
});

const dateInputFormatter = new Intl.DateTimeFormat("sv-SE", {
  timeZone: APP_DISPLAY_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
});

const dateTimeLocalInputFormatter = new Intl.DateTimeFormat("sv-SE", {
  timeZone: APP_DISPLAY_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false
});

export function formatDate(value: string | null | undefined) {
  if (!value) {
    return "未设置";
  }

  if (dateOnlyPattern.test(value)) {
    return value.replaceAll("-", "/");
  }

  const date = parseDisplayDate(value);

  if (!date) {
    return value;
  }

  return displayDateFormatter.format(date);
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "未设置";
  }

  const date = parseDisplayDate(value);

  if (!date) {
    return value;
  }

  return displayDateTimeFormatter.format(date);
}

export function formatDateTimeSeconds(value: string | null | undefined) {
  if (!value) {
    return "未设置";
  }

  const date = parseDisplayDate(value);

  if (!date) {
    return value;
  }

  return displayDateTimeSecondsFormatter.format(date);
}

export function formatTime(value: string | null | undefined) {
  if (!value) {
    return "未设置";
  }

  const date = parseDisplayDate(value);

  if (!date) {
    return value;
  }

  return displayTimeFormatter.format(date);
}

export function formatRelative(value: string | null | undefined) {
  if (!value) {
    return "未更新";
  }

  const date = parseDisplayDate(value);

  if (!date) {
    return value;
  }

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(0, Math.round(diffMs / 60000));

  if (diffMinutes < 1) {
    return "刚刚";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} 分钟前`;
  }

  const diffHours = Math.round(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours} 小时前`;
  }

  const diffDays = Math.round(diffHours / 24);

  if (diffDays < 30) {
    return `${diffDays} 天前`;
  }

  return formatDate(value);
}

export function formatDateInputValue(value: string | Date | null | undefined = new Date()) {
  if (!value) {
    return "";
  }

  if (typeof value === "string" && dateOnlyPattern.test(value)) {
    return value;
  }

  const date = parseDisplayDate(value);

  if (!date) {
    return "";
  }

  return dateInputFormatter.format(date);
}

export function formatDateTimeLocalInputValue(value: string | Date | null | undefined) {
  const date = parseDisplayDate(value);

  if (!date) {
    return "";
  }

  return dateTimeLocalInputFormatter.format(date).replace(" ", "T");
}

export function formatFileSize(value: number | null | undefined) {
  if (!value || value <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  let size = value;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size >= 10 || unitIndex === 0 ? size.toFixed(0) : size.toFixed(1)} ${units[unitIndex]}`;
}

function parseDisplayDate(value: string | Date | null | undefined) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date
    ? value
    : new Date(dateOnlyPattern.test(value) ? `${value}T00:00:00+08:00` : value);

  return Number.isNaN(date.getTime()) ? null : date;
}
