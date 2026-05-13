import { Component, inject, Input, signal, WritableSignal } from "@angular/core";
import { EducationalOffer } from "../../model/coreModel/educationalOffer";
import { StudyProgram } from "../../model/coreModel/studyProgram";
import { ToastModule } from "primeng/toast";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { AuthService, ExitWithoutSavingService } from "@eo4geo/ngx-bok-utils";
import { Router } from "@angular/router";
import { Subscription, take } from "rxjs";
import { ConfirmationService, MessageService } from "primeng/api";
import { FormsModule } from "@angular/forms";
import { FloatLabelModule } from "primeng/floatlabel";
import { SelectModule } from 'primeng/select';
import { CurriculumNode } from "../../model/coreModel/curriculumNode";
import { OfferIndexComponent } from "../offerIndexComponent/offerIndexComponent.component";
import { UtilsService } from "../../services/useCaseServices/utils.service";
import { Module, ModuleType } from "../../model/coreModel/module";
import { TooltipModule } from "primeng/tooltip";
import { ButtonModule } from "primeng/button";
import { Course } from "../../model/coreModel/course";
import { Lecture } from "../../model/coreModel/lecture";
import { DialogModule } from "primeng/dialog";
import { PanelModule } from "primeng/panel";
import { CurriculumNodeFormComponent } from "../curriculumNodeForm/curriculumNodeForm.component";

@Component({
  standalone: true,
  selector: 'offer-form',
  templateUrl: './offerForm.component.html',
  styleUrls: ['./offerForm.component.css'],
  imports: [ToastModule, ConfirmDialogModule, FloatLabelModule, FormsModule, PanelModule, OfferIndexComponent, SelectModule, TooltipModule, 
            ButtonModule, DialogModule, CurriculumNodeFormComponent],
})
export class OfferFormComponent {
  @Input() pageName: string = 'Create New Educational Offer';
  @Input() inputOffer?: EducationalOffer;
  offer: WritableSignal<EducationalOffer> = signal(new EducationalOffer(new StudyProgram(undefined, this.generateTimeBasedID())));
  selectedNode: WritableSignal<CurriculumNode> = signal<CurriculumNode>(this.offer().root);
  errorMap: Map<string, string | undefined> = new Map();

  rootNodeModalVisible: boolean = false;
  rootNodeModalClosable: boolean = false;

  rootNodeType: string | undefined;
  rootNodeModuleType: ModuleType | undefined;

  newNodeType: string | undefined;
  newNodeModuleType: ModuleType | undefined;

  private readonly CHILD_TYPES: Record<string, string[]> = {
    'Root': ['Study Program', 'Module', 'Course', 'Lecture'],
    'Study Program': ['Module', 'Course', 'Lecture'],
    'Course': ['Module', 'Lecture'],
    'Lecture': [],
  };

  private readonly MODULE_CHILD_TYPES: Record<ModuleType, string[]> = {
    [ModuleType.StudyProgram]: ['Study Program'],
    [ModuleType.Course]:       ['Course'],
    [ModuleType.Lecture]:      ['Lecture'],
  };

  private readonly MODULE_TYPES: Record<string, Object[]> = {
    'Root': [
      {
        label: ModuleType.StudyProgram.charAt(0).toUpperCase() + ModuleType.StudyProgram.slice(1),
        value: ModuleType.StudyProgram
      },
      {
        label: ModuleType.Course.charAt(0).toUpperCase() + ModuleType.Course.slice(1),
        value: ModuleType.Course
      },
      {
        label: ModuleType.Lecture.charAt(0).toUpperCase() + ModuleType.Lecture.slice(1),
        value: ModuleType.Lecture
      }
    ],
    'Study Program': [
      {
        label: ModuleType.Course.charAt(0).toUpperCase() + ModuleType.Course.slice(1),
        value: ModuleType.Course
      },
      {
        label: ModuleType.Lecture.charAt(0).toUpperCase() + ModuleType.Lecture.slice(1),
        value: ModuleType.Lecture
      }
    ],
    'Course': [
      {
        label: ModuleType.Lecture.charAt(0).toUpperCase() + ModuleType.Lecture.slice(1),
        value: ModuleType.Lecture
      }
    ],
    'Lecture': [],
  };

  private sessionSubscription?: Subscription;

  private authService: AuthService = inject(AuthService);
  private confirmationService: ConfirmationService = inject(ConfirmationService);
  private messageService: MessageService = inject(MessageService);
  private exitWithoutSavingService: ExitWithoutSavingService = inject(ExitWithoutSavingService);
  private router: Router = inject(Router);
  private utilsService: UtilsService = inject(UtilsService);

