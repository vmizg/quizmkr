import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { setBasePath } from '@shoelace-style/shoelace/dist/utilities/base-path';
import '@shoelace-style/shoelace';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

setBasePath('https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.7.0/cdn/');

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch((err) => console.error(err));
