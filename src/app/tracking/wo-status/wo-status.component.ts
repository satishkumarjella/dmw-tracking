import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ConfigService } from '../../shared/config.service';
import { ModuleLoaderComponent } from '../../shared/components/module-loader/module-loader.component';

type StageState = 'done' | 'active' | 'pending';

interface WorkOrder {
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
  imports: [CommonModule, FormsModule, RouterModule, ModuleLoaderComponent]
})
export class WoStatusComponent implements OnInit, OnDestroy {
  isLoading = true;
  poInput = '';
  errorMessage = '';
  selectedWo: WorkOrder | null = null;

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

  readonly workOrders: WorkOrder[] = [
    {
      poNumber: '25280-A01-01',
      title: 'WO-1042',
      customer: 'Target',
      style: 'TSH-908',
      color: 'Navy Blue',
      factory: 'Hyderabad Unit 2',
      totalQty: 12000,
      inProcessQty: 3500,
      shippedQty: 5000,
      receivedQty: 2500,
      backOrderQty: 1000,
      deliveryDate: '2026-05-05',
      daysRemaining: 13,
      stages: {
        cutting: 'done',
        sewing: 'done',
        finishing: 'active',
        packing: 'pending',
        dispatch: 'pending'
      }
    }
  ];

  constructor(private configService: ConfigService) {}

  ngOnInit() {
    this.configService.applyModuleTheme('wo-status');
    setTimeout(() => {
      this.isLoading = false;
    }, 600);
  }

  ngOnDestroy() {
    this.configService.applyModuleTheme(null);
  }
  lookup(): void {
    const value = this.poInput.trim().toUpperCase();

    if (!value) {
      this.errorMessage = 'Please enter a PO number.';
      this.selectedWo = null;
      return;
    }

    const found = this.workOrders.find(
      wo => wo.poNumber.toUpperCase() === value || wo.title.toUpperCase() === value
    );

    if (!found) {
      this.errorMessage = 'No work order found for the entered PO number.';
      this.selectedWo = null;
      return;
    }

    this.errorMessage = '';
    this.selectedWo = found;
  }

  clearAll(): void {
    this.poInput = '';
    this.errorMessage = '';
    this.selectedWo = null;
  }

  get activeStageLabel(): string {
    if (!this.selectedWo) {
      return 'Active — In Production';
    }

    const activeStage = this.stageConfig.find(
      stage => this.selectedWo?.stages[stage.key] === 'active'
    );

    return activeStage
      ? `Active — In ${activeStage.label}`
      : 'Active — In Production';
  }

  get progressPercent(): number {
    if (!this.selectedWo || !this.selectedWo.totalQty) {
      return 0;
    }

    return Math.min(
      100,
      Math.round((this.selectedWo.receivedQty / this.selectedWo.totalQty) * 100)
    );
  }

  trackByStage(_: number, stage: StageConfig): string {
    return stage.key;
  }
}