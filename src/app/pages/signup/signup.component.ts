import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';

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
    public configService: ConfigService
  ) {}

  onSignup() {
    if (this.password !== this.confirmPassword) {
      alert('Passwords do not match.');
      return;
    }
    
    if (this.email && this.password && this.tenantId) {
      this.authService.signup(this.tenantId, this.email, this.password).subscribe({
        next: (res) => {
          alert('Signup successful! Please login.');
          this.router.navigate(['/login']);
        },
        error: (err) => {
          alert('Signup failed: ' + (err.error?.message || 'Unknown error'));
        }
      });
    } else {
      alert('Please fill in all fields including Workspace Name.');
    }
  }
}