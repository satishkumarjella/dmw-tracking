import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../shared/services/auth.service';
import { ToastService } from '../../shared/services/toast.service';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { searchOutline, chevronUpOutline, chevronDownOutline } from 'ionicons/icons';
import { ModuleLoaderComponent } from '../../shared/components/module-loader/module-loader.component';
import { FormBuilderComponent } from '../../pages/form-builder/form-builder.component';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonIcon, ModuleLoaderComponent, FormBuilderComponent]
})
export class AdminComponent implements OnInit {
  isLoading = true;
  activeTab: 'users' | 'forms' = 'users';
  users: any[] = [];
  availableModules = ['wo-status', 'abm-status', 'quality-inspection', 'shipping', 'receiving'];
  currentUserRole = 'user';

  // Search & Sort State
  searchQuery: string = '';
  sortColumn: string = 'createdAt';
  sortDirection: 'asc' | 'desc' = 'desc';

  constructor(private http: HttpClient, private authService: AuthService, private toastService: ToastService) {
    addIcons({ searchOutline, chevronUpOutline, chevronDownOutline });
    this.authService.currentUser$.subscribe(user => {
      if (user) this.currentUserRole = user.role;
    });
  }

  ngOnInit() {
    this.loadUsers();
    // Simulate premium module loading effect
    setTimeout(() => {
      this.isLoading = false;
    }, 1200);
  }

  loadUsers() {
    const tenantId = this.authService.getTenantId();
    this.http.get<any[]>('http://localhost:3000/user', {
      headers: { 'x-tenant-id': tenantId || '', Authorization: `Bearer ${this.authService.getToken()}` }
    }).subscribe(users => this.users = users);
  }

  changeUserRole(userId: string, event: Event) {
    const select = event.target as HTMLSelectElement;
    const newRole = select.value;
    const tenantId = this.authService.getTenantId();
    this.http.patch(`http://localhost:3000/user/${userId}/role`, { role: newRole }, {
      headers: { 'x-tenant-id': tenantId || '', Authorization: `Bearer ${this.authService.getToken()}` }
    }).subscribe({
      next: () => this.toastService.success('Role assigned successfully'),
      error: (err) => {
        this.toastService.error('Failed to update role: ' + (err.error?.message || err.message));
        this.loadUsers(); // Revert
      }
    });
  }

  hasModule(user: any, module: string): boolean {
    return user.modules && user.modules.includes(module);
  }

  toggleModule(user: any, module: string, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    if (!user.modules) user.modules = [];
    
    if (checked) {
      if (!user.modules.includes(module)) user.modules.push(module);
    } else {
      user.modules = user.modules.filter((m: string) => m !== module);
    }
  }

  saveUserModules(user: any) {
    const tenantId = this.authService.getTenantId();
    this.http.patch(`http://localhost:3000/user/${user.id}/modules`, { modules: user.modules }, {
      headers: { 'x-tenant-id': tenantId || '', Authorization: `Bearer ${this.authService.getToken()}` }
    }).subscribe({
      next: () => this.toastService.success('Modules assigned successfully'),
      error: (err) => this.toastService.error('Failed to assign modules: ' + (err.error?.message || err.message))
    });
  }

  deleteUser(user: any) {
    if (!confirm(`Are you sure you want to completely delete ${user.email}? This action cannot be undone.`)) return;
    
    const tenantId = this.authService.getTenantId();
    this.http.delete(`http://localhost:3000/user/${user.id}`, {
      headers: { 'x-tenant-id': tenantId || '', Authorization: `Bearer ${this.authService.getToken()}` }
    }).subscribe({
      next: () => {
        this.toastService.success('User deleted successfully');
        this.loadUsers();
      },
      error: (err) => this.toastService.error('Failed to delete user: ' + (err.error?.message || err.message))
    });
  }

  // --- Search and Sort Logic ---

  sortBy(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
  }

  get filteredAndSortedUsers(): any[] {
    let result = this.users;

    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(u => 
        (u.email && u.email.toLowerCase().includes(query)) ||
        (u.role && u.role.toLowerCase().includes(query))
      );
    }

    result.sort((a, b) => {
      let valA = a[this.sortColumn];
      let valB = b[this.sortColumn];

      if (this.sortColumn === 'createdAt') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      } else {
        valA = valA ? valA.toString().toLowerCase() : '';
        valB = valB ? valB.toString().toLowerCase() : '';
      }

      if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }
}
