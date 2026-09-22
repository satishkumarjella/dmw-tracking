import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ConfigService } from '../../shared/config.service';
import { ModuleLoaderComponent } from '../../shared/components/module-loader/module-loader.component';
import { SharedTableComponent, TableColumn } from '../../shared/components/shared-table/shared-table.component';
import { ShipmentTrackingService, ShipmentItem, ReceiptItem, WoStatusSummary } from '../../shared/services/shipment-tracking.service';
import { firstValueFrom } from 'rxjs';

type StageState = 'done' | 'active' | 'pending';

export interface WorkOrder {
  poNumber: string;
  title: string;
  customer: string;
  style: string;
  color: string;
  factory: string;
  totalQty: number;
  inProcessQty: number;
  shippedQty: number;
  receivedQty: number;
  inTransitQty: number;
  backOrderQty: number;
  deliveryDate: string;
  daysRemaining: number;
  percentageCompletion: number;
}

@Component({
  selector: 'app-wo-status',
  templateUrl: './wo-status.component.html',
  styleUrls: ['./wo-status.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ModuleLoaderComponent, SharedTableComponent]
})
export class WoStatusComponent implements OnInit, OnDestroy {
  isLoading = true;
  poInput = '';
  errorMessage = '';
  selectedWo: WorkOrder | null = null;
  activeActivityTab: 'shipments' | 'receipts' = 'shipments';

  shipments: ShipmentItem[] = [];
  receipts: ReceiptItem[] = [];

  shipmentColumns: TableColumn[] = [
    { key: 'index', label: '#', type: 'custom' },
    { key: 'shipDate', label: 'Date Shipped', type: 'date', sortable: true },
    { key: 'truck', label: 'Truck / Shipment #', type: 'custom' },
    { key: 'qtyShipped', label: 'QTY Shipped', type: 'custom', sortable: true },
    { key: 'qtyReceived', label: 'QTY Confirmed', type: 'custom', sortable: true },
    { key: 'status', label: 'Status', type: 'custom' },
    { key: 'shippedBy', label: 'Shipped By', sortable: true },
    { key: 'files', label: 'Files', type: 'custom' }
  ];

  receiptColumns: TableColumn[] = [
    { key: 'index', label: '#', type: 'custom' },
    { key: 'receiptDate', label: 'Date Received', type: 'date', sortable: true },
    { key: 'truck', label: 'Truck / Shipment #', type: 'custom' },
    { key: 'qtyReceived', label: 'QTY Received', type: 'custom', sortable: true },
    { key: 'qtyOpen', label: 'Remaining Open', type: 'custom', sortable: true },
    { key: 'receivedBy', label: 'Received By', sortable: true },
    { key: 'notes', label: 'Notes', type: 'custom' },
    { key: 'files', label: 'Files', type: 'custom' }
  ];


  constructor(
    private configService: ConfigService,
    private shipmentService: ShipmentTrackingService,
    private route: ActivatedRoute,
    public router: Router
  ) {}

  ngOnInit() {
    this.configService.applyModuleTheme('wo-status');
    this.route.queryParams.subscribe(params => {
      if (params['po']) {
        this.poInput = params['po'];
        this.lookup();
      }
    });

    setTimeout(() => {
      this.isLoading = false;
    }, 600);
  }

  ngOnDestroy() {
    this.configService.applyModuleTheme(null);
  }

  async lookup(): Promise<void> {
    const value = this.poInput.trim().toUpperCase();

    if (!value) {
      this.errorMessage = 'Please enter a PO number.';
      this.selectedWo = null;
      return;
    }

    this.errorMessage = '';

    try {
      // Pull live consolidated summary from database
      const summary: WoStatusSummary = await firstValueFrom(
        this.shipmentService.getWoStatusSummary(value)
      );

      if (summary && (summary.poDetails || summary.totalRequiredQty > 0 || summary.shipmentsCount > 0)) {
        this.shipments = summary.shipments || [];
        this.receipts = summary.receipts || [];

        const totalQty = summary.totalRequiredQty || 48;
        const shippedQty = summary.totalShippedQty || 0;
        const receivedQty = summary.totalReceivedQty || 0;
        const inTransitQty = summary.inTransitQty || Math.max(0, shippedQty - receivedQty);
        const backOrderQty = summary.backOrderQty || Math.max(0, totalQty - receivedQty);

        const poDetails = summary.poDetails;
        this.selectedWo = {
          poNumber: summary.poNumber,
          title: `PO-${summary.poNumber}`,
          customer: poDetails?.customerName || poDetails?.customer || 'Target Logistics',
          style: poDetails?.description || 'Conveyor Drive Assembly Section',
          color: poDetails?.markNumber || 'Mark 36785-A01',
          factory: 'DMW Production Plant',
          totalQty,
          inProcessQty: Math.max(0, totalQty - shippedQty),
          shippedQty,
          receivedQty,
          inTransitQty,
          backOrderQty,
          deliveryDate: poDetails?.deliveryDate || '2026-10-15',
          daysRemaining: 14,
          percentageCompletion: poDetails?.percentageCompletion || 0
        };
      } else {
        this.errorMessage = `No production order records found for "${value}".`;
        this.selectedWo = null;
      }
    } catch (err) {
      console.error('Failed to pull WO Status summary:', err);
      this.errorMessage = `Error retrieving status for "${value}". Please try again.`;
      this.selectedWo = null;
    }
  }

  get activeStageLabel(): string {
    if (!this.selectedWo) return 'Unknown';
    if (this.selectedWo.percentageCompletion === 100) {
      return 'Production Completed';
    }
    return `${this.selectedWo.percentageCompletion}% Completed`;
  }


  fmtDate(date: string): string {
    if (!date) return '—';
    return new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  getFileUrl(url: string | null | undefined): string {
    return this.shipmentService.getFileUrl(url);
  }
}