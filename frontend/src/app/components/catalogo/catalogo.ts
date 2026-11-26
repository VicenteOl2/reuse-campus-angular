import { Component, OnInit, computed, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReuseApiService } from '../../services/reuse-api.service';
import { AuthService } from '../../services/auth.service';
import { Publicacion } from '../../models/reuse.models';

@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './catalogo.html',
  styleUrl: './catalogo.css'
})
export class Catalogo implements OnInit {
  private readonly api = inject(ReuseApiService);
  readonly auth = inject(AuthService);

  readonly alertaEmitida = output<{ tipo: 'ok' | 'error'; texto: string }>();

  readonly publicaciones = signal<Publicacion[]>([]);
  filtroEstadoPub = '';
  filtroModalidadPub = '';

  nuevaPub = {
    titulo: '',
    descripcion: '',
    categoria: 'Apuntes',
    modalidad: 'DONACIÓN' as 'DONACIÓN' | 'INTERCAMBIO'
  };

  readonly publicacionSeleccionadaId = signal<number | null>(null);
  mensajeSolicitud = '';

  readonly esUsuarioBloqueado = computed(
    () => this.auth.usuarioActual()?.estado !== 'ACTIVO'
  );

  ngOnInit(): void {
    this.cargarPublicaciones();
  }

  cargarPublicaciones(): void {
    this.api
      .getPublicaciones({
        estado: this.filtroEstadoPub || undefined,
        modalidad: this.filtroModalidadPub || undefined
      })
      .subscribe({
        next: (data) => this.publicaciones.set(data),
        error: () =>
          this.alertaEmitida.emit({ tipo: 'error', texto: 'Error al cargar publicaciones.' })
      });
  }

  publicarItem(): void {
    const user = this.auth.usuarioActual();
    if (!user) return;

    if (user.estado !== 'ACTIVO') {
      this.alertaEmitida.emit({
        tipo: 'error',
        texto: 'Tu cuenta no está ACTIVA para publicar.'
      });
      return;
    }

    if (!this.nuevaPub.titulo.trim() || !this.nuevaPub.descripcion.trim()) {
      this.alertaEmitida.emit({
        tipo: 'error',
        texto: 'Completa título y descripción.'
      });
      return;
    }

    this.api
      .crearPublicacion({
        titulo: this.nuevaPub.titulo.trim(),
        descripcion: this.nuevaPub.descripcion.trim(),
        categoria: this.nuevaPub.categoria,
        modalidad: this.nuevaPub.modalidad,
        usuarioId: user.id
      })
      .subscribe({
        next: () => {
          this.nuevaPub = {
            titulo: '',
            descripcion: '',
            categoria: 'Apuntes',
            modalidad: 'DONACIÓN'
          };
          this.alertaEmitida.emit({
            tipo: 'ok',
            texto: 'Publicación creada en estado DISPONIBLE.'
          });
          this.cargarPublicaciones();
        },
        error: (err) => {
          this.alertaEmitida.emit({
            tipo: 'error',
            texto: err?.error?.mensaje || 'No se pudo crear la publicación.'
          });
        }
      });
  }

  abrirSolicitud(pubId: number): void {
    this.publicacionSeleccionadaId.set(pubId);
    this.mensajeSolicitud = '';
  }

  enviarSolicitud(pubId: number): void {
    const user = this.auth.usuarioActual();
    if (!user) return;

    this.api
      .crearSolicitud({
        publicacionId: pubId,
        solicitanteId: user.id,
        mensaje: this.mensajeSolicitud.trim() || 'Me interesa este artículo.'
      })
      .subscribe({
        next: () => {
          this.publicacionSeleccionadaId.set(null);
          this.mensajeSolicitud = '';
          this.alertaEmitida.emit({
            tipo: 'ok',
            texto: 'Solicitud enviada en estado PENDIENTE.'
          });
        },
        error: (err) => {
          this.alertaEmitida.emit({
            tipo: 'error',
            texto: err?.error?.mensaje || 'No se pudo enviar la solicitud.'
          });
        }
      });
  }
}