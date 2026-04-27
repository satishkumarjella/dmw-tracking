import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from 'src/app/shared/header/header.component';
import { IonHeader, IonContent } from '@ionic/angular/standalone';

interface ReceiptEntry {
  date: string;
  truck: string;
  po: string;
  qtyReq: number;
  qtyRcv: number;
  qtyOpen: number;
  by: string;
  docName?: string;
  docUrl?: string;
  picName?: string;
  picUrl?: string;
}

@Component({
  selector: 'app-receiving',
  standalone: true,
  imports: [IonHeader, CommonModule, FormsModule, RouterModule, HeaderComponent, IonContent],
  templateUrl: './receiving.component.html',
  styleUrls: ['./receiving.component.scss']
})
export class ReceivingComponent {
  poInput = '';
  errorMessage = '';
  showError = false;

  showResultPanel = false;
  isModalOpen = false;
  toastMessage = '';

  currentPo = '';
  currentTotalQty = 0;

  receipts: ReceiptEntry[] = [];

  today: string = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format for date input

  form = {
    date: '',
    truck: '',
    po: '',
    by: '',
    qtyReq: 0,
    qtyRcv: 0,
    qtyOpen: 0,
    docFile: null as File | null,
    picFile: null as File | null,
    docName: '',
    picName: '',
    docUrl: '',
    picUrl: ''
  };

  lookup(): void {
    if (!this.poInput.trim()) {
      this.showErrorMessage('Please enter or scan a Production Order number.');
      return;
    }

    this.currentPo = this.poInput.trim();
    this.currentTotalQty = 120;
    this.showResultPanel = true;
    this.showError = false;
  }

  clearSearch(): void {
    this.poInput = '';
    this.showResultPanel = false;
    this.showError = false;
    this.errorMessage = '';
    this.currentPo = '';
    this.currentTotalQty = 0;
    this.receipts = [];
  }

  showErrorMessage(message: string): void {
    this.errorMessage = message;
    this.showError = true;
  }

  openModal(): void {
    this.form = {
      date: '',
      truck: '',
      po: this.currentPo,
      by: '',
      qtyReq: this.currentTotalQty,
      qtyRcv: 0,
      qtyOpen: this.currentTotalQty,
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
  }

  calcOpen(): void {
    const received = Number(this.form.qtyRcv) || 0;
    const required = Number(this.form.qtyReq) || 0;
    this.form.qtyOpen = Math.max(0, required - received);
  }

  onFileChange(event: Event, type: 'doc' | 'pic'): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    const url = URL.createObjectURL(file);

    if (type === 'doc') {
      this.form.docFile = file;
      this.form.docName = file.name;
      this.form.docUrl = url;
    } else {
      this.form.picFile = file;
      this.form.picName = file.name;
      this.form.picUrl = url;
    }
  }

  submitReceipt(): void {
    if (!this.form.date || !this.form.truck.trim() || !this.form.by.trim()) {
      this.showToast('Please complete all required fields.');
      return;
    }

    const entry: ReceiptEntry = {
      date: this.form.date,
      truck: this.form.truck.trim(),
      po: this.form.po,
      qtyReq: this.form.qtyReq,
      qtyRcv: Number(this.form.qtyRcv) || 0,
      qtyOpen: this.form.qtyOpen,
      by: this.form.by.trim(),
      docName: this.form.docName,
      docUrl: this.form.docUrl,
      picName: this.form.picName,
      picUrl: this.form.picUrl
    };

    this.receipts = [entry, ...this.receipts];
    this.closeModal();
    this.showToast('Receipt submitted successfully.');
  }

  get totalReceived(): number {
    return this.receipts.reduce((sum, item) => sum + item.qtyRcv, 0);
  }

  get totalOpen(): number {
    return Math.max(0, this.currentTotalQty - this.totalReceived);
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