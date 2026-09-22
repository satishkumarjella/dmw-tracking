import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ConfigService } from '../../shared/config.service';
import { ExcelExportService } from '../../shared/services/excel-export.service';
import { ModuleLoaderComponent } from '../../shared/components/module-loader/module-loader.component';
import { SharedTableComponent, TableColumn } from '../../shared/components/shared-table/shared-table.component';
import { ShipmentTrackingService, ShipmentItem, ReceiptItem } from '../../shared/services/shipment-tracking.service';
import { firstValueFrom } from 'rxjs';

export interface ReceiptEntry {
  id?: string;
  shipmentId?: string | null;
  date: string;
  truck: string;
  po: string;
  qtyReq: number;
  qtyShipped?: number;
  qtyRcv: number;
  qtyOpen: number;
  by: string;
  notes?: string | null;
  docName?: string | null;
  docUrl?: string | null;
  picName?: string | null;
  picUrl?: string | null;
}

@Component({
  selector: 'app-receiving',
  standalone: true,
  templateUrl: './receiving.component.html',
  styleUrls: ['./receiving.component.scss'],
  imports: [CommonModule, FormsModule, RouterModule, ModuleLoaderComponent, SharedTableComponent]
})
export class ReceivingComponent implements OnInit, OnDestroy {
  isLoading = true;
  isSubmitting = false;
  poInput = '';
  errorMessage = '';
  showError = false;

  showResultPanel = false;
  isModalOpen = false;
  toastMessage = '';

  currentPo = '';
  currentTotalQty = 0;
  poMark = '';
  poDesc = '';

  pendingShipments: ShipmentItem[] = [];
  receipts: ReceiptEntry[] = [];
  selectedShipment: ShipmentItem | null = null;
  quickFilterText = '';

  // Removed local pagination state since shared-table handles it

  today: string = new Date().toISOString().split('T')[0];

  tableColumns: TableColumn[] = [
    { key: 'index', label: '#', type: 'custom' },
    { key: 'date', label: 'Date Received', type: 'date', sortable: true },
    { key: 'truck', label: 'Truck / Shipment #', type: 'custom', sortable: true },
    { key: 'po', label: 'PO #', sortable: true },
    { key: 'qtyReq', label: 'QTY Required', type: 'custom', sortable: true },
    { key: 'qtyRcv', label: 'QTY Received', type: 'custom', sortable: true },
    { key: 'qtyOpen', label: 'QTY Open', type: 'custom', sortable: true },
    { key: 'by', label: 'Received By', type: 'custom', sortable: true },
    { key: 'docs', label: 'Receipt Docs', type: 'custom' },
    { key: 'picture', label: 'Picture', type: 'custom' }
  ];

  pendingTableColumns: TableColumn[] = [
    { key: 'shipmentNumber', label: 'Shipment #', type: 'custom', sortable: true },
    { key: 'shipDate', label: 'Date Shipped', type: 'date', sortable: true },
    { key: 'qtyShipped', label: 'QTY Shipped', type: 'text', sortable: true },
    { key: 'pendingQty', label: 'Pending Receipt', type: 'custom', sortable: false },
    { key: 'status', label: 'Status', type: 'custom', sortable: true },
    { key: 'action', label: 'Action', type: 'custom' }
  ];

  form = {
    shipmentId: '' as string | null,
    date: '',
    truck: '',
    po: '',
    by: '',
    qtyReq: 0,
    qtyShipped: 0,
    qtyRcv: 0,
    qtyOpen: 0,
    notes: '',
    docFile: null as File | null,
    picFile: null as File | null,
    docName: '',
    picName: '',
    docUrl: '',
    picUrl: ''
  };

  constructor(
    private configService: ConfigService,
    private excelExportService: ExcelExportService,
    private shipmentService: ShipmentTrackingService,
    private route: ActivatedRoute,
    public router: Router
  ) {}

