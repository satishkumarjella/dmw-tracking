import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface FormField {
  id: string;
  pdfFieldName: string;
  label: string;
  type: 'text' | 'textarea' | 'checkbox' | 'radio' | 'select' | 'date' | 'number' | 'time';
  options?: string[];
  required?: boolean;
  analyzeField?: boolean;
  expectedValue?: string;
}

export interface FormSection {
  name: string;
  layout?: 'standard' | 'checklist' | 'summary';
  fields: FormField[];
}

export interface FormTemplate {
  id?: string;
  name: string;
  description?: string;
  schema: FormSection[];
}

@Injectable({
  providedIn: 'root'
})
export class FormBuilderService {
  private apiUrl = `${environment.apiUrl}/form-templates`;

  constructor(private http: HttpClient) {}

  getTemplates() {
    return this.http.get<FormTemplate[]>(this.apiUrl);
  }

  uploadPdf(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{schema: FormField[]}>(`${this.apiUrl}/parse-pdf`, formData);
  }

  saveTemplate(template: FormTemplate) {
    return this.http.post<FormTemplate>(this.apiUrl, template);
  }

  updateTemplate(id: string, template: FormTemplate) {
    return this.http.put<FormTemplate>(`${this.apiUrl}/${id}`, template);
  }

  deleteTemplate(id: string) {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
