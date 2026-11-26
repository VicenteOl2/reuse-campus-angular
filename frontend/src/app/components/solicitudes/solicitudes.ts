import { Component, OnInit, computed, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReuseApiService } from '../../services/reuse-api.service';
import { AuthService } from '../../services/auth.service';
import { Solicitud } from '../../models/reuse.models';

@Component({
  selector: 'app-solicitudes',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './solicitudes.html',
  styleUrl: './solicitudes.css'
})
export class Solicitudes implements OnInit {
  private readonly api = inject(ReuseApiService);
  readonly auth = inject(AuthService);

  readonly alertaEmitida = output<{ tipo: 'ok' | 'error'; texto: string }>();
  readonly cambioRealizado = output<void>();

  readonly solicitudes = signal<Solicitud[]>([]);
  filtroEstadoSol = '';

  readonly esUsuarioBloqueado = computed(
    () => this.auth.usuarioActual()?.estado !== 'ACTIVO'
  );

  ngOnInit(): void {
    this.cargarSolicitudes();
  }

  cargarSolicitudes(): void {
    this.api
      .getSolicitudes({
        estado: this.filtroEstadoSol || undefined
      })
      .subscribe({
        next: (data) => this.solicitudes.set(data),
        error: () =>
          this.alertaEmitida.emit({ tipo: 'error', texto: 'Error al cargar solicitudes.' })
      });
  }

  aceptarSolicitud(solicitudId: number): void {
    this.api.aceptarSolicitud(solicitudId).subscribe({
      next: (res) => {
        this.alertaEmitida.emit({
          tipo: 'ok',
          texto: res.mensaje || 'Solicitud aceptada y publicación RESERVADA.'
        });
        this.cargarSolicitudes();
        this.cambioRealizado.emit();
      },
      error: (err) => {
        this.alertaEmitida.emit({
          tipo: 'error',
          texto: err?.error?.mensaje || 'No se pudo aceptar la solicitud.'
        });
      }
    });
  }
}