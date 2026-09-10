import { Candle, ChartViewport, Timeframe } from '../types';

/**
 * ============================================================================
 * TRADEXPULSE PROFESSIONAL CHART VIEWPORT & COORDINATE ENGINE
 * ============================================================================
 * Implements a continuous/fractional viewport coordinate transformation model
 * decoupled from growing realtime candle arrays. Provides 1:1 direct pointer
 * tracking, cursor-anchored zoom, auto-live snap, and momentum deceleration.
 */

export interface ChartDimensions {
  width: number;
  height: number;
  paddingLeft: number;
  paddingRight: number;
  paddingTop: number;
  paddingBottom: number;
  plotWidth: number;
  plotHeight: number;
}

export interface PriceBounds {
  minPrice: number;
  maxPrice: number;
  paddedMin: number;
  paddedMax: number;
  paddedRange: number;
}

export class ChartViewportEngine {
  public static readonly DEFAULT_VISIBLE_BARS = 55;
  public static readonly MIN_VISIBLE_BARS = 14;
  public static readonly MAX_VISIBLE_BARS = 260;
  public static readonly DEFAULT_RIGHT_OFFSET_BARS = 12;
  public static readonly LIVE_EDGE_SNAP_TOLERANCE = 1.0; // within 1.0 bar of live edge snaps to LIVE

  /**
   * Calculate liveFirstVisibleIndex such that latest candle sits
   * (rightOffsetBars) bars inside from the right boundary.
   */
  public static getLiveFirstVisibleIndex(
    totalCandles: number,
    visibleBarCount: number,
    rightOffsetBars: number = this.DEFAULT_RIGHT_OFFSET_BARS
  ): number {
    if (totalCandles <= 0) return 0;
    const lastIndex = totalCandles - 1;
    return (lastIndex + rightOffsetBars) - visibleBarCount;
  }

  /**
   * Determine whether viewport is currently at the live market edge.
   */
  public static isAtLiveEdge(
    viewport: ChartViewport,
    totalCandles: number,
    tolerance: number = this.LIVE_EDGE_SNAP_TOLERANCE
  ): boolean {
    if (viewport.mode === 'LIVE' && viewport.isFollowingLive) return true;
    const liveFirst = this.getLiveFirstVisibleIndex(totalCandles, viewport.visibleBarCount, viewport.rightOffsetBars);
    return viewport.firstVisibleIndex >= liveFirst - tolerance;
  }

  /**
   * Create an initial LIVE viewport
   */
  public static createInitialViewport(
    totalCandles: number = 250,
    visibleBarCount: number = this.DEFAULT_VISIBLE_BARS,
    rightOffsetBars: number = this.DEFAULT_RIGHT_OFFSET_BARS
  ): ChartViewport {
    const liveFirst = this.getLiveFirstVisibleIndex(totalCandles, visibleBarCount, rightOffsetBars);
    return {
      firstVisibleIndex: liveFirst,
      visibleBarCount,
      rightOffsetBars,
      mode: 'LIVE',
      isFollowingLive: true,
      isDragging: false,
      isZooming: false
    };
  }

  /**
   * Professional 1:1 Direct Pointer Drag
   * Moving mouse right (+deltaX) moves chart right -> reveals older candles (decreases firstVisibleIndex).
   * Moving mouse left (-deltaX) moves chart left -> reveals newer candles (increases firstVisibleIndex).
   */
  public static applyPan(
    currentViewport: ChartViewport,
    dragStartFirstVisible: number,
    totalDx: number,
    plotWidth: number,
    totalCandles: number
  ): ChartViewport {
    const barSpacing = plotWidth / currentViewport.visibleBarCount;
    const barsMoved = totalDx / barSpacing;
    const targetFirst = dragStartFirstVisible - barsMoved;

    const liveFirst = this.getLiveFirstVisibleIndex(totalCandles, currentViewport.visibleBarCount, currentViewport.rightOffsetBars);

    // Auto-snap to live edge if dragged near the current live bar
    if (targetFirst >= liveFirst - this.LIVE_EDGE_SNAP_TOLERANCE) {
      return {
        ...currentViewport,
        firstVisibleIndex: liveFirst,
        mode: 'LIVE',
        isFollowingLive: true
      };
    }

    // Historical navigation: view is completely independent of growing candle array
    return {
      ...currentViewport,
      firstVisibleIndex: targetFirst,
      mode: 'HISTORICAL',
      isFollowingLive: false
    };
  }

