import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Event, NavigationStart, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { TextHoverSlide } from '../text-hover-slide/text-hover-slide';
import { Parallax } from '../../../core/services/parallax';
import { ScrollManager } from '../../../core/services/scroll-manager';

@Component({
  selector: 'app-navbar',
  imports: [
    RouterLink,
    TextHoverSlide
],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  private readonly parallax = inject(Parallax);
  private readonly scrollManager = inject(ScrollManager);
  private readonly router = inject(Router);

  public readonly showMobileContainer = signal<boolean>(false);

  constructor() {
    this.router.events.pipe(
      filter((event: Event) => event instanceof NavigationStart),
      takeUntilDestroyed()
    ).subscribe(() => {
      this.closeMobileContainer();
    });
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

  public openMobileContainer(): void {
    this.showMobileContainer.set(!this.showMobileContainer());
  }

  public closeMobileContainer(): void {
    this.showMobileContainer.set(false);
  }
}
