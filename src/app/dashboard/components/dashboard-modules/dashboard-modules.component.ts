import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard-modules',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-modules.component.html'
})
export class DashboardModulesComponent {
  @Input() isDashboardRoute: boolean = true;
}