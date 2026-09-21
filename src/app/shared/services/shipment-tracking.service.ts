import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PoDetails {
  id?: string;
  productionOrderNumber: string;
  purchasingDocument?: string;
  markNumber?: string;
  description?: string;
  quantity: number;
  customer?: string;
  customerName?: string;
  deliveryDate?: string;
}

export interface ShipmentItem {
  id: string;
  tenantId?: string;
  productionOrderNumber: string;
  purchaseOrderId?: string;
  shipmentNumber: string;
  shipDate: string;
  qtyRequired: number;
  qtyShipped: number;
  qtyReceived: number;
  qtyOpen: number;
  shippedBy: string;
  carrier?: string;
  status: string; // 'PENDING_RECEIPT' | 'PARTIALLY_RECEIVED' | 'RECEIVED'
  docName?: string | null;
  docUrl?: string | null;
  picName?: string | null;
  picUrl?: string | null;
  notes?: string | null;
  createdAt?: string;
}

export interface ReceiptItem {
  id: string;
  tenantId?: string;
  productionOrderNumber: string;
  purchaseOrderId?: string;
  shipmentId?: string | null;
  receiptDate: string;
  truck: string;
  qtyRequired: number;
  qtyShipped: number;
  qtyReceived: number;
  qtyOpen: number;
  receivedBy: string;
  notes?: string | null;
  docName?: string | null;
  docUrl?: string | null;
  picName?: string | null;
  picUrl?: string | null;
  status: string;
  createdAt?: string;
}

export interface WoStatusSummary {
  poNumber: string;
  poDetails: PoDetails | null;
  totalRequiredQty: number;
  totalShippedQty: number;
  totalReceivedQty: number;
  inTransitQty: number;
  backOrderQty: number;
  shipmentsCount: number;
  receiptsCount: number;
  shipments: ShipmentItem[];
  receipts: ReceiptItem[];
}

@Injectable({
  providedIn: 'root'
})
export class ShipmentTrackingService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Helper to format file URLs (handles backend static /uploads or absolute URLs)
   */
  getFileUrl(url: string | null | undefined): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
      return url;
    }
    return `${this.apiUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  }

  /**
   * Lookup PO details by production order number
   */
  getPoDetails(poNumber: string): Observable<PoDetails | null> {
    return this.http.get<PoDetails | null>(`${this.apiUrl}/purchase-orders/by-po/${encodeURIComponent(poNumber.trim())}`);
  }

  /**
   * Fetch all shipments for a specific PO
   */
  getShipments(poNumber: string): Observable<ShipmentItem[]> {
    const query = poNumber ? `?po=${encodeURIComponent(poNumber.trim())}` : '';
    return this.http.get<ShipmentItem[]>(`${this.apiUrl}/shipments${query}`);
  }

  /**
   * Create a new shipment in the database
   */
  createShipment(shipmentData: {
    productionOrderNumber: string;
    shipmentNumber: string;
    shipDate: string;
    qtyRequired?: number;
    qtyShipped: number;
    qtyOpen?: number;
    shippedBy: string;
    carrier?: string;
    docName?: string | null;
    docUrl?: string | null;
    picName?: string | null;
    picUrl?: string | null;
    notes?: string | null;
  }): Observable<ShipmentItem> {
    return this.http.post<ShipmentItem>(`${this.apiUrl}/shipments`, shipmentData);
  }

  /**
   * Fetch all receipts for a specific PO
   */
  getReceipts(poNumber: string): Observable<ReceiptItem[]> {
    return this.http.get<ReceiptItem[]>(`${this.apiUrl}/receipts?po=${encodeURIComponent(poNumber.trim())}`);
  }

  /**
   * Confirm receipt of a shipment / log inbound receipt
   */
  confirmReceipt(receiptData: {
    shipmentId?: string | null;
    productionOrderNumber: string;
    receiptDate: string;
    truck: string;
    qtyRequired?: number;
    qtyShipped?: number;
    qtyReceived: number;
    qtyOpen?: number;
    receivedBy: string;
    notes?: string | null;
    docName?: string | null;
    docUrl?: string | null;
    picName?: string | null;
    picUrl?: string | null;
  }): Observable<ReceiptItem> {
    return this.http.post<ReceiptItem>(`${this.apiUrl}/receipts`, receiptData);
  }

  /**
   * Get consolidated status summary for Work Order Status component
   */
  getWoStatusSummary(poNumber: string): Observable<WoStatusSummary> {
    return this.http.get<WoStatusSummary>(`${this.apiUrl}/shipments/summary/${encodeURIComponent(poNumber.trim())}`);
  }

  /**
   * Upload shipment or receipt doc/photo
   */
  uploadFile(file: File): Observable<{ filename: string; originalName: string; url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ filename: string; originalName: string; url: string }>(
      `${this.apiUrl}/shipments/upload`,
      formData
    );
  }
}