  /**
   * Cursor-Centered Zoom
   * The market coordinate (bar index) underneath cursor stays fixed on screen while surrounding bars scale.
   */
  public static applyZoom(
    currentViewport: ChartViewport,
    zoomRatio: number, // < 1 to zoom in (fewer bars), > 1 to zoom out (more bars)
    cursorScreenX: number,
    dims: ChartDimensions,
    totalCandles: number
  ): ChartViewport {
    const plotWidth = dims.plotWidth;
    const paddingLeft = dims.paddingLeft;

    // Anchor ratio across plot width
    const anchorRatio = Math.max(0.04, Math.min(0.96, (cursorScreenX - paddingLeft) / plotWidth));

    const rawVisible = currentViewport.visibleBarCount * zoomRatio;
    const newVisible = Math.max(
      this.MIN_VISIBLE_BARS,
      Math.min(this.MAX_VISIBLE_BARS, Math.round(rawVisible * 100) / 100)
    );

    const anchorIndex = currentViewport.firstVisibleIndex + anchorRatio * currentViewport.visibleBarCount;
    const newFirst = anchorIndex - anchorRatio * newVisible;

    const liveFirst = this.getLiveFirstVisibleIndex(totalCandles, newVisible, currentViewport.rightOffsetBars);

    if (currentViewport.isFollowingLive || newFirst >= liveFirst - this.LIVE_EDGE_SNAP_TOLERANCE) {
      return {
        ...currentViewport,
        visibleBarCount: newVisible,
        firstVisibleIndex: liveFirst,
        mode: 'LIVE',
        isFollowingLive: true
      };
    }

    return {
      ...currentViewport,
      visibleBarCount: newVisible,
      firstVisibleIndex: newFirst,
      mode: 'HISTORICAL',
      isFollowingLive: false
    };
  }

  /**
   * Snaps viewport directly to LIVE edge
   */
  public static snapToLive(
    currentViewport: ChartViewport,
    totalCandles: number
  ): ChartViewport {
    const liveFirst = this.getLiveFirstVisibleIndex(totalCandles, currentViewport.visibleBarCount, currentViewport.rightOffsetBars);
    return {
      ...currentViewport,
      firstVisibleIndex: liveFirst,
      mode: 'LIVE',
      isFollowingLive: true
    };
  }

  /**
   * Advances viewport when a new timeframe candle is created while following LIVE.
   * If in HISTORICAL mode, viewport stays FROZEN and does not advance.
   */
  public static handleNewRealtimeCandle(
    currentViewport: ChartViewport,
    newTotalCandles: number
  ): ChartViewport {
    if (!currentViewport.isFollowingLive) {
      // Historical mode: viewport NEVER moves upon new candle arrivals!
      return currentViewport;
    }
    const liveFirst = this.getLiveFirstVisibleIndex(newTotalCandles, currentViewport.visibleBarCount, currentViewport.rightOffsetBars);
    return {
      ...currentViewport,
      firstVisibleIndex: liveFirst,
      mode: 'LIVE',
      isFollowingLive: true
    };
  }

  /**
   * Rebase viewport when older historical candles are prepended.
   * Shifts firstVisibleIndex by the prepended amount so the visual screen position doesn't jump!
   */
  public static rebasePrependedHistory(
    currentViewport: ChartViewport,
    prependedCount: number
  ): ChartViewport {
    return {
      ...currentViewport,
      firstVisibleIndex: currentViewport.firstVisibleIndex + prependedCount
    };
  }

