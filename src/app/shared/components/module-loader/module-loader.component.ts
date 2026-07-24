import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-module-loader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './module-loader.component.html',
  styleUrls: ['./module-loader.component.scss']
})
export class ModuleLoaderComponent {
  @Input() moduleName: string = 'Module';
}
