import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TextHoverSlide } from '../text-hover-slide/text-hover-slide';

@Component({
  selector: 'app-navbar',
  imports: [
    RouterLink,
    TextHoverSlide
],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {}
