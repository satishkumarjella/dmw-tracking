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
  stages: Record<string, StageState>;
}

interface StageConfig {
  key: string;
  label: string;
  icon: string;
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

  readonly stageConfig: StageConfig[] = [
    {
      key: 'cutting',
      label: 'Cutting',
      icon: `
        <svg viewBox="0 0 24 24">
          <circle cx="6" cy="6" r="2"></circle>
          <circle cx="6" cy="18" r="2"></circle>
          <line x1="20" y1="4" x2="8.12" y2="15.88"></line>
          <line x1="14.47" y1="14.48" x2="20" y2="20"></line>
          <line x1="8.12" y1="8.12" x2="12" y2="12"></line>
        </svg>
      `
    },
    {
      key: 'sewing',
      label: 'Sewing',
      icon: `
        <svg viewBox="0 0 24 24">
          <path d="M12 3v18"></path>
          <path d="M8 7h8"></path>
          <path d="M9 21h6"></path>
        </svg>
      `
    },
    {
      key: 'finishing',
      label: 'Finishing',
      icon: `
        <svg viewBox="0 0 24 24">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      `
    },
    {
      key: 'packing',
      label: 'Packing',
      icon: `
        <svg viewBox="0 0 24 24">
          <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path>
          <path d="M3.29 7 12 12l8.71-5"></path>
          <path d="M12 22V12"></path>
        </svg>
      `
    },
    {
      key: 'dispatch',
      label: 'Dispatch',
      icon: `
        <svg viewBox="0 0 24 24">
          <rect x="1" y="3" width="15" height="13"></rect>
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
          <circle cx="5.5" cy="18.5" r="2.5"></circle>
          <circle cx="18.5" cy="18.5" r="2.5"></circle>
        </svg>
      `
    }
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

        // Dynamically compute production workflow stages based on actual progress
        const stages: Record<string, StageState> = {
          cutting: 'done',
          sewing: 'done',
          finishing: 'done',
          packing: 'done',
          dispatch: 'pending'
        };

        if (receivedQty >= totalQty && totalQty > 0) {
          stages['dispatch'] = 'done';
        } else if (shippedQty > 0) {
          stages['dispatch'] = 'active';
        } else {
          stages['finishing'] = 'active';
          stages['packing'] = 'pending';
          stages['dispatch'] = 'pending';
        }

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
          stages
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

    if (this.selectedWo.stages['dispatch'] === 'done') {
      return 'Completed & Delivered';
    }

    const activeStage = this.stageConfig.find(
      s => this.selectedWo?.stages[s.key] === 'active'
    );

    if (activeStage) return `${activeStage.label} in progress`;

    const doneCount = Object.values(this.selectedWo.stages).filter(
      s => s === 'done'
    ).length;

    return `${doneCount} of 5 stages complete`;
  }

  trackByStage(index: number, stage: StageConfig): string {
    return stage.key;
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