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
import { SharedTableComponent, TableColumn } from '../../shared/components/shared-table/shared-table.component';
import { SharedSelectComponent } from '../../shared/components/shared-select/shared-select.component';
import { ConfigService } from '../../shared/config.service';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonIcon, ModuleLoaderComponent, FormBuilderComponent, SharedTableComponent, SharedSelectComponent]
})
export class AdminComponent implements OnInit {
  isLoading = true;
  activeTab: 'users' | 'forms' | 'theme' = 'users';
  users: any[] = [];
  availableModules = ['wo-status', 'abm-status', 'quality-inspection', 'shipping', 'receiving', 'project-dashboard'];
  currentUserRole = 'user';

  roleOptions = [
    { label: 'User', value: 'user' },
    { label: 'DMW User', value: 'DMW User' },
    { label: 'Admin', value: 'admin' },
    { label: 'Super Admin', value: 'super_admin' }
  ];

  userColumns: TableColumn[] = [
    { key: 'user', label: 'User Details', type: 'custom', sortable: false },
    { key: 'createdAt', label: 'Joined Date', type: 'date', sortable: true },
    { key: 'role', label: 'Role Level', type: 'custom', sortable: true },
    { key: 'modules', label: 'Module Access', type: 'custom' },
    { key: 'actions', label: 'Actions', type: 'custom', width: '120px' }
  ];

  // Search State
  searchQuery: string = '';

  // Theme State
  themeConfig: Record<string, string> = {
    primary: '#FD7B01',
    secondary: '#0061AA',
    buttonColor: '#b15601',
    excel: '#107c41',
    success: '#107c41',
    warning: '#d83b01',
    danger: '#a80000',
    'bg-body': '#f3f2f1',
    'bg-surface': '#ffffff',
    'text-main': '#201f1e',
    'text-muted': '#605e5c',
    'border-subtle': '#edebe9',
    'border-strong': '#c8c6c4'
  };

  constructor(
    private http: HttpClient, 
    private authService: AuthService, 
    private toastService: ToastService,
    private configService: ConfigService
  ) {
    addIcons({ searchOutline, chevronUpOutline, chevronDownOutline });
    this.authService.currentUser$.subscribe(user => {
      if (user) this.currentUserRole = user.role;
    });
  }

  ngOnInit() {
    this.loadUsers();
    this.loadTheme();
    // Simulate premium module loading effect
    setTimeout(() => {
      this.isLoading = false;
    }, 1200);
  }

  loadTheme() {
    const config = this.configService.config();
    if (config && config.theme) {
      this.themeConfig = { ...this.themeConfig, ...config.theme };
    }
  }

  saveTheme() {
    const tenantId = this.authService.getTenantId();
    if (!tenantId) return;

    this.http.post('http://localhost:3000/config', { theme: this.themeConfig }, {
      headers: { 'x-tenant-id': tenantId, Authorization: `Bearer ${this.authService.getToken()}` }
    }).subscribe({
      next: (res: any) => {
        this.toastService.success('Theme saved successfully!');
        // Update local service and DOM immediately
        const currentConfig = this.configService.config();
        if (currentConfig) {
          currentConfig.theme = res.theme;
          this.configService.config.set(currentConfig);
          // @ts-ignore
          this.configService.applyTheme(res.theme);
        }
      },
      error: (err) => this.toastService.error('Failed to save theme: ' + (err.error?.message || err.message))
    });
  }

  loadUsers() {
    const tenantId = this.authService.getTenantId();
    this.http.get<any[]>('http://localhost:3000/user', {
      headers: { 'x-tenant-id': tenantId || '', Authorization: `Bearer ${this.authService.getToken()}` }
    }).subscribe(users => this.users = users);
  }

  changeUserRole(userId: string, newRole: string) {
    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      this.loadUsers(); // Reset view
      return;
    }
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

  // --- Search and Sort Logic is now handled by SharedTableComponent ---
}
