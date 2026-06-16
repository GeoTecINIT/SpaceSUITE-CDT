import { CommonModule } from '@angular/common';
import { Component, ComponentRef, EventEmitter, inject, Input, Output, signal, SimpleChanges, ViewChild, ViewContainerRef } from '@angular/core';
import { BokComponent, BokInformationService } from '@eo4geo/ngx-bok-visualization';
import { ButtonModule } from "primeng/button";
import { DialogModule } from 'primeng/dialog';
import { ChipModule } from 'primeng/chip';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinner } from "primeng/progressspinner";
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { UtilsService } from '../../services/utils.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  standalone: true,
  selector: 'bokModal',
  templateUrl: './bokModal.component.html',
  styleUrls: ['./bokModal.component.css'],
  imports: [DialogModule, ButtonModule, ChipModule, CommonModule, TooltipModule, ProgressSpinner, ToastModule, TranslateModule],
})
export class BokModalComponent {
  visible = false;
  
  @Input() label: string = 'BoK Concepts';
  @Input() disabled: boolean = false;

  currentConcept = signal('');
  currentConceptName = signal('');

  @Input() selectedConcepts: string[] = [];
  selectedConceptsColor: Map<string, string> = new Map();
  selectedConceptsTooltip: Map<string, string> = new Map();
  @Output() selectedConceptsChange: EventEmitter<string[]> = new EventEmitter();

  @ViewChild('dynamicContainer', { read: ViewContainerRef }) container!: ViewContainerRef;

  private componentRef: ComponentRef<BokComponent> | null = null;

  @Input() allowKnowledgeAreas: boolean = true;
  invalidConcept = signal(false);

  private bokInfo = inject(BokInformationService);
  private utilsService = inject(UtilsService);
  private messageService = inject(MessageService);
  private translate = inject(TranslateService);

  ngOnChanges(changes: SimpleChanges) {
    if (changes['selectedConcepts']) {
      this.selectedConcepts.forEach( concept => {
        this.bokInfo.getConceptColor(concept).subscribe(
          color => {
            const softColor = color ? this.utilsService.convertHexToRgba(color, 0.5) : '';
            this.selectedConceptsColor.set(concept, softColor)
          }
        )
        this.bokInfo.getConceptName(concept).subscribe(
          tooltip => this.selectedConceptsTooltip.set(concept, tooltip)
        );
      })
    }
  }

  showDialog() {
    this.visible = true;
  }

  async loadComponent() {
    if (this.componentRef) return;
    this.container.clear();
    const { BokComponent } = await import('@eo4geo/ngx-bok-visualization');
    this.componentRef = this.container.createComponent(BokComponent);
    this.componentRef.setInput('showDescription', false);
    this.componentRef.setInput('showVersions', false);
    this.componentRef.setInput('showSearchEngine', true);
    this.componentRef.instance.codSelectedChange.subscribe((newCode: string) => {
      this.currentConcept.set(newCode);
      if (!this.allowKnowledgeAreas && (this.utilsService.codeToKnowledgeArea.has(this.currentConcept()) || this.currentConcept() == 'GIST')) {
        this.invalidConcept.set(true);
        return
      }
      this.invalidConcept.set(false);
      this.bokInfo.getConceptName(newCode).subscribe(name => this.currentConceptName.set(name));
    })
  }

  addConcept() {
    this.addConceptWithName(this.currentConcept());
  }

  addConceptWithName(concept: string) {
    if (!this.selectedConcepts.includes(concept)) {
      this.selectedConcepts.push(concept);
      this.bokInfo.getConceptColor(concept).subscribe(
        color => {
          const softColor = color ? this.utilsService.convertHexToRgba(color, 0.5) : '';
          this.selectedConceptsColor.set(concept, softColor)
        }
      )
      this.bokInfo.getConceptName(concept).subscribe(
        tooltip => this.selectedConceptsTooltip.set(concept, tooltip)
      );
      this.selectedConceptsChange.emit(this.selectedConcepts);
      this.messageService.add({ 
        severity: 'info', 
        summary: this.translate.instant('bokModal.toast.info.summary'), 
        detail: this.translate.instant('bokModal.toast.info.detail', {concept: concept}), 
        life: 3000, 
        closable: true 
      });
    }
    else {
      this.messageService.add({ 
        severity: 'error', 
        summary: this.translate.instant('bokModal.toast.error.summary'), 
        detail: this.translate.instant('bokModal.toast.error.detail', {concept: concept}), 
        life: 3000, 
        closable: true 
      });
    }
  }

  removeChip(label: string) {
    this.selectedConcepts = this.selectedConcepts.filter(concept => concept != label);
    this.selectedConceptsColor.delete(label);
    this.selectedConceptsTooltip.delete(label);
    this.selectedConceptsChange.emit(this.selectedConcepts);
  }
}