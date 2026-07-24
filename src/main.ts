import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
  ],
});



// export CAPACITOR_ANDROID_STUDIO_PATH="/var/lib/flatpak/app/com.google.AndroidStudio/x86_64/stable/ac49b3a67e5131124b3986806ea0ba64b90c1fd1a82c56670c2fc418d99e8868/files/extra/bin/studio.sh"