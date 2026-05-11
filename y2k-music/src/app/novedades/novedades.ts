import { Component } from '@angular/core';
import { HeaderComponent } from '../components/header/header.component';
import { SidebarComponent } from '../components/sidebar/sidebar.component';
import { SongFormComponent } from '../components/song-form/song-form.component';
import { SongListComponent } from '../components/song-list/song-list.component';
import { FooterComponent } from '../components/footer/footer.component';
import { AuthService } from '../services/auth.service';

@Component({
  standalone: true,
  selector: 'app-novedades',
  imports: [
    HeaderComponent,
    SidebarComponent,
    SongFormComponent,
    SongListComponent,
    FooterComponent,
    
  ],
  templateUrl: './novedades.html',
  styleUrl: './novedades.css',
})
export class Novedades {
  constructor(public authService: AuthService) {}
}
