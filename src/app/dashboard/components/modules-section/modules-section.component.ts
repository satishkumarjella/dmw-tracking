import { Component, Input, Output, EventEmitter, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonButton, IonIcon } from '@ionic/angular/standalone';

@Component({
  selector: 'app-modules-section',
  standalone: true,
  imports: [CommonModule, IonButton, IonIcon],
  templateUrl: './modules-section.component.html',
  styles: [`:host { display: contents; }`],
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['./modules-section.component.scss']
})
export class ModulesSectionComponent {
  @Input() isDashboardRoute: boolean = true;
  @Input() isSidebarCollapsed: boolean = true;
  @Input() activeModule: string = '';

  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() navigate = new EventEmitter<string>();
}