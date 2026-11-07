export const EXPIRY_WINDOW_MONTHS = 3;

const pad = (value) => String(value).padStart(2, '0');

/** Local calendar date in YYYY-MM-DD form (avoids UTC day shifts). */
export function toIsoDate(date = new Date()) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayIsoDate() {
    return toIsoDate(new Date());
}

export function parseIsoDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return null;
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
}

/** Last day of the "next three months" window. */
export function getExpiryWindowEnd(referenceDate = new Date()) {
    const targetMonthStart = new Date(
        referenceDate.getFullYear(),
        referenceDate.getMonth() + EXPIRY_WINDOW_MONTHS,
        1
    );
    const lastDayOfTargetMonth = new Date(
        targetMonthStart.getFullYear(),
        targetMonthStart.getMonth() + 1,
        0
    ).getDate();

    return new Date(
        targetMonthStart.getFullYear(),
        targetMonthStart.getMonth(),
        Math.min(referenceDate.getDate(), lastDayOfTargetMonth)
    );
}

export function getExpiryStatus(expiryDate, referenceDate = new Date()) {
    const date = parseIsoDate(expiryDate);
    if (!date) return null;

    const today = new Date(
        referenceDate.getFullYear(),
        referenceDate.getMonth(),
        referenceDate.getDate()
    );
    const windowEnd = getExpiryWindowEnd(referenceDate);

    if (date < today) {
        return { key: 'expired', label: 'Expired' };
    }

    if (date <= windowEnd) {
        return { key: 'expiring', label: 'Within 3 months' };
    }

    return { key: 'later', label: 'After 3 months' };
}

export function formatShortDate(date) {
    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}
