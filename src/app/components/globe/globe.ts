import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import { Audio } from '../../services/audio';
import { Data } from '../../services/data';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-globe',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './globe.html',
  styleUrl: './globe.scss',
})
export class Globe implements AfterViewInit, OnDestroy {
  @ViewChild('container') containerRef!: ElementRef<HTMLDivElement>;

  public started = false;
  private sub?: Subscription;
  private costSub?: Subscription;
  public eventLogs: { time: Date, attacker: string, type: string, target: string, source: string, sourceUrl: string, emoji: string }[] = [];
  public currentCost: number = 0;
  public showDataSources: boolean = false;

  private map!: L.Map;
  private attackLayer!: L.LayerGroup;

  constructor(private audio: Audio, private data: Data, private cdr: ChangeDetectorRef) { }

  toggleDataSources() {
    this.showDataSources = !this.showDataSources;
  }

  async startSystem() {
    this.started = true;

    // MUST initialize Tone.js directly in the click event hierarchy before any timeouts
    // otherwise Chrome's strict Autoplay policy will block the AudioContext creation.
    await this.audio.initialize();

    // We need a tiny timeout to allow Angular to render the container div before Leaflet tries to attach to it
    setTimeout(() => {
      this.initMap();
      this.data.startSimulation();

      this.sub = this.data.events$.subscribe(event => {
        this.simulateAttack(event);
        this.audio.playLaunch(event.attacker, event.intensity, event.velocity, event.payload, event.type);

        this.eventLogs = [{
          time: new Date(),
          attacker: event.attacker,
          type: event.type,
          target: event.target,
          source: event.source,
          sourceUrl: event.sourceUrl,
          emoji: event.emoji || '🚀'
        }, ...this.eventLogs];

        if (this.eventLogs.length > 50) this.eventLogs.pop();
        this.cdr.detectChanges();
      });

      this.costSub = this.data.cost$.subscribe(cost => {
        this.currentCost = cost;
        this.cdr.detectChanges();
      });
    }, 100);
  }

  ngAfterViewInit(): void {
    // Wait for user to start before initializing map
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
    if (this.sub) {
      this.sub.unsubscribe();
    }
    if (this.costSub) {
      this.costSub.unsubscribe();
    }
    this.data.stopSimulation();
  }

  private initMap(): void {
    const container = this.containerRef.nativeElement;

    this.map = L.map(container, {
      center: [33, 44], // Center on Middle East
      zoom: 4,
      zoomControl: false,
      attributionControl: false
    });

    // Dark Matter tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19
    }).addTo(this.map);

    this.attackLayer = L.layerGroup().addTo(this.map);
  }

  public simulateAttack(event: any): void {
    if (!this.map) return;

    const { attacker, intensity, type, target, originCoords: origin, targetCoords: dest, velocity, payload, emoji } = event;
    const color = attacker === 'USA' ? '#0088ff' : '#ff2200';

    // Create custom Tactical DivIcon for Origin
    const originHtml = `
      <div class="tactical-marker ${attacker.toLowerCase()}">
        <div class="bracket">[</div>
        <div class="marker-core"></div>
        <div class="bracket">]</div>
        <div class="tactical-data origin-data">
          <div><span class="lbl">OP:</span> ${attacker} ${emoji}</div>
          <div><span class="lbl">GEO:</span> ${origin[0].toFixed(2)}, ${origin[1].toFixed(2)}</div>
        </div>
      </div>
    `;

    const originIcon = L.divIcon({
      className: 'custom-div-icon',
      html: originHtml,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    const originMarker = L.marker(origin, { icon: originIcon }).addTo(this.attackLayer);

    // Draw line (Laser Beam)
    const line = L.polyline([origin, dest], {
      color: color,
      weight: 2,
      opacity: 0.8,
      className: `energy-beam ${attacker.toLowerCase()}-beam`
    }).addTo(this.attackLayer);

    // Simulate animation using intervals
    let progress = 0;
    const steps = 30;
    const interval = 50; // ms

    // Custom Tactical DivIcon for the travelling particle (Missile/Drone)
    const particleHtml = `
      <div class="tactical-particle ${attacker.toLowerCase()}">
        <div class="particle-core"></div>
        <div class="tactical-data flying-data">
          <div><span class="lbl">VEL:</span> M${velocity}</div>
          <div><span class="lbl">PLD:</span> ${payload}KG</div>
        </div>
      </div>
    `;

    const particleIcon = L.divIcon({
      className: 'custom-div-icon',
      html: particleHtml,
      iconSize: [10, 10],
      iconAnchor: [5, 5]
    });

    const particle = L.marker(origin, { icon: particleIcon }).addTo(this.attackLayer);

    const animInterval = setInterval(() => {
      progress++;
      if (progress >= steps) {
        clearInterval(animInterval);

        // Impact (Shockwave)
        this.audio.playImpact(payload);

        // Calculate a scale offset based on intensity (size of shockwave)
        const scale = 1 + (intensity * 2);

        const impactHtml = `
          <div class="shockwave-container" style="transform: scale(${scale});">
            <div class="shockwave-ring ring-1 target-${attacker.toLowerCase()}"></div>
            <div class="shockwave-ring ring-2 target-${attacker.toLowerCase()}"></div>
            <div class="shockwave-core target-${attacker.toLowerCase()}"></div>
          </div>
        `;

        const impactIcon = L.divIcon({
          className: 'custom-div-icon',
          html: impactHtml,
          iconSize: [60, 60],
          iconAnchor: [30, 30] // Center the 60x60 shockwave over the coordinate
        });

        const impact = L.marker(dest, { icon: impactIcon }).addTo(this.attackLayer);

        // Cleanup
        this.attackLayer.removeLayer(particle);
        setTimeout(() => {
          if (this.map) {
            this.attackLayer.removeLayer(line);
            this.attackLayer.removeLayer(originMarker);
            this.attackLayer.removeLayer(impact);
          }
        }, 3000);

      } else {
        // Interpolate position
        const lat = origin[0] + ((dest[0] - origin[0]) * (progress / steps));
        const lng = origin[1] + ((dest[1] - origin[1]) * (progress / steps));
        particle.setLatLng([lat, lng]);
      }
    }, interval);
  }
}
