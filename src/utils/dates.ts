import {
  format,
  parse,
  addDays,
  subDays,
  isAfter,
  isBefore,
  isSameDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  subMonths,
  differenceInCalendarDays,
} from 'date-fns'

// Every date in this app is a "YYYY-MM-DD" string representing the user's
// own local calendar day — never a UTC ISO timestamp. Converting through
// Date objects only ever happens via parse()/format() using LOCAL time
// (date-fns's default), so a habit logged at 11:58pm and one logged at
// 12:02am the next day always land on different, correct local days,
// regardless of the browser's timezone or DST transitions.

const DAY_FMT = 'yyyy-MM-dd'

export function todayKey(): string {
  return format(new Date(), DAY_FMT)
}

export function toKey(date: Date): string {
  return format(date, DAY_FMT)
}

export function fromKey(key: string): Date {
  return parse(key, DAY_FMT, new Date())
}

export function addDaysToKey(key: string, amount: number): string {
  return toKey(addDays(fromKey(key), amount))
}

export function subDaysFromKey(key: string, amount: number): string {
  return toKey(subDays(fromKey(key), amount))
}

export function isFutureKey(key: string): boolean {
  const today = fromKey(todayKey())
  return isAfter(fromKey(key), today)
}

export function isPastKey(key: string): boolean {
  const today = fromKey(todayKey())
  return isBefore(fromKey(key), today)
}

export function isTodayKey(key: string): boolean {
  return isSameDay(fromKey(key), fromKey(todayKey()))
}

export function weekRangeForKey(key: string): { start: string; end: string } {
  const d = fromKey(key)
  return {
    start: toKey(startOfWeek(d, { weekStartsOn: 1 })),
    end: toKey(endOfWeek(d, { weekStartsOn: 1 })),
  }
}

export function monthRangeForKey(key: string): { start: string; end: string } {
  const d = fromKey(key)
  return { start: toKey(startOfMonth(d)), end: toKey(endOfMonth(d)) }
}

export function daysBetweenKeys(startKey: string, endKey: string): string[] {
  return eachDayOfInterval({ start: fromKey(startKey), end: fromKey(endKey) }).map(toKey)
}

export function previousMonthOf(year: number, month: number): { year: number; month: number } {
  const d = subMonths(new Date(year, month - 1, 1), 1)
  return { year: d.getFullYear(), month: d.getMonth() + 1 }
}

export function calendarDayDiff(aKey: string, bKey: string): number {
  return differenceInCalendarDays(fromKey(aKey), fromKey(bKey))
}

export function formatFriendly(key: string): string {
  return format(fromKey(key), 'EEEE, MMM d')
}

export function formatShort(key: string): string {
  return format(fromKey(key), 'MMM d')
}

export function monthLabel(year: number, month: number): string {
  return format(new Date(year, month - 1, 1), 'MMMM yyyy')
}

export function greetingForNow(): 'Good morning' | 'Good afternoon' | 'Good evening' {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}