  ngOnInit() {
    this.configService.applyModuleTheme('receiving');
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
    const raw = this.poInput.trim().toUpperCase();
    if (!raw) {
      this.showErrorMessage('Please enter or scan a Production Order number.');
      return;
    }

    this.currentPo = raw;
    this.showError = false;
    this.errorMessage = '';

    try {
      // 1. Fetch PO details from backend
      const po = await firstValueFrom(this.shipmentService.getPoDetails(raw)).catch(() => null);
      if (po && (po.productionOrderNumber || po.quantity)) {
        this.currentTotalQty = Number(po.quantity) || 0;
        this.poMark = po.markNumber || 'Mark N/A';
        this.poDesc = po.description || po.customerName || 'Production Order';
      } else {
        this.showError = true;
        this.showResultPanel = false;
        return;
      }

      this.showResultPanel = true;

      // 2. Fetch shipments and receipts for this PO from database
      await Promise.all([
        this.loadShipments(this.currentPo),
        this.loadReceipts(this.currentPo)
      ]);
    } catch (err) {
      console.error('Error during receiving lookup:', err);
      this.showResultPanel = true;
    }
  }

  async loadShipments(poNumber: string): Promise<void> {
    try {
      const items = await firstValueFrom(this.shipmentService.getShipments(poNumber));
      // Filter out shipments that are already fully received
      this.pendingShipments = (items || []).filter(s => s.status !== 'RECEIVED' && (s.qtyShipped > (s.qtyReceived || 0)));
    } catch (err) {
      console.error('Failed to load shipments for receiving:', err);
      this.pendingShipments = [];
    }
  }

  async loadReceipts(poNumber: string): Promise<void> {
    try {
      const apiReceipts = await firstValueFrom(this.shipmentService.getReceipts(poNumber));
      if (apiReceipts && apiReceipts.length > 0) {
        this.receipts = apiReceipts.map(r => ({
          id: r.id,
          shipmentId: r.shipmentId,
          date: r.receiptDate,
          truck: r.truck,
          po: r.productionOrderNumber,
          qtyReq: r.qtyRequired,
          qtyShipped: r.qtyShipped,
          qtyRcv: r.qtyReceived,
          qtyOpen: r.qtyOpen,
          by: r.receivedBy,
          notes: r.notes,
          docName: r.docName || undefined,
          docUrl: r.docUrl ? this.shipmentService.getFileUrl(r.docUrl) : undefined,
          picName: r.picName || undefined,
          picUrl: r.picUrl ? this.shipmentService.getFileUrl(r.picUrl) : undefined,
        }));
      } else {
        this.receipts = [];
      }
    } catch (err) {
      console.error('Failed to load receipts:', err);
    }
  }

  /**
   * Action when user clicks "Confirm Receipt" directly on a shipped item
   */
  confirmShipment(shipment: ShipmentItem): void {
    this.selectedShipment = shipment;
    const pendingToReceive = Math.max(0, shipment.qtyShipped - (shipment.qtyReceived || 0));

    this.form = {
      shipmentId: shipment.id,
      date: this.today,
      truck: shipment.shipmentNumber,
      po: shipment.productionOrderNumber || this.currentPo,
      by: '',
      qtyReq: shipment.qtyRequired || this.currentTotalQty,
      qtyShipped: shipment.qtyShipped,
      qtyRcv: pendingToReceive,
      qtyOpen: Math.max(0, (shipment.qtyRequired || this.currentTotalQty) - (this.totalReceived + pendingToReceive)),
      notes: '',
      docFile: null,
      picFile: null,
      docName: '',
      picName: '',
      docUrl: '',
      picUrl: ''
    };

    this.isModalOpen = true;
  }

  openModal(): void {
    // If shipments exist with pending qty, select the first pending one by default
    const firstPending = this.pendingShipments.find(s => (s.qtyShipped - (s.qtyReceived || 0)) > 0);
    if (firstPending) {
      this.confirmShipment(firstPending);
      return;
    }

    this.selectedShipment = null;
    this.form = {
      shipmentId: null,
      date: this.today,
      truck: '',
      po: this.currentPo,
      by: '',
      qtyReq: this.currentTotalQty,
      qtyShipped: 0,
      qtyRcv: Math.max(0, this.currentTotalQty - this.totalReceived),
      qtyOpen: 0,
      notes: '',
      docFile: null,
      picFile: null,
      docName: '',
      picName: '',
      docUrl: '',
      picUrl: ''
    };
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedShipment = null;
  }

