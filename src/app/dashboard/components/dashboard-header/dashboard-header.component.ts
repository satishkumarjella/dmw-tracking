import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonHeader, IonButton, IonIcon, IonPopover, IonList, IonItem, IonLabel, IonContent, IonSearchbar, IonToggle } from '@ionic/angular/standalone';
import { HeaderComponent } from '../../../shared/header/header.component';
import { ThemeService } from 'src/app/shared/theme.service';
import { ConfigService } from '../../../shared/config.service';
@Component({
  selector: 'app-dashboard-header',
  standalone: true,
  imports: [IonSearchbar, CommonModule, FormsModule, IonHeader, IonButton, IonIcon, IonPopover, IonList, IonItem, IonLabel, IonContent, HeaderComponent, IonToggle],
  templateUrl: './dashboard-header.component.html',
  styleUrls: ['./dashboard-header.component.scss']
})
export class DashboardHeaderComponent {
  @Input() isDashboardRoute: boolean = true;
  @Input() isSidebarCollapsed: boolean = true;
  @Input() globalPoSearch: string = '';
  @Input() moduleDescription: string = '';
  @Input() moduleTitle: string = '';
  @Input() activeModule: string = '';

  themeService = inject(ThemeService);
  configService = inject(ConfigService);
  isDark = this.themeService.isDarkMode;

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  @Output() globalPoSearchChange = new EventEmitter<string>();
  @Output() searchTriggered = new EventEmitter<void>();
  @Output() profileOpened = new EventEmitter<void>();
  @Output() preferencesOpened = new EventEmitter<void>();
  @Output() helpOpened = new EventEmitter<void>();
  @Output() loggedOut = new EventEmitter<void>();
  @Output() cameraScanTriggered = new EventEmitter<void>();

  onSearchChange(val: string) {
    this.globalPoSearch = val;
    this.globalPoSearchChange.emit(val);
  }
}