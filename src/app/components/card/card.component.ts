import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  inject,
  Input,
  OnInit,
  signal,
  ViewChild,
  WritableSignal,
} from '@angular/core';
import { Router } from '@angular/router';
import { SkillTagComponent, Tag } from '@eo4geo/ngx-bok-utils';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { Popover, PopoverModule } from 'primeng/popover';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { catchError, defaultIfEmpty, finalize, of, take } from 'rxjs';
import { UtilsService } from '../../services/useCaseServices/utils.service';
import { OrganizationDBService } from '../../services/databaseServices/organizationDB.service';
import { EducationalOfferService } from '../../services/useCaseServices/educationalOffer.service';
import { EducationalOffer } from '../../model/coreModel/educationalOffer';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  standalone: true,
  selector: 'card',
  templateUrl: './card.component.html',
  styleUrl: './card.component.css',
  imports: [
    CommonModule,
    ButtonModule,
    CardModule,
    TagModule,
    TooltipModule,
    PopoverModule,
    SkeletonModule,
    SkillTagComponent,
    TranslateModule
  ],
})
export class CardComponent implements OnInit {
  @Input() educationalOffer!: EducationalOffer;
  @Input() logged: boolean = false;

  private organizations: string[] = [];

  @ViewChild('op') op!: Popover;

  @ViewChild('container') containerElement!: ElementRef;
  @ViewChild('subjects') subjectsElement!: ElementRef;

  @ViewChild('conceptsOp') conceptsOp!: Popover;

  @ViewChild('card') cardComponent!: ElementRef;
  maxOverflowWidth: WritableSignal<number> = signal(2000);
  minOverflowWidth: WritableSignal<number> = signal(500);

  concepts: WritableSignal<Tag[]> = signal([]);
  private conceptsLoaded: boolean = false;
  overflow: WritableSignal<boolean> = signal(false);
  compactConcepts: WritableSignal<boolean> = signal(false);
  limitTagsHeight: WritableSignal<boolean> = signal(true);

  skeletonElements: number[] = [];
  showSkeleton: boolean = true;

  private educationalOfferService = inject(EducationalOfferService);
  private utilsService = inject(UtilsService);
  private orgService = inject(OrganizationDBService);
  private router = inject(Router);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  //private pdfService = inject(PdfService);
  //private rdfService = inject(RdfService);
  private translate = inject(TranslateService);

  constructor() {
    this.skeletonElements = Array(10).fill(null);
  }

  ngOnInit() {
    this.orgService.getUserOrganizations().subscribe((orgs) => {
      orgs.forEach((org) => this.organizations.push(org._id));
    });

    this.utilsService
      .bokStringToTag(this.educationalOffer.root.bokConcepts)
      .pipe(defaultIfEmpty([]))
      .subscribe((results) => {
        this.concepts.set([...this.concepts(), ...results].sort((a, b) => a.label.localeCompare(b.label)));
        this.conceptsLoaded = true;
        this.showSkeleton = false;
      });
  }

  ngAfterViewChecked() {
    if (this.conceptsLoaded && this.limitTagsHeight) {
      const currentWidth = this.cardComponent.nativeElement.clientWidth;
      this.maxOverflowWidth.set(currentWidth * 1.4);
      this.minOverflowWidth.set(currentWidth * 0.6);
      this.overflow.set(this.checkOverflow());
      this.limitTagsHeight.set(false);
    }
  }

  compactConceptsChanged = () => (this.compactConcepts.set(!this.compactConcepts()));

  checkOverflow(): boolean {
    const containerHeight = this.containerElement.nativeElement.clientHeight;
    const subjectsHeight = this.subjectsElement.nativeElement.scrollHeight;
    return subjectsHeight > containerHeight;
  }

  onClickConcept(code: string): void {
    window.open(`https://geospacebok.eu/${code}`);
  }

  onClickTitle(event: MouseEvent): void {
    event.preventDefault();
    this.router.navigate([`offer/${this.educationalOffer.id}`]);
  }

  checkUser() {
    return this.organizations.includes(this.educationalOffer.orgId);
  }

  editJob() {
    this.router.navigate([`edit/${this.educationalOffer.id}`]);
  }

  duplicateJob() {
    this.router.navigate([`new/${this.educationalOffer.id}`]);
  }

