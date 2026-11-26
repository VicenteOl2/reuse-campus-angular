import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ReuseApiService } from '../../services/reuse-api.service';
import { AuthService } from '../../services/auth.service';
import { Entrega, Publicacion, Solicitud } from '../../models/reuse.models';
import { Catalogo } from '../catalogo/catalogo';
import { Solicitudes} from '../solicitudes/solicitudes';
import { Entregas } from '../entregas/entregas';
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule,Catalogo,Solicitudes,Entregas],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  private readonly api = inject(ReuseApiService);
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);

  readonly tabActiva = signal<'catalogo' | 'solicitudes' | 'entregas'>('catalogo');
  readonly alerta = signal<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  readonly publicaciones = signal<Publicacion[]>([]);
  readonly solicitudes = signal<Solicitud[]>([]);
  readonly entregas = signal<Entrega[]>([]);

  filtroEstadoPub = '';
  filtroModalidadPub = '';
  filtroEstadoSol = '';

  nuevaPub = {
    titulo: '',
    descripcion: '',
    categoria: 'Apuntes',
    modalidad: 'DONACIÓN' as 'DONACIÓN' | 'INTERCAMBIO'
  };

  publicacionSeleccionadaId = signal<number | null>(null);
  mensajeSolicitud = '';

  readonly esUsuarioBloqueado = computed(
    () => this.auth.usuarioActual()?.estado !== 'ACTIVO'
  );

  ngOnInit(): void {
    this.cargarDatos();
  }

  mostrarAlerta(tipo: 'ok' | 'error', texto: string): void {
    this.alerta.set({ tipo, texto });
    setTimeout(() => {
      if (this.alerta()?.texto === texto) {
        this.alerta.set(null);
      }
    }, 4500);
  }

  cargarDatos(): void {
    if (!this.auth.usuarioActual()) return;
    this.cargarPublicaciones();
    this.cargarSolicitudes();
    this.cargarEntregas();
  }

  cargarPublicaciones(): void {
    this.api
      .getPublicaciones({
        estado: this.filtroEstadoPub || undefined,
        modalidad: this.filtroModalidadPub || undefined
      })
      .subscribe({
        next: (data) => this.publicaciones.set(data),
        error: () => this.mostrarAlerta('error', 'Error al cargar publicaciones.')
      });
  }

  cargarSolicitudes(): void {
    this.api
      .getSolicitudes({
        estado: this.filtroEstadoSol || undefined
      })
      .subscribe({
        next: (data) => this.solicitudes.set(data),
        error: () => this.mostrarAlerta('error', 'Error al cargar solicitudes.')
      });
  }

  cargarEntregas(): void {
    this.api.getEntregas().subscribe({
      next: (data) => this.entregas.set(data),
      error: () => this.mostrarAlerta('error', 'Error al cargar entregas.')
    });
  }

  cerrarSesion(): void {
    this.auth.cerrarSesion();
    this.router.navigate(['/login']);
  }

  publicarItem(): void {
    const user = this.auth.usuarioActual();
    if (!user) return;

    if (user.estado !== 'ACTIVO') {
      this.mostrarAlerta('error', 'Tu cuenta no está ACTIVA para publicar.');
      return;
    }

    if (!this.nuevaPub.titulo.trim() || !this.nuevaPub.descripcion.trim()) {
      this.mostrarAlerta('error', 'Completa título y descripción.');
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
          this.mostrarAlerta('ok', 'Publicación creada en estado DISPONIBLE.');
          this.cargarPublicaciones();
        },
        error: (err) => {
          this.mostrarAlerta('error', err?.error?.mensaje || 'No se pudo crear la publicación.');
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
          this.mostrarAlerta('ok', 'Solicitud enviada en estado PENDIENTE.');
          this.cargarSolicitudes();
        },
        error: (err) => {
          this.mostrarAlerta('error', err?.error?.mensaje || 'No se pudo enviar la solicitud.');
        }
      });
  }

  aceptarSolicitud(solicitudId: number): void {
    this.api.aceptarSolicitud(solicitudId).subscribe({
      next: (res) => {
        this.mostrarAlerta('ok', res.mensaje || 'Solicitud aceptada y publicación RESERVADA.');
        this.cargarPublicaciones();
        this.cargarSolicitudes();
        this.cargarEntregas();
      },
      error: (err) => {
        this.mostrarAlerta('error', err?.error?.mensaje || 'No se pudo aceptar la solicitud.');
      }
    });
  }

  completarEntrega(entregaId: number): void {
    this.api.completarEntrega(entregaId).subscribe({
      next: (res) => {
        this.mostrarAlerta('ok', res.mensaje || 'Entrega completada y publicación ENTREGADA.');
        this.cargarPublicaciones();
        this.cargarEntregas();
      },
      error: (err) => {
        this.mostrarAlerta('error', err?.error?.mensaje || 'No se pudo completar la entrega.');
      }
    });
  }
}