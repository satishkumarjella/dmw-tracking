import { Component, Input, Output, EventEmitter, inject, OnInit, HostListener, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject, Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { IonHeader, IonButton, IonIcon, IonPopover, IonList, IonItem, IonLabel, IonContent, IonSearchbar, IonToggle, IonSpinner } from '@ionic/angular/standalone';
import { HeaderComponent } from '../../../shared/header/header.component';
import { ThemeService } from 'src/app/shared/theme.service';
import { ConfigService } from '../../../shared/config.service';
import { environment } from '../../../../environments/environment';

export interface SearchResult {
  productionOrderNumber: string;
  description?: string;
  shortText?: string;
  customerName?: string;
  deliveryDate?: string;
  material?: string;
}

import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-dashboard-header',
  standalone: true,
  imports: [IonSearchbar, CommonModule, FormsModule, IonHeader, IonButton, IonIcon, IonPopover, IonList, IonItem, IonLabel, IonContent, HeaderComponent, IonToggle, IonSpinner],
  templateUrl: './dashboard-header.component.html',
  styleUrls: ['./dashboard-header.component.scss']
})
export class DashboardHeaderComponent implements OnInit {
  @Input() isDashboardRoute: boolean = true;
  @Input() isSidebarCollapsed: boolean = true;
  @Input() globalPoSearch: string = '';
  @Input() moduleDescription: string = '';
  @Input() moduleTitle: string = '';
  @Input() activeModule: string = '';

  themeService = inject(ThemeService);
  configService = inject(ConfigService);
  http = inject(HttpClient);
  isDark = this.themeService.isDarkMode;

  @Output() globalPoSearchChange = new EventEmitter<string>();
  @Output() searchTriggered = new EventEmitter<void>();
  @Output() profileOpened = new EventEmitter<void>();
  @Output() preferencesOpened = new EventEmitter<void>();
  @Output() helpOpened = new EventEmitter<void>();
  @Output() loggedOut = new EventEmitter<void>();
  @Output() cameraScanTriggered = new EventEmitter<void>();

  @ViewChild(IonSearchbar) searchbar!: IonSearchbar;
  sanitizer = inject(DomSanitizer);

  private searchTerms = new Subject<string>();
  searchResults$: Observable<SearchResult[]> = of([]);
  showDropdown = false;
  isLoading = false;
  hasSearched = false;

  // Detect platform for keyboard hint
  isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  shortcutHint = this.isMac ? '⌘K' : 'Ctrl+K';

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
      event.preventDefault();
      this.searchbar.setFocus();
    }
  }

  ngOnInit(): void {
    this.searchResults$ = this.searchTerms.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((term: string) => {
        if (!term.trim()) {
          this.isLoading = false;
          this.hasSearched = false;
          this.showDropdown = false;
          return of([]);
        }
        this.isLoading = true;
        this.hasSearched = true;
        this.showDropdown = true;
        return this.http.get<SearchResult[]>(`${environment.apiUrl}/purchase-orders/search?q=${term}`).pipe(
          catchError(() => of([]))
        );
      })
    );

    this.searchResults$.subscribe(results => {
      this.isLoading = false;
      // We keep showDropdown true if hasSearched is true, so we can show "No results"
      if (this.hasSearched && !this.globalPoSearch.trim()) {
         this.showDropdown = false;
      }
    });
  }

  highlightMatch(text: string | undefined): SafeHtml {
    if (!text) return '';
    if (!this.globalPoSearch) return text;
    
    // Escape regex characters
    const safeQuery = this.globalPoSearch.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    const regex = new RegExp(`(${safeQuery})`, 'gi');
    const highlighted = text.replace(regex, '<span class="highlight-text">$1</span>');
    return this.sanitizer.bypassSecurityTrustHtml(highlighted);
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  onSearchChange(val: string) {
    this.globalPoSearch = val;
    this.globalPoSearchChange.emit(val);
    this.searchTerms.next(val);
  }

  hideDropdownDelayed() {
    setTimeout(() => {
      this.showDropdown = false;
    }, 200);
  }

  selectRecord(poNumber: string) {
    this.globalPoSearch = poNumber;
    this.globalPoSearchChange.emit(poNumber);
    this.showDropdown = false;
    this.searchTriggered.emit();
  }
}
