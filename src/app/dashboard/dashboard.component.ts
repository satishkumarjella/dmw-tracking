import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import {
  IonContent,
  IonFooter,
  IonRouterOutlet,
  IonHeader
} from '@ionic/angular/standalone';
import { HeaderComponent } from '../shared/header/header.component';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: true,
  imports: [RouterModule, CommonModule, HeaderComponent, IonContent,
    IonFooter,
    IonRouterOutlet,
    IonHeader,]
})
export class DashboardComponent implements OnInit, OnDestroy {
  currentYear: number = new Date().getFullYear();
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

  ngOnInit() {}

  ngOnDestroy() {
    if (this.routerSub) {
      this.routerSub.unsubscribe();
    }
  }

  checkRoute(url: string) {
    this.isDashboardRoute = url === '/dashboard' || url === '/dashboard/';
  }

  navigateToRoute(path: string) {
    console.log(path);
    this.router.navigate(['/dashboard/' + path]);
  }
}
