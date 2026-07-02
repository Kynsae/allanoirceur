import { Component, computed, signal } from '@angular/core';

@Component({
  selector: 'app-page-loader',
  imports: [],
  templateUrl: './page-loader.html',
  styleUrl: './page-loader.scss',
})
export class PageLoader {
  public readonly loadingPercentage = signal<number>(0);
  public readonly fillWidth = computed(() => (353 * this.loadingPercentage()) / 100);

  constructor() {
    this.load();
  }

  private load(): void {
    setTimeout(() => {
      this.loadingPercentage.update((value) => Math.min(value + 10, 100));
      if (this.loadingPercentage() >= 100) return;
      this.load();
    }, 1000);
  }
}
