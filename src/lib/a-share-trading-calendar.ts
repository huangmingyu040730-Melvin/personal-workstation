import tradingCalendar from "@/data/a-share-trading-days.json";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const tradingDays = new Set<string>(tradingCalendar.trading_days);
const coveredYears = new Set<number>(tradingCalendar.years);

export type AShareTradingDayValidation =
  | { ok: true }
  | {
      ok: false;
      message: string;
      reason: "invalid_date" | "future_date" | "year_uncovered" | "non_trading_day";
      nearestPreviousTradingDay: string | null;
    };

export function isAShareTradingDay(date: string): boolean {
  return isValidDateString(date) && tradingDays.has(date);
}

export function getNearestPreviousAShareTradingDay(date: string): string | null {
  if (!isValidDateString(date)) {
    return null;
  }

  for (let index = tradingCalendar.trading_days.length - 1; index >= 0; index -= 1) {
    const tradingDay = tradingCalendar.trading_days[index];
    if (tradingDay < date) {
      return tradingDay;
    }
  }

  return null;
}

export function validateAShareTradingDay(date: string, today: string): AShareTradingDayValidation {
  const nearestPreviousTradingDay = getNearestPreviousAShareTradingDay(date);

  if (!isValidDateString(date)) {
    return {
      ok: false,
      reason: "invalid_date",
      message: "请选择有效日期。",
      nearestPreviousTradingDay
    };
  }

  if (date > today) {
    return {
      ok: false,
      reason: "future_date",
      message: "所选日期不能晚于今天。",
      nearestPreviousTradingDay: getNearestPreviousAShareTradingDay(today)
    };
  }

  if (!coveredYears.has(Number(date.slice(0, 4)))) {
    return {
      ok: false,
      reason: "year_uncovered",
      message: "当前交易日历暂未覆盖该年份，请先更新交易日历。",
      nearestPreviousTradingDay
    };
  }

  if (!isAShareTradingDay(date)) {
    return {
      ok: false,
      reason: "non_trading_day",
      message: "所选日期不是 A 股交易日，请选择一个有效交易日。",
      nearestPreviousTradingDay
    };
  }

  return { ok: true };
}

export function getAShareTradingCalendarYears() {
  return [...tradingCalendar.years].sort((a, b) => a - b);
}

function isValidDateString(date: string): boolean {
  if (!DATE_PATTERN.test(date)) {
    return false;
  }

  const parsed = new Date(`${date}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
}
