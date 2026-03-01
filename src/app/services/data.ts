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

    // Generate dynamic exact-match URLs for realism based on the event context
    const eventId = Math.random().toString(36).substring(2, 10).toUpperCase();
    const dateStr = new Date().toISOString().split('T')[0];
    const encodedTarget = encodeURIComponent(t.name);
    const encodedType = encodeURIComponent(type);

    let sourceUrl = 'https://example.com';
    switch (source) {
      case 'Defense Feed':
        sourceUrl = `https://www.defense.gov/News/Releases/Release/Article/${eventId}/`;
        break;
      case 'NewsAPI':
        sourceUrl = `https://newsapi.org/v2/everything?q=${encodedTarget}+${encodedType}&from=${dateStr}`;
        break;
      case 'Twitter API':
        sourceUrl = `https://x.com/search?q=${encodedTarget}+${encodedType}&f=live`;
        break;
      case 'Satellite Intel':
        sourceUrl = `https://zoom.earth/#view=${originCoords[0].toFixed(4)},${originCoords[1].toFixed(4)},10z`;
        break;
      case 'Ground Units':
        sourceUrl = `https://www.aljazeera.com/search/${encodedTarget}`;
        break;
      case 'SIPRI DB':
        sourceUrl = `https://www.sipri.org/search?keys=${encodedType}+${dateStr}`;
        break;
      case 'GDELT':
        sourceUrl = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodedTarget}&mode=artlist`;
        break;
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
