import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-page-loader',
  imports: [],
  templateUrl: './page-loader.html',
  styleUrl: './page-loader.scss',
})
export class PageLoader {
  public readonly isLoaded = signal(false);

  constructor() {
    setTimeout(() => {
      this.isLoaded.set(true);
    }, 1000)
  }
}
