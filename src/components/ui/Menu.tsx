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
import { ChevronRight, Check } from "lucide-react";

/* ===========================================================================
   Types
   =========================================================================== */

interface MenuProps {
  /** Menu content */
  children: React.ReactNode;
}

interface MenuTriggerProps {
  /** Trigger element */
  children: React.ReactNode;
  /** Additional className */
  className?: string;
  /** Pass ref to trigger element */
  triggerRef?: React.RefObject<HTMLButtonElement>;
}

interface MenuListProps {
  /** Menu items */
  children: React.ReactNode;
  /** Label for accessibility */
  label?: string;
  /** Additional className */
  className?: string;
  /** Alignment */
  align?: "start" | "center" | "end";
  /** Side offset */
  sideOffset?: number;
  /** Align offset */
  alignOffset?: number;
}

interface MenuItemProps {
  /** Item content */
  children: React.ReactNode;
  /** Callback when item is selected */
  onSelect?: (event: React.MouseEvent | React.KeyboardEvent) => void;
  /** Disable the item */
  disabled?: boolean;
  /** Item value for radio/checkbox groups */
  value?: string;
  /** Additional className */
  className?: string;
  /** Destructive action */
  destructive?: boolean;
  /** Start icon */
  icon?: React.ReactNode;
  /** End icon */
  endIcon?: React.ReactNode;
  /** Keyboard shortcut hint */
  shortcut?: string;
}

interface MenuCheckboxItemProps extends MenuItemProps {
  /** Checked state */
  checked?: boolean;
}

interface MenuRadioGroupProps {
  /** Radio items */
  children: React.ReactNode;
  /** Group value */
  value?: string;
  /** Callback when value changes */
  onValueChange?: (value: string) => void;
  /** Group label */
  label?: string;
}

interface MenuRadioItemProps extends MenuItemProps {
  /** Group this radio belongs to */
  groupValue?: string;
}

interface MenuDividerProps {
  /** Additional className */
  className?: string;
}

interface MenuSubProps {
  /** Nested menu content */
  children: React.ReactNode;
  /** Sub menu label */
  label?: string;
}

interface MenuSubTriggerProps {
  /** Trigger content */
  children: React.ReactNode;
  /** Additional className */
  className?: string;
}

interface MenuSubContentProps {
  /** Sub menu content */
  children: React.ReactNode;
  /** Additional className */
  className?: string;
}

/* ===========================================================================
   Context
   =========================================================================== */

interface MenuContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  labelId: string;
}

const MenuContext = createContext<MenuContextValue | null>(null);

function useMenuContext() {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error("Menu components must be used within a Menu");
  }
  return context;
}

/* ===========================================================================
   MenuRadioGroup Context
   =========================================================================== */

interface MenuRadioGroupContextValue {
  value?: string;
  onValueChange?: (value: string) => void;
}

const MenuRadioGroupContext = createContext<MenuRadioGroupContextValue | null>(null);

function useMenuRadioGroupContext() {
  return useContext(MenuRadioGroupContext);
}

/* ===========================================================================
   Utility Functions
   =========================================================================== */

function generateId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

/* ===========================================================================
   Main Menu Component
   =========================================================================== */

export function Menu({ children }: MenuProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const labelId = generateId("menu");

  const handleClose = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      if (
        contentRef.current &&
        !contentRef.current.contains(e.target as Node) &&
        !triggerRef.current?.contains(e.target as Node)
      ) {
        handleClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, handleClose]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const content = contentRef.current;
      if (!content) return;

      // Get all focusable items
      const items = Array.from(
        content.querySelectorAll<HTMLElement>(
          '[role="menuitem"]:not([disabled]), [role="menuitemcheckbox"]:not([disabled]), [role="menuitemradio"]:not([disabled])'
        )
      ).filter((el) => el.offsetParent !== null);

      const currentIndex = items.findIndex(
        (item) => item === document.activeElement || item.contains(document.activeElement)
      );

      if (currentIndex === -1) {
        items[0]?.focus();
        return;
      }

      let newIndex = currentIndex;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          newIndex = (currentIndex + 1) % items.length;
          break;
        case "ArrowUp":
          e.preventDefault();
          newIndex = (currentIndex - 1 + items.length) % items.length;
          break;
        case "Home":
          e.preventDefault();
          newIndex = 0;
          break;
        case "End":
          e.preventDefault();
          newIndex = items.length - 1;
          break;
        case "Escape":
          e.preventDefault();
          handleClose();
          return;
        case "Enter":
        case " ":
          // Let the item handle it
          return;
        default:
          // Typeahead
          if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
            const lowerKey = e.key.toLowerCase();
            const startIndex = currentIndex + 1;
            const searchedItems = [...items.slice(startIndex), ...items.slice(0, startIndex)];
            
            const match = searchedItems.find((item) => {
              const text = item.textContent?.toLowerCase() || "";
              return text.startsWith(lowerKey);
            });

            if (match) {
              e.preventDefault();
              match.focus();
            }
          }
          return;
      }

      items[newIndex]?.focus();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, handleClose]);

  // Prevent scroll when open
  useEffect(() => {
    if (!open) return;
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [open]);

  const contextValue: MenuContextValue = {
    open,
    setOpen,
    onClose: handleClose,
    triggerRef,
    labelId,
  };

  return (
    <MenuContext.Provider value={contextValue}>
      {React.Children.map(children, (child) => {
        if ((child as React.ReactElement)?.type === MenuTrigger || (child as React.ReactElement)?.type === "button") {
          // Wrap the trigger with the context
          return <MenuTriggerWrapper triggerRef={triggerRef}>{child}</MenuTriggerWrapper>;
        }
        if ((child as React.ReactElement)?.type === MenuList) {
          // Pass contentRef to MenuList
          return React.cloneElement(child as React.ReactElement<{ contentRef?: React.RefObject<HTMLDivElement> }>, {
            contentRef,
          });
        }
        return child;
      })}
    </MenuContext.Provider>
  );
}

