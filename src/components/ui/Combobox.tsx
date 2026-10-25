"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  createContext,
  useContext,
} from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, Check, X, Search } from "lucide-react";

/* ===========================================================================
   Types
   =========================================================================== */

export interface ComboboxOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface ComboboxProps {
  /** Available options */
  options: ComboboxOption[];
  /** Current value(s) — string for single, string[] for multi */
  value?: string | string[];
  /** Called when selection changes */
  onChange: (value: string | string[]) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Enable multi-select mode */
  multiple?: boolean;
  /** Disable the entire control */
  disabled?: boolean;
  /** Label for accessibility */
  label?: string;
  /** Helper text id (for aria-describedby) */
  "aria-describedby"?: string;
  /** Error message */
  error?: string;
  /** Name attribute for form submission */
  name?: string;
  /** Additional className */
  className?: string;
  /** Maximum height of the dropdown */
  maxHeight?: string;
  /** Show search input */
  searchable?: boolean;
  /** Placeholder for search input */
  searchPlaceholder?: string;
  /** Clear button visible when has value */
  clearable?: boolean;
  /** Callback when menu opens/closes */
  onOpenChange?: (open: boolean) => void;
}

/* ===========================================================================
   Context
   =========================================================================== */

interface ComboboxContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  inputValue: string;
  setInputValue: (value: string) => void;
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  multiple: boolean;
  selectedValue: string | string[];
  onOptionSelect: (value: string) => void;
  highlightedValue: string | null;
  setHighlightedValue: (value: string | null) => void;
  options: ComboboxOption[];
  filteredOptions: ComboboxOption[];
  disabled: boolean;
  labelId: string;
  descriptionId: string;
  errorId: string;
}

const ComboboxContext = createContext<ComboboxContextValue | null>(null);

function useComboboxContext() {
  const context = useContext(ComboboxContext);
  if (!context) {
    throw new Error("Combobox components must be used within a Combobox");
  }
  return context;
}

/* ===========================================================================
   Utility Hooks
   =========================================================================== */

/**
 * Generates unique IDs for ARIA attributes
 */
function useId(prefix: string = "combobox") {
  const idRef = useRef(`${prefix}-${Math.random().toString(36).slice(2, 9)}`);
  return idRef.current;
}

/**
 * Keyboard navigation hook for combobox
 */
function useKeyboardNavigation({
  options,
  open,
  setOpen,
  onSelect,
  multiple,
}: {
  options: ComboboxOption[];
  open: boolean;
  setOpen: (open: boolean) => void;
  onSelect: (value: string) => void;
  multiple: boolean;
}) {
  const { activeIndex, setActiveIndex } = useComboboxContext();

  const navigate = useCallback(
    (key: string) => {
      const enabledOptions = options.filter((opt) => !opt.disabled);
      if (enabledOptions.length === 0) return;

      const currentIndex = options.findIndex(
        (opt) => opt.value === enabledOptions[activeIndex]?.value
      );

      let newIndex = activeIndex;

      switch (key) {
        case "ArrowDown":
          newIndex = Math.min(activeIndex + 1, options.length - 1);
          while (options[newIndex]?.disabled) newIndex++;
          break;
        case "ArrowUp":
          newIndex = Math.max(activeIndex - 1, 0);
          while (options[newIndex]?.disabled) newIndex--;
          break;
        case "Home":
          newIndex = 0;
          while (options[newIndex]?.disabled) newIndex++;
          break;
        case "End":
          newIndex = options.length - 1;
          while (options[newIndex]?.disabled) newIndex--;
          break;
        case "Enter":
        case " ":
          if (open && options[activeIndex] && !options[activeIndex].disabled) {
            onSelect(options[activeIndex].value);
            if (!multiple) setOpen(false);
          }
          return true;
        case "Escape":
          setOpen(false);
          return true;
        case "Backspace":
        case "Delete":
          // Handled by the input component for multi-select
          return false;
        default:
          return false;
      }

      setActiveIndex(newIndex);
      return true;
    },
    [options, activeIndex, setActiveIndex, onSelect, multiple, open, setOpen]
  );

  const handleTypeahead = useCallback(
    (key: string) => {
      const enabledOptions = options.filter((opt) => !opt.disabled);
      const lowerKey = key.toLowerCase();

      // Find current position after active index
      const startIndex = activeIndex + 1;
      const searchedOptions = [
        ...enabledOptions.slice(startIndex),
        ...enabledOptions.slice(0, startIndex),
      ];

      const match = searchedOptions.find((opt) =>
        opt.label.toLowerCase().startsWith(lowerKey)
      );

      if (match) {
        const newIndex = options.findIndex((opt) => opt.value === match.value);
        setActiveIndex(newIndex);
      }
    },
    [options, activeIndex, setActiveIndex]
  );

  return { navigate, handleTypeahead };
}

