import { Component, computed, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { SongService, Song } from '../../services/song.service';
import { AuthService } from '../../services/auth.service';
import { PrimeraMayusculaPipe } from '../../pipes/primera-mayuscula-pipe';

interface ItunesSearchResponse {
  results: Array<{
    previewUrl?: string;
    trackName: string;
    artistName: string;
    trackTimeMillis?: number;
  }>;
}

@Component({
  selector: 'app-song-list',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, PrimeraMayusculaPipe],
  templateUrl: './song-list.component.html',
  styleUrl: './song-list.component.css'
})
export class SongListComponent implements OnDestroy {
  query = signal('');
  statusMessage = signal('');
  statusColor = signal('green');
  nowPlayingId = signal<number | null>(null);
  loadingPreviewId = signal<number | null>(null);
  currentTime = signal(0);
  duration = signal(0);
  volume = signal(0.7);

  filteredSongs = computed(() => {
    const q = this.query().toLowerCase().trim();
    if (!q) return this.songService.songs();
    return this.songService.songs().filter(s =>
      s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q)
    );
  });

  isAuthenticated = computed(() => this.authService.isAuthenticated());

  private audio: any = null;
  private progressInterval: any = null;

  constructor(
    public songService: SongService,
    private authService: AuthService,
    private http: HttpClient
  ) {}

  onSearch(value: string) {
    this.query.set(value);
  }

  clearSearch() {
    this.query.set('');
  }

  delete(id: number) {
    if (!this.isAuthenticated()) {
      this.showStatus('Necesitas iniciar sesión para borrar canciones.', 'red');
      return;
    }
    this.songService.delete(id);
  }

  async playPreview(song: Song) {
    if (typeof window === 'undefined' || typeof window.Audio === 'undefined') {
      this.showStatus('La reproducción no está disponible en este entorno.', 'red');
      return;
    }

    if (this.nowPlayingId() === song.id) {
      this.stopPreview();
      return;
    }

    if (!this.audio) {
      this.audio = new window.Audio();
      this.audio.volume = this.volume();
      this.audio.addEventListener('ended', () => this.nowPlayingId.set(null));
      this.audio.addEventListener('loadedmetadata', () => {
        this.duration.set(this.audio.duration || 0);
      });
      this.audio.addEventListener('timeupdate', () => {
        this.currentTime.set(this.audio.currentTime || 0);
      });
    }

    this.loadingPreviewId.set(song.id);
    const query = encodeURIComponent(`${song.title} ${song.artist}`);
    const url = `https://itunes.apple.com/search?term=${query}&limit=1&media=music`;

    try {
      const response = await firstValueFrom(this.http.get<ItunesSearchResponse>(url));
      const result = response.results[0];
      if (!result?.previewUrl) {
        this.showStatus('No se encontró preview para esta canción.', 'red');
        return;
      }

      this.audio.src = result.previewUrl;
      this.audio.load();
      await this.audio.play();
      this.nowPlayingId.set(song.id);
      this.duration.set(this.audio.duration || 0);
      this.showStatus(`Reproduciendo: ${result.trackName} - ${result.artistName}`, 'green');
      this.startProgress();
    } catch {
      this.showStatus('Error al buscar la preview. Intenta más tarde.', 'red');
    } finally {
      this.loadingPreviewId.set(null);
    }
  }

  stopPreview() {
    if (!this.audio) {
      return;
    }
    this.audio.pause();
    this.audio.currentTime = 0;
    this.nowPlayingId.set(null);
    this.currentTime.set(0);
    this.showStatus('Reproducción detenida.', 'black');
    this.stopProgress();
  }

  setVolume(event: Event) {
    const value = Number((event.target as HTMLInputElement).value);
    this.volume.set(value);
    if (this.audio) {
      this.audio.volume = value;
    }
  }

  seek(event: Event) {
    if (!this.audio) {
      return;
    }
    const value = Number((event.target as HTMLInputElement).value);
    this.audio.currentTime = value;
    this.currentTime.set(value);
  }

  private startProgress() {
    this.stopProgress();
    this.progressInterval = setInterval(() => {
      if (this.audio) {
        this.currentTime.set(this.audio.currentTime || 0);
        this.duration.set(this.audio.duration || 0);
      }
    }, 250);
  }

  private stopProgress() {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  private formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  }

  private showStatus(text: string, color: string) {
    this.statusMessage.set(text);
    this.statusColor.set(color);
    setTimeout(() => this.statusMessage.set(''), 4000);
  }

  trackById(_: number, song: Song) {
    return song.id;
  }

  ngOnDestroy() {
    if (!this.audio) {
      return;
    }
    this.audio.pause();
    this.audio.src = '';
    this.stopProgress();
  }
}
