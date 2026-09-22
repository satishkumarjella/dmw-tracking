import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';
import { ModuleLoaderComponent } from '../../shared/components/module-loader/module-loader.component';

import { SharedTableComponent, TableColumn } from '../../shared/components/shared-table/shared-table.component';

@Component({
  selector: 'app-project-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective, ModuleLoaderComponent, SharedTableComponent],
  templateUrl: './project-dashboard.component.html',
  styleUrls: ['./project-dashboard.component.scss'],
})
export class ProjectDashboardComponent implements OnInit {
  projectDefInput: string = '';
  isLoading: boolean = true;
  workOrders: any[] = [];
  
  deliveryDatesChartData: ChartConfiguration['data'] = { datasets: [], labels: [] };
  fabricatorsChartData: ChartConfiguration['data'] = { datasets: [], labels: [] };
  wbsElementsChartData: ChartConfiguration['data'] = { datasets: [], labels: [] };
  unitAllocationChartData: ChartConfiguration['data'] = { datasets: [], labels: [] };
  
  barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false
  };

  tableColumns: TableColumn[] = [
    { key: 'poNumber', label: 'PO Number', valueGetter: (row) => row.productionOrderNumber || row.purchasingDocument, sortable: true },
    { key: 'wbsElement', label: 'WBS Element', sortable: true },
    { key: 'fabricator', label: 'Fabricator', valueGetter: (row) => row.fabricatorName || row.fabricator, sortable: true },
    { key: 'requiredBy', label: 'Required By', sortable: true },
    { key: 'unitAllocation', label: 'Unit Allocation', sortable: true },
    { key: 'material', label: 'Material', sortable: true },
    { key: 'description', label: 'Description', valueGetter: (row) => row.shortText || row.description, sortable: true },
    { key: 'quantity', label: 'Qty', valueGetter: (row) => row.quantity || row.stillToBeDeliveredQty, sortable: true },
    { key: 'percentageCompletion', label: '% Completed', valueGetter: (row) => row.percentageCompletion != null ? row.percentageCompletion + '%' : '0%', sortable: true },
  ];

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    setTimeout(() => {
      this.isLoading = false;
    }, 600);
  }

  lookup() {
    this.executeSearch(this.projectDefInput);
  }

  onRowClick(wo: any) {
    if (wo && wo.productionOrderNumber) {
      this.router.navigate(['/dashboard/wo-status'], { queryParams: { po: wo.productionOrderNumber }});
    }
  }

  private executeSearch(query: string) {
    if (!query) {
      this.workOrders = [];
      return;
    }
    this.isLoading = true;
    const tenantId = localStorage.getItem('tenantId') || 'dmw';
    this.http.get<any[]>(`${environment.apiUrl}/purchase-orders/project?q=${encodeURIComponent(query)}`, {
      headers: { 'x-tenant-id': tenantId }
    }).subscribe({
      next: (data) => {
        this.workOrders = data;
        this.processChartData();
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  private processChartData() {
    const deliveryDates: any = {};
    const fabricators: any = {};
    const wbs: any = {};
    const allocations: any = {};

    this.workOrders.forEach(wo => {
      const date = wo.requiredBy || 'N/A';
      deliveryDates[date] = (deliveryDates[date] || 0) + 1;

      const fab = wo.fabricatorName || wo.fabricator || 'Unknown';
      fabricators[fab] = (fabricators[fab] || 0) + 1;

      const wbsEl = wo.wbsElement || 'N/A';
      wbs[wbsEl] = (wbs[wbsEl] || 0) + 1;

      const unit = wo.unitAllocation || 'Unallocated';
      allocations[unit] = (allocations[unit] || 0) + 1;
    });

    this.deliveryDatesChartData = {
      labels: Object.keys(deliveryDates),
      datasets: [{ data: Object.values(deliveryDates), label: 'WOs per Delivery Date', backgroundColor: '#fd7b01' }]
    };

    this.fabricatorsChartData = {
      labels: Object.keys(fabricators),
      datasets: [{ data: Object.values(fabricators), label: 'WOs per Fabricator', backgroundColor: '#0061aa' }]
    };

    this.wbsElementsChartData = {
      labels: Object.keys(wbs),
      datasets: [{ data: Object.values(wbs), label: 'WOs per WBS Element', backgroundColor: '#107c41' }]
    };

    this.unitAllocationChartData = {
      labels: Object.keys(allocations),
      datasets: [{ data: Object.values(allocations), label: 'WOs per Unit Allocation', backgroundColor: '#d83b01' }]
    };
  }
}
