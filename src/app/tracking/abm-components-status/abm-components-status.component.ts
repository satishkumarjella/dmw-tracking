import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ConfigService } from '../../shared/config.service';
import { ModuleLoaderComponent } from '../../shared/components/module-loader/module-loader.component';
import { SharedTableComponent, TableColumn } from '../../shared/components/shared-table/shared-table.component';
import { environment } from '../../../environments/environment';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-abm-components-status',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ModuleLoaderComponent, SharedTableComponent],
  templateUrl: './abm-components-status.component.html',
  styleUrls: ['./abm-components-status.component.scss']
})
export class AbmComponentsStatusComponent implements OnInit, OnDestroy {
  isLoading = true;
  currentYear: number = new Date().getFullYear();

  poInput: string = '';
  hasError: boolean = false;
  showResult: boolean = false;
  loadingResult: boolean = false;

  poData: any = null;
  totReq: number = 0;
  totRcv: number = 0;
  totOpen: number = 0;

  searchTerm: string = '';

  tableColumns: TableColumn[] = [
    { key: 'abm', label: 'ABM', type: 'custom' },
    { key: 'desc', label: 'Description', type: 'custom' },
    { key: 'reqQty', label: 'Req QTY', type: 'custom' },
    { key: 'po', label: 'PO #', type: 'custom' },
    { key: 'rcv', label: 'QTY Received', type: 'custom' },
    { key: 'qtyOpen', label: 'QTY Open', type: 'custom' }
  ];

  get filteredAbms(): any[] {
    if (!this.poData || !this.poData.abms) return [];
    if (!this.searchTerm) return this.poData.abms;
    
    const term = this.searchTerm.toLowerCase();
    return this.poData.abms.filter((item: any) => 
      (item.id && item.id.toLowerCase().includes(term)) ||
      (item.desc && item.desc.toLowerCase().includes(term)) ||
      (item.descSub && item.descSub.toLowerCase().includes(term)) ||
      (item.po && item.po.toLowerCase().includes(term))
    );
  }

  constructor(
    private configService: ConfigService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.configService.applyModuleTheme('abm-status');
    setTimeout(() => {
      this.isLoading = false;
    }, 600);
  }

  ngOnDestroy() {
    this.configService.applyModuleTheme(null);
  }

  async lookup(): Promise<void> {
    const raw = this.poInput.trim().toUpperCase();

    this.hasError = false;
    this.showResult = false;
    this.poData = null;
    this.totReq = 0;
    this.totRcv = 0;
    this.totOpen = 0;

    if (!raw) {
      this.hasError = true;
      return;
    }

    this.loadingResult = true;

    try {
      const results: any[] = await lastValueFrom(
        this.http.get<any[]>(`${environment.apiUrl}/abm?order=${raw}`)
      );

      if (!results || results.length === 0) {
        this.hasError = true;
        this.loadingResult = false;
        return;
      }

      // Map the returned data
      const firstRow = results[0];
      
      const mappedAbms = results.map(row => ({
        id: row.wbsElement || 'Unknown',
        desc: row.material || 'Unknown',
        descSub: row.materialDescription || '',
        reqQty: parseInt(row.productionOrderReqQty, 10) || 0,
        po: row.order || '',
        rcv: parseInt(row.goodsRecieptQty, 10) || 0
      }));

      this.poData = {
        po: raw,
        mark: firstRow.projectDefinition || '',
        markDesc: firstRow.finalAssembly || '',
        abms: mappedAbms
      };

      this.totReq = mappedAbms.reduce((sum: number, item: any) => sum + item.reqQty, 0);
      this.totRcv = mappedAbms.reduce((sum: number, item: any) => sum + item.rcv, 0);
      this.totOpen = mappedAbms.reduce((sum: number, item: any) => sum + (item.reqQty - item.rcv), 0);

      this.showResult = true;
      
      setTimeout(() => {
        const el = document.getElementById('resultPanel');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 50);

    } catch (error) {
      console.error('Error fetching ABM data', error);
      this.hasError = true;
    } finally {
      this.loadingResult = false;
    }
  }

  clearAll(): void {
    this.poInput = '';
    this.hasError = false;
    this.showResult = false;
    this.loadingResult = false;
    this.poData = null;
    this.totReq = 0;
    this.totRcv = 0;
    this.totOpen = 0;
  }

  getPct(rcv: number, req: number): number {
    if (!req) return 0;
    return Math.round((rcv / req) * 100);
  }
}