import { afterNextRender, Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ScrollManager } from './core/services/scroll-manager';
import { Viewport } from './core/services/viewport';
import { Navbar } from './shared/components/navbar/navbar';
import { PageLoader } from './features/page-loader/page-loader';
import { Footer } from './shared/components/footer/footer';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    Navbar,
    PageLoader,
    Footer
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private readonly scrollManager = inject(ScrollManager);
  private readonly viewport = inject(Viewport);
  protected readonly title = signal('allanoirceur-web');

  constructor() {
    afterNextRender(() => {
      this.viewport.init();
      this.scrollManager.init();
    });
  }
}
