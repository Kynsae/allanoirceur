import { Component, input } from '@angular/core';
import { TextHoverSlide } from '../text-hover-slide/text-hover-slide';

@Component({
  selector: 'app-link-preview',
  imports: [
    TextHoverSlide
  ],
  templateUrl: './link-preview.html',
  styleUrl: './link-preview.scss',
})
export class LinkPreview {
  public readonly link = input.required<any>();
}
