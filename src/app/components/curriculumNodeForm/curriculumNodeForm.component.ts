import { Component, EventEmitter, inject, Input, Output, SimpleChanges } from "@angular/core";
import { ToastModule } from "primeng/toast";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { Subscription, take } from "rxjs";
import { TreeNode } from "primeng/api";
import { InputTextModule } from "primeng/inputtext";
import { FormsModule } from "@angular/forms";
import { InputIconModule } from "primeng/inputicon";
import { IconFieldModule } from "primeng/iconfield";
import { FloatLabelModule } from "primeng/floatlabel";
import { StepperModule } from 'primeng/stepper';
import { SelectModule } from 'primeng/select';
import { CurriculumNode } from "../../model/coreModel/curriculumNode";
import { TooltipModule } from "primeng/tooltip";
import { ButtonModule } from "primeng/button";
import { TextareaModule } from 'primeng/textarea';
import { DialogModule } from "primeng/dialog";
import { InputNumberModule } from 'primeng/inputnumber';
import { BokModalComponent } from "../bokModal/bokModal.component";
import { PanelModule } from "primeng/panel";
import { TextChipsComponent } from "../textChips/textChips.component";
import { CustomSelectComponent } from "../customSelect/customSelect.component";
import { MultiselectChipsComponent } from "../multiselectChips/multiselectChips.component";
import { IscedfAreaService } from "../../services/iscedfArea.service";
import { ISCEDFArea } from "../../model/coreModel/iscedfArea";
import { TreeselectChipsComponent } from "../treeselectChips/treeselectChips.component";
import { ESCOService } from "../../services/esco.service";
import { DurationUnit } from "../../model/coreModel/duration";
import { DividerModule } from "primeng/divider";
import { TrainingMaterial } from "../../model/coreModel/trainingMaterial";
import { Affiliation } from "../../model/coreModel/affiliation";
import { Course, CourseType } from "../../model/coreModel/course";
import { Lecture } from "../../model/coreModel/lecture";
import { SelectButtonModule } from "primeng/selectbutton";
import { ESCOSkill } from "../../model/coreModel/escoSkill";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { UtilsService } from "../../services/utils.service";

@Component({
  standalone: true,
  selector: 'curriuclum-node-form',
  templateUrl: './curriculumNodeForm.component.html',
  styleUrls: ['./curriculumNodeForm.component.css'],
  imports: [ToastModule, ConfirmDialogModule, InputTextModule, FloatLabelModule, FormsModule, InputIconModule, IconFieldModule, PanelModule, InputNumberModule,
            StepperModule, SelectModule, TooltipModule, ButtonModule, DialogModule, TextareaModule, BokModalComponent, TextChipsComponent, TranslateModule,
            CustomSelectComponent, MultiselectChipsComponent, TreeselectChipsComponent, DividerModule, SelectButtonModule],
})
export class CurriculumNodeFormComponent {
  @Input() errorMap: Map<string, string | undefined> = new Map();
  @Input() curriculumNode!: CurriculumNode;
  @Output() curriculumNodeChanged: EventEmitter<undefined> = new EventEmitter();

  public showCustomTransversalSkills: boolean = false;
  public transversalSkills: TreeNode<any>[] = [];

  public selectedTransversalSkills: TreeNode[] = [];
  public selectedStudyAreas: string[] = [];

  public DURATION_UNIT: object[] = [];
  public COURSE_TYPE: object[] = [];
  public LECTURE_ISPRACTICAL: any[] = [];

  private langChangeSub: Subscription;

  private translate = inject(TranslateService);
  private iscedfAreaService: IscedfAreaService = inject(IscedfAreaService);
  private escoService: ESCOService = inject(ESCOService);
  private utilsService: UtilsService = inject(UtilsService);

  constructor() {
    this.langChangeSub = this.translate.onLangChange.subscribe(() => this.buildSelectFields());
    this.buildSelectFields();
  }

  ngOnInit() {
    this.escoService.getTransversalSkillsFromJson().pipe(take(1)).subscribe(
      data => {
        this.transversalSkills = data;
        this.selectedTransversalSkills = this.curriculumNode.transversalSkills
          .map(skill => this.findTransversalSkill(skill.preferredLabel, this.transversalSkills)).filter(value => value != undefined);
      }
    );
  }

