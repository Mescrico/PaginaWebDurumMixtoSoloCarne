import { Injectable, signal, computed } from '@angular/core';

export interface User {
  username: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly USERS_KEY = 'y2k_users';
  private readonly CURRENT_USER_KEY = 'y2k_current_user';

  // 1. Declaramos los signals con valores por defecto
  users = signal<User[]>([]);
  currentUser = signal<User | null>(null);
  isAuthenticated = computed(() => !!this.currentUser());

  // 2. El constructor rellena los signals en cuanto arranca el servicio
  constructor() {
    this.users.set(this.loadUsers());
    this.currentUser.set(this.loadCurrentUser());
  }

  // 3. Tu getter (déjalo tal cual, está perfecto)
  private get storageAvailable(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }


  // 1. CARGAR USUARIOS AL INICIAR
  private loadUsers(): User[] {
    if (!this.storageAvailable) return [];
    try {
      const data = localStorage.getItem(this.USERS_KEY);
      return data ? JSON.parse(data) : []; // Si no hay nada, devuelve lista vacía
    } catch (e) {
      console.error("Error leyendo usuarios del disco", e);
      return []; // Si el JSON está roto, devolvemos lista vacía para no romper la app
    }
  }

  // 2. CARGAR SESIÓN ACTIVA AL INICIAR (Para que no se borre al dar F5)
  private loadCurrentUser(): User | null {
    if (!this.storageAvailable) return null;
    try {
      const username = localStorage.getItem(this.CURRENT_USER_KEY);
      if (!username) return null;

      // Importante: Volvemos a cargar la lista para estar seguros de que el usuario existe
      const allUsers = this.loadUsers();
      return allUsers.find(u => u.username === username) || null;
    } catch {
      return null;
    }
  }

  // 3. GUARDAR LISTA DE USUARIOS
  private saveUsers() {
    if (this.storageAvailable) {
      localStorage.setItem(this.USERS_KEY, JSON.stringify(this.users()));
    }
  }

  // 4. GUARDAR SESIÓN ACTUAL (Esta es la que pedías)
  private saveCurrentUser() {
    if (!this.storageAvailable) return;
    
    if (this.currentUser()) {
      // Guardamos el nombre del usuario logueado
      localStorage.setItem(this.CURRENT_USER_KEY, this.currentUser()!.username);
    } else {
      localStorage.removeItem(this.CURRENT_USER_KEY);
    }
  }

  // FUNCIÓN PARA REGISTRARSE
  register(username: string, password: string, confirmPassword: string) {
    const normalized = username.trim().toLowerCase();
    
    if (!normalized || !password.trim() || password !== confirmPassword) {
      return { success: false, message: 'Datos incorrectos o contraseñas no coinciden.' };
    }

    const exists = this.users().some(user => user.username === normalized);
    if (exists) return { success: false, message: 'El usuario ya existe.' };

    const newUser: User = { username: normalized, password: password.trim() };
    
    // Actualizamos la lista y el usuario actual
    this.users.update(list => [...list, newUser]);
    this.saveUsers(); // <--- Guarda en disco
    
    this.currentUser.set(newUser);
    this.saveCurrentUser(); // <--- Guarda la sesión

    return { success: true, message: '¡Cuenta creada con éxito!' };
  }

  // FUNCIÓN PARA LOGIN
  login(username: string, password: string) {
    const normalized = username.trim().toLowerCase();
    const user = this.users().find(u => u.username === normalized && u.password === password.trim());

    if (!user) return { success: false, message: 'Usuario o contraseña incorrectos.' };

    this.currentUser.set(user);
    this.saveCurrentUser(); // <--- Guarda la sesión para que no se borre al cerrar
    
    return { success: true, message: 'Bienvenido de nuevo.' };
  }

  // FUNCIÓN PARA CERRAR SESIÓN
  logout() {
    this.currentUser.set(null);
    this.saveCurrentUser(); // <--- Borra la sesión del disco
  }
}