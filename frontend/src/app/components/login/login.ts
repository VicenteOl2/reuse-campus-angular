import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ReuseApiService } from '../../services/reuse-api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  private readonly api = inject(ReuseApiService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  correo = '';
  password = '';
  readonly errorMsg = signal('');
  readonly enviando = signal(false);

  submitLogin(): void {
    this.errorMsg.set('');

    if (!this.correo.trim() || !this.password.trim()) {
      this.errorMsg.set('Debes ingresar correo y contraseña.');
      return;
    }

    this.enviando.set(true);
    this.api.login(this.correo.trim(), this.password).subscribe({
      next: (res) => {
        this.enviando.set(false);
        if (res.ok && res.usuario) {
          this.auth.iniciarSesion(res.usuario);
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.enviando.set(false);
        this.errorMsg.set(err?.error?.mensaje || 'Credenciales inválidas o cuenta bloqueada.');
      }
    });
  }
}