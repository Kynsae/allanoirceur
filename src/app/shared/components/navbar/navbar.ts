import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TextHoverSlide } from '../text-hover-slide/text-hover-slide';
import { NgStyle } from "../../../../../node_modules/@angular/common/types/_common_module-chunk";
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
}
