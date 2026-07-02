import { afterNextRender, Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ScrollManager } from './core/services/scroll-manager';
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
  protected readonly title = signal('allanoirceur-web');

  constructor() {
    afterNextRender(() => {
      this.scrollManager.init();
    });
  }
}