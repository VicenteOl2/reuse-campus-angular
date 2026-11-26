import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Entrega, Publicacion, Solicitud, Usuario } from '../models/reuse.models';

@Injectable({ providedIn: 'root' })
export class ReuseApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:3000/api';

  // Usuarios & Auth
  getUsuarios() {
    return this.http.get<Usuario[]>(`${this.baseUrl}/usuarios`);
  }

  login(correo: string, password: string) {
    return this.http.post<{ ok: boolean; usuario?: Usuario; mensaje?: string }>(
      `${this.baseUrl}/auth/login`,
      { correo, password }
    );
  }

  // Publicaciones
  getPublicaciones(filtros?: { estado?: string; modalidad?: string; categoria?: string; usuarioId?: number }) {
    let params = new HttpParams();
    if (filtros?.estado) params = params.set('estado', filtros.estado);
    if (filtros?.modalidad) params = params.set('modalidad', filtros.modalidad);
    if (filtros?.categoria) params = params.set('categoria', filtros.categoria);
    if (filtros?.usuarioId) params = params.set('usuarioId', String(filtros.usuarioId));
    return this.http.get<Publicacion[]>(`${this.baseUrl}/publicaciones`, { params });
  }

  crearPublicacion(payload: {
    titulo: string;
    descripcion: string;
    categoria: string;
    modalidad: 'DONACIÓN' | 'INTERCAMBIO';
    usuarioId: number;
  }) {
    return this.http.post<{ ok: boolean; publicacion: Publicacion }>(`${this.baseUrl}/publicaciones`, payload);
  }

  // Solicitudes
  getSolicitudes(filtros?: { publicacionId?: number; solicitanteId?: number; estado?: string }) {
    let params = new HttpParams();
    if (filtros?.publicacionId) params = params.set('publicacionId', String(filtros.publicacionId));
    if (filtros?.solicitanteId) params = params.set('solicitanteId', String(filtros.solicitanteId));
    if (filtros?.estado) params = params.set('estado', filtros.estado);
    return this.http.get<Solicitud[]>(`${this.baseUrl}/solicitudes`, { params });
  }

  crearSolicitud(payload: { publicacionId: number; solicitanteId: number; mensaje: string }) {
    return this.http.post<{ ok: boolean; solicitud: Solicitud }>(`${this.baseUrl}/solicitudes`, payload);
  }

  aceptarSolicitud(solicitudId: number) {
    return this.http.patch<{ ok: boolean; mensaje: string; entrega: Entrega }>(
      `${this.baseUrl}/solicitudes/${solicitudId}/aceptar`,
      {}
    );
  }

  // Entregas
  getEntregas() {
    return this.http.get<Entrega[]>(`${this.baseUrl}/entregas`);
  }

  completarEntrega(entregaId: number) {
    return this.http.patch<{ ok: boolean; mensaje: string; entrega: Entrega }>(
      `${this.baseUrl}/entregas/${entregaId}/completar`,
      {}
    );
  }
}