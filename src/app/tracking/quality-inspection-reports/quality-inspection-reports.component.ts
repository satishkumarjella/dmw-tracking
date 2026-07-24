import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { ConfigService } from '../../shared/config.service';
import { ModuleLoaderComponent } from '../../shared/components/module-loader/module-loader.component';

interface ProductionRecord {
  po: string;
  mark: string;
  markDesc: string;
}

interface IssueItem {
  date: string;
  project: string;
  po: string;
  description: string;
  containment: string;
  preventative: string;
  impact: string;
  resolution: string;
  source: string;
  recordedBy: string;
  status: 'Open' | 'In Progress' | 'Closed';
}

@Component({
  selector: 'app-quality-inspection-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ModuleLoaderComponent],
  templateUrl: './quality-inspection-reports.component.html',
  styleUrls: ['./quality-inspection-reports.component.scss']
})
export class QualityInspectionReportsComponent implements OnInit, OnDestroy {
  isLoading = true;
  poInput = '';
  showError = false;

  activeView: 'gir' | 'issue' | 'paint' | 'specs' = 'gir';

  selectedRecord: ProductionRecord | null = null;
  issues: IssueItem[] = [];

  showFillModal = false;
  showIssueModal = false;
  toastMessage = '';

  girPdfUrl!: SafeResourceUrl;
  paintPdfUrl!: SafeResourceUrl;
  criticalSpecsImage = 'assets/images/critical-specs-placeholder.png';


  records: ProductionRecord[] = [
    {
      po: '25280-A01-01',
      mark: '36785-A01-01-01',
      markDesc: 'Conveyor Drive Assembly Section A01'
    }
  ];

  fillForm = {
    jobNo: '',
    wo: '',
    mark: '',
    status: 'OK',
    quantity: null as number | null,
    of: null as number | null,
    productType: '',
    instructions: '',
    inspectorName: '',
    date: ''
  };

  issueForm = {
    date: '',
    project: '',
    po: '',
    description: '',
    containment: '',
    preventative: '',
    impact: '',
    resolution: '',
    source: '',
    recordedBy: ''
  };

  constructor(private sanitizer: DomSanitizer, private configService: ConfigService) {}

  ngOnInit(): void {
    this.configService.applyModuleTheme('quality-inspection');
    setTimeout(() => {
      this.isLoading = false;
    }, 600);

    this.girPdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      'assets/sample/general-inspection-report.pdf'
    );

    this.paintPdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      'assets/sample/paint-specs.pdf'
    );
  }

  ngOnDestroy(): void {
    this.configService.applyModuleTheme(null);
  }

  lookup(): void {
    const value = this.poInput.trim().toUpperCase();
    const found = this.records.find(item => item.po === value);

    if (!found) {
      this.selectedRecord = null;
      this.showError = true;
      return;
    }

    this.showError = false;
    this.selectedRecord = found;
    this.activeView = 'gir';

    this.fillForm.jobNo = found.po.split('-')[0] || '';
    this.fillForm.wo = found.po.split('-')[1] || '';
    this.fillForm.mark = found.mark;
    this.fillForm.productType = found.markDesc;
    this.fillForm.date = this.today();

    this.issueForm.project = `PRJ-${found.po.split('-')[0] || ''}`;
    this.issueForm.po = found.po;
    this.issueForm.date = this.today();
  }

  clearAll(): void {
    this.poInput = '';
    this.showError = false;
    this.selectedRecord = null;
    this.activeView = 'gir';
  }

  setActiveView(view: 'gir' | 'issue' | 'paint' | 'specs'): void {
    this.activeView = view;
  }

  openFillModal(): void {
    this.showFillModal = true;
  }

  closeFillModal(): void {
    this.showFillModal = false;
  }

  closeFillModalByOverlay(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.closeFillModal();
    }
  }

  submitFill(): void {
    this.closeFillModal();
    this.showToast('Inspection form submitted successfully');
  }

  openIssueModal(): void {
    this.showIssueModal = true;
  }

  closeIssueModal(): void {
    this.showIssueModal = false;
  }

  closeIssueModalByOverlay(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.closeIssueModal();
    }
  }

  submitIssue(): void {
    if (!this.issueForm.description?.trim() || !this.issueForm.recordedBy?.trim()) {
      alert('Please fill Issue Description and Recorded By at minimum.');
      return;
    }

    const issue: IssueItem = {
      date: this.issueForm.date,
      project: this.issueForm.project,
      po: this.issueForm.po,
      description: this.issueForm.description,
      containment: this.issueForm.containment,
      preventative: this.issueForm.preventative,
      impact: this.issueForm.impact,
      resolution: this.issueForm.resolution,
      source: this.issueForm.source,
      recordedBy: this.issueForm.recordedBy,
      status: 'Open'
    };

    this.issues = [issue, ...this.issues];
    this.resetIssueForm();
    this.closeIssueModal();
    this.showToast('Issue logged successfully');
  }

  handleUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      this.showToast(`File "${file.name}" uploaded successfully`);
    }
  }

  statusClass(status: string): string {
    switch (status) {
      case 'Open':
        return 'sp-open';
      case 'In Progress':
        return 'sp-progress';
      case 'Closed':
        return 'sp-closed';
      default:
        return 'sp-open';
    }
  }

  private resetIssueForm(): void {
    this.issueForm = {
      date: this.today(),
      project: this.selectedRecord ? `PRJ-${this.selectedRecord.po.split('-')[0]}` : '',
      po: this.selectedRecord?.po || '',
      description: '',
      containment: '',
      preventative: '',
      impact: '',
      resolution: '',
      source: '',
      recordedBy: ''
    };
  }

  private showToast(message: string): void {
    this.toastMessage = message;
    setTimeout(() => {
      this.toastMessage = '';
    }, 3500);
  }

  private today(): string {
    return new Date().toISOString().split('T')[0];
  }

  
}