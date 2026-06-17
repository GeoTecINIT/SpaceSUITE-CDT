import { Component, inject, Input, signal, WritableSignal } from "@angular/core";
import { EducationalOffer } from "../../model/coreModel/educationalOffer";
import { StudyProgram } from "../../model/coreModel/studyProgram";
import { ToastModule } from "primeng/toast";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { AuthService, ExitWithoutSavingService } from "@eo4geo/ngx-bok-utils";
import { ActivatedRoute, Router, UrlTree } from "@angular/router";
import { catchError, EMPTY, of, Subscription, switchMap, take } from "rxjs";
import { ConfirmationService, MessageService } from "primeng/api";
import { FormsModule } from "@angular/forms";
import { FloatLabelModule } from "primeng/floatlabel";
import { SelectModule } from 'primeng/select';
import { CurriculumNode, NodeType } from "../../model/coreModel/curriculumNode";
import { OfferIndexComponent } from "../offerIndexComponent/offerIndexComponent.component";
import { TooltipModule } from "primeng/tooltip";
import { ButtonModule } from "primeng/button";
import { Course } from "../../model/coreModel/course";
import { Lecture } from "../../model/coreModel/lecture";
import { DialogModule } from "primeng/dialog";
import { PanelModule } from "primeng/panel";
import { CurriculumNodeFormComponent } from "../curriculumNodeForm/curriculumNodeForm.component";
import { EducationalOfferService } from "../../services/educationalOffer.service";
import { OfferValidationService } from "../../services/offerValidation.service";
import { OrganizationDBService } from "../../services/databaseServices/organizationDB.service";
import { SelectButtonModule } from "primeng/selectbutton";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { UtilsService } from "../../services/utils.service";
import { MessageModule } from 'primeng/message';
import { Grouping, GroupingType } from "../../model/coreModel/grouping";

@Component({
  standalone: true,
  selector: 'offer-form',
  templateUrl: './offerForm.component.html',
  styleUrls: ['./offerForm.component.css'],
  imports: [ToastModule, ConfirmDialogModule, FloatLabelModule, FormsModule, PanelModule, OfferIndexComponent, SelectModule, TooltipModule, 
            ButtonModule, DialogModule, CurriculumNodeFormComponent, SelectButtonModule, TranslateModule, MessageModule],
})
export class OfferFormComponent {
  @Input() inputPageName?: string;
  @Input() inputOffer?: EducationalOffer;
  pageName: string = 'Create New Educational Offer'
  offer: WritableSignal<EducationalOffer> = signal(new EducationalOffer(new StudyProgram(undefined, this.generateTimeBasedID())));
  selectedNode: WritableSignal<CurriculumNode> = signal<CurriculumNode>(this.offer().root);
  errorMap: Map<string, string> = new Map();

  rootNodeModalVisible: boolean = false;
  rootNodeModalClosable: boolean = false;

  rootNodeType: NodeType | undefined;
  rootNodeGroupingType: GroupingType | undefined;

  newNodeType: NodeType | undefined;
  newNodeGroupingType: GroupingType | undefined;

  public readonly groupingNodeType: NodeType = NodeType.Grouping;

  private CHILD_TYPES?: Record<string, Object[]>;

  private GROUPING_CHILD_TYPES?: Record<GroupingType, Object[]>;

  private GROUPING_TYPES?: Record<string, Object[]>;

  public IS_PUBLIC?: any[];

  organizations: object[] = [];
  divisions: string[] = [];

  loggedUserId!: string;

  expandPanel: boolean = false;

  promotedNode?: string;

  private previousNavigationUrl?: UrlTree;

  private sessionSubscription?: Subscription;
  private userOrgsSubscription?: Subscription;
  private langChangeSub: Subscription;

  private authService: AuthService = inject(AuthService);
  private confirmationService: ConfirmationService = inject(ConfirmationService);
  private messageService: MessageService = inject(MessageService);
  private exitWithoutSavingService: ExitWithoutSavingService = inject(ExitWithoutSavingService);
  private router: Router = inject(Router);
  private route: ActivatedRoute = inject(ActivatedRoute);
  private educationalOfferService: EducationalOfferService = inject(EducationalOfferService);
  private offerValidationService: OfferValidationService = inject(OfferValidationService);
  private organizationDBService: OrganizationDBService = inject(OrganizationDBService);
  private translate: TranslateService = inject(TranslateService);
  private utilsService: UtilsService = inject(UtilsService);

