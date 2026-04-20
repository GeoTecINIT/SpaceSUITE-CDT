import { Component, inject, signal, ViewChild, WritableSignal} from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { CommonModule } from "@angular/common";
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ButtonModule } from 'primeng/button';
import { PanelModule } from 'primeng/panel';
import { TabsModule } from 'primeng/tabs';
import { DividerModule } from 'primeng/divider';
import { catchError, combineLatest, concatMap, finalize, forkJoin, map, of, retry, skip, Subscription, take, tap } from "rxjs";
import { ConfirmationService, MessageService } from "primeng/api";
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { Popover, PopoverModule } from 'primeng/popover';
import { AuthService, Tag, SkillTagComponent } from "@eo4geo/ngx-bok-utils";
import { UtilsService } from "../../services/useCaseServices/utils.service";
import { EducationalOffer } from "../../model/coreModel/educationalOffer";
import { EducationalOfferService } from "../../services/useCaseServices/educationalOffer.service";
import { OrganizationDBService } from "../../services/databaseServices/organizationDB.service";
import { CurriculumNode } from "../../model/coreModel/curriculumNode";
import { Skeleton, SkeletonModule } from "primeng/skeleton";

@Component({
  standalone: true,
  selector: 'offer-page',
  templateUrl: './offerPage.component.html',
  styleUrls: ['./offerPage.component.css'],
  imports: [CommonModule, ProgressSpinnerModule, ButtonModule, PanelModule, TabsModule, DividerModule, ConfirmDialogModule, ToastModule, PopoverModule, SkillTagComponent, SkeletonModule],
  providers: [ConfirmationService, MessageService]
})
export class OfferPageComponent {
  offer: WritableSignal<EducationalOffer | undefined> = signal<EducationalOffer | undefined>(undefined);
  selectedNode: WritableSignal<CurriculumNode | undefined> = signal<CurriculumNode | undefined>(undefined);

  bokConcepts: WritableSignal<Tag[]> = signal<Tag[]>([]);
  studyAreas: WritableSignal<Tag[]> = signal<Tag[]>([]);
  transversalSkills: WritableSignal<Tag[]> = signal<Tag[]>([]);
  customTransversalSkills: WritableSignal<Tag[]> = signal<Tag[]>([]);

  private userOrgIdsSubscription!: Subscription;
  private userOrgIds: string[] = [];

  private authStateSubscription!: Subscription;
  private loggedUserId: string | undefined = undefined;

  @ViewChild('op') op!: Popover;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private utilsService = inject(UtilsService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private educationalOfferService = inject(EducationalOfferService);
  private organizationService = inject(OrganizationDBService);

  ngOnInit() {
    const routeData$ = combineLatest([
      this.route.paramMap,
      this.route.queryParams
    ]).pipe(
      map(([paramMap, queryParams]) => {
        const offerId = paramMap.get('dynamicValue') || '';
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
      const isMaterialMissing = !newOffer;
      const isNotPublic = newOffer && !newOffer.isPublic;
      const belongsToUserOrg = newOffer?.orgId && this.userOrgIds.includes(newOffer.orgId);
      const belongsToUser = newOffer && userData && newOffer.userId === userData.uid;

      if (isMaterialMissing || (isNotPublic && !(belongsToUserOrg || belongsToUser))) {
          this.router.navigate(['not_found']);
      }
      else this.loadOffer(newOffer);
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
              summary: 'Info', 
              detail: `Educational offer successfully updated!`,
              life: 3000, 
              closable: true 
            }); 
            break
          case 'create':
            this.messageService.add({ 
              severity: 'info', 
              summary: 'Info', 
              detail: `Educational offer successfully created!`,
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

  private loadOffer(newOffer: EducationalOffer) {
    this.offer.set(newOffer);
    this.loadNode(newOffer.root);
  }

  loadNode(selectedNode: CurriculumNode) {
    this.selectedNode.set(selectedNode);
    this.bokConcepts.set([]);
    this.studyAreas.set([]);
    this.transversalSkills.set([]);
    this.customTransversalSkills.set([]);

    this.utilsService
      .stringToTag(selectedNode.bokConcepts.sort(), 'bok')
      .subscribe(tags => (this.bokConcepts.set(tags)));

    this.utilsService
      .stringToTag(selectedNode.studyAreas.map(value => value.getCompleteName()).sort(), 'primary')
      .subscribe(tags => (this.studyAreas.set(tags)));
    
    this.utilsService
      .stringToTag(selectedNode.transversalSkills.map(value => value.preferredLabel).sort(), 'primary')
      .subscribe(tags => (this.transversalSkills.set(tags)));
    
    this.utilsService
      .stringToTag(selectedNode.customTransversalSkills.sort())
      .subscribe(tags => (this.customTransversalSkills.set(tags)));
  }

  getOfferType() {
    const constructorName = this.offer()?.root.constructor.name;
    const formattedName = constructorName?.match(/[A-Z]+(?![a-z])|[A-Z]?[a-z]+|\d+/g)?.join(' ');
    return formattedName;
  }

  goToMainPage() {
    this.router.navigate(['']);
  }

  editMaterial() {
    this.router.navigate(['edit/' + this.offer()!.id]);
  }

  deleteModal(event: Event) {
    this.confirmationService.confirm({
        target: event.target as EventTarget,
        message: 'Do you want to delete this training material?',
        header: 'Delete Material',
        icon: 'pi pi-info-circle',
        rejectLabel: 'Cancel',
        rejectButtonProps: {
            label: 'Cancel',
            severity: 'secondary',
        },
        acceptButtonProps: {
            label: 'Delete',
            severity: 'primary',
        },

        accept: () => {
          this.deleteMaterial();
        },
        reject: () => {
        },
    });
  }

  deleteMaterial() {
    let deleteError = false;
    this.educationalOfferService.deleteEducationalOffer(this.offer()!.id).pipe(
      take(1),
      catchError((error) => {
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: error.message ?? 'Something went wrong. Try again later or contact the administrator.', 
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
/*
  downloadMaterialXML() {
    const url = this.rdfConverter.getRdfXmlUrl(this.material!);
    this.downloadURI(url, this.material?._id + '_metadata.xml');
    this.op.hide();
  }

  downloadMaterialTTL() {
    const url = this.rdfConverter.getRdfTtlUrl(this.material!);
    this.downloadURI(url, this.material?._id + '_metadata.ttl');
    this.op.hide();
  }

  downloadMaterialRDFa() {
    const url = this.rdfConverter.getRdfaUrl(this.material!);
    this.downloadURI(url, this.material?._id + '_metadata.html');
    this.op.hide();
  }

  private downloadURI(uri: string, name: string) {
    let link = document.createElement("a");
    link.download = name;
    link.href = uri;
    link.click();
  }
  */

  copyURIToClipboard() {
    navigator.clipboard.writeText(window.location.href);
    this.messageService.add({ 
      severity: 'info', 
      summary: 'Info', 
      detail: `You copied the offer url to clipboard!`,
      life: 3000, 
      closable: true 
    });
  }
}