/* ===========================================================================
   MenuTriggerWrapper - Internal
   =========================================================================== */

function MenuTriggerWrapper({
  children,
  triggerRef,
}: {
  children: React.ReactNode;
  triggerRef: React.RefObject<HTMLButtonElement>;
}) {
  const { open, setOpen } = useMenuContext();

  if (!React.isValidElement(children)) return children;

  return React.cloneElement(children as React.ReactElement<{
    ref?: React.RefObject<HTMLButtonElement>;
    onClick?: () => void;
    "aria-haspopup"?: string;
    "aria-expanded"?: boolean;
    "aria-controls"?: string;
    className?: string;
  }>, {
    ref: triggerRef,
    onClick: () => setOpen(!open),
    "aria-haspopup": "menu",
    "aria-expanded": open,
    "aria-controls": open ? undefined : undefined,
  });
}

/* ===========================================================================
   MenuTrigger - For external use
   =========================================================================== */

export function MenuTrigger({
  children,
  className,
  triggerRef,
}: MenuTriggerProps) {
  const { open, setOpen, onClose, labelId } = useMenuContext();

  return (
    <>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<{
            onClick?: () => void;
            "aria-haspopup"?: string;
            "aria-expanded"?: boolean;
            "aria-controls"?: string;
            ref?: React.RefObject<HTMLButtonElement>;
            className?: string;
          }>, {
            ref: triggerRef,
            onClick: () => setOpen(!open),
            "aria-haspopup": "menu",
            "aria-expanded": open,
            "aria-controls": open ? `${labelId}-content` : undefined,
            className: className,
          });
        }
        return child;
      })}
    </>
  );
}

/* ===========================================================================
   MenuList Component
   =========================================================================== */

interface MenuListInternalProps extends MenuListProps {
  contentRef?: React.RefObject<HTMLDivElement>;
}

export function MenuList({
  children,
  label,
  className,
  align = "start",
  sideOffset = 4,
  alignOffset = 0,
  contentRef,
}: MenuListInternalProps) {
  const { open, setOpen, onClose, triggerRef, labelId } = useMenuContext();

  if (!open) return null;

  return (
    <div
      ref={contentRef}
      role="menu"
      aria-label={label}
      id={`${labelId}-content`}
      className={cn(
        "z-50 min-w-[12rem] overflow-hidden rounded-lg border border-ink-200 bg-white p-1 shadow-lg",
        "animate-in fade-in zoom-in-95 duration-150",
        "absolute mt-2",
        align === "start" && `left-[${alignOffset}px]`,
        align === "center" && "left-1/2 -translate-x-1/2",
        align === "end" && `right-[${alignOffset}px]`,
        className
      )}
      style={{ marginTop: `${sideOffset}px` }}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  );
}

/* ===========================================================================
   MenuItem Component
   =========================================================================== */

export function MenuItem({
  children,
  onSelect,
  disabled = false,
  className,
  destructive = false,
  icon,
  endIcon,
  shortcut,
}: MenuItemProps) {
  const { onClose } = useMenuContext();

  const handleClick = (e: React.MouseEvent) => {
    if (disabled) return;
    onSelect?.(e);
    onClose();
  };

  return (
    <button
      role="menuitem"
      disabled={disabled}
      onClick={handleClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm",
        "text-left transition-colors duration-150",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-hamplard-primary focus-visible:ring-inset",
        disabled && "cursor-not-allowed opacity-50",
        !disabled && destructive
          ? "text-rose-600 hover:bg-rose-50"
          : !disabled && "text-ink-900 hover:bg-ink-100",
        className
      )}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span className="flex-1 truncate">{children}</span>
      {shortcut && (
        <span className="text-xs text-ink-400">{shortcut}</span>
      )}
      {endIcon && <span className="flex-shrink-0">{endIcon}</span>}
    </button>
  );
}

/* ===========================================================================
   MenuCheckboxItem Component
   =========================================================================== */

