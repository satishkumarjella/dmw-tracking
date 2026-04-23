import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, RouterModule]
})
export class SignupComponent {
  email = '';
  password = '';
  confirmPassword = '';

  constructor() {}

  onSignup() {
    if (this.password !== this.confirmPassword) {
      console.error('Passwords do not match.');
      return;
    }
    console.log('Signup attempted with:', this.email);
  }
}