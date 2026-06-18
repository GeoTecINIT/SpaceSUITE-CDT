import { Component, inject, signal, ViewChild, WritableSignal} from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { CommonModule, Location } from "@angular/common";
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ButtonModule } from 'primeng/button';
import { PanelModule } from 'primeng/panel';
import { TabsModule } from 'primeng/tabs';
import { DividerModule } from 'primeng/divider';
import { catchError, combineLatest, concatMap, finalize, forkJoin, map, of, retry, skip, Subscription, take, tap } from "rxjs";
import { ConfirmationService, MenuItem, MessageService } from "primeng/api";
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { Popover, PopoverModule } from 'primeng/popover';
import { AuthService, Tag, SkillTagComponent } from "@eo4geo/ngx-bok-utils";
import { UtilsService } from "../../services/utils.service";
import { EducationalOffer } from "../../model/coreModel/educationalOffer";
import { EducationalOfferService } from "../../services/educationalOffer.service";
import { OrganizationDBService } from "../../services/databaseServices/organizationDB.service";
import { CurriculumNode, NodeType } from "../../model/coreModel/curriculumNode";
import { SkeletonModule } from "primeng/skeleton";
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { OfferIndexComponent } from "../offerIndexComponent/offerIndexComponent.component";
import { Course } from "../../model/coreModel/course";
import { Lecture } from "../../model/coreModel/lecture";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { Duration } from "../../model/coreModel/duration";
import { PdfService } from "../../services/exportServices/pdf.service";
import { RdfService } from "../../services/exportServices/rdf.service";
import { JsonService } from "../../services/exportServices/json.service";
import { Grouping } from "../../model/coreModel/grouping";

@Component({
  standalone: true,
  selector: 'offer-page',
  templateUrl: './offerPage.component.html',
  styleUrls: ['./offerPage.component.css'],
  imports: [CommonModule, ProgressSpinnerModule, ButtonModule, PanelModule, TabsModule, DividerModule, BreadcrumbModule, TranslateModule,
            ConfirmDialogModule, ToastModule, PopoverModule, SkillTagComponent, SkeletonModule, DividerModule, OfferIndexComponent],
})
export class OfferPageComponent {
  offer: WritableSignal<EducationalOffer | undefined> = signal<EducationalOffer | undefined>(undefined);
  selectedNode: WritableSignal<CurriculumNode | undefined> = signal<CurriculumNode | undefined>(undefined);
  selectedNodeType: WritableSignal<string> = signal<string>("");

  bokConcepts: WritableSignal<Tag[]> = signal<Tag[]>([]);
  studyAreas: WritableSignal<Tag[]> = signal<Tag[]>([]);
  transversalSkills: WritableSignal<Tag[]> = signal<Tag[]>([]);
  customTransversalSkills: WritableSignal<Tag[]> = signal<Tag[]>([]);
  affiliations: WritableSignal<Tag[]> = signal<Tag[]>([]);

  breadcrumbItems: WritableSignal<MenuItem[]> = signal([]);

  expandPanel: boolean = false;

  public readonly groupingNodeType: NodeType = NodeType.Grouping;

  private userOrgIdsSubscription!: Subscription;
  private userOrgIds: string[] = [];

  private authStateSubscription!: Subscription;
  private loggedUserId: string | undefined = undefined;

