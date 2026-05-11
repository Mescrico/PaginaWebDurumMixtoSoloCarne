import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';

export const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true; // Si está logueado, lo deja pasar
  } else {
    // Si no está logueado, lo mandamos al inicio sin usar alert en SSR
    console.warn('Necesita iniciar sesión para ver esta sección.');
    router.navigate(['/']);
    return false;
  }
};