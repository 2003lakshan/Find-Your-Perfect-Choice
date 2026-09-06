import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MapPin, ChevronDown, X } from 'lucide-react';
import { SL_CITIES } from '../data/sriLankaData';

/**
 * CityPicker — searchable combobox for Sri Lanka cities.
 *
 * Props:
 *   value        {string}   current city value
 *   onChange     {fn}       called with new city string
 *   placeholder  {string}   input placeholder text
 *   className    {string}   extra class on root wrapper
 *   inputStyle   {object}   inline styles forwarded to the <input>
 *   wrapStyle    {object}   inline styles forwarded to the root div
 *   light        {boolean}  if true use light-mode colours (for Upload form)
 */
export default function CityPicker({
  value = '',
  onChange,
  placeholder = 'Search or select city…',
  className = '',
  inputStyle = {},
  wrapStyle = {},
  light = false,
}) {
  const [query,  setQuery]  = useState(value || '');
  const [open,   setOpen]   = useState(false);
  const [hovered, setHovered] = useState(-1);
  const rootRef  = useRef(null);
  const inputRef = useRef(null);
  const listRef  = useRef(null);

  // Keep local query in sync if parent resets value
  useEffect(() => { setQuery(value || ''); }, [value]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
        // If user typed something that's not a valid city, revert
        if (!SL_CITIES.includes(query)) {
          setQuery(value || '');
        }
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [query, value]);

  const filtered = query.trim()
    ? SL_CITIES.filter(c => c.toLowerCase().startsWith(query.trim().toLowerCase()))
    : SL_CITIES;

  const select = useCallback((city) => {
    setQuery(city);
    setOpen(false);
    onChange?.(city);
  }, [onChange]);

  const clear = (e) => {
    e.stopPropagation();
    setQuery('');
    onChange?.('');
    inputRef.current?.focus();
  };

  // Keyboard navigation
  const onKeyDown = (e) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      setOpen(true);
      setHovered(0);
      return;
    }
    if (e.key === 'Escape') { setOpen(false); return; }
    if (e.key === 'ArrowDown') {
      setHovered(h => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      setHovered(h => Math.max(h - 1, 0));
    } else if (e.key === 'Enter' && hovered >= 0 && filtered[hovered]) {
      select(filtered[hovered]);
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current || hovered < 0) return;
    const item = listRef.current.children[hovered];
    if (item) item.scrollIntoView({ block: 'nearest' });
  }, [hovered]);

  const bg       = light ? 'rgba(255,253,248,0.9)' : 'var(--color-input, #112244)';
  const border   = light ? '1.5px solid rgba(139,100,60,0.18)' : '1.5px solid rgba(240,244,255,0.10)';
  const txtColor = light ? '#1a1208' : 'var(--color-foreground, #F0F4FF)';
  const phColor  = light ? 'rgba(26,18,8,0.30)' : 'rgba(240,244,255,0.30)';
  const dropBg   = light ? '#fff' : '#0d1b35';
  const dropBorder = light ? '1px solid rgba(139,100,60,0.18)' : '1px solid rgba(240,244,255,0.10)';
  const itemHover  = light ? 'rgba(139,100,60,0.08)' : 'rgba(212,168,50,0.10)';
  const activeColor = light ? '#8B643C' : '#D4A832';

  return (
    <div
      ref={rootRef}
      className={`city-picker-root ${className}`}
      style={{ position: 'relative', ...wrapStyle }}
    >
      {/* Input row */}
      <div
        style={{
          display: 'flex', alignItems: 'center',
          background: bg, border, borderRadius: 14,
          transition: 'border-color 0.2s, box-shadow 0.2s',
          boxShadow: open
            ? light
              ? '0 0 0 3px rgba(139,100,60,0.12)'
              : '0 0 0 3px rgba(212,168,50,0.12)'
            : 'none',
        }}
      >
        <MapPin
          size={16}
          style={{ margin: '0 0 0 14px', color: activeColor, flexShrink: 0 }}
        />
        <input
          ref={inputRef}
          type="text"
          autoComplete="off"
          spellCheck={false}
          value={query}
          placeholder={placeholder}
          style={{
            flex: 1, border: 'none', outline: 'none',
            background: 'transparent', padding: '12px 8px 12px 10px',
            fontSize: '0.92rem', color: txtColor,
            fontFamily: 'inherit',
            ...inputStyle,
          }}
          onFocus={() => { setOpen(true); setHovered(-1); }}
          onChange={e => {
            setQuery(e.target.value);
            setOpen(true);
            setHovered(0);
            // If user clears the input, clear selection
            if (!e.target.value) onChange?.('');
          }}
          onKeyDown={onKeyDown}
        />
        {/* Clear button */}
        {query && (
          <button
            type="button"
            onClick={clear}
            title="Clear"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '0 6px', color: phColor, display: 'flex', alignItems: 'center',
            }}
          >
            <X size={14} />
          </button>
        )}
        <ChevronDown
          size={14}
          style={{
            marginRight: 12, color: phColor, flexShrink: 0,
            transition: 'transform 0.2s',
            transform: open ? 'rotate(180deg)' : 'none',
          }}
        />
      </div>

      {/* Dropdown */}
      {open && (
        <div
          ref={listRef}
          style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
            background: dropBg, border: dropBorder,
            borderRadius: 14, overflow: 'hidden auto',
            maxHeight: 240, zIndex: 9999,
            boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
          }}
        >
          {filtered.length === 0 ? (
            <div style={{ padding: '14px 16px', color: phColor, fontSize: '0.88rem' }}>
              No cities found for "{query}"
            </div>
          ) : (
            filtered.map((city, idx) => (
              <div
                key={city}
                onMouseDown={() => select(city)}
                onMouseEnter={() => setHovered(idx)}
                style={{
                  padding: '10px 16px',
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  color: city === value ? activeColor : txtColor,
                  fontWeight: city === value ? 700 : 400,
                  background:
                    idx === hovered
                      ? itemHover
                      : city === value
                        ? (light ? 'rgba(139,100,60,0.06)' : 'rgba(212,168,50,0.06)')
                        : 'transparent',
                  borderLeft: city === value
                    ? `2px solid ${activeColor}`
                    : '2px solid transparent',
                  transition: 'background 0.1s',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}
              >
                <MapPin size={12} style={{ color: activeColor, flexShrink: 0, opacity: city === value ? 1 : 0.4 }} />
                {/* Highlight matching prefix */}
                {query.trim() && city.toLowerCase().startsWith(query.trim().toLowerCase())
                  ? <>
                      <strong>{city.slice(0, query.trim().length)}</strong>
                      {city.slice(query.trim().length)}
                    </>
                  : city
                }
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
