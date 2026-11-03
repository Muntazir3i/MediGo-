const currencyFormatter = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

export const formatCurrency = (value) => {
    const number = Number(value);
    return `₹ ${currencyFormatter.format(Number.isFinite(number) ? number : 0)}`;
};

export const formatLedgerDate = (value) => {
    if (!value) return '—';

    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value));

    if (!match) return String(value);

    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));

    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

export const getInitials = (name = '') => {
    const words = String(name).trim().split(/\s+/).filter(Boolean);

    if (words.length === 0) return '?';
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();

    return `${words[0][0]}${words[1][0]}`.toUpperCase();
};
