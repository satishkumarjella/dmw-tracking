import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfigService } from '../../../shared/config.service';

@Component({
  selector: 'app-dashboard-modules',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-modules.component.html',
  styleUrls: ['./dashboard-modules.component.scss']
})
export class DashboardModulesComponent {
  @Input() isDashboardRoute: boolean = true;
  configService = inject(ConfigService);
}