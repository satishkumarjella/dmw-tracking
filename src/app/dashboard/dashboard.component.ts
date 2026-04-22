import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: true,
  imports: [RouterModule, CommonModule]
})
export class DashboardComponent implements OnInit, OnDestroy {
  currentTime: Date = new Date();
  currentYear: number = new Date().getFullYear();
  private timerId: any;
  isDashboardRoute: boolean = true;
  private routerSub!: Subscription;

  constructor(private router: Router) {
    this.checkRoute(this.router.url);
    this.routerSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.checkRoute(event.urlAfterRedirects);
    });
  }

  ngOnInit() {
    this.timerId = setInterval(() => {
      this.currentTime = new Date();
    }, 1000);
  }

  ngOnDestroy() {
    if (this.timerId) {
      clearInterval(this.timerId);
    }
    if (this.routerSub) {
      this.routerSub.unsubscribe();
    }
  }

  checkRoute(url: string) {
    this.isDashboardRoute = url === '/dashboard' || url === '/dashboard/';
  }

  navigateToRoute(path: string) {
    this.router.navigate(['/dashboard/' + path]);
  }
}
