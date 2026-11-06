const PALETTE_SELECTOR = '[cmdk-input]';

/**
 * Focus a destination field only after the command palette has fully closed.
 *
 * Radix restores focus when its dialog unmounts, so focusing too early lets the
 * palette steal focus back. Polling also waits for the destination tab content
 * to mount (for example when switching ledger tabs).
 */
export function focusWhenPaletteClosed(selector, { onFocused, timeout = 3000 } = {}) {
    let timer = null;
    let cancelled = false;
    const startedAt = performance.now();

    const tick = () => {
        if (cancelled) return;

        const input = document.querySelector(selector);
        const paletteOpen = Boolean(document.querySelector(PALETTE_SELECTOR));

        if (input && !paletteOpen) {
            input.focus({ preventScroll: false });
            if (typeof input.select === 'function') input.select();
            onFocused?.();
            return;
        }

        if (performance.now() - startedAt <= timeout) {
            timer = setTimeout(tick, 50);
        }
    };

    timer = setTimeout(tick, 0);

    return () => {
        cancelled = true;
        if (timer) clearTimeout(timer);
    };
}
