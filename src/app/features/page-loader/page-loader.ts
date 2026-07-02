import { Component, computed, signal } from '@angular/core';

@Component({
  selector: 'app-page-loader',
  imports: [],
  templateUrl: './page-loader.html',
  styleUrl: './page-loader.scss',
})
export class PageLoader {
  private readonly maxRevealLength = 30;
  public readonly loadingPercentage = signal<number>(0);
  public readonly revealDasharray = computed(() => {
    const revealLength = (this.loadingPercentage() / 100) * this.maxRevealLength;
    return `${revealLength} 100`;
  });
  public readonly revealStrokeWidth = computed(() => (this.loadingPercentage() === 0 ? 0 : 18));

  constructor() {
    this.load();
  }

  private load(): void {
    setTimeout(() => {
      this.loadingPercentage.update((value) => Math.min(value + 3, 100));
      if (this.loadingPercentage() >= 100) return;
      this.load();
    }, 100);
  }
}
