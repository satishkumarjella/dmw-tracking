import { Injectable, signal } from '@angular/core';

export interface AppModule {
  id: string;
  title: string;
  shortName: string;
  desc: string;
  route: string;
  colorClass?: string;
  colorHex?: string;
  colorRgb?: string;
  buttonColor?: string;
  iconSvg: string;
}

export interface AppConfig {
  vendorName: string;
  logoUrl: string;
  theme: {
    primary: string;
    secondary: string;
    buttonColor?: string;
    [key: string]: any;
  };
  modules: AppModule[];
}

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  public config = signal<AppConfig | null>(null);

  constructor() {}

  async loadConfig(): Promise<void> {
    try {
      const tenantId = localStorage.getItem('tenantId');
      let data: AppConfig | null = null;

      // Always load local config to ensure modules are present
      const localResponse = await fetch('assets/config.json');
      if (localResponse.ok) {
        data = await localResponse.json();
      }

      if (tenantId && data) {
        try {
          const response = await fetch('http://localhost:3000/config', {
            headers: { 'x-tenant-id': tenantId }
          });
          if (response.ok) {
            const configEntity = await response.json();
            // Merge backend theme overrides
            if (configEntity.theme) {
              data.theme = { ...data.theme, ...configEntity.theme };
            }
            // Only override modules if backend actually provided some
            if (configEntity.modules && configEntity.modules.length > 0) {
              data.modules = configEntity.modules;
            }
          }
        } catch (e) {
          console.warn('Backend config fetch failed, falling back to local', e);
        }
      }

      if (!data) throw new Error('Failed to load any configuration');

      
      // Compute RGB variants for module colors
      if (data && data.modules && data.theme) {
        data.modules = data.modules.map(m => ({
          ...m,
          colorHex: m.colorHex || data.theme.primary,
          colorRgb: this.hexToRgb(m.colorHex || data.theme.primary),
          buttonColor: m.buttonColor || data.theme.buttonColor
        }));
      }

      if (data) {
        this.config.set(data);
        if (data.theme) {
          this.applyTheme(data.theme);
        }
      }
    } catch (err) {
      console.error('Error loading app config:', err);
      // Fallback defaults
      this.config.set({
        vendorName: 'DMW Tracking',
        logoUrl: 'assets/logo.png',
        theme: { primary: '#4F46E5', secondary: '#0ea5e9' },
        modules: []
      });
    }
  }

  private applyTheme(theme: Record<string, string>) {
    const root = document.documentElement;
    
    Object.keys(theme).forEach(key => {
      // Map JSON key to SCSS variable name
      let varName = `--${key}`;
      if (['primary', 'secondary', 'excel', 'success', 'warning', 'danger'].includes(key)) {
        varName = `--color-${key}`;
      } else if (key === 'buttonColor') {
        varName = '--color-button';
      }

      root.style.setProperty(varName, theme[key]);

      // Set RGB variants for alpha transparency in glassmorphism
      if (['primary', 'secondary', 'excel'].includes(key)) {
        root.style.setProperty(`${varName}-rgb`, this.hexToRgb(theme[key]));
      }
    });
  }

  public applyModuleTheme(moduleId: string | null) {
    const config = this.config();
    if (!config) return;

    const root = document.documentElement;
    
    if (moduleId) {
      const mod = config.modules.find(m => m.id === moduleId || m.route === moduleId);
      if (mod) {
        if (mod.colorHex) {
          root.style.setProperty('--color-primary', mod.colorHex);
          root.style.setProperty('--color-primary-rgb', this.hexToRgb(mod.colorHex));
        }
        if (mod.buttonColor) {
          root.style.setProperty('--color-button', mod.buttonColor);
        }
        return;
      }
    }

    // Fallback to global theme
    if (config.theme.primary) {
      root.style.setProperty('--color-primary', config.theme.primary);
      root.style.setProperty('--color-primary-rgb', this.hexToRgb(config.theme.primary));
    }
    if (config.theme.buttonColor) {
      root.style.setProperty('--color-button', config.theme.buttonColor);
    }
  }

  private hexToRgb(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
    }
    return '0, 0, 0';
  }
}
