import { Injectable, signal } from '@angular/core';
import { Usuario } from '../models/reuse.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly storageKey = 'reuse_usuario_activo';
  readonly usuarioActual = signal<Usuario | null>(this.cargarDesdeStorage());

  private cargarDesdeStorage(): Usuario | null {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Usuario;
    } catch {
      return null;
    }
  }

  iniciarSesion(usuario: Usuario): void {
    localStorage.setItem(this.storageKey, JSON.stringify(usuario));
    this.usuarioActual.set(usuario);
  }

  cerrarSesion(): void {
    localStorage.removeItem(this.storageKey);
    this.usuarioActual.set(null);
  }
}