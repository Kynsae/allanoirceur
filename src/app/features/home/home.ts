import { afterNextRender, Component, ElementRef, inject, ViewChild } from '@angular/core';
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
  @ViewChild('landingVideo')
  private readonly landingVideo?: ElementRef<HTMLVideoElement>;

  @ViewChild('featuredAlbumSection')
  private readonly featuredAlbumSection?: ElementRef<HTMLElement>;

  private readonly parallax = inject(Parallax);
  private readonly scrollManager = inject(ScrollManager);
  private readonly loaderManager = inject(NavigationLoaderManager);
  
  public readonly featuredAlbum = RECORDS[0];

  public readonly SHOW_EVENTS = SHOW_EVENTS;

  constructor() {
    this.loaderManager.startLoading(1);
    
    afterNextRender(() => {
      this.setupVideoAutoplay();
    });
  }

  lastPercent = -1;

  public videoLoad(event: any) {
    this.loaderManager.updateSourceProgress(0, 100);
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