  constructor() {
    this.langChangeSub = this.translate.onLangChange.subscribe(() => this.buildSelectOptions());
    this.buildSelectOptions()
  }

  ngOnInit() {
    this.route.paramMap.pipe(switchMap(paramMap => {
      const offerId = paramMap.get('offerId');
      if (!offerId) return of(undefined)
      else return this.educationalOfferService.getEducationalOffer(offerId).pipe(take(1));
    })).subscribe((duplicatedOffer: EducationalOffer | undefined) => {
      if (this.inputOffer) {
        this.offer.set(new EducationalOffer(this.inputOffer.root, this.inputOffer));
        this.organizationDBService.getOrganizationDivisions(this.offer().orgId).subscribe(divisions => this.divisions = divisions);
      } else if (duplicatedOffer) {
        this.offer.set(new EducationalOffer(duplicatedOffer.root));
      }
      else {
        this.rootNodeModalVisible = true;
      }

      this.selectedNode.set(this.offer().root);
    });

    this.sessionSubscription = this.authService.getUserState().subscribe ( state => {
      if (!state?.logged) {
        this.exitWithoutSavingService.bypassGuard.next(true);
        this.router.navigate(['']);
      }
      else this.loggedUserId = state.uid;
    });

    this.exitWithoutSavingService.showModalSubject.subscribe(value => {
      if (value) this.confirmExitWithoutSaving()
    });

    this.userOrgsSubscription = this.organizationDBService.getUserOrganizations().subscribe(organizations => {
      this.organizations = [];
      organizations.forEach(organization =>
        this.organizations.push({label: organization.name, value: organization._id})
      )
    });

    const initial = this.router.lastSuccessfulNavigation?.previousNavigation?.initialUrl?.toString();
    this.previousNavigationUrl = initial ? this.router.parseUrl(initial.split('?')[0]) : undefined;
  }

  ngOnDestroy() {
    this.sessionSubscription?.unsubscribe();
    this.userOrgsSubscription?.unsubscribe();
    this.langChangeSub.unsubscribe();
  }

  confirmExitWithoutSaving() {
    this.confirmationService.confirm({
      message: this.translate.instant('offerForm.modal.exit.message'),
      header: this.translate.instant('offerForm.modal.exit.header'),
      icon: 'pi pi-info-circle',
      rejectButtonProps: {
        label: this.translate.instant('offerForm.modal.exit.reject'),
        severity: 'secondary',
      },
      acceptButtonProps: {
        label: this.translate.instant('offerForm.modal.exit.accept'),
        severity: 'danger',
      },
      accept: () => this.exitWithoutSavingService.exitSubject.next(true),
      reject: () => this.exitWithoutSavingService.exitSubject.next(false),
    });
  }

  getValidChildTypes(): Object[] {
    const node = this.selectedNode();
    if (!node) return [];
    const nodeType = node.nodeType;
    if (nodeType === NodeType.Grouping && node instanceof Grouping) {
      return this.GROUPING_CHILD_TYPES![node.groupingType] ?? [];
    }
    return this.CHILD_TYPES![nodeType.toString()] ?? [];
  }

  getRootNodeTypes(): Object[] {
    return this.CHILD_TYPES!['Root'];
  }

  getValidGroupingTypes(): object[] {
    const node = this.selectedNode();
    if (!node) return [];
    const nodeType = node.nodeType
    return this.GROUPING_TYPES![nodeType.toString()] ?? [];
  }

  getRootGroupingTypes(): object[] {
    return this.GROUPING_TYPES!['Root'];
  }

  updateSelectedNode() {
    this.offer.update(o =>
      Object.assign(Object.create(Object.getPrototypeOf(o)), o)
    );
  }

