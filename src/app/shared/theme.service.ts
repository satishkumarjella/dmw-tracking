import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  public isDarkMode = signal<boolean>(this.checkDefaultTheme());

  constructor() {
    this.applyTheme(this.isDarkMode());
  }

  toggleTheme() {
    this.isDarkMode.update(dark => !dark);
    this.applyTheme(this.isDarkMode());
  }

  private checkDefaultTheme(): boolean {
    const savedTheme = localStorage.getItem('dmw-theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  private applyTheme(isDark: boolean) {
    if (isDark) {
      document.body.classList.add('dark');
      document.body.classList.remove('light');
    } else {
      document.body.classList.add('light');
      document.body.classList.remove('dark');
    }
    localStorage.setItem('dmw-theme', isDark ? 'dark' : 'light');
  }
}
