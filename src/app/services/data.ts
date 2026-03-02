import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject, Observable } from 'rxjs';

export interface AttackEvent {
  attacker: 'USA' | 'IRN';
  intensity: number;
  type: string;
  target: string;
  source: string;
  sourceUrl: string;
  originCoords: [number, number];
  targetCoords: [number, number];
  velocity: number;
  payload: number;
  emoji: string;
}

@Injectable({
  providedIn: 'root',
})
export class Data {
  private eventsSubject = new Subject<AttackEvent>();
  private costSubject: BehaviorSubject<number>;
  private intervalId: any;
  private costIntervalId: any;
  private currentCost = 0;
  private anchorDateMs: number = 0;
  private accumulatedWeaponCost: number = 0;

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

  constructor() {
    // 1. Load or initialize Anchor Date
    const storedAnchor = localStorage.getItem('soundata_war_anchor');
    if (storedAnchor) {
      this.anchorDateMs = parseInt(storedAnchor, 10);
    } else {
      this.anchorDateMs = Date.now() - (24 * 60 * 60 * 1000);
      localStorage.setItem('soundata_war_anchor', this.anchorDateMs.toString());
    }

    // 2. Load or initialize Accumulated Weapon Cost
    const storedAccumulated = localStorage.getItem('soundata_war_accumulated');
    this.accumulatedWeaponCost = storedAccumulated ? parseInt(storedAccumulated, 10) : 0;

    // 3. Initialize Subject with current calculation
    const initialSeconds = (Date.now() - this.anchorDateMs) / 1000;
    this.currentCost = (initialSeconds * 5000) + this.accumulatedWeaponCost;
    this.costSubject = new BehaviorSubject<number>(this.currentCost);
  }

  get events$(): Observable<AttackEvent> {
    return this.eventsSubject.asObservable();
  }

  get cost$(): Observable<number> {
    return this.costSubject.asObservable();
  }

  startSimulation() {
    if (this.intervalId) return;

    const updateCost = () => {
      const secondsSinceAnchor = (Date.now() - this.anchorDateMs) / 1000;
      this.currentCost = (secondsSinceAnchor * 5000) + this.accumulatedWeaponCost;
      this.costSubject.next(this.currentCost);
    };

    updateCost();

    // Fast interval for visual ticking of passive costs
    this.costIntervalId = setInterval(updateCost, 100);

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

    // Map Emojis to Types
    const emojiMap: { [key: string]: string } = {
      'BALLISTIC MISSILE': '🚀',
      'DRONE SWARM': '🛸',
      'CRUISE MISSILE': '🛩️',
      'CYBER ATTACK': '💻',
      'ARTILLERY': '☄️'
    };
    const emoji = emojiMap[type] || '⚠️';

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

    // Generate tactical metadata
    const velocity = parseFloat((1.5 + (Math.random() * 8.0)).toFixed(1)); // MACH 1.5 to 9.5
    const payload = Math.floor(200 + (Math.random() * 2000)); // 200kg to 2200kg

    // Calculate explicit weapon cost to add to the counter
    const weaponCosts: { [key: string]: number } = {
      'BALLISTIC MISSILE': 18000000,
      'CRUISE MISSILE': 2500000,
      'DRONE SWARM': 450000,
      'CYBER ATTACK': 120000,
      'ARTILLERY': 50000
    };

    this.accumulatedWeaponCost += weaponCosts[type] || 100000;
    localStorage.setItem('soundata_war_accumulated', this.accumulatedWeaponCost.toString());

    this.eventsSubject.next({
      attacker,
      intensity,
      type,
      target: t.name,
      source,
      sourceUrl,
      originCoords,
      targetCoords: t.coords,
      velocity,
      payload,
      emoji
    });
  }

  stopSimulation() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.costIntervalId) {
      clearInterval(this.costIntervalId);
      this.costIntervalId = null;
    }
  }
}