  ngOnInit() {
    this.sessionSubscription = this.authService.getUserState().subscribe ( state => {
      if (!state?.logged) {
        this.exitWithoutSavingService.bypassGuard.next(true);
        this.router.navigate(['']);
      }
    })
    if (this.inputOffer) {
      this.offer.set(new EducationalOffer(this.inputOffer.root, this.inputOffer));
    }
    else this.rootNodeModalVisible = true;
    this.selectedNode.set(this.offer().root);
    this.exitWithoutSavingService.showModalSubject.subscribe(value => {
      if (value) this.confirmExitWithoutSaving()
    });
  }

  ngOnDestroy() {
    this.sessionSubscription?.unsubscribe();
  }

  confirmExitWithoutSaving() {
    this.confirmationService.confirm({
      message: 'Are you sure that you want to exit without saving?',
      header: 'Exit Without Saving',
      icon: 'pi pi-info-circle',
      rejectButtonProps: {
        label: 'Cancel',
        severity: 'secondary',
      },
      acceptButtonProps: {
        label: 'Exit',
        severity: 'primary',
      },
      accept: () => this.exitWithoutSavingService.exitSubject.next(true),
      reject: () => this.exitWithoutSavingService.exitSubject.next(false),
    });
  }

  getValidChildTypes(): string[] {
    const node = this.selectedNode();
    if (!node) return [];
    const nodeType = this.utilsService.getNodeType(node);
    if (nodeType === 'Module' && node instanceof Module) {
      return this.MODULE_CHILD_TYPES[node.moduleType] ?? [];
    }
    return this.CHILD_TYPES[nodeType] ?? [];
  }

  getRootNodeTypes(): string[] {
    return this.CHILD_TYPES['Root'];
  }

  getValidModuleTypes(): object[] {
    const node = this.selectedNode();
    if (!node) return [];
    const nodeType = this.utilsService.getNodeType(node);
    return this.MODULE_TYPES[nodeType] ?? [];
  }

  getRootModuleTypes(): object[] {
    return this.MODULE_TYPES['Root'];
  }

  updateSelectedNode() {
    this.offer.update(o =>
      Object.assign(Object.create(Object.getPrototypeOf(o)), o)
    );
  }

  changeSelectedNode(nodeId: string) {
    this.newNodeType = undefined;
    this.newNodeModuleType = undefined;
    const newNode = this.offer().getNodeById(nodeId);
    if (newNode == undefined) return;
    this.selectedNode.set(newNode);
  }

  addNewChild() {
    let newChild: CurriculumNode;
    switch(this.newNodeType) {
      case 'Study Program':
        newChild = new StudyProgram(undefined, this.generateTimeBasedID());
        break;
      case 'Module':
        const newModule = new Module(undefined, this.generateTimeBasedID());
        newModule.moduleType = this.newNodeModuleType || ModuleType.Course;
        newChild = newModule;
        break;
      case 'Course':
        newChild = new Course(undefined, this.generateTimeBasedID());
        break;
      case 'Lecture':
        newChild = new Lecture(undefined, this.generateTimeBasedID());
        break;
      default:
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: 'Invalid node type. Try again with other node type.', 
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
      case 'Study Program':
        newRoot = new StudyProgram(undefined, this.generateTimeBasedID());
        break;
      case 'Module':
        const newModule = new Module(undefined, this.generateTimeBasedID());
        newModule.moduleType = this.rootNodeModuleType || ModuleType.StudyProgram;
        newRoot = newModule;
        break;
      case 'Course':
        newRoot = new Course(undefined, this.generateTimeBasedID());
        break;
      case 'Lecture':
        newRoot = new Lecture(undefined, this.generateTimeBasedID());
        break;
      default:
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: 'Invalid node type. Try again with other node type.', 
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
    this.rootNodeModuleType = undefined;
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
        summary: 'Error', 
        detail: 'Invalid node selection. Root node cannot be deleted, try again with other node.', 
        life: 3000, 
        closable: true 
      });
    }
    else {
      this.confirmationService.confirm({
        target: event.target as EventTarget,
        message: 'Do you want to delete the selected curriculum node?',
        header: 'Delete Node',
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
          this.deleteSelectedNode();
        },
        reject: () => {},
      });
    }
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
      summary: 'Info',
      detail: 'Node deleted without problems.', 
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
}