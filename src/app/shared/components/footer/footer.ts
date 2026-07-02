import { afterNextRender, Component, computed, ElementRef, inject, OnDestroy, signal, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { LinkPreview } from '../link-preview/link-preview';
import { Parallax } from '../../../core/services/parallax';
import { ScrollManager } from '../../../core/services/scroll-manager';
import { SOCIAL_LINKS } from '../../../core/datas/social-links.data';

@Component({
  selector: 'app-footer',
  imports: [
    LinkPreview
  ],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class Footer implements OnDestroy {
  @ViewChild('footer')
  private readonly footerSection?: ElementRef<HTMLElement>;

  private readonly parallax = inject(Parallax);
  private readonly scrollManager = inject(ScrollManager);
  private readonly router = inject(Router);
  private readonly footerTop = signal(0);
  private readonly handleLayoutChange = () => this.updateFooterTop();
  private resizeObserver?: ResizeObserver;

  public readonly SOCIAL_LINKS = SOCIAL_LINKS;

  public readonly logoTransform = computed(() => {
    const offset = this.lerpOffset(-170, 110, 0, 0);
    const pixelRatio = typeof window === 'undefined' ? 1 : (window.devicePixelRatio || 1);
    const snappedOffset = Math.round(offset * pixelRatio) / pixelRatio;

    return `translate3d(0, ${snappedOffset}px, 0)`;
  });

  constructor() {
    afterNextRender(() => {
      this.updateFooterTop();

      window.addEventListener('resize', this.handleLayoutChange);

      this.resizeObserver = new ResizeObserver(this.handleLayoutChange);
      this.resizeObserver.observe(document.body);
      this.resizeObserver.observe(this.footerSection?.nativeElement ?? document.body);
    });
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
      this.scrollManager.actualScroll() - this.footerTop(), 
      easingType
    );
  }

  public get isHomeRoute(): boolean {
    return this.router.url === '/';
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.handleLayoutChange);
    this.resizeObserver?.disconnect();
  }

  private updateFooterTop(): void {
    this.footerTop.set(this.footerSection?.nativeElement.offsetTop ?? 0);
  }
}
