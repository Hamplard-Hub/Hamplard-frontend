"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  createContext,
  useContext,
} from "react";
import { cn } from "@/lib/utils";

/* ===========================================================================
   Types
   =========================================================================== */

interface TabsProps {
  /** Tab panels and tab elements */
  children: React.ReactNode;
  /** Default active tab value */
  defaultValue?: string;
  /** Controlled active tab value */
  value?: string;
  /** Callback when tab changes */
  onChange?: (value: string) => void;
  /** Orientation for accessibility */
  orientation?: "horizontal" | "vertical";
  /** Sync with URL */
  urlSync?: boolean;
  /** URL parameter name for sync */
  urlParam?: string;
  /** Additional className */
  className?: string;
}

interface TabListProps {
  /** Tab elements */
  children: React.ReactNode;
  /** Additional className */
  className?: string;
  /** ARIA label for the tab list */
  "aria-label"?: string;
}

interface TabProps {
  /** Tab button content */
  children: React.ReactNode;
  /** Unique value for this tab */
  value: string;
  /** Disable this tab */
  disabled?: boolean;
  /** Additional className */
  className?: string;
  /** Optional icon */
  icon?: React.ReactNode;
  /** Icon position */
  iconPosition?: "left" | "right";
}

interface TabPanelProps {
  /** Panel content */
  children: React.ReactNode;
  /** Must match the corresponding tab's value */
  value: string;
  /** Additional className */
  className?: string;
  /** Hide when not active */
  hidden?: boolean;
}

/* ===========================================================================
   Context
   =========================================================================== */

interface TabsContextValue {
  orientation: "horizontal" | "vertical";
  value: string;
  setValue: (value: string) => void;
  urlSync: boolean;
  urlParam: string;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error("Tabs components must be used within Tabs");
  }
  return context;
}

/* ===========================================================================
   Main Tabs Component
   =========================================================================== */

export function Tabs({
  children,
  defaultValue,
  value: controlledValue,
  onChange,
  orientation = "horizontal",
  urlSync = false,
  urlParam = "tab",
  className,
}: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue || "");

  // Determine controlled vs uncontrolled
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;

  const setValue = useCallback(
    (newValue: string) => {
      if (!isControlled) {
        setInternalValue(newValue);
      }
      onChange?.(newValue);

      // URL sync
      if (urlSync) {
        const url = new URL(window.location.href);
        url.searchParams.set(urlParam, newValue);
        window.history.pushState({}, "", url.toString());
      }
    },
    [isControlled, onChange, urlSync, urlParam]
  );

  // Initialize from URL
  useEffect(() => {
    if (!urlSync) return;

    const params = new URLSearchParams(window.location.search);
    const urlValue = params.get(urlParam);

    if (urlValue) {
      setValue(urlValue);
    } else if (defaultValue) {
      setValue(defaultValue);
    }

    // Listen for popstate
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const urlValue = params.get(urlParam);
      if (urlValue) {
        if (!isControlled) {
          setInternalValue(urlValue);
        }
        onChange?.(urlValue);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [urlSync, urlParam, defaultValue, isControlled, onChange, setValue]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if focus is within a tab
      const target = e.target as HTMLElement;
      const tabList = target.closest('[role="tablist"]');
      if (!tabList) return;

      const tabs = Array.from(
        tabList.querySelectorAll<HTMLButtonElement>('[role="tab"]:not([disabled])')
      );
      const currentIndex = tabs.findIndex((tab) => tab === target || tab.contains(target));

      if (currentIndex === -1) return;

      let newIndex = currentIndex;
      const isVertical = orientation === "vertical";

      switch (e.key) {
        case isVertical ? "ArrowDown" : "ArrowRight":
          e.preventDefault();
          newIndex = (currentIndex + 1) % tabs.length;
          break;
        case isVertical ? "ArrowUp" : "ArrowLeft":
          e.preventDefault();
          newIndex = (currentIndex - 1 + tabs.length) % tabs.length;
          break;
        case "Home":
          e.preventDefault();
          newIndex = 0;
          break;
        case "End":
          e.preventDefault();
          newIndex = tabs.length - 1;
          break;
        default:
          return;
      }

      tabs[newIndex]?.focus();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [orientation]);

  // Set initial value
  useEffect(() => {
    if (defaultValue && !value) {
      setValue(defaultValue);
    }
  }, [defaultValue, value, setValue]);

  const contextValue: TabsContextValue = {
    orientation,
    value,
    setValue,
    urlSync,
    urlParam,
  };

  return (
    <TabsContext.Provider value={contextValue}>
      <div className={cn("flex flex-col", className)}>{children}</div>
    </TabsContext.Provider>
  );
}

/* ===========================================================================
   TabList Component
   =========================================================================== */

export function TabList({
  children,
  className,
  "aria-label": ariaLabel,
}: TabListProps) {
  const { orientation } = useTabsContext();

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "flex border-b border-ink-200",
        orientation === "vertical" && "flex-col border-b-0 border-r border-ink-200",
        className
      )}
    >
      {children}
    </div>
  );
}

/* ===========================================================================
   Tab Component
   =========================================================================== */

export function Tab({
  children,
  value,
  disabled = false,
  className,
  icon,
  iconPosition = "left",
}: TabProps) {
  const { value: activeValue, setValue, orientation } = useTabsContext();
  const isActive = activeValue === value;

  const handleClick = () => {
    if (!disabled) {
      setValue(value);
    }
  };

  const handleFocus = () => {
    if (!disabled) {
      setValue(value);
    }
  };

  return (
    <button
      role="tab"
      aria-selected={isActive}
      aria-controls={`panel-${value}`}
      id={`tab-${value}`}
      tabIndex={isActive ? 0 : -1}
      disabled={disabled}
      onClick={handleClick}
      onFocus={handleFocus}
      className={cn(
        "group flex items-center gap-2 px-4 py-3 text-sm font-medium",
        "transition-all duration-200",
        "focus:outline-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-hamplard-primary focus-visible:ring-inset",
        orientation === "vertical" && "justify-start border-r-2 border-transparent",
        isActive
          ? "border-b-2 border-hamplard-primary text-hamplard-primary"
          : "text-ink-600 hover:text-ink-900 hover:bg-ink-50",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
    >
      {icon && iconPosition === "left" && (
        <span className="flex-shrink-0">{icon}</span>
      )}
      <span className="truncate">{children}</span>
      {icon && iconPosition === "right" && (
        <span className="flex-shrink-0">{icon}</span>
      )}
    </button>
  );
}

/* ===========================================================================
   TabPanel Component
   =========================================================================== */

export function TabPanel({
  children,
  value,
  className,
  hidden: hiddenProp = false,
}: TabPanelProps) {
  const { value: activeValue } = useTabsContext();
  const isActive = activeValue === value;

  return (
    <div
      role="tabpanel"
      id={`panel-${value}`}
      aria-labelledby={`tab-${value}`}
      tabIndex={0}
      hidden={hiddenProp ? !isActive : undefined}
      className={cn(
        "animate-in fade-in duration-200",
        !isActive && "hidden",
        className
      )}
    >
      {children}
    </div>
  );
}

/* ===========================================================================
   Export
   =========================================================================== */

export default Tabs;