import { Component, computed, input } from '@angular/core';
import { DatePipe, UpperCasePipe } from '@angular/common';
import { ShowEvent } from '../../../core/models/show-event.model';

@Component({
  selector: 'app-event-preview',
  imports: [DatePipe, UpperCasePipe],
  templateUrl: './event-preview.html',
  styleUrl: './event-preview.scss',
})
export class EventPreview {
  public readonly showEvent = input.required<ShowEvent>();
  public readonly eventDate = computed(() => {
    const rawDate = this.showEvent().date;
    const numericDate = Number(rawDate);

    if (Number.isFinite(numericDate)) {
      const timestamp = rawDate.length <= 10 ? numericDate * 1000 : numericDate;
      return new Date(timestamp);
    }

    return new Date(rawDate);
  });
}