  changeSelectedNode(nodeId: string) {
    this.newNodeType = undefined;
    this.newNodeGroupingType = undefined;
    this.promotedNode = undefined;
    const newNode = this.offer().getNodeById(nodeId);
    if (newNode == undefined) return;
    this.selectedNode.set(newNode);
  }

  addNewChild() {
    let newChild: CurriculumNode;
    switch(this.newNodeType) {
      case NodeType.StudyProgram:
        newChild = new StudyProgram(undefined, this.generateTimeBasedID());
        break;
      case NodeType.Grouping:
        const newGrouping = new Grouping(undefined, this.generateTimeBasedID());
        newGrouping.groupingType = this.newNodeGroupingType || GroupingType.Course;
        newChild = newGrouping;
        break;
      case NodeType.Course:
        newChild = new Course(undefined, this.generateTimeBasedID());
        break;
      case NodeType.Lecture:
        newChild = new Lecture(undefined, this.generateTimeBasedID());
        break;
      default:
        this.messageService.add({ 
          severity: 'error', 
          summary: this.translate.instant('offerForm.toast.invalidTypeError.summary'), 
          detail: this.translate.instant('offerForm.toast.invalidTypeError.detail'), 
          life: 3000, 
          closable: true 
        });
        return;
    }
    const parent = this.selectedNode();
    if (!parent) return;

    this.offer.update(offer => {
      offer.getNodeById(parent.id)?.addChild(newChild);
      return Object.assign(
        Object.create(Object.getPrototypeOf(offer)),
        offer
      );
    });
  }

  addRootNode() {
    let newRoot: CurriculumNode;
    switch(this.rootNodeType) {
      case NodeType.StudyProgram:
        newRoot = new StudyProgram(undefined, this.generateTimeBasedID());
        break;
      case NodeType.Grouping:
        const newGrouping = new Grouping(undefined, this.generateTimeBasedID());
        newGrouping.groupingType = this.rootNodeGroupingType || GroupingType.StudyProgram;
        newRoot = newGrouping;
        break;
      case NodeType.Course:
        newRoot = new Course(undefined, this.generateTimeBasedID());
        break;
      case NodeType.Lecture:
        newRoot = new Lecture(undefined, this.generateTimeBasedID());
        break;
      default:
        this.messageService.add({ 
          severity: 'error', 
          summary: this.translate.instant('offerForm.toast.invalidTypeError.summary'), 
          detail: this.translate.instant('offerForm.toast.invalidTypeError.detail'), 
          life: 3000, 
          closable: true 
        });
        return;
    }

    this.offer.update(offer => {
      offer.root = newRoot;
      return Object.assign(
        Object.create(Object.getPrototypeOf(offer)),
        offer
      );
    });
    this.rootNodeType = undefined;
    this.rootNodeGroupingType = undefined;
    this.selectedNode.set(this.offer().root);
    this.rootNodeModalVisible = false;
    this.rootNodeModalClosable = false;
  }

  replaceRootNode() {
    this.rootNodeModalVisible = true;
    this.rootNodeModalClosable = true;
  }

  deleteModal(event: Event) {
    if (this.selectedNode().id === this.offer().root.id) {
      this.messageService.add({ 
        severity: 'error', 
        summary: this.translate.instant('offerForm.toast.deleteRootError.summary'), 
        detail: this.translate.instant('offerForm.toast.deleteRootError.detail'), 
        life: 3000, 
        closable: true 
      });
    }
    else {
      this.confirmationService.confirm({
        target: event.target as EventTarget,
        message: this.translate.instant('offerForm.modal.deleteNode.message'),
        header: this.translate.instant('offerForm.modal.deleteNode.header'),
        icon: 'pi pi-info-circle',
        rejectButtonProps: {
          label: this.translate.instant('offerForm.modal.deleteNode.reject'),
          severity: 'secondary',
        },
        acceptButtonProps: {
          label: this.translate.instant('offerForm.modal.deleteNode.accept'),
          severity: 'danger',
        },

        accept: () => {
          this.deleteSelectedNode();
        },
        reject: () => {},
      });
    }
  }

  returnToHomepage() {
    if (this.previousNavigationUrl) this.router.navigateByUrl(this.previousNavigationUrl);
    else this.router.navigate(['']);
  }

