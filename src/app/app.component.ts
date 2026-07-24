import { Component, inject } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { ThemeService } from './shared/theme.service';
import { ConfigService } from './shared/config.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  private themeService = inject(ThemeService);
  private configService = inject(ConfigService);
  
  constructor() {
    this.configService.loadConfig();
  }
}
