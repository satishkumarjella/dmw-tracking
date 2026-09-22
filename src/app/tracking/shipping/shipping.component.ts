import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ConfigService } from '../../shared/config.service';
import { ModuleLoaderComponent } from '../../shared/components/module-loader/module-loader.component';
import { SharedTableComponent, TableColumn } from '../../shared/components/shared-table/shared-table.component';
import { ShipmentTrackingService, PoDetails, ShipmentItem as ApiShipment } from '../../shared/services/shipment-tracking.service';
import { firstValueFrom } from 'rxjs';

interface ShippingRecord {
  mark: string;
  markDesc: string;
  totalQty: number;
}

export interface ShipmentItem {
  id: string | number;
  date: string;
  truck: string;
  po: string;
  qtyReq: number;
  qtyShip: number;
  qtyReceived?: number;
  qtyOpen: number;
  by: string;
  status: string; // 'PENDING_RECEIPT' | 'PARTIALLY_RECEIVED' | 'RECEIVED'
  docName: string | null;
  docUrl: string | null;
  picName: string | null;
  picUrl: string | null;
}

@Component({
  selector: 'app-shipping',
  templateUrl: './shipping.component.html',
  styleUrls: ['./shipping.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ModuleLoaderComponent, SharedTableComponent]
})
export class ShippingComponent implements OnInit, OnDestroy {
  isLoading = true;
  isSubmitting = false;
  currentYear = new Date().getFullYear();

  poInput = '';
  showError = false;
  searchQuery = '';

  currentPO = '';
  selectedRecord: ShippingRecord | null = null;
  shipments: ShipmentItem[] = [];

  isModalOpen = false;
  toastMessage = '';

  docFile: File | null = null;
  picFile: File | null = null;

  form = {
    date: '',
    truck: '',
    by: '',
    qtyShip: 0,
    qtyOpen: 0
  };

  tableColumns: TableColumn[] = [
    { key: 'index', label: '#', type: 'custom' },
    { key: 'date', label: 'Date Shipped', type: 'date' },
    { key: 'truck', label: 'Truck / Shipment #', type: 'custom' },
    { key: 'po', label: 'Production Order #' },
    { key: 'qtyReq', label: 'QTY Required' },
    { key: 'qtyShip', label: 'QTY Shipped', type: 'custom' },
    { key: 'qtyOpen', label: 'QTY Open', type: 'custom' },
    { key: 'status', label: 'Status', type: 'custom' },
    { key: 'by', label: 'Shipped By' },
    { key: 'docs', label: 'Docs', type: 'custom' },
    { key: 'picture', label: 'Picture', type: 'custom' }
  ];



  constructor(
    private configService: ConfigService,
    private shipmentService: ShipmentTrackingService,
    private route: ActivatedRoute,
    public router: Router
  ) {}

  ngOnInit(): void {
    this.configService.applyModuleTheme('shipping');
    
    // Check if a PO is passed in the query parameters
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

  ngOnDestroy(): void {
    this.configService.applyModuleTheme(null);
  }

  get totalShipped(): number {
    return this.shipments.reduce((sum, item) => sum + (Number(item.qtyShip) || 0), 0);
  }

  get totalOpen(): number {
    return Math.max(0, (this.selectedRecord?.totalQty || 0) - this.totalShipped);
  }

  async lookup(): Promise<void> {
    const raw = this.poInput.trim().toUpperCase();
    this.showError = false;
    this.selectedRecord = null;
    this.shipments = [];

    if (!raw) return;

    try {
      // 1. Fetch PO details from backend
      const poData = await firstValueFrom(this.shipmentService.getPoDetails(raw)).catch(() => null);

      if (poData && (poData.productionOrderNumber || poData.quantity)) {
        this.currentPO = poData.productionOrderNumber || raw;
        this.selectedRecord = {
          mark: poData.markNumber || 'Mark N/A',
          markDesc: poData.description || poData.customerName || 'Production Order Assembly',
          totalQty: Number(poData.quantity) || 0
        };
      } else {
        this.showError = true;
        return;
      }

      // 2. Fetch existing shipments for this PO from backend
      await this.loadShipments(this.currentPO);
    } catch (err) {
      console.error('Error during PO lookup in shipping:', err);
      this.showError = true;
    }
  }

  async loadShipments(poNumber: string): Promise<void> {
    try {
      const apiShipments = await firstValueFrom(this.shipmentService.getShipments(poNumber));
      this.shipments = (apiShipments || []).map(s => ({
        id: s.id,
        date: s.shipDate,
        truck: s.shipmentNumber,
        po: s.productionOrderNumber,
        qtyReq: s.qtyRequired,
        qtyShip: s.qtyShipped,
        qtyReceived: s.qtyReceived || 0,
        qtyOpen: s.qtyOpen,
        by: s.shippedBy,
        status: s.status || 'PENDING_RECEIPT',
        docName: s.docName || null,
        docUrl: s.docUrl ? this.shipmentService.getFileUrl(s.docUrl) : null,
        picName: s.picName || null,
        picUrl: s.picUrl ? this.shipmentService.getFileUrl(s.picUrl) : null,
      }));
    } catch (err) {
      console.error('Failed to load shipments:', err);
    }
  }

  clearAll(): void {
    this.poInput = '';
    this.showError = false;
    this.selectedRecord = null;
    this.currentPO = '';
    this.shipments = [];
  }

  openModal(): void {
    if (!this.selectedRecord) return;

    this.form = {
      date: new Date().toISOString().split('T')[0],
      truck: '',
      by: '',
      qtyShip: 0,
      qtyOpen: this.totalOpen
    };

    this.docFile = null;
    this.picFile = null;
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  onOverlayClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.classList.contains('modal-overlay')) {
      this.closeModal();
    }
  }

  calcOpen(): void {
    const totalQty = this.selectedRecord?.totalQty || 0;
    this.form.qtyOpen = Math.max(0, totalQty - this.totalShipped - Number(this.form.qtyShip || 0));
  }

  handleDocFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.docFile = input.files?.[0] || null;
  }

  handlePicFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.picFile = input.files?.[0] || null;
  }

  async submitShipment(): Promise<void> {
    if (!this.selectedRecord) return;

    const date = this.form.date?.trim();
    const truck = this.form.truck?.trim();
    const by = this.form.by?.trim();
    const qtyShip = Number(this.form.qtyShip || 0);

    if (!date || !truck || !by || !qtyShip) {
      alert('Please fill Date, Truck, QTY Shipping, and Shipped By.');
      return;
    }

    this.isSubmitting = true;

    try {
      let docUrl: string | null = null;
      let docName: string | null = null;
      let picUrl: string | null = null;
      let picName: string | null = null;

      // Upload files if provided
      if (this.docFile) {
        docName = this.docFile.name;
        try {
          const res = await firstValueFrom(this.shipmentService.uploadFile(this.docFile));
          docUrl = res.url;
        } catch {
          docUrl = URL.createObjectURL(this.docFile);
        }
      }

      if (this.picFile) {
        picName = this.picFile.name;
        try {
          const res = await firstValueFrom(this.shipmentService.uploadFile(this.picFile));
          picUrl = res.url;
        } catch {
          picUrl = URL.createObjectURL(this.picFile);
        }
      }

      // Save shipment to database
      await firstValueFrom(
        this.shipmentService.createShipment({
          productionOrderNumber: this.currentPO,
          shipmentNumber: truck,
          shipDate: date,
          qtyRequired: this.selectedRecord.totalQty,
          qtyShipped: qtyShip,
          qtyOpen: Math.max(0, this.selectedRecord.totalQty - this.totalShipped - qtyShip),
          shippedBy: by,
          docName,
          docUrl,
          picName,
          picUrl,
        })
      );

      // Refresh live list from database
      await this.loadShipments(this.currentPO);

      this.closeModal();
      this.showToast('Shipment saved to database successfully!');
    } catch (err) {
      console.error('Failed to save shipment:', err);
      this.showToast('Failed to record shipment. Please try again.');
    } finally {
      this.isSubmitting = false;
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'RECEIVED':
        return 'status-received';
      case 'PARTIALLY_RECEIVED':
        return 'status-partial';
      case 'PENDING_RECEIPT':
      default:
        return 'status-pending';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'RECEIVED':
        return 'Received';
      case 'PARTIALLY_RECEIVED':
        return 'Partially Received';
      case 'PENDING_RECEIPT':
      default:
        return 'In Transit';
    }
  }

  showToast(message: string): void {
    this.toastMessage = message;
    setTimeout(() => {
      this.toastMessage = '';
    }, 3500);
  }

  formatDate(date: string): string {
    if (!date) return '';
    const dt = new Date(`${date}T00:00:00`);
    return dt.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  formatIndex(index: number): string {
    return String(this.shipments.length - index).padStart(2, '0');
  }

  getProgress(item: ShipmentItem): number {
    if (!item.qtyReq) return 0;
    return Math.round((item.qtyShip / item.qtyReq) * 100);
  }
}