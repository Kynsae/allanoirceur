import { inject, Injectable, signal, effect } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Event, NavigationStart, Router } from '@angular/router';
import { filter } from 'rxjs';
import { ScrollManager } from './scroll-manager';

/**
 * Manages page loading state, progress tracking, and scroll behavior during navigation.
 */
@Injectable({
  providedIn: 'root'
})
export class NavigationLoaderManager {
  public readonly hasPageLoaded = signal(false);
  public readonly isLoading = signal(true);
  public readonly loadingPercentage = signal(0);
  
  private minimumTimer: ReturnType<typeof setTimeout> | null = null;
  private progressAnimationFrame: number | null = null;
  private sourceProgress: number[] = [];
  private scrollTimeout: any;
  private loadingStartedAt = 0;
  
  private readonly MIN_LOADING_DURATION_MS = 2500;
  private readonly SCROLL_LIMITER_WAIT_MS = 2000;

  private readonly router = inject(Router);
  private readonly scrollManager = inject(ScrollManager);
  
  constructor() {
    // Reset loading state on each navigation.
    this.router.events.pipe(
      filter((event: Event) => event instanceof NavigationStart),
      takeUntilDestroyed()
    ).subscribe(() => {
      this.clearPendingLoadWork();
      this.loadingPercentage.set(0);
      this.sourceProgress = [];
      this.isLoading.set(true);
    });

    // Sync scroll behaviour with loading state.
    effect(() => {
      if (this.scrollTimeout) clearTimeout(this.scrollTimeout);

      if(this.isLoading()) {
        this.scrollManager.stop();
      }
      else {
        this.scrollTimeout = setTimeout(() => {
          this.scrollManager.start();
        }, this.SCROLL_LIMITER_WAIT_MS);
      }

      if (!this.isLoading() && !this.hasPageLoaded()) {
        this.hasPageLoaded.set(true);
        console.log('page loaded');
      }
    });
  }

  /**
   * Initializes a loading session with multiple progress sources.
   * @param numberOfSources Number of sources to track
   */
  public startLoading(numberOfSources: number): void {
    this.clearPendingLoadWork();
    this.loadingPercentage.set(0);
    this.hasPageLoaded.set(false);
    this.isLoading.set(true);
    this.sourceProgress = new Array(numberOfSources).fill(0);
    this.loadingStartedAt = performance.now();
  }

  /**
   * Updates progress for a specific source and recalculates total.
   * @param sourceIndex Source index (0-based)
   * @param percentage Progress value (0-100)
   */
  public updateSourceProgress(sourceIndex: number, percentage: number): void {
    if (sourceIndex < 0 || sourceIndex >= this.sourceProgress.length) return;
    
    this.sourceProgress[sourceIndex] = Math.max(0, Math.min(100, percentage));
    this.updateLoadingPercentage();
  }

  /**
   * Averages all source progress and completes loading at 100%.
   */
  private updateLoadingPercentage(): void {
    if (this.sourceProgress.length === 0) return;

    const total = this.sourceProgress.reduce((sum, p) => sum + p, 0);
    const average = Math.round(total / this.sourceProgress.length);
    const elapsed = performance.now() - this.loadingStartedAt;
    const minimumDurationProgress = Math.min(100, Math.round((elapsed / this.MIN_LOADING_DURATION_MS) * 100));
    const visibleProgress = average >= 100 ? minimumDurationProgress : Math.min(average, minimumDurationProgress);

    this.loadingPercentage.set(visibleProgress);

    if (average >= 100) {
      if (visibleProgress >= 100) {
        this.completeLoading();
        return;
      }

      this.scheduleProgressCompletion();
    }
  }

  private scheduleProgressCompletion(): void {
    if (this.progressAnimationFrame !== null) {
      return;
    }

    const step = () => {
      this.progressAnimationFrame = null;
      this.updateLoadingPercentage();

      if (this.loadingPercentage() < 100 && this.isLoading()) {
        this.scheduleProgressCompletion();
      }
    };

    this.progressAnimationFrame = requestAnimationFrame(step);
  }

  private completeLoading(): void {
    if (this.minimumTimer) {
      return;
    }

    this.minimumTimer = setTimeout(() => {
      this.minimumTimer = null;
      this.isLoading.set(false);
    }, 0);
  }

  private clearPendingLoadWork(): void {
    if (this.minimumTimer) {
      clearTimeout(this.minimumTimer);
      this.minimumTimer = null;
    }

    if (this.progressAnimationFrame !== null) {
      cancelAnimationFrame(this.progressAnimationFrame);
      this.progressAnimationFrame = null;
    }
  }
}
