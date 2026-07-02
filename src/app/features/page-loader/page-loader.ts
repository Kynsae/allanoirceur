import { Component, computed, inject, signal } from '@angular/core';
import { NavigationLoaderManager } from '../../core/services/navigation-loader-manager';

@Component({
  selector: 'app-page-loader',
  imports: [],
  templateUrl: './page-loader.html',
  styleUrl: './page-loader.scss',
})
export class PageLoader {
  private readonly loaderManager = inject(NavigationLoaderManager);
    
  private readonly maxRevealLength = 30;
  public readonly loadingPercentage = this.loaderManager.loadingPercentage;

  public readonly revealDasharray = computed(() => {
    const revealLength = (this.loadingPercentage() / 100) * this.maxRevealLength;
    return `${revealLength} 100`;
  });
  public readonly revealStrokeWidth = computed(() => (this.loadingPercentage() === 0 ? 0 : 18));
}
