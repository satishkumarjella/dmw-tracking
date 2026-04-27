import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="header">
      <div class="header-left" *ngIf="showLogo">
        <img class="logo-img" [src]="logoSrc" alt="DMW Logo" />
      </div>
      
      <div class="header-right">
        <ng-content></ng-content>
        
        <a class="back-btn" [routerLink]="backLink" *ngIf="showBack">
          <svg viewBox="0 0 24 24">
            <path d="M19 12H5"></path>
            <path d="M12 19l-7-7 7-7"></path>
          </svg>
          <span>{{ backText }}</span>
        </a>
      </div>
    </header>
  `,
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {
  @Input() showLogo: boolean = true;
  @Input() logoSrc: string = 'assets/logo.png';
  @Input() showBack: boolean = true;
  @Input() backText: string = 'Back';
  @Input() backLink: string = '/dashboard';
  @Input() showClock: boolean = true;
  @Input() clockFormat: string = 'HH:mm:ss';
  
  currentTime: Date = new Date();
  private timerId: any;

  ngOnInit() {
    this.timerId = setInterval(() => this.currentTime = new Date(), 1000);
  }

  ngOnDestroy() {
    if (this.timerId) clearInterval(this.timerId);
  }
}