import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Plus, Search, X } from 'lucide-react';

import { Input } from './ui/input.jsx';
import { createSalt, searchSalts } from '../services/medicineService.js';

const STRENGTH_UNITS = ['mg', 'ml', 'mcg', 'IU', '%', 'g'];

const normalizeEntry = (salt) => ({
  saltId: salt?.saltId ?? salt?.id ?? null,
  name: String(salt?.name ?? ''),
  strengthValue: salt?.strengthValue ?? '',
  strengthUnit: salt?.strengthUnit || 'mg',
});

const toPayload = (entry) => ({
  saltId: entry.saltId || null,
  name: entry.name,
  strengthValue:
    entry.strengthValue === '' || entry.strengthValue === null || entry.strengthValue === undefined
      ? null
      : Number(entry.strengthValue),
  strengthUnit: entry.strengthUnit || null,
});

/**
 * Optional salt picker.
 *
 * Salts attach to the medicine (product), not to an individual batch, so every
 * batch of the same medicine shares this list. Leaving it empty is valid.
 */
function SaltEditor({
  value = [],
  onChange,
  disabled = false,
  label = 'Salts (optional)',
  hint = 'Leave empty if the composition is unknown.',
  showLabel = true,
  id = 'salt-editor',
}) {
  const entries = useMemo(
    () => (Array.isArray(value) ? value.map(normalizeEntry) : []),
    [value]
  );

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [error, setError] = useState('');
  const rootRef = useRef(null);

  const commit = (nextEntries) => {
    onChange?.(nextEntries.map(toPayload));
  };

  const assignedIds = useMemo(
    () => new Set(entries.map((entry) => entry.saltId).filter(Boolean)),
    [entries]
  );

  const availableResults = useMemo(
    () => results.filter((salt) => !assignedIds.has(salt.id)),
    [results, assignedIds]
  );

  const exactMatch = availableResults.some(
    (salt) => salt.name.trim().toLowerCase() === query.trim().toLowerCase()
  );

  useEffect(() => {
    if (!open || disabled) return undefined;

    let cancelled = false;
    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const data = await searchSalts(query.trim());
        if (!cancelled) {
          setResults(Array.isArray(data) ? data : []);
          setActiveIndex(-1);
        }
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 220);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, open, disabled]);

  useEffect(() => {
    if (!open) return undefined;

    const handleOutside = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  const addSalt = (salt) => {
    const next = normalizeEntry(salt);

    if (next.saltId && assignedIds.has(next.saltId)) {
      setQuery('');
      return;
    }

    commit([...entries, next]);
    setQuery('');
    setResults([]);
    setOpen(false);
    setError('');
  };

  const createFromQuery = async () => {
    const name = query.trim();
    if (!name || creating) return;

    setCreating(true);
    setError('');

    try {
      const salt = await createSalt(name);
      addSalt(salt);
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not create that salt.');
    } finally {
      setCreating(false);
    }
  };

  const removeSalt = (index) => {
    commit(entries.filter((_, entryIndex) => entryIndex !== index));
  };

  const updateStrength = (index, field, value) => {
    commit(
      entries.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, [field]: value } : entry
      )
    );
  };

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => Math.min(index + 1, availableResults.length - 1));
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, -1));
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();

      if (activeIndex >= 0 && availableResults[activeIndex]) {
        addSalt(availableResults[activeIndex]);
        return;
      }

      if (!exactMatch && query.trim()) {
        createFromQuery();
      }
      return;
    }

    if (event.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  const unitOptions = useMemo(() => {
    const units = new Set(STRENGTH_UNITS);
    entries.forEach((entry) => {
      if (entry.strengthUnit) units.add(entry.strengthUnit);
    });
    return [...units];
  }, [entries]);

  return (
    <div ref={rootRef} className="space-y-2">
      {showLabel && (
        <label htmlFor={`${id}-input`} className="block text-xs font-medium text-slate-600">
          {label}
        </label>
      )}

      {entries.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {entries.map((entry, index) => (
            <div
              key={`${entry.saltId ?? entry.name}-${index}`}
              className="flex items-center gap-1.5 rounded-lg border border-blue-100 bg-blue-50/70 py-1 pl-2.5 pr-1"
            >
              <span className="text-xs font-semibold text-blue-800">{entry.name}</span>

              <Input
                type="number"
                min="0"
                step="0.01"
                value={entry.strengthValue ?? ''}
                disabled={disabled}
                onChange={(event) => updateStrength(index, 'strengthValue', event.target.value)}
                aria-label={`Strength for ${entry.name}`}
                placeholder="—"
                className="h-7 w-16 border-blue-200 bg-white px-1.5 text-center text-xs text-slate-800 shadow-none"
              />

              <select
                value={entry.strengthUnit || 'mg'}
                disabled={disabled}
                onChange={(event) => updateStrength(index, 'strengthUnit', event.target.value)}
                aria-label={`Strength unit for ${entry.name}`}
                className="h-7 rounded-md border border-blue-200 bg-white px-1 text-xs text-slate-700 outline-none disabled:opacity-60"
              >
                {unitOptions.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => removeSalt(index)}
                disabled={disabled}
                aria-label={`Remove ${entry.name}`}
                className="rounded-md p-1 text-blue-500 transition hover:bg-blue-100 hover:text-blue-700 disabled:opacity-50"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <Input
          id={`${id}-input`}
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-controls={`${id}-results`}
          value={query}
          disabled={disabled || creating}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            setError('');
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={creating ? 'Creating salt…' : 'Search or add a salt…'}
          autoComplete="off"
          className="h-9 border-slate-200 bg-white pl-9 text-sm text-slate-900 shadow-none"
        />
      </div>

      {open && !disabled && (
        <div
          id={`${id}-results`}
          role="listbox"
          className="max-h-44 overflow-auto rounded-lg border border-slate-200 bg-white p-1 shadow-sm"
        >
          {loading ? (
            <p className="flex items-center gap-2 px-2 py-2 text-xs text-slate-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Searching salts…
            </p>
          ) : (
            <>
              {availableResults.map((salt, index) => (
                <button
                  key={salt.id}
                  type="button"
                  role="option"
                  aria-selected={activeIndex === index}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => addSalt(salt)}
                  className={`flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm transition ${
                    activeIndex === index
                      ? 'bg-blue-50 text-blue-800'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{salt.name}</span>
                  {Number(salt.usageCount) > 0 && (
                    <span className="text-[10px] text-slate-400">
                      {salt.usageCount} product{Number(salt.usageCount) === 1 ? '' : 's'}
                    </span>
                  )}
                </button>
              ))}

              {availableResults.length === 0 && !query.trim() && (
                <p className="px-2 py-2 text-xs text-slate-500">
                  No salts yet. Type a name to create one.
                </p>
              )}

              {query.trim() && !exactMatch && (
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={createFromQuery}
                  disabled={creating}
                  className="mt-1 flex w-full items-center gap-2 rounded-md border border-dashed border-slate-200 px-2 py-1.5 text-left text-sm text-slate-700 transition hover:border-blue-300 hover:bg-blue-50/60"
                >
                  {creating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
                  ) : (
                    <Plus className="h-3.5 w-3.5 text-blue-600" />
                  )}
                  Create “{query.trim()}”
                </button>
              )}
            </>
          )}
        </div>
      )}

      {error && <p className="text-xs text-rose-600">{error}</p>}

      {hint && <p className="text-[11px] text-slate-400">{hint}</p>}
    </div>
  );
}

export default SaltEditor;
