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
  public eventLogs: { time: Date, attacker: string, type: string, target: string, source: string }[] = [];

  private map!: L.Map;
  private attackLayer!: L.LayerGroup;

  constructor(private audio: Audio, private data: Data, private cdr: ChangeDetectorRef) { }

  async startSystem() {
    this.started = true;

    // We need a tiny timeout to allow Angular to render the container div before Leaflet tries to attach to it
    setTimeout(async () => {
      this.initMap();
      await this.audio.initialize();
      this.data.startSimulation();

      this.sub = this.data.events$.subscribe(event => {
        this.simulateAttack(event.attacker, event.intensity, event.type, event.target, event.originCoords, event.targetCoords);
        this.audio.playLaunch(event.attacker, event.intensity);

        this.eventLogs = [{
          time: new Date(),
          attacker: event.attacker,
          type: event.type,
          target: event.target,
          source: event.source
        }, ...this.eventLogs];

        if (this.eventLogs.length > 50) this.eventLogs.pop();
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

  public simulateAttack(attacker: 'USA' | 'IRN', intensity: number, type: string, target: string, origin: [number, number], dest: [number, number]): void {
    if (!this.map) return;

    const color = attacker === 'USA' ? '#0088ff' : '#ff2200';

    // Draw origin marker
    const originMarker = L.circleMarker(origin, {
      radius: 4,
      color: color,
      fillColor: color,
      fillOpacity: 1
    }).addTo(this.attackLayer);

    // Draw line
    const line = L.polyline([origin, dest], {
      color: color,
      weight: 2,
      opacity: 0.8,
      dashArray: '5, 10',
      className: 'attack-line'
    }).addTo(this.attackLayer);

    // Simulate animation using intervals
    let progress = 0;
    const steps = 30;
    const interval = 50; // ms

    // Create traveling particle
    const particle = L.circleMarker(origin, {
      radius: 3,
      color: '#fff',
      fillColor: '#fff',
      fillOpacity: 1
    }).addTo(this.attackLayer);

    const animInterval = setInterval(() => {
      progress++;
      if (progress >= steps) {
        clearInterval(animInterval);

        // Impact
        this.audio.playImpact();

        // Impact marker
        const impact = L.circleMarker(dest, {
          radius: 10 + (intensity * 20),
          color: color,
          fillColor: color,
          fillOpacity: 0.5,
          className: 'impact-pulse'
        }).addTo(this.attackLayer);

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
