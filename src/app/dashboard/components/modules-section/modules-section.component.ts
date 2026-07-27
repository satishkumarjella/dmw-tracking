import { Component, Input, Output, EventEmitter, ViewEncapsulation, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { ConfigService } from '../../../shared/config.service';
import { AuthService } from '../../../shared/services/auth.service';
import { HttpClient } from '@angular/common/http';
import { SafeHtmlPipe } from '../../../shared/safe-html.pipe';
import { OnInit } from '@angular/core';

@Component({
  selector: 'app-modules-section',
  standalone: true,
  imports: [CommonModule, IonButton, IonIcon, SafeHtmlPipe],
  templateUrl: './modules-section.component.html',
  styles: [`:host { display: contents; }`],
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['./modules-section.component.scss']
})
export class ModulesSectionComponent implements OnInit {
  configService = inject(ConfigService);
  authService = inject(AuthService);
  http = inject(HttpClient);

  allowedModules: string[] = [];
  currentUserRole = 'user';

  @Input() isDashboardRoute: boolean = true;
  @Input() isSidebarCollapsed: boolean = true;
  @Input() activeModule: string = '';

  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() navigate = new EventEmitter<string>();

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.currentUserRole = user.role;
        this.allowedModules = user.modules || [];
      }
    });
  }

  hasAccess(moduleId: string): boolean {
    if (this.currentUserRole === 'super_admin' || this.currentUserRole === 'admin') return true;
    return this.allowedModules.includes(moduleId);
  }
}