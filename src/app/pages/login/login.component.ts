import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ConfigService } from '../../shared/config.service';
import { AuthService } from '../../shared/services/auth.service';
import { ToastService } from '../../shared/services/toast.service';
import { IonContent } from '@ionic/angular/standalone';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [IonContent, FormsModule, CommonModule]
})
export class LoginComponent {
  tenantId = '';
  email = '';
  password = '';

  constructor(
    private router: Router,
    public configService: ConfigService,
    private authService: AuthService,
    private toastService: ToastService
  ) {}

  onLogin() {
    if (this.email && this.password && this.tenantId) {
      this.authService.login(this.tenantId, this.email, this.password).subscribe({
        next: (res) => {
          this.toastService.success('Login successful!');
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.toastService.error('Login failed: ' + (err.error?.message || 'Unknown error'));
        }
      });
    } else {
      this.toastService.error('Please fill in all fields including Workspace Name.');
    }
  }
}