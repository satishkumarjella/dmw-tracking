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

  currentDate = new Date();
  greeting = 'Welcome';

  // Mock KPI data for the command center
  kpiStats = [
    { label: 'System Status', value: 'Healthy', icon: 'check-circle', color: '#10b981', type: 'text' },
    { label: 'Active Work Orders', value: 42, icon: 'briefcase', color: '#f59e0b', type: 'number' },
    { label: 'Pending Actions', value: 7, icon: 'alert-circle', color: '#ef4444', type: 'number' }
  ];

  constructor() {
    this.updateGreeting();
    // Update time every minute
    setInterval(() => {
      this.currentDate = new Date();
      this.updateGreeting();
    }, 60000);
  }

  private updateGreeting() {
    const hour = this.currentDate.getHours();
    if (hour < 12) {
      this.greeting = 'Good Morning';
    } else if (hour < 17) {
      this.greeting = 'Good Afternoon';
    } else {
      this.greeting = 'Good Evening';
    }
  }
}