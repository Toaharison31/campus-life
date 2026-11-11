import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Search, X } from "lucide-react";

export default function CommandPalette({
  open,
  title,
  query,
  onQueryChange,
  onClose,
  onSelect,
  groups = [],
  placeholder,
  emptyMessage,
  closeLabel,
}) {
  const inputRef = useRef(null);
  const listId = useId();
  const [activeIndex, setActiveIndex] = useState(0);
  const items = useMemo(
    () =>
      groups.flatMap((group, groupIndex) =>
        group.items.map((item, itemIndex) => ({
          ...item,
          groupIndex,
          itemIndex,
        })),
      ),
    [groups],
  );
  const selectedIndex = items.length
    ? Math.min(activeIndex, items.length - 1)
    : 0;

  useEffect(() => {
    if (!open) return undefined;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    inputRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  const selectItem = (item) => {
    onSelect(item);
    onClose();
  };
  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    } else if (event.target !== inputRef.current) {
      return;
    } else if (items.length && event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % items.length);
    } else if (items.length && event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + items.length) % items.length);
    } else if (items[selectedIndex] && event.key === "Enter") {
      event.preventDefault();
      selectItem(items[selectedIndex]);
    }
  };

  return createPortal(
    <div
      className="command-palette-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onKeyDown={handleKeyDown}
    >
      <section
        className="command-palette"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="command-palette-search">
          <Search size={20} aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={
              items[selectedIndex]
                ? `${listId}-${items[selectedIndex].groupIndex}-${items[selectedIndex].itemIndex}`
                : undefined
            }
            value={query}
            onChange={(event) => {
              setActiveIndex(0);
              onQueryChange(event.target.value);
            }}
            placeholder={placeholder}
            aria-label={title}
          />
          <button
            className="icon-button"
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
          >
            <X size={19} aria-hidden="true" />
          </button>
        </div>
        <div className="command-palette-results" id={listId} role="listbox">
          {items.length ? (
            groups.map((group, groupIndex) =>
              group.items.length ? (
                <section
                  className="command-palette-group"
                  key={group.id || groupIndex}
                  role="group"
                  aria-label={group.label}
                >
                  {group.label && <h2>{group.label}</h2>}
                  {group.items.map((item, itemIndex) => {
                    const flatIndex = groups
                      .slice(0, groupIndex)
                      .reduce(
                        (count, entry) => count + entry.items.length,
                        itemIndex,
                    );
                    const Icon = item.icon;
                    return (
                      <button
                        id={`${listId}-${groupIndex}-${itemIndex}`}
                        className={
                          flatIndex === selectedIndex
                            ? "command-palette-option active"
                            : "command-palette-option"
                        }
                        type="button"
                        tabIndex={-1}
                        role="option"
                        aria-selected={flatIndex === selectedIndex}
                        key={item.id ?? itemIndex}
                        onMouseEnter={() => setActiveIndex(flatIndex)}
                        onClick={() => selectItem(item)}
                      >
                        {Icon && (
                          <span className="command-palette-icon">
                            <Icon size={19} aria-hidden="true" />
                          </span>
                        )}
                        <span className="command-palette-item-copy">
                          <strong>{item.title}</strong>
                          {item.description && <small>{item.description}</small>}
                        </span>
                      </button>
                    );
                  })}
                </section>
              ) : null,
            )
          ) : (
            <p className="command-palette-empty">{emptyMessage}</p>
          )}
        </div>
      </section>
    </div>,
    document.body,
  );
}