  deleteModal(event: Event) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: this.translate.instant('card.deleteModal.message'),
      header: this.translate.instant('card.deleteModal.header'),
      icon: 'pi pi-info-circle',
      rejectLabel: this.translate.instant('card.deleteModal.reject'),
      rejectButtonProps: {
        label: this.translate.instant('card.deleteModal.reject'),
        severity: 'secondary',
      },
      acceptButtonProps: {
        label: this.translate.instant('card.deleteModal.accept'),
        severity: 'danger',
      },

      accept: () => {
        this.deleteOffer();
      },
      reject: () => {},
    });
  }

  deleteOffer() {
    let deleteError = false;
    this.educationalOfferService.deleteEducationalOffer(this.educationalOffer.id)
      .pipe(
        take(1),
        catchError((error) => {
          this.messageService.add({
            severity: 'error',
            summary: this.translate.instant('card.toast.delete.error.summary'),
            detail: this.translate.instant('card.toast.delete.error.detail'),
            life: 3000,
            closable: true,
          });
          deleteError = true;
          return of(null);
        }),
        finalize(() => {
          if (!deleteError)
            this.messageService.add({
              severity: 'info',
              summary: this.translate.instant('card.toast.delete.info.summary'),
              detail: this.translate.instant('card.toast.delete.info.detail'),
              life: 3000,
              closable: true,
            });
        }),
      )
      .subscribe();
  }

  copyLink(): void {
    navigator.clipboard.writeText(window.location.href + `offer/${this.educationalOffer.id}`);

    this.messageService.add({
      severity: 'info',
      summary: this.translate.instant('card.toast.copy.info.summary'),
      detail: this.translate.instant('card.toast.copy.info.detail'),
      life: 3000,
      closable: true,
    });
  }

  /*
  downloadPDF(): void {
    document.body.style.cursor = 'wait';
    this.op.hide();

    this.pdfService
      .generatePortfolioPdf(new EducationalOffer(this.educationalOffer.root, this.educationalOffer))
      .subscribe((pdf) => {
        this.downloadURI(pdf.url, pdf.filename);
        document.body.style.cursor = '';
      });
  }

  downloadRDF(format: 'ttl' | 'xml' | 'rdfa'): void {
    document.body.style.cursor = 'wait';
    this.op.hide();

    const fileName = (this.educationalOffer.root.name || 'default_name')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '_')
      .replace(/[^\w_-]/g, '')
      .toLowerCase();
    const newOffer = new EducationalOffer(this.educationalOffer.root, this.educationalOffer);

    switch (format) {
      case 'ttl':
        const ttlUrl = this.rdfService.getRdfTtlUrl(newOffer);
        this.downloadURI(ttlUrl, fileName + '_profile.ttl');

        break;

      case 'xml':
        const xmlUrl = this.rdfService.getRdfXmlUrl(newOffer);
        this.downloadURI(xmlUrl, fileName + '_profile.rdf.xml');

        break;

      case 'rdfa':
        const rdfaUrl = this.rdfService.getRdfaUrl(newOffer);
        this.downloadURI(rdfaUrl, fileName + '_profile.html');

        break;
    }

    document.body.style.cursor = '';
  }

  private downloadURI(uri: string, name: string): void {
    const link = document.createElement('a');
    link.download = name;
    link.href = uri;
    link.click();
  }
  **/

  get duplicateTooltip(): string {
    const action = this.translate.instant('card.tooltips.duplicate');
    return this.logged ? action : this.translate.instant('card.tooltips.loginRequired', { action: action.toLowerCase() });
  }

  get editTooltip(): string {
    const action = this.translate.instant('card.tooltips.edit');
    const access = this.translate.instant('card.tooltips.accessRequired', { action: action.toLowerCase() });
    const login = this.translate.instant('card.tooltips.loginRequired', { action: action.toLowerCase() });
    return this.logged ? (this.checkUser() ? action : access) : login;
  }

  get deleteTooltip(): string {
    const action = this.translate.instant('card.tooltips.delete');
    const access = this.translate.instant('card.tooltips.accessRequired', { action: action.toLowerCase() });
    const login = this.translate.instant('card.tooltips.loginRequired', { action: action.toLowerCase() });
    return this.logged ? (this.checkUser() ? action : access) : login;
  }
}
