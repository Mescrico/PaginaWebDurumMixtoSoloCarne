import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { SongService, Song } from '../../services/song.service';
import { AuthService } from '../../services/auth.service';
import { PrimeraMayusculaPipe } from '../../pipes/primera-mayuscula-pipe';

@Component({
  selector: 'app-song-list',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, PrimeraMayusculaPipe],
  templateUrl: './song-list.component.html',
  styleUrl: './song-list.component.css'
})
export class SongListComponent {
  query = signal('');
  statusMessage = signal('');
  statusColor = signal('green');
  loadingPreviewId = signal<number | null>(null);
  nowPlayingId = signal<number | null>(null);
  currentPreviewTitle = signal('');
  currentTime = signal(0);
  duration = signal(0);
  volume = signal(0.7);

  private audio: HTMLAudioElement | null = null;
  private http = inject(HttpClient);

  filteredSongs = computed(() => {
    const q = this.query().toLowerCase().trim();
    if (!q) return this.songService.songs();
    return this.songService.songs().filter(s =>
      s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q)
    );
  });

  isAuthenticated = computed(() => this.authService.isAuthenticated());

  constructor(
    public songService: SongService,
    private authService: AuthService
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

  playPreview(song: Song) {
    if (this.nowPlayingId() === song.id) {
      this.stopPreview();
      return;
    }
    if (this.loadingPreviewId()) {
      return;
    }

    this.loadingPreviewId.set(song.id);
    this.currentPreviewTitle.set(`${song.title} - ${song.artist}`);

    const query = encodeURIComponent(`${song.title} ${song.artist}`);
    const url = `https://itunes.apple.com/search?term=${query}&entity=song&limit=1`;

    this.http.get<any>(url).subscribe({
      next: (data) => {
        const previewUrl = data?.results?.[0]?.previewUrl;
        if (previewUrl && typeof window !== 'undefined') {
          this.startAudio(previewUrl, song.id);
        } else {
          this.showStatus('No se encontró preview para esta canción.', 'red');
          this.loadingPreviewId.set(null);
        }
      },
      error: () => {
        this.showStatus('Error al cargar el preview.', 'red');
        this.loadingPreviewId.set(null);
      }
    });
  }

  private startAudio(previewUrl: string, id: number) {
    this.stopPreview();

    if (typeof window === 'undefined') {
      this.loadingPreviewId.set(null);
      return;
    }

    this.audio = new Audio(previewUrl);
    this.audio.volume = this.volume();
    this.audio.addEventListener('loadedmetadata', () => {
      this.duration.set(this.audio?.duration || 0);
    });
    this.audio.addEventListener('timeupdate', () => {
      this.currentTime.set(this.audio?.currentTime || 0);
    });
    this.audio.addEventListener('ended', () => {
      this.stopPreview();
    });

    this.audio.play().then(() => {
      this.nowPlayingId.set(id);
      this.loadingPreviewId.set(null);
    }).catch(() => {
      this.showStatus('No se pudo reproducir el audio.', 'red');
      this.loadingPreviewId.set(null);
      this.stopPreview();
    });
  }

  stopPreview() {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio = null;
    }

    this.nowPlayingId.set(null);
    this.loadingPreviewId.set(null);
    this.currentTime.set(0);
    this.duration.set(0);
  }

  setVolume(event: Event) {
    const value = parseFloat((event.target as HTMLInputElement).value);
    this.volume.set(value);
    if (this.audio) {
      this.audio.volume = value;
    }
  }

  seek(event: Event) {
    const value = parseFloat((event.target as HTMLInputElement).value);
    if (this.audio) {
      this.audio.currentTime = value;
    }
    this.currentTime.set(value);
  }

  formatTime(seconds: number) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${secs}`;
  }

  private showStatus(text: string, color: string) {
    this.statusMessage.set(text);
    this.statusColor.set(color);
    setTimeout(() => this.statusMessage.set(''), 2500);
  }

  trackById(_: number, song: Song) {
    return song.id;
  }
}
