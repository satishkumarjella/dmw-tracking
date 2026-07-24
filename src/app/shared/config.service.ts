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
  iconSvg: string;
}

export interface AppConfig {
  vendorName: string;
  logoUrl: string;
  theme: {
    primary: string;
    secondary: string;
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
      const response = await fetch('assets/config.json');
      if (!response.ok) throw new Error('Failed to load config');
      const data: AppConfig = await response.json();
      
      // Compute RGB variants for module colors
      if (data.modules) {
        data.modules = data.modules.map(m => ({
          ...m,
          colorHex: m.colorHex || data.theme.primary,
          colorRgb: this.hexToRgb(m.colorHex || data.theme.primary)
        }));
      }

      this.config.set(data);
      this.applyTheme(data.theme);
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

  private applyTheme(theme: { primary: string; secondary: string }) {
    const root = document.documentElement;
    
    // Set Hex values
    if (theme.primary) root.style.setProperty('--color-primary', theme.primary);
    if (theme.secondary) root.style.setProperty('--color-secondary', theme.secondary);

    // Set RGB variants for alpha transparency in glassmorphism
    if (theme.primary) root.style.setProperty('--color-primary-rgb', this.hexToRgb(theme.primary));
    if (theme.secondary) root.style.setProperty('--color-secondary-rgb', this.hexToRgb(theme.secondary));
  }

  public applyModuleTheme(moduleId: string | null) {
    const config = this.config();
    if (!config) return;

    const root = document.documentElement;
    
    if (moduleId) {
      const mod = config.modules.find(m => m.id === moduleId || m.route === moduleId);
      if (mod && mod.colorHex) {
        root.style.setProperty('--color-primary', mod.colorHex);
        root.style.setProperty('--color-primary-rgb', this.hexToRgb(mod.colorHex));
        return;
      }
    }

    // Fallback to global theme
    if (config.theme.primary) {
      root.style.setProperty('--color-primary', config.theme.primary);
      root.style.setProperty('--color-primary-rgb', this.hexToRgb(config.theme.primary));
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
