import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ConfigService } from '../../shared/config.service';
import { ModuleLoaderComponent } from '../../shared/components/module-loader/module-loader.component';

interface ShippingRecord {
  mark: string;
  markDesc: string;
  totalQty: number;
}

interface ShipmentItem {
  id: number;
  date: string;
  truck: string;
  po: string;
  qtyReq: number;
  qtyShip: number;
  qtyOpen: number;
  by: string;
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
  imports: [CommonModule, FormsModule, RouterModule, ModuleLoaderComponent]
})
export class ShippingComponent implements OnInit, OnDestroy {
  isLoading = true;
  currentYear = new Date().getFullYear();

  poInput = '';
  showError = false;

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

  DB: Record<string, ShippingRecord> = {
    '25280-A01-01': {
      mark: '36785-A01-01-01',
      markDesc: 'Conveyor Drive Assembly Section A01',
      totalQty: 48
    }
  };

  constructor(private configService: ConfigService) {}

  ngOnInit(): void {
    this.configService.applyModuleTheme('shipping');
    setTimeout(() => {
      this.isLoading = false;
    }, 600);
  }

  ngOnDestroy(): void {
    this.configService.applyModuleTheme(null);
    this.shipments.forEach(item => {
      if (item.docUrl) URL.revokeObjectURL(item.docUrl);
      if (item.picUrl) URL.revokeObjectURL(item.picUrl);
    });
  }

  get totalShipped(): number {
    return this.shipments.reduce((sum, item) => sum + item.qtyShip, 0);
  }

  get totalOpen(): number {
    return Math.max(0, (this.selectedRecord?.totalQty || 0) - this.totalShipped);
  }

  lookup(): void {
    const raw = this.poInput.trim().toUpperCase();
    this.showError = false;
    this.selectedRecord = null;

    const rec = this.DB[raw];
    if (!rec) {
      this.showError = true;
      return;
    }

    this.currentPO = raw;
    this.selectedRecord = rec;
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
      qtyOpen: this.selectedRecord.totalQty - this.totalShipped
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

  submitShipment(): void {
    if (!this.selectedRecord) return;

    const date = this.form.date?.trim();
    const truck = this.form.truck?.trim();
    const by = this.form.by?.trim();
    const qtyShip = Number(this.form.qtyShip || 0);

    if (!date || !truck || !by || !qtyShip) {
      alert('Please fill Date, Truck, QTY Shipping, and Shipped By.');
      return;
    }

    const docUrl = this.docFile ? URL.createObjectURL(this.docFile) : null;
    const picUrl = this.picFile ? URL.createObjectURL(this.picFile) : null;

    const item: ShipmentItem = {
      id: Date.now(),
      date,
      truck,
      po: this.currentPO,
      qtyReq: this.selectedRecord.totalQty,
      qtyShip,
      qtyOpen: Math.max(0, this.selectedRecord.totalQty - this.totalShipped - qtyShip),
      by,
      docName: this.docFile ? this.docFile.name : null,
      docUrl,
      picName: this.picFile ? this.picFile.name : null,
      picUrl
    };

    this.shipments.unshift(item);
    this.closeModal();
    this.showToast('Shipment recorded successfully!');
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