  /**
   * Rebase viewport when switching timeframes.
   * Preserves approximate timestamp if historical, or remains LIVE if live.
   */
  public static rebaseTimeframe(
    currentViewport: ChartViewport,
    targetTimestamp: number | null,
    newCandles: Candle[]
  ): ChartViewport {
    if (currentViewport.isFollowingLive || !targetTimestamp || newCandles.length === 0) {
      return this.snapToLive(currentViewport, newCandles.length);
    }

    // Locate closest candle in new timeframe
    let closestIndex = 0;
    let minDiff = Infinity;
    for (let i = 0; i < newCandles.length; i++) {
      const diff = Math.abs(newCandles[i].time - targetTimestamp);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = i;
      }
    }

    const newFirst = Math.max(0, closestIndex - Math.round(currentViewport.visibleBarCount / 2));
    return {
      ...currentViewport,
      firstVisibleIndex: newFirst,
      mode: 'HISTORICAL',
      isFollowingLive: false
    };
  }

  /**
   * Coordinate Transformer: Market Bar Index -> Screen X (Pixels)
   */
  public static barToScreenX(
    barIndex: number,
    firstVisibleIndex: number,
    barSpacing: number,
    paddingLeft: number
  ): number {
    return paddingLeft + (barIndex - firstVisibleIndex) * barSpacing + barSpacing / 2;
  }

  /**
   * Coordinate Transformer: Screen X (Pixels) -> Market Bar Index (Continuous float)
   */
  public static screenXToBar(
    screenX: number,
    firstVisibleIndex: number,
    barSpacing: number,
    paddingLeft: number
  ): number {
    return firstVisibleIndex + (screenX - paddingLeft - barSpacing / 2) / barSpacing;
  }

  /**
   * Coordinate Transformer: Price -> Screen Y (Pixels)
   */
  public static priceToScreenY(
    price: number,
    paddedMin: number,
    paddedRange: number,
    paddingTop: number,
    plotHeight: number
  ): number {
    if (paddedRange <= 0) return paddingTop + plotHeight / 2;
    return paddingTop + plotHeight - ((price - paddedMin) / paddedRange) * plotHeight;
  }

  /**
   * Coordinate Transformer: Screen Y (Pixels) -> Price
   */
  public static screenYToPrice(
    screenY: number,
    paddedMin: number,
    paddedRange: number,
    paddingTop: number,
    plotHeight: number
  ): number {
    if (plotHeight <= 0) return paddedMin;
    const fraction = (paddingTop + plotHeight - screenY) / plotHeight;
    return paddedMin + fraction * paddedRange;
  }

  /**
   * Convert timestamp to approximate bar index in continuous space.
   * If exact candle exists, returns its index.
   * If timestamp is in the future, projects forward based on timeframe interval.
   */
  public static timestampToBarIndex(
    timestamp: number,
    candles: Candle[],
    timeframe: Timeframe
  ): number {
    if (candles.length === 0) return 0;

    const firstTime = candles[0].time;
    const lastTime = candles[candles.length - 1].time;

    const tfMs: Record<Timeframe, number> = {
      M1: 60 * 1000,
      M5: 5 * 60 * 1000,
      M15: 15 * 60 * 1000,
      H1: 60 * 60 * 1000,
      H4: 4 * 60 * 60 * 1000,
      D1: 24 * 60 * 60 * 1000
    };
    const interval = tfMs[timeframe] || 5 * 60 * 1000;

    if (timestamp >= lastTime) {
      const barsAhead = (timestamp - lastTime) / interval;
      return (candles.length - 1) + barsAhead;
    }

    if (timestamp <= firstTime) {
      const barsBehind = (firstTime - timestamp) / interval;
      return -barsBehind;
    }

    // Binary search for closest candle
    let low = 0;
    let high = candles.length - 1;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const cTime = candles[mid].time;
      if (Math.abs(cTime - timestamp) < interval / 2) {
        return mid;
      }
      if (cTime < timestamp) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    return Math.max(0, Math.min(candles.length - 1, low));
  }
}
