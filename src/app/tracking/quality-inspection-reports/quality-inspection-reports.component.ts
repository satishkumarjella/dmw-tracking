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
import { AuthService } from '../../shared/services/auth.service';

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

interface InspectionItem {
  id?: string;
  purchaseOrderId: string;
  inspectorName: string;
  inspectionDate: string;
  formPdfUrl?: string;
  formData?: any;
  formTemplateId?: string;
  createdAt?: string;
  status?: string;
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
  inspections: InspectionItem[] = [];

  showFillModal = false;
  showIssueModal = false;
  showAnalysisModal = false;
  selectedAnalysisStats: any = null;
  toastMessage = '';
  
  isAdmin = true; // Mock admin check for now
  isEditMode = false;
  editingIssueId: string | null = null;
  
  isInspectionEditMode = false;
  editingInspectionId: string | null = null;
  
  currentUserRole = '';
  isDmwUser = false;

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
    private fbService: FormBuilderService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.configService.applyModuleTheme('quality-inspection');
    setTimeout(() => {
      this.isLoading = false;
    }, 600);

    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.currentUserRole = user.role || '';
        this.isDmwUser = this.currentUserRole === 'DMW User';
        this.isAdmin = this.currentUserRole === 'Admin' || this.currentUserRole === 'Superadmin';
      }
    });

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
    
    // Only reset form data if we are NOT in edit mode
    if (!this.isInspectionEditMode) {
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
        
      this.http.get<InspectionItem[]>(`${environment.apiUrl}/inspections?purchaseOrderId=${record.id}`)
        .subscribe({
          next: (res) => {
            this.inspections = res || [];
          },
          error: (err) => console.error('Error fetching inspections:', err)
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

  get totalSubmittedQuantity(): number {
    if (!this.inspections) return 0;
    return this.inspections.length;
  }

  openFillModal(): void {
    this.isInspectionEditMode = false;
    this.editingInspectionId = null;
    this.dynamicFormData = {};
    if (this.templates.length > 0) {
      this.selectTemplate(this.templates[0]);
    }
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

  submitFillForm(status: string = 'COMPLETED'): void {
    if (!this.selectedTemplate || !this.selectedRecord?.id) {
      alert('Please select a template and ensure a Production Order is active.');
      return;
    }
    
    const payload = {
      purchaseOrderId: this.selectedRecord.id,
      inspectorName: 'Admin User', // Mock user
      formData: this.dynamicFormData,
      formTemplateId: this.selectedTemplate.id,
      status: status
    };

    if (this.isInspectionEditMode && this.editingInspectionId) {
      this.http.put<InspectionItem>(`${environment.apiUrl}/inspections/${this.editingInspectionId}`, payload).subscribe({
        next: (updatedInspection) => {
          const index = this.inspections.findIndex(i => i.id === this.editingInspectionId);
          if (index !== -1) {
            this.inspections[index] = updatedInspection;
          }
          if (status === 'COMPLETED') {
            this.closeFillModal();
            this.showToast('Inspection Log updated successfully');
          } else {
            this.showToast('Progress saved successfully');
          }
        },
        error: (err) => {
          console.error(err);
          alert('Failed to update inspection.');
        }
      });
    } else {
      this.http.post<InspectionItem>(`${environment.apiUrl}/inspections`, payload).subscribe({
        next: (newInspection) => {
          this.inspections = [newInspection, ...this.inspections];
          
          if (status === 'COMPLETED') {
            this.closeFillModal();
            this.showToast('Inspection Log submitted successfully');
          } else {
            // Set edit mode so subsequent saves update the same record
            this.isInspectionEditMode = true;
            this.editingInspectionId = newInspection.id || null;
            this.showToast('Progress saved successfully');
          }
        },
        error: (err) => {
          console.error(err);
          alert('Failed to submit inspection.');
        }
      });
    }
  }

  editInspection(inspection: InspectionItem): void {
    this.isInspectionEditMode = true;
    this.editingInspectionId = inspection.id || null;
    this.dynamicFormData = inspection.formData ? { ...inspection.formData } : {};
    
    // Select the correct template based on formTemplateId
    if (inspection.formTemplateId) {
      const template = this.templates.find(t => t.id === inspection.formTemplateId);
      if (template) {
        this.selectedTemplate = template;
      }
    }
    
    this.showFillModal = true;
  }

  deleteInspection(id: string | undefined): void {
    if (!id) return;
    if (confirm('Are you sure you want to delete this inspection?')) {
      this.http.delete(`${environment.apiUrl}/inspections/${id}`).subscribe({
        next: () => {
          this.inspections = this.inspections.filter(i => i.id !== id);
          this.showToast('Inspection deleted successfully');
        },
        error: (err) => {
          console.error(err);
          alert('Failed to delete inspection.');
        }
      });
    }
  }

  downloadFilledPdf(inspection: InspectionItem): void {
    if (!inspection.formTemplateId) {
      alert('This inspection does not have a linked template.');
      return;
    }
    
    const template = this.templates.find(t => t.id === inspection.formTemplateId);
    if (!template) {
      alert('Template not found for this inspection.');
      return;
    }

    let flatSchema: any[] = [];
    if (template.schema) {
       template.schema.forEach((section: any) => {
         if (section.fields) {
           flatSchema = flatSchema.concat(section.fields);
         }
       });
    }

    const payload = {
      schema: flatSchema,
      data: inspection.formData
    };
    
    this.http.post(`${environment.apiUrl}/form-templates/${template.id}/generate-pdf`, payload, { responseType: 'blob' })
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

  openAnalysisModal(stats: any): void {
    this.selectedAnalysisStats = stats;
    this.showAnalysisModal = true;
  }

  closeAnalysisModal(): void {
    this.showAnalysisModal = false;
    this.selectedAnalysisStats = null;
  }

  closeAnalysisModalByOverlay(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.closeAnalysisModal();
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

  getFieldLabel(fieldId: string): string {
    for (const t of this.templates) {
      if (t.schema) {
        for (const section of t.schema) {
          if (section.fields) {
             const field = section.fields.find((f: any) => f.id === fieldId);
             if (field) return field.label;
          }
        }
      }
    }
    return '';
  }

  getInspectionStats(insp: InspectionItem): { evaluable: number, rejected: number, success: number, successPct: number, failPct: number, rejectedFields: string[] } {
    const stats = { evaluable: 0, rejected: 0, success: 0, successPct: 0, failPct: 0, rejectedFields: [] as string[] };
    if (!insp.formData) return stats;

    Object.keys(insp.formData).forEach(key => {
      const val = insp.formData[key];
      if (typeof val === 'string') {
        const upper = val.toUpperCase();
        if (upper === 'REJECT') {
           stats.rejected++;
           stats.evaluable++;
           stats.rejectedFields.push(this.getFieldLabel(key) || key);
        } else if (['OK', 'N/A', 'N/A*', 'CORRECTED/CHECKED'].includes(upper)) {
           stats.evaluable++;
        }
      }
    });

    stats.success = stats.evaluable - stats.rejected;
    if (stats.evaluable > 0) {
      stats.failPct = Math.round((stats.rejected / stats.evaluable) * 100);
      stats.successPct = 100 - stats.failPct;
    }
    
    return stats;
  }

  // --- Stepper Logic ---
  currentStepIndex = 0;

  isStepEditable(stepIndex: number): boolean {
    if (this.isAdmin) return true;
    if (this.currentUserRole === 'user') {
      return stepIndex < 5;
    }
    if (this.isDmwUser) {
      return stepIndex === 5;
    }
    return true;
  }

  getSectionStats(sectionIdx: number): { completion: number; success: number } {
    if (!this.selectedTemplate || !this.selectedTemplate.schema) {
      return { completion: 0, success: 0 };
    }
    const section = this.selectedTemplate.schema[sectionIdx];
    if (!section || !section.fields) return { completion: 0, success: 0 };
    
    let total = 0;
    let filled = 0;
    let successCount = 0;

    section.fields.forEach((f: any) => {
      total++;
      const val = this.dynamicFormData[f.id];
      if (val !== undefined && val !== null && val !== '') {
        filled++;
        if (f.analyzeField && val === f.expectedValue) {
          successCount++;
        } else if (f.analyzeField && val !== f.expectedValue) {
          // failure
        } else {
          successCount++;
        }
      }
    });

    if (this.dynamicFormData[`section_${sectionIdx}_signName`]) {
      filled++;
      successCount++;
    }
    total++;

    return {
      completion: total === 0 ? 0 : Math.round((filled / total) * 100),
      success: filled === 0 ? 0 : Math.round((successCount / filled) * 100)
    };
  }

  goToStep(index: number) {
    if (index >= 0 && index < this.selectedTemplate!.schema!.length) {
      this.currentStepIndex = index;
    }
  }

  prevStep() {
    if (this.currentStepIndex > 0) {
      this.currentStepIndex--;
    }
  }

  nextStep() {
    if (this.currentStepIndex < this.selectedTemplate!.schema!.length - 1) {
      this.currentStepIndex++;
    }
  }

  saveProgress() {
    this.submitFillForm('IN_PROGRESS');
  }

  hasOtherFields(section: any): boolean {
    return section.fields && section.fields.some((f: any) => !f.options);
  }

  getChecklistOptions(section: any): string[] {
    if (!section || !section.fields) return [];
    const firstRadio = section.fields.find((f: any) => f.options);
    return firstRadio ? firstRadio.options : [];
  }
}
