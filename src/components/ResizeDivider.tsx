import React, { useEffect, useState, useRef, useCallback } from 'react';

interface ResizeDividerProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  chartHeightPercent: number;
  onHeightChange: (newPercent: number) => void;
  minChartPx?: number;
  minBottomPx?: number;
}

export const ResizeDivider: React.FC<ResizeDividerProps> = ({
  containerRef,
  chartHeightPercent,
  onHeightChange,
  minChartPx = 350,
  minBottomPx = 160,
}) => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const isDraggingRef = useRef<boolean>(false);

  const handleStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    isDraggingRef.current = true;
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (clientY: number) => {
      if (!isDraggingRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const totalH = rect.height;
      if (totalH <= 0) return;

      const currentY = clientY - rect.top;
      const rawPercent = (currentY / totalH) * 100;

      // Calculate min and max bounds based on pixel constraints
      const minPercent = Math.max(25, (minChartPx / totalH) * 100);
      const maxPercent = Math.min(85, ((totalH - minBottomPx) / totalH) * 100);

      const clamped = Math.max(minPercent, Math.min(maxPercent, rawPercent));
      onHeightChange(clamped);

      try {
        localStorage.setItem('tradexpulse_chart_split', clamped.toFixed(1));
      } catch {
        // ignore localStorage errors
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      handleMove(e.clientY);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        e.preventDefault();
        handleMove(e.touches[0].clientY);
      }
    };

    const onEnd = () => {
      setIsDragging(false);
      isDraggingRef.current = false;
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onEnd);
    };
  }, [isDragging, containerRef, minChartPx, minBottomPx, onHeightChange]);

  return (
    <div
      id="chart-bottom-resize-divider"
      onMouseDown={handleStart}
      onTouchStart={handleStart}
      className="relative w-full h-[10px] -my-[4.5px] cursor-row-resize flex items-center select-none shrink-0 z-10 group bg-transparent"
      aria-label="Resize chart and bottom panels"
      role="separator"
    >
      {/* 
        The ONLY visible element: ONE simple thin horizontal line.
        No text. No arrows. No icons. No pills. No badges.
      */}
      <div 
        className={`w-full h-px transition-colors duration-150 pointer-events-none ${
          isDragging 
            ? 'bg-cyan-400 shadow-[0_0_8px_rgba(56,189,248,0.5)]' 
            : 'bg-[#1B2537] group-hover:bg-[#2E405E]'
        }`} 
      />
    </div>
  );
};
