import { Component, signal } from '@angular/core';
import { Globe } from './components/globe/globe';

@Component({
  selector: 'app-root',
  imports: [Globe],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('iran-usa-ballistics');
}