export function MenuCheckboxItem({
  children,
  checked = false,
  onSelect,
  disabled = false,
  className,
  icon,
}: MenuCheckboxItemProps) {
  const { onClose } = useMenuContext();

  const handleClick = (e: React.MouseEvent) => {
    if (disabled) return;
    onSelect?.(e);
    // Don't close on checkbox toggle - let consumer handle state
  };

  return (
    <button
      role="menuitemcheckbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={handleClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm",
        "text-left transition-colors duration-150",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-hamplard-primary focus-visible:ring-inset",
        disabled && "cursor-not-allowed opacity-50",
        !disabled && "text-ink-900 hover:bg-ink-100",
        className
      )}
    >
      <span className="flex h-4 w-4 items-center justify-center">
        {checked && <Check className="h-3 w-3" />}
      </span>
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span className="flex-1">{children}</span>
    </button>
  );
}

/* ===========================================================================
   MenuRadioGroup Component
   =========================================================================== */

export function MenuRadioGroup({
  children,
  value,
  onValueChange,
  label,
}: MenuRadioGroupProps) {
  const { labelId } = useMenuContext();

  return (
    <div role="group" aria-label={label || labelId}>
      <MenuRadioGroupContext.Provider value={{ value, onValueChange }}>
        {children}
      </MenuRadioGroupContext.Provider>
    </div>
  );
}

/* ===========================================================================
   MenuRadioItem Component
   =========================================================================== */

export function MenuRadioItem({
  children,
  onSelect,
  disabled = false,
  value,
  className,
  icon,
}: MenuRadioItemProps) {
  const { onClose } = useMenuContext();
  const radioContext = useMenuRadioGroupContext();
  const isChecked = radioContext?.value === value;

  const handleClick = (e: React.MouseEvent) => {
    if (disabled) return;
    radioContext?.onValueChange?.(value!);
    onSelect?.(e);
    onClose();
  };

  return (
    <button
      role="menuitemradio"
      aria-checked={isChecked}
      disabled={disabled}
      onClick={handleClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm",
        "text-left transition-colors duration-150",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-hamplard-primary focus-visible:ring-inset",
        disabled && "cursor-not-allowed opacity-50",
        !disabled && "text-ink-900 hover:bg-ink-100",
        className
      )}
    >
      <span className="flex h-4 w-4 items-center justify-center">
        {isChecked && (
          <span className="h-2 w-2 rounded-full bg-hamplard-primary" />
        )}
      </span>
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span className="flex-1">{children}</span>
    </button>
  );
}

/* ===========================================================================
   MenuDivider Component
   =========================================================================== */

export function MenuDivider({ className }: MenuDividerProps) {
  return (
    <div
      role="separator"
      className={cn("my-1 h-px bg-ink-200", className)}
    />
  );
}

/* ===========================================================================
   MenuSub Component (Nested Menus)
   =========================================================================== */

export function MenuSub({ children, label }: MenuSubProps) {
  const [isOpen, setIsOpen] = useState(false);
  const subTriggerRef = useRef<HTMLButtonElement>(null);
  const subContentRef = useRef<HTMLDivElement>(null);

  // Keyboard for nested menu
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const content = subContentRef.current;
      if (!content) return;

      switch (e.key) {
        case "Escape":
          e.preventDefault();
          setIsOpen(false);
          subTriggerRef.current?.focus();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <div className="relative">
      {React.Children.map(children, (child) => {
        const childElement = child as React.ReactElement;
        if (childElement?.type === MenuSubTrigger) {
          return React.cloneElement(childElement, {
            ref: subTriggerRef,
            onMouseEnter: () => setIsOpen(true),
            onMouseLeave: () => setIsOpen(false),
            onClick: () => setIsOpen(!isOpen),
            "aria-expanded": isOpen,
          } as React.ButtonHTMLAttributes<HTMLButtonElement>);
        }
        if (childElement?.type === MenuSubContent) {
          if (!isOpen) return null;
          return React.cloneElement(childElement, {
            ref: subContentRef,
          });
        }
        return child;
      })}
    </div>
  );
}

export function MenuSubTrigger({
  children,
  className,
}: MenuSubTriggerProps) {
  return (
    <button
      role="menuitem"
      className={cn(
        "flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm",
        "text-left text-ink-900 transition-colors duration-150",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-hamplard-primary focus-visible:ring-inset",
        "hover:bg-ink-100",
        className
      )}
    >
      {children}
      <ChevronRight className="h-4 w-4" />
    </button>
  );
}

export function MenuSubContent({
  children,
  className,
}: MenuSubContentProps) {
  return (
    <div
      role="menu"
      className={cn(
        "z-50 min-w-[12rem] overflow-hidden rounded-lg border border-ink-200 bg-white p-1 shadow-lg",
        "animate-in fade-in zoom-in-95 duration-150",
        "absolute left-full top-0 ml-1",
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

export default Menu;