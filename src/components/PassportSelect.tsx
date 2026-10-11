import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { catalog } from '../frontend/engine';

const passports = [...catalog.passports].sort((a, b) => a.name.localeCompare(b.name));

export function PassportSelect({ value, onChange, label = 'My passport' }: {
  value: string; onChange: (id: string) => void; label?: string;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const matches = passports.filter(p => `${p.name} ${p.id}`.toLowerCase().includes(query.trim().toLowerCase()));
  const selected = passports.find(p => p.id === value)!;
  const active = matches[activeIndex];

  useEffect(() => {
    if (!open) return;
    input.current?.focus();
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);

  useEffect(() => {
    const option = list.current?.querySelector<HTMLElement>('[data-active="true"]');
    const container = list.current;
    if (!container || !option) return;
    const offset = option.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop;
    if (offset < container.scrollTop) container.scrollTop = offset;
    else if (offset + option.offsetHeight > container.scrollTop + container.clientHeight)
      container.scrollTop = offset + option.offsetHeight - container.clientHeight;
  }, [activeIndex, open, query]);

  function close() { setOpen(false); trigger.current?.focus(); }
  function choose(passportId: string) { onChange(passportId); setQuery(''); close(); }
  function show() {
    setQuery('');
    setActiveIndex(Math.max(0, passports.findIndex(p => p.id === value)));
    setOpen(true);
  }

  return <div className="passport-select passport-combobox" ref={root}
    onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
    <span>{label}</span>
    <button type="button" ref={trigger} className="passport-combobox-trigger"
      aria-label={`${label}: ${selected.name}`} aria-expanded={open}
      aria-haspopup="listbox" aria-controls={open ? `${id}-options` : undefined}
      onClick={() => open ? close() : show()}
      onKeyDown={event => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); show(); }
      }}>
      <span>{selected.flagEmoji} {selected.name}</span><ChevronDown size={16} aria-hidden="true" />
    </button>
    {open && <div className="passport-combobox-menu">
      <input ref={input} type="text" role="combobox" aria-autocomplete="list"
        aria-expanded="true" aria-controls={`${id}-options`}
        aria-activedescendant={active ? `${id}-${active.id}` : undefined}
        aria-label={`Search ${label.toLowerCase()}`} placeholder="Type a passport" value={query}
        onChange={event => { setQuery(event.target.value); setActiveIndex(0); }}
        onKeyDown={event => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex(index => Math.max(0, Math.min(matches.length - 1, index + (event.key === 'ArrowDown' ? 1 : -1))));
          }
          if (event.key === 'Enter') { event.preventDefault(); if (active) choose(active.id); }
          if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); }
        }} />
      <div ref={list} id={`${id}-options`} role="listbox" aria-label={`${label} options`}>
        {matches.map((passport, index) => <div id={`${id}-${passport.id}`} key={passport.id}
          role="option" aria-selected={passport.id === value} data-active={index === activeIndex}
          onPointerMove={() => setActiveIndex(index)}
          onPointerDown={event => event.preventDefault()}
          onClick={() => choose(passport.id)}>{passport.flagEmoji} {passport.name}</div>)}
      </div>
      <p className="sr-only" role="status">{matches.length ? `${matches.length} passports found` : 'No passports found.'}</p>
      {!matches.length && <p aria-hidden="true">No passports found.</p>}
    </div>}
  </div>;
}
