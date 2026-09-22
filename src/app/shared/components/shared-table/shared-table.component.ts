import { Component, Input, Output, EventEmitter, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedSelectComponent } from '../shared-select/shared-select.component';

export interface TableColumn {
  key: string;       // The property key (supports dot notation, e.g., 'user.name')
  label: string;     // Column header text
  type?: 'text' | 'date' | 'badge' | 'boolean' | 'custom'; // Formatting type
  badgeClass?: (val: any) => string; // Optional function to determine badge class
  width?: string;    // Optional CSS width
  valueGetter?: (row: any, index: number) => any; // Optional function to compute the value
  sortable?: boolean; // Whether column is sortable
}

@Component({
  selector: 'app-shared-table',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedSelectComponent],
  templateUrl: './shared-table.component.html',
  styleUrls: ['./shared-table.component.scss']
})
export class SharedTableComponent {
  @Input() data: any[] = [];
  @Input() columns: TableColumn[] = [];
  @Input() isRowClickable: boolean = false;
  @Input() emptyMessage: string = 'No records found.';
  @Input() customCellTemplates: { [key: string]: TemplateRef<any> } = {};
  
  // Sort Inputs
  @Input() sortColumn: string = '';
  @Input() sortDirection: 'asc' | 'desc' = 'asc';
  
  // Search Input
  @Input() enableSearch: boolean = false;
  @Input() searchPlaceholder: string = 'Search...';
  @Input() searchTerm: string = '';

  // Pagination Inputs
  @Input() enablePagination: boolean = false;
  @Input() pageSize: number = 10;
  @Input() pageSizeOptions: number[] = [5, 10, 25, 50, 100];
  @Input() currentPage: number = 1;
  
  @Output() rowClick = new EventEmitter<any>();
  @Output() sort = new EventEmitter<{column: string, direction: 'asc' | 'desc'}>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  onSort(col: TableColumn) {
    if (!col.sortable) return;
    if (this.sortColumn === col.key) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = col.key;
      this.sortDirection = 'asc';
    }
    // Still emit in case parent wants to handle server-side sorting
    this.sort.emit({ column: this.sortColumn, direction: this.sortDirection });
  }

  onRowClick(row: any) {
    if (this.isRowClickable) {
      this.rowClick.emit(row);
    }
  }

  // Helper to resolve nested object paths or use valueGetter
  resolvePath(row: any, col: TableColumn, index: number): any {
    if (!row) return null;
    if (col.valueGetter) return col.valueGetter(row, index);
    if (!col.key) return null;
    return col.key.split('.').reduce((acc, part) => acc && acc[part] !== undefined ? acc[part] : null, row);
  }

  // -------------------------------------------------------------
  // Built-in Client-Side Filtering, Sorting, and Pagination Logic
  // -------------------------------------------------------------

  get filteredData(): any[] {
    if (!this.data) return [];
    
    // 1. Filter
    let result = [...this.data];
    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const q = this.searchTerm.trim().toLowerCase();
      result = result.filter(row => {
        return this.columns.some(col => {
          const val = this.resolvePath(row, col, 0);
          if (val === null || val === undefined) return false;
          return String(val).toLowerCase().includes(q);
        });
      });
    }
    return result;
  }

  get sortedData(): any[] {
    let result = [...this.filteredData];
    
    // 2. Sort
    if (this.sortColumn) {
      const colDef = this.columns.find(c => c.key === this.sortColumn);
      
      result = result.sort((a, b) => {
        let valA = colDef ? this.resolvePath(a, colDef, 0) : null;
        let valB = colDef ? this.resolvePath(b, colDef, 0) : null;
        
        if (valA === undefined || valA === null) valA = '';
        if (valB === undefined || valB === null) valB = '';

        if (typeof valA === 'number' && typeof valB === 'number') {
          return this.sortDirection === 'asc' ? valA - valB : valB - valA;
        }

        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();
        if (strA < strB) return this.sortDirection === 'asc' ? -1 : 1;
        if (strA > strB) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }

  get processedData(): any[] {
    const sorted = this.sortedData;
    // 3. Paginate
    if (!this.enablePagination) {
      return sorted;
    }
    const start = (this.currentPage - 1) * this.pageSize;
    return sorted.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.sortedData.length / this.pageSize) || 1;
  }

  get paginationStartIndex(): number {
    if (this.sortedData.length === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get paginationEndIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.sortedData.length);
  }

  setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.pageChange.emit(this.currentPage);
    }
  }

  onPageSizeChange(): void {
    this.currentPage = 1; // Reset to first page
    this.pageSizeChange.emit(this.pageSize);
    this.pageChange.emit(this.currentPage);
  }
}
