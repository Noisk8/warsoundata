import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export interface AttackEvent {
  attacker: 'USA' | 'IRN';
  intensity: number;
  type: string;
  target: string;
  source: string;
  sourceUrl: string;
  originCoords: [number, number];
  targetCoords: [number, number];
}

@Injectable({
  providedIn: 'root',
})
export class Data {
  private eventsSubject = new Subject<AttackEvent>();
  private intervalId: any;

  private attackTypes = ['BALLISTIC MISSILE', 'DRONE SWARM', 'CRUISE MISSILE', 'CYBER ATTACK', 'ARTILLERY'];

  private usaTargets = [
    { name: 'TEHRAN MIL BASE', coords: [35.6892, 51.3890] as [number, number] },
    { name: 'NATANZ FACILITY', coords: [33.9572, 51.9328] as [number, number] },
    { name: 'QAM NOJEH BASE', coords: [35.1970, 48.6534] as [number, number] }
  ];

  private irnTargets = [
    { name: 'USS GERALD FORD', coords: [34.5, 34.0] as [number, number] },
    { name: 'AIN AL ASAD BASE', coords: [33.8058, 42.4410] as [number, number] },
    { name: 'AL UDEID AB', coords: [25.1186, 51.3147] as [number, number] }
  ];

  private sources = ['NewsAPI', 'GDELT', 'Twitter API', 'SIPRI DB', 'Defense Feed'];

  get events$(): Observable<AttackEvent> {
    return this.eventsSubject.asObservable();
  }

  startSimulation() {
    if (this.intervalId) return;

    this.emitEvent(); // Emit immediately upon start

    this.intervalId = setInterval(() => {
      this.emitEvent();
    }, 1500 + Math.random() * 2000);
  }

  private emitEvent() {
    const attacker = Math.random() > 0.5 ? 'USA' : 'IRN';
    const intensity = Math.random();

    const type = this.attackTypes[Math.floor(Math.random() * this.attackTypes.length)];
    const source = this.sources[Math.floor(Math.random() * this.sources.length)];

    // Map sources to dummy URLs for realism
    const urlMap: { [key: string]: string } = {
      'Defense Feed': 'https://www.defense.gov/News/',
      'NewsAPI': 'https://newsapi.org/',
      'Twitter API': 'https://x.com/search?q=missile+strike',
      'Satellite Intel': 'https://www.maxar.com/',
      'Ground Units': 'https://www.aljazeera.com/',
      'SIPRI DB': 'https://www.sipri.org/databases',
      'GDELT': 'https://www.gdeltproject.org/'
    };
    const sourceUrl = urlMap[source] || 'https://example.com';

    let originCoords: [number, number];
    let t;

    if (attacker === 'USA') {
      // USA attacks from carriers or allied bases (mostly West/South of Iran)
      originCoords = [30.0 + (Math.random() * 5), 35.0 + (Math.random() * 10)];
      t = this.usaTargets[Math.floor(Math.random() * this.usaTargets.length)];
    } else {
      // IRN attacks from inside Iran (East of targets)
      originCoords = [32.0 + (Math.random() * 4), 52.0 + (Math.random() * 8)];
      t = this.irnTargets[Math.floor(Math.random() * this.irnTargets.length)];
    }

    this.eventsSubject.next({
      attacker,
      intensity,
      type,
      target: t.name,
      source,
      sourceUrl,
      originCoords,
      targetCoords: t.coords
    });
  }

  stopSimulation() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
