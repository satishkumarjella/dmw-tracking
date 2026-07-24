import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ConfigService } from '../../shared/config.service';
import { IonContent } from '@ionic/angular/standalone';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [IonContent, FormsModule, CommonModule]
})
export class LoginComponent {
  email = '';
  password = '';

  constructor(
    private router: Router,
    public configService: ConfigService
  ) {}

  onLogin() {
    if (this.email && this.password) {
      // TODO: Replace with actual authentication service logic
      console.log('Authenticating:', this.email);
      
      // Navigate to the dashboard on successful login
      this.router.navigate(['/dashboard']);
    }
  }
}