/* ===========================================================================
   Main Combobox Component
   =========================================================================== */

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  multiple = false,
  disabled = false,
  label,
  error,
  name,
  className,
  maxHeight = "16rem",
  searchable = true,
  searchPlaceholder = "Search...",
  clearable = true,
  onOpenChange,
  name,
  "aria-describedby": ariaDescribedBy,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [highlightedValue, setHighlightedValue] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);

  const labelId = useId("combobox-label");
  const descriptionId = useId("combobox-description");
  const errorId = useId("combobox-error");

  // Filter options based on input
  const filteredOptions = useMemo(() => {
    if (!inputValue) return options;
    const lower = inputValue.toLowerCase();
    return options.filter(
      (opt) =>
        !opt.disabled &&
        (opt.label.toLowerCase().includes(lower) ||
          opt.value.toLowerCase().includes(lower))
    );
  }, [options, inputValue]);

  // Get display label(s)
  const displayValue = useMemo(() => {
    if (multiple && Array.isArray(value)) {
      if (value.length === 0) return "";
      const labels = value
        .map((v) => options.find((opt) => opt.value === v)?.label)
        .filter(Boolean);
      return labels.join(", ");
    }
    if (value) {
      return options.find((opt) => opt.value === value)?.label ?? "";
    }
    return "";
  }, [value, options, multiple]);

  // Handle option selection
  const handleOptionSelect = useCallback(
    (optionValue: string) => {
      if (multiple) {
        const current = Array.isArray(value) ? value : [];
        const newValue = current.includes(optionValue)
          ? current.filter((v) => v !== optionValue)
          : [...current, optionValue];
        onChange(newValue);
      } else {
        onChange(optionValue);
        const selectedLabel = options.find((opt) => opt.value === optionValue);
        setInputValue("");
        setOpen(false);
        onOpenChange?.(false);
      }
    },
    [multiple, value, onChange, options, onOpenChange]
  );

  // Handle clear
  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (multiple) {
        onChange([]);
      } else {
        onChange("");
        setInputValue("");
      }
    },
    [multiple, onChange]
  );

  // Keyboard navigation
  const { navigate, handleTypeahead } = useKeyboardNavigation({
    options: filteredOptions,
    open,
    setOpen,
    onSelect: handleOptionSelect,
    multiple,
  });

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return;

      // If closed, open on ArrowDown, ArrowUp, Enter, or printable character
      if (!open) {
        if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
          e.preventDefault();
          setOpen(true);
          onOpenChange?.(true);
          return;
        }
      }

      // Navigation
      if (["ArrowDown", "ArrowUp", "Home", "End", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        if (navigate(e.key)) return;
      }

      // Close on Escape
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        onOpenChange?.(false);
        return;
      }

      // Typeahead for printable characters
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        handleTypeahead(e.key);
      }

      // Backspace to remove last tag in multi-select
      if (
        multiple &&
        e.key === "Backspace" &&
        inputValue === "" &&
        Array.isArray(value) &&
        value.length > 0
      ) {
        onChange(value.slice(0, -1));
      }
    },
    [
      disabled,
      open,
      navigate,
      handleTypeahead,
      inputValue,
      multiple,
      value,
      onChange,
      onOpenChange,
    ]
  );

  // Focus management when opening
  useEffect(() => {
    if (open && listboxRef.current) {
      const firstEnabled = filteredOptions.findIndex((opt) => !opt.disabled);
      setActiveIndex(firstEnabled >= 0 ? firstEnabled : -1);
    }
  }, [open, filteredOptions]);

  // Scroll active item into view
  useEffect(() => {
    if (open && activeIndex >= 0 && listboxRef.current) {
      const activeElement = listboxRef.current.children[activeIndex] as HTMLElement;
      activeElement?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex, open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        onOpenChange?.(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onOpenChange]);

  // Prevent scroll when open
  useEffect(() => {
    if (!open) return;
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [open]);

  const contextValue: ComboboxContextValue = {
    open,
    setOpen,
    inputValue,
    setInputValue,
    activeIndex,
    setActiveIndex,
    multiple,
    selectedValue: value ?? (multiple ? [] : ""),
    onOptionSelect: handleOptionSelect,
    highlightedValue,
    setHighlightedValue,
    options: filteredOptions,
    filteredOptions,
    disabled,
    labelId,
    descriptionId,
    errorId,
  };

  const describedBy = [
    ariaDescribedBy,
    error ? errorId : null,
    descriptionId,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <ComboboxContext.Provider value={contextValue}>
      <div ref={containerRef} className={cn("relative w-full", className)}>
        {label && (
          <label
            id={labelId}
            className="block text-sm font-medium text-ink-900 mb-1.5"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {/* Trigger Button */}
          <button
            type="button"
            role="combobox"
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls={`${labelId}-listbox`}
            aria-describedby={describedBy || undefined}
            aria-disabled={disabled}
            disabled={disabled}
            onClick={() => {
              if (!disabled) {
                setOpen(!open);
                onOpenChange?.(!open);
              }
            }}
            onKeyDown={handleKeyDown}
            className={cn(
              "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left",
              "bg-white transition-colors duration-200",
              "focus:outline-none focus:ring-2 focus:ring-hamplard-primary focus:ring-offset-2",
              disabled
                ? "cursor-not-allowed border-ink-200 bg-ink-50 text-ink-400"
                : error
                ? "border-rose-500 focus:ring-rose-500"
                : "border-ink-200 hover:border-ink-300"
            )}
          >
            <span
              className={cn(
                "truncate",
                !displayValue && "text-ink-400"
              )}
            >
              {displayValue || placeholder}
            </span>

            <div className="flex items-center gap-1">
              {/* Clear button */}
              {clearable &&
                ((multiple && Array.isArray(value) && value.length > 0) ||
                  (!multiple && value)) && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="rounded p-0.5 hover:bg-ink-100 focus:outline-none focus:ring-2 focus:ring-hamplard-primary"
                    tabIndex={-1}
                    aria-label="Clear selection"
                  >
                    <X className="h-4 w-4 text-ink-500" />
                  </button>
                )}

              {/* Dropdown indicator */}
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-ink-500 transition-transform duration-200",
                  open && "rotate-180"
                )}
              />
            </div>
          </button>

          {/* Listbox Dropdown */}
          {open && (
            <div
              className={cn(
                "absolute z-50 mt-1 w-full rounded-lg border border-ink-200 bg-white shadow-lg",
                "overflow-hidden"
              )}
            >
              {/* Search Input */}
              {searchable && (
                <div className="border-b border-ink-100 p-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                    <input
                      type="text"
                      role="searchbox"
                      autoComplete="off"
                      value={inputValue}
                      onChange={(e) => {
                        setInputValue(e.target.value);
                        setActiveIndex(0);
                      }}
                      placeholder={searchPlaceholder}
                      className="w-full rounded-md border border-ink-200 px-9 py-2 text-sm outline-none focus:border-hamplard-primary focus:ring-1 focus:ring-hamplard-primary"
                      onKeyDown={handleKeyDown}
                    />
                  </div>
                </div>
              )}

              {/* Options List */}
              <ul
                ref={listboxRef}
                id={`${labelId}-listbox`}
                role="listbox"
                aria-multiselectable={multiple}
                className={cn("max-h-[200px] overflow-y-auto p-1")}
                style={{ maxHeight }}
              >
                {filteredOptions.length === 0 ? (
                  <li className="px-3 py-4 text-center text-sm text-ink-400">
                    No options found
                  </li>
                ) : (
                  filteredOptions.map((option, index) => (
                    <ComboboxOptionItem
                      key={option.value}
                      option={option}
                      index={index}
                    />
                  ))
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <p id={errorId} className="mt-1.5 text-sm text-rose-600" role="alert">
            {error}
          </p>
        )}

        {/* Hidden input for form submission */}
        {multiple && Array.isArray(value) && (
          <input type="hidden" name={name} value={value.join(",")} />
        )}
        {!multiple && value && <input type="hidden" name={name} value={value} />}
      </div>
    </ComboboxContext.Provider>
  );
}

/* ===========================================================================
   Option Item Component
   =========================================================================== */

function ComboboxOptionItem({
  option,
  index,
}: {
  option: ComboboxOption;
  index: number;
}) {
  const {
    activeIndex,
    setActiveIndex,
    selectedValue,
    onOptionSelect,
    multiple,
    highlightedValue,
    setHighlightedValue,
    labelId,
  } = useComboboxContext();

  const isActive = index === activeIndex;
  const isSelected = multiple
    ? Array.isArray(selectedValue) && selectedValue.includes(option.value)
    : selectedValue === option.value;

  const handleClick = () => {
    if (!option.disabled) {
      onOptionSelect(option.value);
    }
  };

  const handleMouseEnter = () => {
    if (!option.disabled) {
      setActiveIndex(index);
      setHighlightedValue(option.value);
    }
  };

  return (
    <li
      role="option"
      aria-selected={isSelected}
      aria-disabled={option.disabled}
      id={`${labelId}-option-${index}`}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      className={cn(
        "flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm",
        "transition-colors duration-150",
        option.disabled && "cursor-not-allowed opacity-50",
        !option.disabled && isActive && "bg-hamplard-lilac text-hamplard-deep",
        !option.disabled && !isActive && "hover:bg-ink-50",
        isSelected && "bg-hamplard-lilac font-medium"
      )}
    >
      <span className="truncate">{option.label}</span>

      {isSelected && (
        <Check className="h-4 w-4 text-hamplard-primary" aria-hidden="true" />
      )}
    </li>
  );
}

/* ===========================================================================
   Export
   =========================================================================== */

export default Combobox;