  ngOnDestroy() {
    this.langChangeSub.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['curriculumNode']) {
      const newNode: CurriculumNode = changes['curriculumNode'].currentValue;
      const oldNode: CurriculumNode = changes['curriculumNode'].previousValue;
      if (changes['curriculumNode'].isFirstChange() || (newNode != undefined && oldNode != undefined && newNode.id != oldNode.id)) {
        this.selectedTransversalSkills = newNode.transversalSkills
          .map(skill => this.findTransversalSkill(skill.preferredLabel, this.transversalSkills)).filter(value => value != undefined);
        this.selectedStudyAreas = newNode.studyAreas.map(area => area.name);
        this.showCustomTransversalSkills = newNode.customTransversalSkills.length > 0;
      }
    }
  }

  private buildSelectFields() {
    this.DURATION_UNIT= [
      {
        label: this.translate.instant('durationUnit.years'),
        value: DurationUnit.Years
      },
      {
        label: this.translate.instant('durationUnit.semesters'),
        value: DurationUnit.Semesters
      },
      {
        label: this.translate.instant('durationUnit.trimesters'),
        value: DurationUnit.Trimesters
      },
      {
        label: this.translate.instant('durationUnit.months'),
        value: DurationUnit.Months
      },
      {
        label: this.translate.instant('durationUnit.weeks'),
        value: DurationUnit.Weeks
      },
      {
        label: this.translate.instant('durationUnit.days'),
        value: DurationUnit.Days
      },
      {
        label: this.translate.instant('durationUnit.hours'),
        value: DurationUnit.Hours
      },
      {
        label: this.translate.instant('durationUnit.minutes'),
        value: DurationUnit.Minutes
      },
    ];

    this.COURSE_TYPE = [
      {
        label: this.translate.instant('courseTypes.common'),
        value: CourseType.Common
      },
      {
        label: this.translate.instant('courseTypes.elective'),
        value: CourseType.Elective
      },
      {
        label: this.translate.instant('courseTypes.specialization'),
        value: CourseType.Specialization
      }
    ];

    this.LECTURE_ISPRACTICAL = [
      { label: this.translate.instant('curriculumNodeForm.lecturePractical.practical'), value: true },
      { label: this.translate.instant('curriculumNodeForm.lecturePractical.theoretical'), value: false }
    ];
  }

  private findTransversalSkill(label: string, nodes: TreeNode[]): TreeNode | undefined {
    let match: TreeNode | undefined;
    for(let node of nodes) {
      if (node.label === label) return node;
      match = this.findTransversalSkill(label, node.children || []);
      if (match) return match;
    }
    return undefined;
  }

  onNameChange(newName: string) {
    this.curriculumNode.name = newName;
    this.curriculumNodeChanged.emit();
  }

  selectedNodeEqf(): string | undefined {
    if (this.curriculumNode.eqf < 1 || this.curriculumNode.eqf > 8) return undefined;
    return 'EQF ' + this.curriculumNode.eqf;
  }

  onEqfChange(value: string) {
    const cleanedValue = value.replace('EQF', '').trim();
    this.curriculumNode.eqf = Number(cleanedValue);
  }

  onStudyAreasChange() {
    this.iscedfAreaService.getFieldsByNames(this.selectedStudyAreas).subscribe((fields: ISCEDFArea[]) => {
      this.curriculumNode.studyAreas = fields;
    });
  }

  onTransversalSkillChange() {
    this.curriculumNode.transversalSkills = this.selectedTransversalSkills.map(value => {
      const newEscoSkill: ESCOSkill = new ESCOSkill(value as any); 
      newEscoSkill.preferredLabel = value.label!;
      return newEscoSkill;
    });
  }

  addTrainingMaterial() {
    const newMat = new TrainingMaterial();
    this.curriculumNode.trainingMaterials.push(newMat);
  }

  deleteTrainingMaterial(index: number) {
    this.curriculumNode.trainingMaterials.splice(index, 1);
  }

  addAffiliation() {
    const newAff = new Affiliation();
    this.curriculumNode.affiliations.push(newAff);
  }

  deleteAffiliation(index: number) {
    this.curriculumNode.affiliations.splice(index, 1);
  }

  goToNextStep(callback: (nextStepValue: number) => void, index: number) {
    callback(index);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 0);
  }

  get selectedCourse(): Course | null {
    return this.curriculumNode instanceof Course 
      ? this.curriculumNode as Course 
      : null;
  }

  get selectedLecture(): Lecture | null {
    return this.curriculumNode instanceof Lecture 
      ? this.curriculumNode as Lecture 
      : null;
  }

  getNodeType(): string {
    return this.utilsService.getTranslatedNodeType(this.curriculumNode.nodeType);
  }
}