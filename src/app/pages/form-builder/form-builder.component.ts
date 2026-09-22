import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormBuilderService, FormField, FormSection, FormTemplate } from './form-builder.service';
import { SharedSelectComponent } from '../../shared/components/shared-select/shared-select.component';

@Component({
  selector: 'app-form-builder',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedSelectComponent],
  templateUrl: './form-builder.component.html',
  styleUrls: ['./form-builder.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class FormBuilderComponent implements OnInit {
  templates: FormTemplate[] = [];
  selectedTemplateId: string | null = null;

  templateName = '';
  templateDescription = '';
  sections: FormSection[] = [];
  isParsing = false;
  showPreview = false;

  fieldTypeOptions = [
    { label: 'Text (Single Line)', value: 'text' },
    { label: 'Textarea (Multi Line)', value: 'textarea' },
    { label: 'Number', value: 'number' },
    { label: 'Date', value: 'date' },
    { label: 'Time', value: 'time' },
    { label: 'Checkbox', value: 'checkbox' },
    { label: 'Radio Group', value: 'radio' },
    { label: 'Dropdown Select', value: 'select' }
  ];

  constructor(private fbService: FormBuilderService) {}

  ngOnInit() {
    this.loadTemplates();
  }

  loadTemplates() {
    this.fbService.getTemplates().subscribe(res => {
      this.templates = res;
    });
  }

  createNew() {
    this.selectedTemplateId = null;
    this.templateName = '';
    this.templateDescription = '';
    this.sections = [];
  }

  selectTemplate(template: FormTemplate) {
    this.selectedTemplateId = template.id || null;
    this.templateName = template.name;
    this.templateDescription = template.description || '';
    
    // Normalize old templates that might be saved as flat array
    if (template.schema.length > 0 && !(template.schema[0] as any).fields) {
       this.sections = [{ name: 'Default Section', fields: template.schema as any }];
    } else {
       this.sections = template.schema;
    }
  }

  deleteTemplate(id: string) {
    if (confirm('Are you sure you want to delete this template?')) {
      this.fbService.deleteTemplate(id).subscribe(() => {
        this.loadTemplates();
        if (this.selectedTemplateId === id) this.createNew();
      });
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.isParsing = true;
      this.fbService.uploadPdf(file).subscribe({
        next: (res) => {
          // Dump all parsed fields into a new "Parsed Fields" section
          this.sections.push({
            name: 'Parsed Fields (Unassigned)',
            fields: res.schema as any
          });
          this.isParsing = false;
        },
        error: (err) => {
          console.error(err);
          this.isParsing = false;
          alert('Failed to parse PDF.');
        }
      });
    }
  }

  addSection() {
    this.sections.push({
      name: 'New Section',
      layout: 'standard',
      fields: []
    });
  }

  removeSection(index: number) {
    if (confirm('Are you sure you want to remove this section and all its fields?')) {
      this.sections.splice(index, 1);
    }
  }

  mergeWithNext(index: number) {
    if (index < this.sections.length - 1) {
      if (confirm('Are you sure you want to merge this section with the next section?')) {
        const nextSection = this.sections[index + 1];
        this.sections[index].fields.push(...nextSection.fields);
        this.sections.splice(index + 1, 1);
      }
    }
  }

  // Drag and Drop Merge Logic
  draggedSectionIndex: number | null = null;

  onDragStart(event: DragEvent, index: number) {
    this.draggedSectionIndex = index;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', index.toString());
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  onDragEnter(event: DragEvent, index: number) {
    event.preventDefault();
    if (this.draggedSectionIndex !== null && this.draggedSectionIndex !== index) {
       (event.currentTarget as HTMLElement).classList.add('drag-over-active');
    }
  }

  onDragLeave(event: DragEvent) {
    (event.currentTarget as HTMLElement).classList.remove('drag-over-active');
  }

  onDrop(event: DragEvent, targetIndex: number) {
    event.preventDefault();
    (event.currentTarget as HTMLElement).classList.remove('drag-over-active');
    
    if (this.draggedSectionIndex !== null && this.draggedSectionIndex !== targetIndex) {
      const sourceSection = this.sections[this.draggedSectionIndex];
      const targetSection = this.sections[targetIndex];
      
      if (confirm(`Are you sure you want to merge "${sourceSection.name}" into "${targetSection.name}"?`)) {
        targetSection.fields.push(...sourceSection.fields);
        this.sections.splice(this.draggedSectionIndex, 1);
      }
    }
    this.draggedSectionIndex = null;
  }

  addField(sectionIndex: number) {
    this.sections[sectionIndex].fields.push({
      id: 'new_field_' + Date.now(),
      pdfFieldName: '',
      label: 'New Field',
      type: 'text',
      required: false,
      analyzeField: false,
      expectedValue: ''
    });
  }

  removeField(sectionIndex: number, fieldIndex: number) {
    this.sections[sectionIndex].fields.splice(fieldIndex, 1);
  }

  togglePreview() {
    this.showPreview = !this.showPreview;
  }

  trimStr(val: string) {
    return val.trim();
  }

  updateFieldOptions(field: any, value: string) {
    field.options = value.split(',').map(v => v.trim()).filter(v => v.length > 0);
  }

  saveTemplate() {
    if (!this.templateName) {
      alert('Please provide a template name.');
      return;
    }

    const template: FormTemplate = {
      name: this.templateName,
      description: this.templateDescription,
      schema: this.sections
    };

    if (this.selectedTemplateId) {
      this.fbService.updateTemplate(this.selectedTemplateId, template).subscribe({
        next: () => {
          alert('Template updated successfully!');
          this.loadTemplates();
        },
        error: (err) => {
          console.error(err);
          alert('Failed to update template.');
        }
      });
    } else {
      this.fbService.saveTemplate(template).subscribe({
        next: () => {
          alert('Template saved successfully!');
          this.createNew();
          this.loadTemplates();
        },
        error: (err) => {
          console.error(err);
          alert('Failed to save template.');
        }
      });
    }
  }
}
