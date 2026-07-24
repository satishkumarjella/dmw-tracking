import { Component, Input, Output, EventEmitter, ViewEncapsulation, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { ConfigService } from '../../../shared/config.service';
import { SafeHtmlPipe } from '../../../shared/safe-html.pipe';

@Component({
  selector: 'app-modules-section',
  standalone: true,
  imports: [CommonModule, IonButton, IonIcon, SafeHtmlPipe],
  templateUrl: './modules-section.component.html',
  styles: [`:host { display: contents; }`],
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['./modules-section.component.scss']
})
export class ModulesSectionComponent {
  configService = inject(ConfigService);

  @Input() isDashboardRoute: boolean = true;
  @Input() isSidebarCollapsed: boolean = true;
  @Input() activeModule: string = '';

  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() navigate = new EventEmitter<string>();
}