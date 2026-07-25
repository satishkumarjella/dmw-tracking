import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { addIcons } from 'ionicons';
import { settingsOutline, personCircleOutline, optionsOutline, helpCircleOutline, logOutOutline, chevronBackOutline, menuOutline, searchOutline, informationCircleOutline, barcodeOutline } from 'ionicons/icons';
import { DashboardModulesComponent } from './components/dashboard-modules/dashboard-modules.component';
import { DashboardFooterComponent } from './components/dashboard-footer/dashboard-footer.component';
import { DashboardHeaderComponent } from './components/dashboard-header/dashboard-header.component';
import { ModulesSectionComponent } from './components/modules-section/modules-section.component';
import { AuthService } from '../shared/services/auth.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [FormsModule, RouterModule, CommonModule,
    DashboardHeaderComponent, DashboardFooterComponent, DashboardModulesComponent, ModulesSectionComponent]
})
export class DashboardComponent implements OnInit, OnDestroy {
  currentYear: number = new Date().getFullYear();
  isDashboardRoute: boolean = true;
  activeModule: string = '';
  isSidebarCollapsed: boolean = true;
  globalPoSearch: string = '';
  activeChildComponent: any;
  private routerSub!: Subscription;

  constructor(private router: Router, private authService: AuthService) {
    addIcons({ settingsOutline, personCircleOutline, optionsOutline, helpCircleOutline, logOutOutline, chevronBackOutline, menuOutline, searchOutline, informationCircleOutline, barcodeOutline });
    this.checkRoute(this.router.url);
    this.routerSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.checkRoute(event.urlAfterRedirects);
    });
  }

  ngOnInit() { }

  ngOnDestroy() {
    if (this.routerSub) {
      this.routerSub.unsubscribe();
    }
  }

  checkRoute(url: string) {
    this.isDashboardRoute = url === '/dashboard' || url === '/dashboard/';
    const parts = url.split('/');
    this.activeModule = parts[parts.length - 1] || '';
  }

  navigateToRoute(path: string) {
    console.log(path);
    this.router.navigate(['/dashboard/' + path]);
  }

  getModuleTitle(): string {
    const titles: { [key: string]: string } = {
      'wo-status': 'Work Order Status',
      'abm-status': 'ABM Components',
      'quality-inspection': 'Quality Inspection',
      'shipping': 'Shipping',
      'receiving': 'Receiving'
    };
    return titles[this.activeModule] || 'Dashboard';
  }

  getModuleDescription(): string {
    const descriptions: { [key: string]: string } = {
      'wo-status': 'Track open and closed work orders, monitor production milestones, and manage job progress in real time.',
      'abm-status': 'Real-time component inventory, assembly build module tracking, BOM compliance, and parts availability.',
      'quality-inspection': 'Inspection logs, NCR reports, PPAP records, first-article documentation, and audit trail history.',
      'shipping': 'Manage outbound shipments, coordinate carriers, generate BOLs, and track delivery status.',
      'receiving': 'Process inbound receipts, verify purchase orders, log discrepancies, and confirm dock deliveries.'
    };
    return descriptions[this.activeModule] || 'Select a module to view its details.';
  }

  onOutletActivate(component: any) {
    this.activeChildComponent = component;
    if (this.globalPoSearch) {
      this.triggerSearch();
    }
  }

  triggerSearch() {
    if (this.activeChildComponent && this.globalPoSearch) {
      this.activeChildComponent.poInput = this.globalPoSearch;
      if (typeof this.activeChildComponent.lookup === 'function') {
        this.activeChildComponent.lookup();
      }
    }
  }

  openProfile() {
    console.log('Navigate to profile');
  }

  openPreferences() {
    console.log('Navigate to preferences');
  }

  openHelp() {
    console.log('Navigate to help & support');
  }

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  startCameraScan() {
    console.log('Starting camera scan...');
    alert('Camera barcode scanner integration will go here.');
  }

}
