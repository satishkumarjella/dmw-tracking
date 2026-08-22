import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject, Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { ConfigService } from '../../shared/config.service';
import { ModuleLoaderComponent } from '../../shared/components/module-loader/module-loader.component';
import { environment } from '../../../environments/environment';

export interface ProductionRecord {
  id?: string;
  productionOrderNumber: string;
  projectDef?: string;
  wbsElement?: string;
  markNumber?: string;
  material?: string;
  description?: string;
  shortText?: string;
  quantity?: number;
  orderQuantity?: number;
  fabricatorName?: string;
  supplierPlant?: string;
  requiredBy?: string;
  deliveryDate?: string;
  shipNotes?: string;
  notes?: string;
  materialPoText?: string;
  revisionNo?: string;
  revisionDate?: string;
}

interface IssueItem {
  id?: string;
  date: string;
  projectNumber: string;
  productionOrderNumber: string;
  description: string;
  containment: string;
  preventativeAction: string;
  impact: string;
  resolution: string;
  sourceOfNonConformance: string;
  recordedBy: string;
}

import { FormBuilderService, FormTemplate } from '../../pages/form-builder/form-builder.service';

@Component({
  selector: 'app-quality-inspection-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ModuleLoaderComponent],
  templateUrl: './quality-inspection-reports.component.html',
  styleUrls: ['./quality-inspection-reports.component.scss']
})
export class QualityInspectionReportsComponent implements OnInit, OnDestroy {
  isLoading = true;
  poInput = ''; // Injected by dashboard.component.ts
  showError = false;

  templates: FormTemplate[] = [];
  selectedTemplate: FormTemplate | null = null;
  dynamicFormData: any = {};

  activeView: 'gir' | 'issue' | 'paint' | 'specs' = 'gir';

  selectedRecord: ProductionRecord | null = null;
  issues: IssueItem[] = [];

  showFillModal = false;
  showIssueModal = false;
  toastMessage = '';
  
  isAdmin = true; // Mock admin check for now
  isEditMode = false;
  editingIssueId: string | null = null;