  submitEducationalOffer() {
    this.exitWithoutSavingService.bypassGuard.next(true);
    if (!this.inputOffer) this.offer().userId = this.loggedUserId;
    else this.offer().updatedAt = new Date();
    this.errorMap = this.offerValidationService.validateEducationalOffer(this.offer());
    if (this.errorMap.size == 0) {
      this.educationalOfferService.submitEducationalOffer(this.offer(), this.inputOffer).pipe(
        take(1),
        catchError( error => {
          console.error(error)
          this.messageService.add({ 
            severity: 'error', 
            summary: this.translate.instant('offerForm.toast.submitError.summary'), 
            detail: this.translate.instant('offerForm.toast.submitError.detail'), 
            life: 3000, 
            closable: true 
          });
          return EMPTY;
        })
      ).subscribe(eduOfferId => {
        this.router.navigate(
          ['offer/' + eduOfferId], 
          { 
            queryParams: { 
              submited: true, 
              mode: this.inputOffer != undefined ? 'update' : 'create' 
            } 
          }
        );
      });
    }
    else {
      this.messageService.add({ 
        severity: 'error', 
        summary: this.translate.instant('offerForm.toast.mandatoryFieldsError.summary'), 
        detail: this.translate.instant('offerForm.toast.mandatoryFieldsError.detail'), 
        life: 3000, 
        closable: true 
      });
    }
  }

  loadDivisions(newValue: {label: string, value: string}) {
    this.offer().orgId = newValue.value;
    this.offer().orgName = newValue.label;
    this.offer().division = undefined;
    this.organizationDBService.getOrganizationDivisions(this.offer().orgId).subscribe(divisions => this.divisions = divisions);
  }

  private deleteSelectedNode() {
    this.offer.update(offer => {
      offer.removeNode(this.selectedNode().id)
      return Object.assign(
        Object.create(Object.getPrototypeOf(offer)),
        offer
      );
    });
    this.selectedNode.set(this.offer().root);
    this.messageService.add({ 
      severity: 'info', 
      summary: this.translate.instant('offerForm.toast.nodeDeleted.summary'), 
        detail: this.translate.instant('offerForm.toast.nodeDeleted.detail'), 
      life: 3000, 
      closable: true 
    });
  }

  private generateTimeBasedID() {  
    const now = new Date();  
  
    const year = now.getFullYear();  
    const month = String(now.getMonth() + 1).padStart(2, '0');  
    const day = String(now.getDate()).padStart(2, '0');  
    const hour = String(now.getHours()).padStart(2, '0');  
    const minute = String(now.getMinutes()).padStart(2, '0');  
    const second = String(now.getSeconds()).padStart(2, '0');  
    const millisecond = String(now.getMilliseconds()).padStart(3, '0');  
  
    return `${year}-${month}-${day}-${hour}-${minute}-${second}-${millisecond}`;  
  }  

