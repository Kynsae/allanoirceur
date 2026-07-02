import { afterNextRender, Component, computed, effect, ElementRef, HostListener, inject, OnDestroy, signal, viewChildren } from '@angular/core';
import { ArtistRecord } from '../../core/models/artist-record.model';
import { ScrollManager } from '../../core/services/scroll-manager';
import { ScrollTextReel } from '../../shared/components/scroll-text-reel/scroll-text-reel';
import { RECORDS } from '../../core/datas/records.data';

interface RecordTextTransition {
  fromIndex: number;
  toIndex: number;
  activeIndex: number;
  progress: number;
}

@Component({
  selector: 'app-records',
  imports: [
    ScrollTextReel
  ],
  templateUrl: './records.html',
  styleUrl: './records.scss',
})
export class Records implements OnDestroy {
  private readonly TRANSITION_WINDOW = 0.6;
  private readonly END_FADE_DISTANCE_FACTOR = 0.65;
  private readonly END_FADE_LEAD_FACTOR = 0.2;
  private readonly scrollManager = inject(ScrollManager);
  private readonly recordCovers = viewChildren<ElementRef<HTMLImageElement>>('recordCover');
  private readonly coverCenters = signal<number[]>([]);
  private measureFrameId: number | null = null;
  private lastScroll = 0;

  protected readonly scrollDirection = signal<'up' | 'down'>('down');
  protected readonly recordTransition = computed<RecordTextTransition>(() => {
    const centers = this.coverCenters();
    const direction = this.scrollDirection();

    if (typeof window === 'undefined' || centers.length === 0) {
      return {
        fromIndex: 0,
        toIndex: 0,
        activeIndex: 0,
        progress: 0
      };
    }

    const viewportCenter = this.scrollManager.actualScroll() + window.innerHeight / 2;

    if (viewportCenter <= centers[0]!) {
      return {
        fromIndex: 0,
        toIndex: 0,
        activeIndex: 0,
        progress: 0
      };
    }

    const lastIndex = centers.length - 1;

    if (viewportCenter >= centers[lastIndex]!) {
      return {
        fromIndex: lastIndex,
        toIndex: lastIndex,
        activeIndex: lastIndex,
        progress: 0
      };
    }

    for (let index = 0; index < lastIndex; index++) {
      const start = centers[index]!;
      const end = centers[index + 1]!;

      if (viewportCenter >= start && viewportCenter <= end) {
        const segmentProgress = (viewportCenter - start) / (end - start);
        const isScrollingUp = direction === 'up';
        const fromIndex = isScrollingUp ? index + 1 : index;
        const toIndex = isScrollingUp ? index : index + 1;
        const directionalProgress = isScrollingUp ? 1 - segmentProgress : segmentProgress;
        const progress = this.tightenTransitionWindow(directionalProgress);

        return {
          fromIndex,
          toIndex,
          activeIndex: progress >= 0.5 ? toIndex : fromIndex,
          progress
        };
      }
    }

    return {
      fromIndex: lastIndex,
      toIndex: lastIndex,
      activeIndex: lastIndex,
      progress: 0
    };
  });
  protected readonly activeRecord = computed<ArtistRecord>(() => this.RECORDS[this.recordTransition().activeIndex] ?? this.RECORDS[0]!);
  protected readonly fromRecord = computed<ArtistRecord>(() => this.RECORDS[this.recordTransition().fromIndex] ?? this.RECORDS[0]!);
  protected readonly toRecord = computed<ArtistRecord>(() => this.RECORDS[this.recordTransition().toIndex] ?? this.RECORDS[0]!);
  protected readonly transitionProgress = computed(() => this.recordTransition().progress);
  protected readonly activePosition = computed(() => `${this.activeRecordIndex() + 1}/${this.RECORDS.length}`);
  protected readonly fromPosition = computed(() => `${this.recordTransition().fromIndex + 1}/${this.RECORDS.length}`);
  protected readonly toPosition = computed(() => `${this.recordTransition().toIndex + 1}/${this.RECORDS.length}`);
  protected readonly activeRecordIndex = computed(() => this.recordTransition().activeIndex);
  protected readonly infosOpacity = computed(() => {
    const centers = this.coverCenters();

    if (typeof window === 'undefined' || centers.length === 0) {
      return 1;
    }

    const lastCenter = centers[centers.length - 1]!;
    const previousCenter = centers.length > 1 ? centers[centers.length - 2]! : lastCenter - window.innerHeight / 2;
    const fadeDistance = Math.max(120, (lastCenter - previousCenter) * this.END_FADE_DISTANCE_FACTOR);
    const fadeStart = lastCenter - fadeDistance * this.END_FADE_LEAD_FACTOR;
    const fadeEnd = fadeStart + fadeDistance;
    const viewportCenter = this.scrollManager.actualScroll() + window.innerHeight / 2;

    if (viewportCenter <= fadeStart) {
      return 1;
    }

    if (viewportCenter >= fadeEnd) {
      return 0;
    }

    return 1 - (viewportCenter - fadeStart) / (fadeEnd - fadeStart);
  });

  public readonly RECORDS = RECORDS;

  constructor() {
    effect(() => {
      this.recordCovers();
      this.scheduleCoverMeasurement();
    });

    effect(() => {
      const scroll = this.scrollManager.actualScroll();

      if (scroll !== this.lastScroll) {
        this.scrollDirection.set(scroll > this.lastScroll ? 'down' : 'up');
        this.lastScroll = scroll;
      }
    });

    afterNextRender(() => {
      this.scheduleCoverMeasurement();
    });
  }

  @HostListener('window:resize')
  protected onWindowResize(): void {
    this.scheduleCoverMeasurement();
  }

  protected onCoverLoad(): void {
    this.scheduleCoverMeasurement();
  }

  public ngOnDestroy(): void {
    if (this.measureFrameId !== null) {
      cancelAnimationFrame(this.measureFrameId);
      this.measureFrameId = null;
    }
  }

  private scheduleCoverMeasurement(): void {
    if (typeof window === 'undefined') {
      return;
    }

    if (this.measureFrameId !== null) {
      return;
    }

    this.measureFrameId = window.requestAnimationFrame(() => {
      this.measureFrameId = null;
      this.measureCoverCenters();
    });
  }

  private measureCoverCenters(): void {
    const covers = this.recordCovers();

    if (covers.length === 0) {
      this.coverCenters.set([]);
      return;
    }

    const scroll = this.scrollManager.actualScroll();
    const centers = covers.map((cover) => {
      const rect = cover.nativeElement.getBoundingClientRect();
      return scroll + rect.top + rect.height / 2;
    });
    this.coverCenters.set(centers);
  }

  private tightenTransitionWindow(progress: number): number {
    const halfWindow = this.TRANSITION_WINDOW / 2;
    const windowStart = 0.5 - halfWindow;
    const windowEnd = 0.5 + halfWindow;

    if (progress <= windowStart) {
      return 0;
    }

    if (progress >= windowEnd) {
      return 1;
    }

    return (progress - windowStart) / (windowEnd - windowStart);
  }
}
