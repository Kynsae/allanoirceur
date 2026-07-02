import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

/**
 * Keeps a stable layout viewport height on touch devices so browser chrome
 * changes do not reflow full-screen sections while scrolling.
 */
@Injectable({ providedIn: 'root' })
export class Viewport {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly viewportHeight = signal(0);
  private lastWidth = 0;

  private readonly resizeListener = () => {
    if (!this.isTouchDevice()) {
      this.updateViewportHeight();
      return;
    }

    const nextWidth = window.innerWidth;

    if (nextWidth !== this.lastWidth) {
      this.updateViewportHeight();
    }
  };

  private readonly orientationListener = () => this.updateViewportHeight();

  public init(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.updateViewportHeight();
    window.addEventListener('resize', this.resizeListener, { passive: true });
    window.addEventListener('orientationchange', this.orientationListener, { passive: true });
  }

  public height(): number {
    if (!isPlatformBrowser(this.platformId)) {
      return 0;
    }

    return this.viewportHeight() || Math.round(window.innerHeight);
  }

  private updateViewportHeight(): void {
    const nextHeight = Math.round(window.visualViewport?.height ?? window.innerHeight);

    this.lastWidth = window.innerWidth;
    this.viewportHeight.set(nextHeight);
    document.documentElement.style.setProperty('--viewport-height', `${nextHeight}px`);
  }

  private isTouchDevice(): boolean {
    return window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  }
}
