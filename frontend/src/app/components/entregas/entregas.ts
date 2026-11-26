import { Component, OnInit, computed, inject, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ReuseApiService } from '../../services/reuse-api.service';
import { AuthService } from '../../services/auth.service';
import { Entrega } from '../../models/reuse.models';

@Component({
  selector: 'app-entregas',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './entregas.html',
  styleUrl: './entregas.css'
})
export class Entregas implements OnInit {
  private readonly api = inject(ReuseApiService);
  readonly auth = inject(AuthService);

  readonly alertaEmitida = output<{ tipo: 'ok' | 'error'; texto: string }>();
  readonly cambioRealizado = output<void>();
  readonly entregas = signal<Entrega[]>([]);

  readonly esUsuarioBloqueado = computed(
    () => this.auth.usuarioActual()?.estado !== 'ACTIVO'
  );

  ngOnInit(): void {
    this.cargarEntregas();
  }

  cargarEntregas(): void {
    this.api.getEntregas().subscribe({
      next: (data) => this.entregas.set(data),
      error: () =>
        this.alertaEmitida.emit({ tipo: 'error', texto: 'Error al cargar entregas.' })
    });
  }

  completarEntrega(entregaId: number): void {
    this.api.completarEntrega(entregaId).subscribe({
      next: (res) => {
        this.alertaEmitida.emit({
          tipo: 'ok',
          texto: res.mensaje || 'Entrega completada y publicación ENTREGADA.'
        });
        this.cargarEntregas();
        this.cambioRealizado.emit();
      },
      error: (err) => {
        this.alertaEmitida.emit({
          tipo: 'error',
          texto: err?.error?.mensaje || 'No se pudo completar la entrega.'
        });
      }
    });
  }
}