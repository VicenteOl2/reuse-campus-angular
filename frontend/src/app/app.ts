import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReuseApiService } from './services/reuse-api.service';
import { AuthService } from './services/auth.service';
import { Entrega, Publicacion, Solicitud, Usuario } from './models/reuse.models';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private readonly api = inject(ReuseApiService);
  readonly auth = inject(AuthService);

  readonly tabActiva = signal<'catalogo' | 'solicitudes' | 'entregas'>('catalogo');
  readonly cargando = signal(false);
  readonly alerta = signal<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  // Datos principales
  readonly usuarios = signal<Usuario[]>([]);
  readonly publicaciones = signal<Publicacion[]>([]);
  readonly solicitudes = signal<Solicitud[]>([]);
  readonly entregas = signal<Entrega[]>([]);

  // Login
  correoLogin = 'vicente@campus.cl';
  passwordLogin = '1234';

  // Filtros catálogo
  filtroEstadoPub = '';
  filtroModalidadPub = '';

  // Nueva publicación
  nuevaPub = {
    titulo: '',
    descripcion: '',
    categoria: 'Apuntes',
    modalidad: 'DONACIÓN' as 'DONACIÓN' | 'INTERCAMBIO'
  };

  // Solicitud en curso
  publicacionSeleccionadaId = signal<number | null>(null);
  mensajeSolicitud = '';

  // Filtro solicitudes
  filtroEstadoSol = '';

  readonly esUsuarioBloqueado = computed(
    () => this.auth.usuarioActual()?.estado !== 'ACTIVO'
  );

  ngOnInit(): void {
    this.cargarTodo();
  }

  mostrarAlerta(tipo: 'ok' | 'error', texto: string): void {
    this.alerta.set({ tipo, texto });
    setTimeout(() => {
      if (this.alerta()?.texto === texto) {
        this.alerta.set(null);
      }
    }, 5000);
  }

  cargarTodo(): void {
    this.cargando.set(true);
    this.api.getUsuarios().subscribe({
      next: (users) => {
        this.usuarios.set(users);
        if (!this.auth.usuarioActual() && users.length > 0) {
          this.auth.iniciarSesion(users[0]);
        }
      },
      error: () => this.mostrarAlerta('error', 'No se pudo conectar con el backend en puerto 3000.')
    });

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
        next: (data) => {
          this.publicaciones.set(data);
          this.cargando.set(false);
        },
        error: () => this.cargando.set(false)
      });
  }

  cargarSolicitudes(): void {
    this.api
      .getSolicitudes({
        estado: this.filtroEstadoSol || undefined
      })
      .subscribe({
        next: (data) => this.solicitudes.set(data)
      });
  }

  cargarEntregas(): void {
    this.api.getEntregas().subscribe({
      next: (data) => this.entregas.set(data)
    });
  }

  hacerLogin(): void {
    if (!this.correoLogin.trim() || !this.passwordLogin.trim()) {
      this.mostrarAlerta('error', 'Ingresa correo y contraseña.');
      return;
    }

    this.api.login(this.correoLogin.trim(), this.passwordLogin).subscribe({
      next: (res) => {
        if (res.ok && res.usuario) {
          this.auth.iniciarSesion(res.usuario);
          this.mostrarAlerta('ok', `Sesión iniciada como ${res.usuario.nombre}.`);
        }
      },
      error: (err) => {
        const msg = err?.error?.mensaje || 'Credenciales inválidas o usuario bloqueado.';
        this.mostrarAlerta('error', msg);
      }
    });
  }

  cambiarUsuarioRapido(idStr: string): void {
    const id = Number(idStr);
    const encontrado = this.usuarios().find((u) => u.id === id);
    if (encontrado) {
      this.auth.iniciarSesion(encontrado);
      this.publicacionSeleccionadaId.set(null);
      this.mostrarAlerta('ok', `Usuario activo cambiado a ${encontrado.nombre} (${encontrado.estado}).`);
    }
  }

  publicarItem(): void {
    const user = this.auth.usuarioActual();
    if (!user) {
      this.mostrarAlerta('error', 'Debes iniciar sesión para publicar.');
      return;
    }
    if (user.estado !== 'ACTIVO') {
      this.mostrarAlerta('error', 'Tu cuenta no está ACTIVA para crear publicaciones.');
      return;
    }
    if (!this.nuevaPub.titulo.trim() || !this.nuevaPub.descripcion.trim()) {
      this.mostrarAlerta('error', 'Completa título y descripción de la publicación.');
      return;
    }

    this.api
      .crearPublicacion({
        titulo: this.nuevaPub.titulo.trim(),
        descripcion: this.nuevaPub.descripcion.trim(),
        categoria: this.nuevaPub.categoria.trim() || 'General',
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
        mensaje: this.mensajeSolicitud.trim() || 'Me interesa este artículo del campus.'
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
        this.mostrarAlerta('error', err?.error?.mensaje || 'Error al aceptar solicitud.');
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
        this.mostrarAlerta('error', err?.error?.mensaje || 'Error al completar la entrega.');
      }
    });
  }
}