  @ViewChild('op') op!: Popover;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private authService = inject(AuthService);
  private utilsService = inject(UtilsService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private educationalOfferService = inject(EducationalOfferService);
  private organizationService = inject(OrganizationDBService);
  private translate = inject(TranslateService);
  private pdfService = inject(PdfService);
  private rdfService = inject(RdfService);
  private jsonService = inject(JsonService);

  ngOnInit() {
    let nodeId: string = '';
    const routeData$ = combineLatest([
      this.route.paramMap,
      this.route.queryParams
    ]).pipe(
      map(([paramMap, queryParams]) => {
        const offerId = paramMap.get('offerId') || '';
        nodeId = paramMap.get('nodeId') || '';
        const submited = queryParams['submited'] === 'true' || queryParams['submited'] === true;
        return { offerId, submited };
      }),
      concatMap(({ offerId, submited }) =>
        this.educationalOfferService.getEducationalOffer(offerId).pipe(
          tap((offer) => {
            if (submited && !offer) throw new Error('Educational offer not found');
          }),
          retry({count: 1, delay: 500}),
          catchError(() => of(undefined))
        )
      ),
      take(1),
    );

    const orgIds$ = this.organizationService.getUserOrganizations().pipe(
      map(orgs => orgs.map(o => o._id)),
      tap(orgIds => this.userOrgIds = orgIds),
      take(1)
    );

    const userState$ = this.authService.getUserState().pipe(
      tap(authState => this.loggedUserId = authState?.uid),
      take(1)
    )

    forkJoin([routeData$, orgIds$, userState$]).subscribe(([newOffer, _, userData]) => {
      const isOfferMissing = !newOffer;
      const isNotPublic = newOffer && !newOffer.isPublic;
      const belongsToUserOrg = newOffer?.orgId && this.userOrgIds.includes(newOffer.orgId);
      const belongsToUser = newOffer && userData && newOffer.userId === userData.uid;

      if (isOfferMissing || (isNotPublic && !(belongsToUserOrg || belongsToUser))) {
          this.router.navigate(['not_found']);
      }
      else this.loadOffer(newOffer, nodeId);
    });

    this.userOrgIdsSubscription = this.organizationService.getUserOrganizations().pipe(
      skip(1),
      map(orgs => orgs.map(o => o._id))
    ).subscribe(ids => {
      this.userOrgIds = ids;
    });

    this.authStateSubscription = this.authService.getUserState().pipe(skip(1)).subscribe(authState => this.loggedUserId = authState?.uid);
  }

  ngAfterViewInit() {
    this.route.queryParams.subscribe(params => {
      const submited: boolean = params['submited'];
      const mode: string = params['mode'];
      if (submited){
        switch (mode){
          case 'update':
            this.messageService.add({ 
              severity: 'info', 
              summary: this.translate.instant('offerPage.toast.update.summary'), 
              detail: this.translate.instant('offerPage.toast.update.detail'), 
              life: 3000, 
              closable: true 
            }); 
            break
          case 'create':
            this.messageService.add({ 
              severity: 'info', 
              summary: this.translate.instant('offerPage.toast.create.summary'), 
              detail: this.translate.instant('offerPage.toast.create.detail'), 
              life: 3000, 
              closable: true 
            }); 
            break
        }
      }
    });
  }

  ngOnDestroy() {
    this.authStateSubscription.unsubscribe();
    this.userOrgIdsSubscription.unsubscribe();
  }

  private loadOffer(newOffer: EducationalOffer, nodeId: string) {
    this.offer.set(newOffer);
    const nodeToLoad = newOffer.getNodeById(nodeId) || newOffer.root;
    this.loadNode(nodeToLoad);
  }

  private loadNode(selectedNode: CurriculumNode) {
    if (selectedNode.id === this.selectedNode()?.id) return;

    this.location.replaceState('offer/' + this.offer()!.id + "/" + selectedNode.id);

    
    this.selectedNodeType.set(this.getNodeType(selectedNode.nodeType));
    this.selectedNode.set(selectedNode);
    this.bokConcepts.set([]);
    this.studyAreas.set([]);
    this.transversalSkills.set([]);
    this.customTransversalSkills.set([]);

    this.breadcrumbItems.set(this.buildBreadCrumb(selectedNode));

    this.utilsService
      .bokStringToTag(selectedNode.bokConcepts.sort())
      .subscribe(tags => (this.bokConcepts.set(tags)));

    this.studyAreas.set(selectedNode.studyAreas.map(value => new Tag(value.getCompleteName(), 'primary')));
    
    this.transversalSkills.set(selectedNode.transversalSkills.map(value => new Tag(value.preferredLabel, 'url', undefined, undefined, value.uri)));

    this.affiliations.set(selectedNode.affiliations.map(value => {
      if (value.url) return new Tag(value.name, 'url', undefined, undefined, value.url);
      return new Tag(value.name, 'primary');
    }));

    this.customTransversalSkills.set(selectedNode.customTransversalSkills.map(value => new Tag(value, 'primary')));
  }

  getGroupingType(): string {
    const selectedNode = this.selectedNode();
    if (selectedNode instanceof Grouping) {
      return this.utilsService.getTranslatedGroupingType(selectedNode.groupingType);
    }
    return "";
  }

  getGroupingName(): string {
    const selectedNode = this.selectedNode();
    if (selectedNode instanceof Grouping) {
      return selectedNode.groupingName;
    }
    return "";
  }

  getAssessment(): string {
    const selectedNode = this.selectedNode();
    if (selectedNode instanceof Course) {
      return selectedNode.assessment;
    }
    return "";
  }

  getCourseType(): string | undefined {
    const selectedNode = this.selectedNode();
    if (selectedNode instanceof Course && selectedNode.courseType) {
      return this.utilsService.getTranslatedCourseType(selectedNode.courseType);
    }
    return undefined;
  }

  getIsPractical(): string {
    const selectedNode = this.selectedNode();
    if (selectedNode instanceof Lecture) {
      if(selectedNode.isPractical) this.translate.instant('boolean.true');
    }
    return this.translate.instant('boolean.false');
  }

  changeSelectedNode(nodeId: string) {
    const newNode = this.offer()!.getNodeById(nodeId);
    if (newNode == undefined) return;
    this.loadNode(newNode);
  }

  buildBreadCrumb(child: CurriculumNode): MenuItem[] {
    const findPath = (
      current: CurriculumNode,
      target: CurriculumNode,
      path: CurriculumNode[]
    ): CurriculumNode[] | null => {
      const newPath = [...path, current];

      if (current.id === target.id) return newPath;

      for (const c of current.getChildren()) {
        const result = findPath(c, target, newPath);
        if (result) return result;
      }

      return null;
    };

    const path = findPath(this.offer()!.root, child, []) ?? [];

    return path.map((node, index) => {
      if (index != path.length - 1) {
          return ({
          id: node.id,
          label: node.name,
          command: (event) => this.loadNode(this.offer()!.getNodeById(event.item!.id!)!),
          style: { cursor: 'pointer' }
        })
      }
      return  ({
          id: node.id,
          label: node.name,
          styleClass: 'font-bold',
          link: false,
          style: { cursor: 'default', pointerEvents: 'none', color: 'var(--primary-color)'}
        })
    });
  }

  goToMainPage() {
    this.router.navigate(['']);
  }

  editOffer() {
    this.router.navigate(['edit/' + this.offer()!.id]);
  }

  deleteModal(event: Event) {
    this.confirmationService.confirm({
        target: event.target as EventTarget,
        message: this.translate.instant('offerPage.modal.delete.message'),
        header: this.translate.instant('offerPage.modal.delete.header'),
        icon: 'pi pi-info-circle',
        rejectButtonProps: {
            label: this.translate.instant('offerPage.modal.delete.reject'),
            severity: 'secondary',
        },
        acceptButtonProps: {
            label: this.translate.instant('offerPage.modal.delete.accept'),
            severity: 'danger',
        },

        accept: () => {
          this.deleteOffer();
        },
        reject: () => {
        },
    });
  }

  deleteOffer() {
    let deleteError = false;
    this.educationalOfferService.deleteEducationalOffer(this.offer()!.id).pipe(
      take(1),
      catchError((error) => {
        this.messageService.add({ 
          severity: 'error', 
          summary: this.translate.instant('offerPage.toast.error.summary'),
          detail: error.message ?? this.translate.instant('offerPage.toast.error.detail'),
          life: 3000, 
          closable: true 
        });
        deleteError = true;
        return of(null)
      }),
      finalize(() => {
        if (!deleteError) this.router.navigate([''], {queryParams: { submited: true, mode: 'delete' }});
      })
    ).subscribe();
  }

  checkUser() {
    return (this.loggedUserId == this.offer()?.userId);
  }

  checkOrganizations() {
    const currentOffer = this.offer();
    return (currentOffer != undefined &&  currentOffer.orgId && this.userOrgIds.includes(currentOffer.orgId));
  }

  onClickConcept(code: string) {
    window.open('https://geospacebok.eu/' + code)
  }

  toggle(event: any) {
    this.op.toggle(event);
  }

  downloadPDF(): void {
    document.body.style.cursor = 'wait';
    this.op.hide();

    this.pdfService
      .generateOfferPdf(new EducationalOffer(this.offer()!.root, this.offer()))
      .subscribe((pdf) => {
        this.downloadURI(pdf.url, pdf.filename);
        document.body.style.cursor = '';
      });
  }
  downloadOfferXML() {
    const url = this.rdfService.getRdfXmlUrl(this.offer()!);
    this.downloadURI(url, this.offer()!.id + '_metadata.xml');
    this.op.hide();
  }

  downloadOfferTTL() {
    const url = this.rdfService.getRdfTtlUrl(this.offer()!);
    this.downloadURI(url, this.offer()!.id + '_metadata.ttl');
    this.op.hide();
  }

  downloadOfferRDFa() {
    const url = this.rdfService.getRdfaUrl(this.offer()!);
    this.downloadURI(url, this.offer()!.id + '_metadata.html');
    this.op.hide();
  }

  downloadOfferJSON() {
    const url = this.jsonService.getJSONUrl(this.offer()!);
    this.downloadURI(url, this.offer()!.id + '_metadata.json');
    this.op.hide();
  }

  private downloadURI(uri: string, name: string) {
    let link = document.createElement("a");
    link.download = name;
    link.href = uri;
    link.click();
  }

  copyURIToClipboard() {
    navigator.clipboard.writeText(window.location.href);
    this.messageService.add({ 
      severity: 'info', 
      summary: this.translate.instant('offerPage.toast.copy.summary'),
      detail: this.translate.instant('offerPage.toast.copy.detail'),
      life: 3000, 
      closable: true 
    });
  }

  getNodeType(type: NodeType): string {
    return this.utilsService.getTranslatedNodeType(type);
  }

  getTimeRequiredUnit(timeRequired: Duration | undefined) {
    if (!timeRequired) return '';
    return this.utilsService.getTranslatedDurationUnit(timeRequired.unit);
  }
}