import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard.component';

export const dashboardRoutes: Routes = [
    {
        path: '',
        component: DashboardComponent,
        children: [
            {
                path: 'abm-status',
                loadComponent: () =>
                    import('../tracking/abm-components-status/abm-components-status.component').then(
                        (m) => m.AbmComponentsStatusComponent
                    ),
            },
            {
                path: 'quality-inspection',
                loadComponent: () =>
                    import('../tracking/quality-inspection-reports/quality-inspection-reports.component').then(
                        (m) => m.QualityInspectionReportsComponent
                    ),
            },
            {
                path: 'receiving',
                loadComponent: () =>
                    import('../tracking/receiving/receiving.component').then(
                        (m) => m.ReceivingComponent
                    ),
            },
            {
                path: 'shipping',
                loadComponent: () =>
                    import('../tracking/shipping/shipping.component').then(
                        (m) => m.ShippingComponent
                    ),
            },
            {
                path: 'wo-status',
                loadComponent: () =>
                    import('../tracking/wo-status/wo-status.component').then(
                        (m) => m.WoStatusComponent
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