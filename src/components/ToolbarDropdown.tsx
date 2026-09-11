import React, { useRef, useEffect, useState, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

export interface ToolbarDropdownProps {
  id: string;
  triggerRef: React.RefObject<HTMLElement | null>;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'right';
  offset?: number;
}

export const ToolbarDropdown: React.FC<ToolbarDropdownProps> = ({
  id,
  triggerRef,
  isOpen,
  onClose,
  children,
  className = '',
  align = 'left',
  offset = 4,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number; ready: boolean }>({
    top: 0,
    left: 0,
    ready: false,
  });

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const dropdownEl = dropdownRef.current;
    
    // Estimate or measured dimension
    const dropdownWidth = dropdownEl ? dropdownEl.offsetWidth : 240;
    const dropdownHeight = dropdownEl ? dropdownEl.offsetHeight : 200;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Horizontal positioning
    let left = align === 'right' 
      ? triggerRect.right - dropdownWidth 
      : triggerRect.left;

    // Viewport edge protection (horizontal)
    if (left < 8) {
      left = 8;
    } else if (left + dropdownWidth > viewportWidth - 8) {
      left = Math.max(8, viewportWidth - dropdownWidth - 8);
    }

    // Vertical positioning
    let top = triggerRect.bottom + offset;

    // Viewport edge protection (vertical)
    if (top + dropdownHeight > viewportHeight - 8) {
      // If room above trigger, open upwards
      if (triggerRect.top - dropdownHeight - offset >= 8) {
        top = triggerRect.top - dropdownHeight - offset;
      } else {
        // Otherwise pin to bottom of viewport with margin
        top = Math.max(8, viewportHeight - dropdownHeight - 8);
      }
    }

    setCoords({ top, left, ready: true });
  }, [triggerRef, align, offset]);

  // Position recalculation when open or on resize/scroll
  useLayoutEffect(() => {
    if (!isOpen) return;

    updatePosition();
    // Re-check after layout render for accurate offsetWidth/offsetHeight
    const rafId = requestAnimationFrame(() => {
      updatePosition();
    });

    const handleScrollOrResize = () => {
      updatePosition();
    };

    window.addEventListener('resize', handleScrollOrResize, { passive: true });
    window.addEventListener('scroll', handleScrollOrResize, { passive: true, capture: true });

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, { capture: true } as EventListenerOptions);
    };
  }, [isOpen, updatePosition]);

  // Click outside and escape key handling
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (dropdownRef.current && dropdownRef.current.contains(target)) {
        return;
      }
      if (triggerRef.current && triggerRef.current.contains(target)) {
        return;
      }
      onClose();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside, { passive: true });
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  // Resolve target portal container (supports native browser fullscreen)
  const portalTarget =
    (document.fullscreenElement as HTMLElement) ||
    document.getElementById('overlay-root') ||
    document.body;

  return createPortal(
    <div
      ref={dropdownRef}
      id={`toolbar-dropdown-${id}`}
      data-dropdown-id={id}
      style={{
        position: 'fixed',
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        zIndex: 9999,
        visibility: coords.ready ? 'visible' : 'hidden',
      }}
      className={`bg-[#0E1524] border border-[#1F2C40] rounded-lg shadow-2xl select-none animate-in fade-in zoom-in-95 duration-100 ${className}`}
      role="dialog"
      aria-modal="true"
    >
      {children}
    </div>,
    portalTarget
  );
};
