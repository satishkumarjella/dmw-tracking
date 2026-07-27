import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { ToastService } from '../../shared/services/toast.service';

import { ConfigService } from '../../shared/config.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['../login/login.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, RouterModule]
})
export class SignupComponent {
  tenantId = '';
  email = '';
  password = '';
  confirmPassword = '';

  constructor(
    private authService: AuthService, 
    private router: Router,
    public configService: ConfigService,
    private toastService: ToastService
  ) {}

  onSignup() {
    if (this.password !== this.confirmPassword) {
      this.toastService.error('Passwords do not match.');
      return;
    }
    
    if (this.email && this.password && this.tenantId) {
      this.authService.signup(this.tenantId, this.email, this.password).subscribe({
        next: (res) => {
          this.toastService.success('Signup successful! Please login.');
          this.router.navigate(['/login']);
        },
        error: (err) => {
          this.toastService.error('Signup failed: ' + (err.error?.message || 'Unknown error'));
        }
      });
    } else {
      this.toastService.error('Please fill in all fields including Workspace Name.');
    }
  }
}