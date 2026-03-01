import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Globe } from './components/globe/globe';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Globe],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('iran-usa-ballistics');
}
