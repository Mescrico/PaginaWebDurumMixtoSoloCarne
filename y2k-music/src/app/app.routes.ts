import { Routes } from '@angular/router';
import { Novedades } from './novedades/novedades';
import { Inicio } from './inicio/inicio';

export const routes: Routes = [
  {
    path: '',
    component: Inicio,
    pathMatch: 'full',
  },
  {
    path: 'novedades',
    component: Novedades, 
  }, 
  {
    path: 'inicio',
    component: Inicio,
  }
];
