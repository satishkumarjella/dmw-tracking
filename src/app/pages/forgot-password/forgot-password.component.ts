import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';

import { ConfigService } from '../../shared/config.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['../login/login.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, RouterModule]
})
export class ForgotPasswordComponent {
  tenantId = '';
  email = '';

  constructor(
    private authService: AuthService,
    public configService: ConfigService
  ) {}

  onResetPassword() {
    if (this.email && this.tenantId) {
      this.authService.forgotPassword(this.tenantId, this.email).subscribe({
        next: (res) => {
          alert('If that email exists, a reset link has been sent.');
        },
        error: (err) => {
          alert('Request failed: ' + (err.error?.message || 'Unknown error'));
        }
      });
    } else {
      alert('Please fill in all fields.');
    }
  }
}