  calcOpen(): void {
    const received = Number(this.form.qtyRcv) || 0;
    const newTotalReceived = this.totalReceived + received;
    this.form.qtyOpen = Math.max(0, this.currentTotalQty - newTotalReceived);
  }

  onShipmentSelectChange(shipmentId: string): void {
    if (!shipmentId) {
      this.selectedShipment = null;
      return;
    }
    const found = this.pendingShipments.find(s => s.id === shipmentId);
    if (found) {
      this.selectedShipment = found;
      this.form.shipmentId = found.id;
      this.form.truck = found.shipmentNumber;
      this.form.qtyShipped = found.qtyShipped;
      const pending = Math.max(0, found.qtyShipped - (found.qtyReceived || 0));
      this.form.qtyRcv = pending;
      this.calcOpen();
    }
  }

  onFileChange(event: Event, type: 'doc' | 'pic'): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (type === 'doc') {
      this.form.docFile = file;
      this.form.docName = file.name;
      this.form.docUrl = URL.createObjectURL(file);
    } else {
      this.form.picFile = file;
      this.form.picName = file.name;
      this.form.picUrl = URL.createObjectURL(file);
    }
  }

  async submitReceipt(): Promise<void> {
    if (!this.form.date || !this.form.truck.trim() || !this.form.by.trim() || !this.form.qtyRcv) {
      this.showToast('Please fill Date, Truck #, Received QTY, and Received By.');
      return;
    }

    this.isSubmitting = true;

    try {
      let docUrl: string | null = null;
      let docName: string | null = null;
      let picUrl: string | null = null;
      let picName: string | null = null;

      // Upload documents if selected
      if (this.form.docFile) {
        docName = this.form.docFile.name;
        try {
          const res = await firstValueFrom(this.shipmentService.uploadFile(this.form.docFile));
          docUrl = res.url;
        } catch {
          docUrl = this.form.docUrl;
        }
      }

      if (this.form.picFile) {
        picName = this.form.picFile.name;
        try {
          const res = await firstValueFrom(this.shipmentService.uploadFile(this.form.picFile));
          picUrl = res.url;
        } catch {
          picUrl = this.form.picUrl;
        }
      }

      // Call backend to confirm receipt and update database
      await firstValueFrom(
        this.shipmentService.confirmReceipt({
          shipmentId: this.form.shipmentId || undefined,
          productionOrderNumber: this.currentPo,
          receiptDate: this.form.date,
          truck: this.form.truck.trim(),
          qtyRequired: this.currentTotalQty,
          qtyShipped: this.form.qtyShipped || undefined,
          qtyReceived: Number(this.form.qtyRcv),
          qtyOpen: this.form.qtyOpen,
          receivedBy: this.form.by.trim(),
          notes: this.form.notes || null,
          docName,
          docUrl,
          picName,
          picUrl,
        })
      );

      // Reload both shipments (with updated status) and receipts from database
      await Promise.all([
        this.loadShipments(this.currentPo),
        this.loadReceipts(this.currentPo)
      ]);

      this.closeModal();
      this.showToast('Inbound receipt confirmed and recorded in database!');
    } catch (err) {
      console.error('Failed to confirm receipt:', err);
      this.showToast('Failed to confirm receipt. Please check details and try again.');
    } finally {
      this.isSubmitting = false;
    }
  }

  get totalShipped(): number {
    return this.pendingShipments.reduce((sum, s) => sum + (Number(s.qtyShipped) || 0), 0);
  }

  get totalReceived(): number {
    return this.receipts.reduce((sum, item) => sum + (Number(item.qtyRcv) || 0), 0);
  }

  get totalPendingInTransit(): number {
    return Math.max(0, this.totalShipped - this.totalReceived);
  }

  get totalOpen(): number {
    return Math.max(0, this.currentTotalQty - this.totalReceived);
  }

  getPendingQtyForShipment(s: ShipmentItem): number {
    return Math.max(0, (s.qtyShipped || 0) - (s.qtyReceived || 0));
  }

  getShipmentBadgeClass(status: string): string {
    switch (status) {
      case 'RECEIVED':
        return 'badge-received';
      case 'PARTIALLY_RECEIVED':
        return 'badge-partial';
      case 'PENDING_RECEIPT':
      default:
        return 'badge-pending';
    }
  }

  getShipmentBadgeLabel(status: string): string {
    switch (status) {
      case 'RECEIVED':
        return 'Confirmed Received';
      case 'PARTIALLY_RECEIVED':
        return 'Partially Received';
      case 'PENDING_RECEIPT':
      default:
        return 'Awaiting Confirmation';
    }
  }

  // -------------------------------------------------------------
  // Sorting & Pagination logic is now handled by SharedTableComponent
  // -------------------------------------------------------------

  clearFilter(): void {
    this.quickFilterText = '';
  }

  async exportToExcel(): Promise<void> {
    if (this.receipts.length === 0) {
      this.showToast('No receipt records to export.');
      return;
    }

    this.showToast('Generating Excel (.xlsx) file...');
    try {
      await this.excelExportService.exportToExcel({
        fileName: `Inbound_Receipts_${this.currentPo || 'Export'}_${new Date().toISOString().split('T')[0]}`,
        sheetName: 'Receipts',
        title: `INBOUND RECEIPT REGISTER — PO: ${this.currentPo || 'ALL'}`,
        subtitle: `Generated on ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} | Total Records: ${this.receipts.length}`,
        columns: [
          { header: '#', key: 'index', width: 8, alignment: 'center' },
          { header: 'Date Received', key: 'dateFormatted', width: 16, alignment: 'center' },
          { header: 'Truck / Shipment #', key: 'truck', width: 22, alignment: 'left' },
          { header: 'Production Order #', key: 'po', width: 20, alignment: 'left' },
          { header: 'QTY Required', key: 'qtyReq', width: 16, alignment: 'right', numFmt: '#,##0' },
          { header: 'QTY Received', key: 'qtyRcv', width: 16, alignment: 'right', numFmt: '#,##0' },
          { header: 'QTY Open', key: 'qtyOpen', width: 16, alignment: 'right', numFmt: '#,##0' },
          { header: 'Received By', key: 'by', width: 20, alignment: 'left' },
          { header: 'Notes', key: 'notes', width: 25, alignment: 'left' },
          { header: 'Receipt Docs', key: 'docName', width: 22, alignment: 'left' },
          { header: 'Picture', key: 'picName', width: 22, alignment: 'left' }
        ],
        data: this.receipts.map((r, i) => ({
          index: i + 1,
          dateFormatted: this.fmtDate(r.date),
          truck: r.truck,
          po: r.po,
          qtyReq: r.qtyReq,
          qtyRcv: r.qtyRcv,
          qtyOpen: r.qtyOpen,
          by: r.by,
          notes: r.notes || '—',
          docName: r.docName || '—',
          picName: r.picName || '—'
        }))
      });
      this.showToast('Excel file downloaded successfully!');
    } catch (err) {
      console.error('Export to Excel failed:', err);
      this.showToast('Failed to generate Excel file.');
    }
  }

  clearSearch(): void {
    this.poInput = '';
    this.showResultPanel = false;
    this.showError = false;
    this.errorMessage = '';
    this.currentPo = '';
    this.currentTotalQty = 0;
    this.pendingShipments = [];
    this.receipts = [];
  }

  showErrorMessage(message: string): void {
    this.errorMessage = message;
    this.showError = true;
  }

  getProgressPercent(row: ReceiptEntry): number {
    if (!row.qtyReq) return 0;
    return Math.min(100, Math.round((row.qtyRcv / row.qtyReq) * 100));
  }

  fmtDate(date: string): string {
    if (!date) return '—';
    return new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  showToast(message: string): void {
    this.toastMessage = `✓ ${message}`;
    setTimeout(() => {
      this.toastMessage = '';
    }, 3500);
  }
}