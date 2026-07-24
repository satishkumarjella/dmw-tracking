import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonFooter } from '@ionic/angular/standalone';
import { ConfigService } from '../../../shared/config.service';

@Component({
  selector: 'app-dashboard-footer',
  standalone: true,
  imports: [CommonModule, IonFooter],
  templateUrl: './dashboard-footer.component.html',
  styleUrls: ['./dashboard-footer.component.scss']
})
export class DashboardFooterComponent {
  currentYear: number = new Date().getFullYear();
  configService = inject(ConfigService);
}