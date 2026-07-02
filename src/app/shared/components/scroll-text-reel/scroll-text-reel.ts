import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

type ScrollTextDirection = 'up' | 'down';

@Component({
    selector: 'app-scroll-text-reel',
    templateUrl: './scroll-text-reel.html',
    styleUrl: './scroll-text-reel.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScrollTextReel {
    public readonly fromText = input.required<string>();
    public readonly toText = input.required<string>();
    public readonly progress = input<number>(0);
    public readonly direction = input<ScrollTextDirection>('down');
    public readonly align = input<'start' | 'end'>('start');
    public readonly fill = input<boolean>(false);

    protected readonly clampedProgress = computed(() => {
        const progress = this.progress();
        return Math.max(0, Math.min(1, progress));
    });

    protected readonly hasTransition = computed(() => this.fromText() !== this.toText());

    protected readonly currentText = computed(() => {
        if (!this.hasTransition()) {
            return this.fromText();
        }

        return this.clampedProgress() >= 0.5 ? this.toText() : this.fromText();
    });

    protected readonly outgoingTransform = computed(() => {
        if (!this.hasTransition()) {
            return 'translateY(0%)';
        }

        const progress = this.clampedProgress();
        const offset = this.direction() === 'down' ? -110 * progress : 110 * progress;
        return `translateY(${offset}%)`;
    });

    protected readonly incomingTransform = computed(() => {
        if (!this.hasTransition()) {
            return 'translateY(0%)';
        }

        const progress = this.clampedProgress();
        const remaining = 1 - progress;
        const offset = this.direction() === 'down' ? 110 * remaining : -110 * remaining;
        return `translateY(${offset}%)`;
    });

    protected readonly outgoingOpacity = computed(() => {
        if (!this.hasTransition()) {
            return '1';
        }

        return `${1 - this.clampedProgress()}`;
    });

    protected readonly incomingOpacity = computed(() => {
        if (!this.hasTransition()) {
            return '0';
        }

        return `${this.clampedProgress()}`;
    });
}
