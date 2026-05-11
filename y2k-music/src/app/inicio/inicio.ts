import { Component } from '@angular/core';
import { HeaderComponent } from '../components/header/header.component';
import { SidebarComponent } from '../components/sidebar/sidebar.component';
import { SongFormComponent } from '../components/song-form/song-form.component';
import { SongListComponent } from '../components/song-list/song-list.component';
import { FooterComponent } from '../components/footer/footer.component';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-inicio',
  imports: [
    HeaderComponent,
    SidebarComponent,
    SongFormComponent,
    SongListComponent,
    FooterComponent,
  ],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css',
})
export class Inicio {
  constructor(public authService: AuthService) {}
}
