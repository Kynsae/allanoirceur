import { afterNextRender, Component, DestroyRef, ElementRef, inject, ViewChild } from '@angular/core';
import { ShowEvent } from '../../core/models/show-event.model';
import { EventPreview } from '../../shared/components/event-preview/event-preview';
import { Parallax } from '../../core/services/parallax';
import { ScrollManager } from '../../core/services/scroll-manager';
import { LinkPreview } from '../../shared/components/link-preview/link-preview';
import { ReleaseCoverShader } from '../../shared/components/release-cover-shader/release-cover-shader';
import { RECORDS } from '../../core/datas/records.data';
import { SHOW_EVENTS } from '../../core/datas/show-events.data';
import { NavigationLoaderManager } from '../../core/services/navigation-loader-manager';

@Component({
  selector: 'app-home',
  imports: [
    EventPreview,
    LinkPreview,
    ReleaseCoverShader
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private static readonly VIDEO_SOURCE_INDEX = 0;
  private static readonly VIDEO_LOAD_COMPLETE_THRESHOLD_SECONDS = 0.25;

  @ViewChild('landingVideo')
  private readonly landingVideo?: ElementRef<HTMLVideoElement>;

  @ViewChild('featuredAlbumSection')
  private readonly featuredAlbumSection?: ElementRef<HTMLElement>;

  private readonly parallax = inject(Parallax);
  private readonly scrollManager = inject(ScrollManager);
  private readonly loaderManager = inject(NavigationLoaderManager);
  private readonly destroyRef = inject(DestroyRef);
  
  public readonly featuredAlbum = RECORDS[0];

  public readonly SHOW_EVENTS = SHOW_EVENTS;

  constructor() {
    this.loaderManager.startLoading(1);
    
    afterNextRender(() => {
      this.setupVideoLoadingTracking();
      this.setupVideoAutoplay();
    });
  }

  private setupVideoAutoplay(): void {
    const video = this.landingVideo?.nativeElement;

    if (!video) {
      return;
    }

    const tryPlay = () => {
      video.muted = true;
      video.defaultMuted = true;
      video.setAttribute('muted', '');
      video.setAttribute('autoplay', '');
      video.setAttribute('playsinline', '');

      void video.play().catch(() => {
        // Ignore autoplay rejections and retry on the next supported event.
      });
    };

    tryPlay();

    video.addEventListener('canplay', tryPlay);
    document.addEventListener('visibilitychange', tryPlay);
    window.addEventListener('focus', tryPlay);
    window.addEventListener('pageshow', tryPlay);

    this.destroyRef.onDestroy(() => {
      video.removeEventListener('canplay', tryPlay);
      document.removeEventListener('visibilitychange', tryPlay);
      window.removeEventListener('focus', tryPlay);
      window.removeEventListener('pageshow', tryPlay);
    });
  }

  private setupVideoLoadingTracking(): void {
    const video = this.landingVideo?.nativeElement;

    if (!video) {
      return;
    }

    const syncProgress = () => {
      const percentage = this.calculateBufferedPercentage(video);
      this.loaderManager.updateSourceProgress(Home.VIDEO_SOURCE_INDEX, percentage);

      if (percentage >= 100 || this.hasVideoLoadedEnough(video)) {
        this.loaderManager.updateSourceProgress(Home.VIDEO_SOURCE_INDEX, 100);
      }
    };

    const markAsLoaded = () => {
      this.loaderManager.updateSourceProgress(Home.VIDEO_SOURCE_INDEX, 100);
    };

    video.addEventListener('loadedmetadata', syncProgress);
    video.addEventListener('progress', syncProgress);
    video.addEventListener('durationchange', syncProgress);
    video.addEventListener('canplaythrough', markAsLoaded);
    video.addEventListener('error', markAsLoaded);

    this.destroyRef.onDestroy(() => {
      video.removeEventListener('loadedmetadata', syncProgress);
      video.removeEventListener('progress', syncProgress);
      video.removeEventListener('durationchange', syncProgress);
      video.removeEventListener('canplaythrough', markAsLoaded);
      video.removeEventListener('error', markAsLoaded);
    });

    syncProgress();
  }

  private calculateBufferedPercentage(video: HTMLVideoElement): number {
    if (!Number.isFinite(video.duration) || video.duration <= 0 || video.buffered.length === 0) {
      return 0;
    }

    let bufferedDuration = 0;

    for (let index = 0; index < video.buffered.length; index += 1) {
      bufferedDuration += video.buffered.end(index) - video.buffered.start(index);
    }

    return Math.round(Math.min(100, (bufferedDuration / video.duration) * 100));
  }

  private hasVideoLoadedEnough(video: HTMLVideoElement): boolean {
    if (video.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) {
      return true;
    }

    if (!Number.isFinite(video.duration) || video.duration <= 0 || video.buffered.length === 0) {
      return false;
    }

    const lastBufferedSecond = video.buffered.end(video.buffered.length - 1);
    return lastBufferedSecond >= video.duration - Home.VIDEO_LOAD_COMPLETE_THRESHOLD_SECONDS;
  }

  public lerp(
    rangeStart: number, 
    rangeEnd: number, 
    pageStart: number, 
    pageEnd: number,
    easingType: string = 'linear'
  ): number {
    return this.parallax.lerp(
      rangeStart, 
      rangeEnd, 
      pageStart, 
      pageEnd,
      this.scrollManager.actualScroll(),
      easingType
    );
  }

  public lerpOffset(
    rangeStart: number, 
    rangeEnd: number, 
    pageStart: number, 
    pageEnd: number,
    easingType: string = 'linear'
  ): number {
    return this.parallax.lerp(
      rangeStart, 
      rangeEnd, 
      pageStart,
      pageEnd, 
      this.scrollManager.actualScroll() - (this.featuredAlbumSection?.nativeElement.offsetTop || 0), 
      easingType
    );
  }
}
