import { Component, isStandalone, signal } from '@angular/core';

@Component({
  selector: 'app-page-loader',
  imports: [],
  templateUrl: './page-loader.html',
  styleUrl: './page-loader.scss',
})
export class PageLoader {
  public readonly loadingPercentage = signal<number>(0);

  constructor() {
    this.load();
  }

  load() {
    setTimeout(() => {
      this.loadingPercentage.set(this.loadingPercentage() + 10);
      if (this.loadingPercentage() >= 100) return;
      this.load();
    }, 1000);
  }
}
