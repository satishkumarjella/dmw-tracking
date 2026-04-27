import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-abm-components-status',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './abm-components-status.component.html',
  styleUrls: ['./abm-components-status.component.scss']
})
export class AbmComponentsStatusComponent implements OnInit, OnDestroy {
  currentYear: number = new Date().getFullYear();

  poInput: string = '';
  hasError: boolean = false;
  showResult: boolean = false;

  poData: any = null;
  totReq: number = 0;
  totRcv: number = 0;
  totOpen: number = 0;

  private DB: any = {
    '25280-A01-01': {
      mark: '36785-A01-01-01',
      markDesc: 'Conveyor Drive Assembly — Section A01',
      abms: [
        { id: 'ABM 1', desc: 'Gear', descSub: 'Helical Drive Gear — 12T', reqQty: 10, po: '46001', rcv: 5 },
        { id: 'ABM 2', desc: 'Motor', descSub: '3HP AC Motor — 460V 60Hz', reqQty: 20, po: '46002', rcv: 10 },
        { id: 'ABM 3', desc: 'Drive', descSub: 'Variable Frequency Drive', reqQty: 25, po: '46003', rcv: 20 }
      ]
    }
  };

  ngOnInit() {}

  ngOnDestroy() {}

  lookup(): void {
    const raw = this.poInput.trim().toUpperCase();

    this.hasError = false;
    this.showResult = false;
    this.poData = null;
    this.totReq = 0;
    this.totRcv = 0;
    this.totOpen = 0;

    if (!raw) {
      this.hasError = true;
      return;
    }

    const rec = this.DB[raw];

    if (!rec) {
      this.hasError = true;
      return;
    }

    this.poData = {
      po: raw,
      ...rec
    };

    this.totReq = rec.abms.reduce((sum: number, item: any) => sum + item.reqQty, 0);
    this.totRcv = rec.abms.reduce((sum: number, item: any) => sum + item.rcv, 0);
    this.totOpen = rec.abms.reduce((sum: number, item: any) => sum + (item.reqQty - item.rcv), 0);

    this.showResult = true;

    setTimeout(() => {
      const el = document.getElementById('resultPanel');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  }

  clearAll(): void {
    this.poInput = '';
    this.hasError = false;
    this.showResult = false;
    this.poData = null;
    this.totReq = 0;
    this.totRcv = 0;
    this.totOpen = 0;
  }

  getPct(rcv: number, req: number): number {
    if (!req) return 0;
    return Math.round((rcv / req) * 100);
  }
}