  private buildSelectOptions() {
    if(this.inputPageName == undefined) this.pageName = this.translate.instant('offerForm.headers.pageName')
    this.CHILD_TYPES = {
      'Root': [
        {value: NodeType.StudyProgram, label: this.translate.instant('nodeTypes.studyProgram')},
        {value: NodeType.Grouping, label: this.translate.instant('nodeTypes.grouping')},
        {value: NodeType.Course, label: this.translate.instant('nodeTypes.course')},
        {value: NodeType.Lecture, label: this.translate.instant('nodeTypes.lecture')}
      ],
      'Study Program': [
        {value: NodeType.Grouping, label: this.translate.instant('nodeTypes.grouping')},
        {value: NodeType.Course, label: this.translate.instant('nodeTypes.course')},
        {value: NodeType.Lecture, label: this.translate.instant('nodeTypes.lecture')}
      ],
      'Course': [
        {value: NodeType.Grouping, label: this.translate.instant('nodeTypes.grouping')},
        {value: NodeType.Lecture, label: this.translate.instant('nodeTypes.lecture')}
      ],
      'Lecture': [],
    };

    this.GROUPING_CHILD_TYPES = {
      [GroupingType.StudyProgram]: [{value: NodeType.StudyProgram, label: this.translate.instant('nodeTypes.studyProgram')}],
      [GroupingType.Course]:       [{value: NodeType.Course, label: this.translate.instant('nodeTypes.course')}],
      [GroupingType.Lecture]:      [{value: NodeType.Lecture, label: this.translate.instant('nodeTypes.lecture')}],
    };

    this.GROUPING_TYPES = {
      'Root': [
        {
          label: this.translate.instant('groupingTypes.studyProgram'),
          value: GroupingType.StudyProgram
        },
        {
          label: this.translate.instant('groupingTypes.course'),
          value: GroupingType.Course
        },
        {
          label: this.translate.instant('groupingTypes.lecture'),
          value: GroupingType.Lecture
        }
      ],
      'Study Program': [
        {
          label: this.translate.instant('groupingTypes.course'),
          value: GroupingType.Course
        },
        {
          label: this.translate.instant('groupingTypes.lecture'),
          value: GroupingType.Lecture
        }
      ],
      'Course': [
        {
          label: this.translate.instant('groupingTypes.lecture'),
          value: GroupingType.Lecture
        }
      ],
      'Lecture': [],
    };

    this.IS_PUBLIC = [
      { label: this.translate.instant('offerForm.isPublic.public'), value: true },
      { label: this.translate.instant('offerForm.isPublic.private'), value: false }
    ];
  }

  getSelectedNodeType(): string {
    return this.utilsService.getTranslatedNodeType(this.selectedNode().nodeType);
  }

  getNewNodeType(): string {
    return this.newNodeType ? this.utilsService.getTranslatedNodeType(this.newNodeType) : '';
  }

  showPromoteModal(event: Event) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: this.translate.instant('offerForm.modal.promoteNode.message'),
      header: this.translate.instant('offerForm.modal.promoteNode.header'),
      icon: 'pi pi-info-circle',
      rejectButtonProps: {
        label: this.translate.instant('offerForm.modal.promoteNode.reject'),
        severity: 'secondary',
      },
      acceptButtonProps: {
        label: this.translate.instant('offerForm.modal.promoteNode.accept'),
        severity: 'primary',
      },

      accept: () => {
        this.promoteSelectedNode();
      },
      reject: () => {},
    });
  }

  private promoteSelectedNode() {
    let newNode: CurriculumNode;
    switch(this.selectedNode().nodeType) {
      case NodeType.StudyProgram:
        newNode = new StudyProgram(this.selectedNode());
        break;
      case NodeType.Course:
        newNode = new Course(this.selectedNode());
        break;
      case NodeType.Grouping:
        newNode = new Grouping(this.selectedNode());
        break;
      case NodeType.Lecture:
        newNode = new Lecture(this.selectedNode());
        break;
      default:
        newNode = new StudyProgram(this.selectedNode());
    }
    const newOffer = new EducationalOffer(newNode);
    newOffer.isPublic = this.offer().isPublic;
    newOffer.userId = this.loggedUserId;
    newOffer.orgId = this.offer().orgId;
    newOffer.orgName = this.offer().orgName;
    newOffer.division = this.offer().division;

    this.errorMap = this.offerValidationService.validateEducationalOffer(newOffer);
    if (this.errorMap.size == 0) {
      this.educationalOfferService.submitEducationalOffer(newOffer).pipe(
        take(1),
        catchError( error => {
          console.error(error)
          this.messageService.add({ 
            severity: 'error', 
            summary: this.translate.instant('offerForm.toast.submitError.summary'), 
            detail: this.translate.instant('offerForm.toast.submitError.detail'), 
            life: 3000, 
            closable: true 
          });
          return EMPTY;
        })
      ).subscribe(eduOfferId => {
        const path = this.router.serializeUrl(
          this.router.createUrlTree([`/offer/${eduOfferId}`])
        );
        this.promotedNode = `${window.location.origin}${path}`;
      });
    }
    else {
      this.messageService.add({ 
        severity: 'error', 
        summary: this.translate.instant('offerForm.toast.mandatoryFieldsError.summary'), 
        detail: this.translate.instant('offerForm.toast.mandatoryFieldsError.detail'), 
        life: 3000, 
        closable: true 
      });
    }
  }
}