import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
import { RoleGuard } from '../shared/guards/role.guard';

export const dashboardRoutes: Routes = [
    {
        path: '',
        component: DashboardComponent,
        children: [
            {
                path: 'abm-status',
                canActivate: [RoleGuard],
                data: { module: 'abm-status' },
                loadComponent: () =>
                    import('../tracking/abm-components-status/abm-components-status.component').then(
                        (m) => m.AbmComponentsStatusComponent
                    ),
            },
            {
                path: 'quality-inspection',
                canActivate: [RoleGuard],
                data: { module: 'quality-inspection' },
                loadComponent: () =>
                    import('../tracking/quality-inspection-reports/quality-inspection-reports.component').then(
                        (m) => m.QualityInspectionReportsComponent
                    ),
            },
            {
                path: 'receiving',
                canActivate: [RoleGuard],
                data: { module: 'receiving' },
                loadComponent: () =>
                    import('../tracking/receiving/receiving.component').then(
                        (m) => m.ReceivingComponent
                    ),
            },
            {
                path: 'shipping',
                canActivate: [RoleGuard],
                data: { module: 'shipping' },
                loadComponent: () =>
                    import('../tracking/shipping/shipping.component').then(
                        (m) => m.ShippingComponent
                    ),
            },
            {
                path: 'wo-status',
                canActivate: [RoleGuard],
                data: { module: 'wo-status' },
                loadComponent: () =>
                    import('../tracking/wo-status/wo-status.component').then(
                        (m) => m.WoStatusComponent
                    ),
            },
            {
                path: 'admin',
                canActivate: [RoleGuard],
                data: { module: 'admin' },
                loadComponent: () =>
                    import('./admin/admin.component').then(
                        (m) => m.AdminComponent
                    ),
            },
            {
                path: '**',
                redirectTo: '',
                pathMatch: 'full',
            }
        ]
    }
];