  girPdfUrl!: SafeResourceUrl;
  paintPdfUrl!: SafeResourceUrl;
  criticalSpecsImage = 'assets/images/critical-specs-placeholder.png';

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
    projectNumber: '',
    productionOrderNumber: '',
    description: '',
    containment: '',
    preventativeAction: '',
    impact: '',
    resolution: '',
    sourceOfNonConformance: '',
    recordedBy: ''
  };

  constructor(
    private configService: ConfigService,
    private sanitizer: DomSanitizer,
    private http: HttpClient,
    private fbService: FormBuilderService
  ) {}

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
    this.fetchTemplates();
  }

  fetchTemplates() {
    this.http.get<FormTemplate[]>(`${environment.apiUrl}/form-templates`).subscribe(res => {
      this.templates = res;
      if (this.templates.length > 0) {
        this.selectTemplate(this.templates[0]);
      }
    });
  }

  selectTemplate(template: FormTemplate) {
    this.selectedTemplate = template;
    this.dynamicFormData = {};
    if (template.schema) {
      template.schema.forEach((section: any) => {
        if (section.fields) {
          section.fields.forEach((field: any) => {
            this.dynamicFormData[field.id] = field.type === 'checkbox' ? false : '';
          });
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.configService.applyModuleTheme(null);
  }

  // Called automatically by dashboard.component.ts when the global search triggers
  lookup(): void {
    if (!this.poInput || !this.poInput.trim()) return;
    
    // We fetch from the search endpoint and pick the closest match
    this.http.get<ProductionRecord[]>(`${environment.apiUrl}/purchase-orders/search?q=${this.poInput.trim()}`)
      .subscribe({
        next: (results) => {
          if (results && results.length > 0) {
            this.selectRecord(results[0]);
          } else {
            this.selectedRecord = null;
            this.showError = true;
          }
        },
        error: () => {
          this.selectedRecord = null;
          this.showError = true;
        }
      });
  }

  selectRecord(record: ProductionRecord): void {
    this.selectedRecord = record;
    this.showError = false;
    this.activeView = 'gir';

    // Populate fill form
    this.fillForm.jobNo = record.projectDef || record.productionOrderNumber?.split('-')[0] || '';
    this.fillForm.wo = record.productionOrderNumber;
    this.fillForm.mark = record.markNumber || record.material || '';
    this.fillForm.productType = record.description || record.shortText || '';
    this.fillForm.date = this.today();

    // Populate issue form
    this.issueForm.projectNumber = record.projectDef || '';
    this.issueForm.productionOrderNumber = record.productionOrderNumber;
    this.issueForm.date = this.today();

    // Fetch existing issues
    if (record.id) {
      this.http.get<IssueItem[]>(`${environment.apiUrl}/issues?purchaseOrderId=${record.id}`)
        .subscribe({
          next: (res) => this.issues = res || [],
          error: (err) => console.error('Error fetching issues:', err)
        });
    }
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

  submitFillForm(): void {
    if (!this.selectedTemplate) {
      alert('Please select a template');
      return;
    }
    
    // Simulate submission to backend
    console.log('Submitting Dynamic Form:', {
      templateId: this.selectedTemplate.id,
      data: this.dynamicFormData
    });
    alert('Inspection Log submitted successfully using template: ' + this.selectedTemplate.name);
    this.closeFillModal();
  }

  downloadFilledPdf(): void {
    if (!this.selectedTemplate || !this.selectedTemplate.id) {
      alert('Please fill out and submit the form first to generate a PDF.');
      return;
    }
    let flatSchema: any[] = [];
    if (this.selectedTemplate.schema) {
       this.selectedTemplate.schema.forEach((section: any) => {
         if (section.fields) {
           flatSchema = flatSchema.concat(section.fields);
         }
       });
    }

    const payload = {
      schema: flatSchema,
      data: this.dynamicFormData
    };
    
    this.http.post(`${environment.apiUrl}/form-templates/${this.selectedTemplate.id}/generate-pdf`, payload, { responseType: 'blob' })
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `InspectionReport_${Date.now()}.pdf`;
          a.click();
          window.URL.revokeObjectURL(url);
        },
        error: (err) => {
          console.error(err);
          alert('Failed to generate PDF');
        }
      });
  }

  openIssueModal(): void {
    this.isEditMode = false;
    this.editingIssueId = null;
    this.resetIssueForm();
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

    if (!this.selectedRecord?.id) return;

    const payload = {
      purchaseOrderId: this.selectedRecord.id,
      date: this.issueForm.date,
      projectNumber: this.issueForm.projectNumber,
      productionOrderNumber: this.issueForm.productionOrderNumber,
      description: this.issueForm.description,
      containment: this.issueForm.containment,
      preventativeAction: this.issueForm.preventativeAction,
      impact: this.issueForm.impact,
      resolution: this.issueForm.resolution,
      sourceOfNonConformance: this.issueForm.sourceOfNonConformance,
      recordedBy: this.issueForm.recordedBy,
    };

    if (this.isEditMode && this.editingIssueId) {
      // Update existing issue
      this.http.put<IssueItem>(`${environment.apiUrl}/issues/${this.editingIssueId}`, payload).subscribe({
        next: (updatedIssue) => {
          const index = this.issues.findIndex(i => i.id === this.editingIssueId);
          if (index !== -1) {
            this.issues[index] = updatedIssue;
          }
          this.closeIssueModal();
          this.showToast('Issue updated successfully');
        },
        error: (err) => {
          console.error('Submit Issue error (Update):', err);
          alert('Failed to update issue.');
        }
      });
    } else {
      // Create new issue
      this.http.post<IssueItem>(`${environment.apiUrl}/issues`, payload).subscribe({
        next: (newIssue) => {
          this.issues = [newIssue, ...this.issues];
          this.resetIssueForm();
          this.closeIssueModal();
          this.showToast('Issue logged successfully');
        },
        error: (err) => {
          console.error('Submit Issue error (Create):', err);
          alert('Failed to log issue.');
        }
      });
    }
  }

  editIssue(issue: IssueItem): void {
    this.isEditMode = true;
    this.editingIssueId = issue.id || null;
    
    // Copy data into form
    this.issueForm = {
      date: issue.date ? new Date(issue.date).toISOString().split('T')[0] : this.today(),
      projectNumber: issue.projectNumber || '',
      productionOrderNumber: issue.productionOrderNumber || '',
      description: issue.description || '',
      containment: issue.containment || '',
      preventativeAction: issue.preventativeAction || '',
      impact: issue.impact || '',
      resolution: issue.resolution || '',
      sourceOfNonConformance: issue.sourceOfNonConformance || '',
      recordedBy: issue.recordedBy || ''
    };
    
    this.showIssueModal = true;
  }

  deleteIssue(id: string | undefined): void {
    if (!id) return;
    if (confirm('Are you sure you want to delete this issue? This action cannot be undone.')) {
      this.http.delete(`${environment.apiUrl}/issues/${id}`).subscribe({
        next: () => {
          this.issues = this.issues.filter(iss => iss.id !== id);
          this.showToast('Issue deleted successfully');
        },
        error: (err) => {
          console.error('Delete Issue error:', err);
          alert('Failed to delete issue.');
        }
      });
    }
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
      projectNumber: this.selectedRecord?.projectDef || '',
      productionOrderNumber: this.selectedRecord?.productionOrderNumber || '',
      description: '',
      containment: '',
      preventativeAction: '',
      impact: '',
      resolution: '',
      sourceOfNonConformance: '',
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
