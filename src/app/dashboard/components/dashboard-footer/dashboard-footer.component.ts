import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonFooter } from '@ionic/angular/standalone';

@Component({
  selector: 'app-dashboard-footer',
  standalone: true,
  imports: [CommonModule, IonFooter],
  templateUrl: './dashboard-footer.component.html'
})
export class DashboardFooterComponent {
  currentYear: number = new Date().getFullYear();
}