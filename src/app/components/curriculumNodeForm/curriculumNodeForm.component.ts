import { Component, EventEmitter, inject, Input, Output, signal, SimpleChanges, WritableSignal } from "@angular/core";
import { ToastModule } from "primeng/toast";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { defaultIfEmpty, forkJoin, Subscription, switchMap, take, tap } from "rxjs";
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
import { Grouping } from "../../model/coreModel/grouping";
import { InputGroupModule } from "primeng/inputgroup";
import { InputGroupAddonModule } from "primeng/inputgroupaddon";
import { MenuModule } from "primeng/menu";
import { WorkloadUnit } from "../../model/workloadUnit";
import { CommonModule } from "@angular/common";
import { AutoCompleteModule } from 'primeng/autocomplete';
import { BokInformationService } from "@eo4geo/ngx-bok-visualization";
import { PopoverModule } from "primeng/popover";
import { LearningOutcomesSelectComponent } from "../learningOutcomesSelect/learningOutcomesSelect.component";
import { BloomSkill } from "../../model/coreModel/bloomSkill";

@Component({
  standalone: true,
  selector: 'curriuclum-node-form',
  templateUrl: './curriculumNodeForm.component.html',
  styleUrls: ['./curriculumNodeForm.component.css'],
  imports: [ToastModule, ConfirmDialogModule, InputTextModule, FloatLabelModule, FormsModule, InputIconModule, IconFieldModule, PanelModule, InputNumberModule,
    StepperModule, SelectModule, TooltipModule, ButtonModule, DialogModule, TextareaModule, BokModalComponent, TextChipsComponent, TranslateModule,
    CustomSelectComponent, MultiselectChipsComponent, TreeselectChipsComponent, DividerModule, SelectButtonModule, InputGroupModule, InputGroupAddonModule,
    MenuModule, CommonModule, AutoCompleteModule, PopoverModule, LearningOutcomesSelectComponent],
})
export class CurriculumNodeFormComponent {
  @Input() errorMap: Map<string, string | undefined> = new Map();
  @Input() curriculumNode!: CurriculumNode;
  @Input() groupingNameSuggestions: string[] = [];
  @Output() curriculumNodeChanged: EventEmitter<undefined> = new EventEmitter();
  @Output() saveDraft: EventEmitter<undefined> = new EventEmitter();

  public showCustomTransversalSkills: boolean = false;
  public transversalSkills: TreeNode<any>[] = [];
  public showCustomSkills: boolean = false;
  public skillOptions: WritableSignal<TreeNode[]> = signal([]);

  public selectedTransversalSkills: TreeNode[] = [];
  public selectedStudyAreas: string[] = [];
  public skillSelection: WritableSignal<TreeNode[]> = signal([]);

  public learningOutcomesSuggestions: WritableSignal<any[]> = signal([]);

  public groupingNameOrderedSuggestions: string[] = []

  public stepperIndex: WritableSignal<number> = signal(1);

  public DURATION_UNIT: object[] = [];
  public WORKLOAD_UNIT: object[] = [];
  public COURSE_TYPE: object[] = [];
  public LECTURE_ISPRACTICAL: any[] = [];

  private langChangeSub: Subscription;

  private translate = inject(TranslateService);
  private iscedfAreaService: IscedfAreaService = inject(IscedfAreaService);
  private escoService: ESCOService = inject(ESCOService);
  private utilsService: UtilsService = inject(UtilsService);
  private bokService: BokInformationService = inject(BokInformationService);

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
    this.skillSelection.set(this.curriculumNode.learningObjectives.map(skill => {
      return ({
        key: `${skill.level}-${skill.concept}-${skill.verb != '' ? skill.verb : this.getUnclassifiedHash(skill.label)}`,
        label: skill.label,
        children: [],
        leaf: true,
        expanded: false,
        type: 'leaf',
        data: skill
      })
    }));
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
        this.showCustomSkills = newNode.customLearningObjectives.length > 0;
        this.buildSkillOptions();
        this.stepperIndex.set(1);
      }
    }
  }

  setWorkloadUnit(value: WorkloadUnit) {
    this.curriculumNode.workloadUnit = value;
    this.saveDraft.emit();
  }

  private buildSelectFields() {
    this.WORKLOAD_UNIT = [
      {
        label: this.translate.instant('workloadUnit.ects'),
        value: WorkloadUnit.ECTS
      },
      {
        label: this.translate.instant('workloadUnit.hours'),
        value: WorkloadUnit.Hours
      }
    ];

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

  orderGroupingNameSuggestions(value: string) {
    this.groupingNameOrderedSuggestions =
      this.groupingNameSuggestions.sort((a, b) => {
        if (a === value) return -1;
        if (b == value) return 1;
        return a.localeCompare(b);
      });
  }

  onNameChange(newName: string) {
    this.curriculumNode.name = newName;
    this.curriculumNodeChanged.emit();
    this.saveDraft.emit();
  }

  onGroupingNameChange(newName: string) {
    (this.curriculumNode as Grouping).groupingName = newName;
    this.curriculumNodeChanged.emit();
    this.saveDraft.emit();
  }

  selectedNodeEqf(): string | undefined {
    if (this.curriculumNode.eqf < 1 || this.curriculumNode.eqf > 8) return undefined;
    return 'EQF ' + this.curriculumNode.eqf;
  }

  onEqfChange(value: string) {
    const cleanedValue = value.replace('EQF', '').trim();
    this.curriculumNode.eqf = Number(cleanedValue);
    this.saveDraft.emit();
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
    this.saveDraft.emit();
  }

  addTrainingMaterial() {
    const newMat = new TrainingMaterial();
    this.curriculumNode.trainingMaterials.push(newMat);
  }

  deleteTrainingMaterial(index: number) {
    this.curriculumNode.trainingMaterials.splice(index, 1);
    this.saveDraft.emit();
  }

  addAffiliation() {
    const newAff = new Affiliation();
    this.curriculumNode.affiliations.push(newAff);
  }

  deleteAffiliation(index: number) {
    this.curriculumNode.affiliations.splice(index, 1);
    this.saveDraft.emit();
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

  get selectedGrouping(): Grouping | null {
    return this.curriculumNode instanceof Grouping 
      ? this.curriculumNode as Grouping 
      : null;
  }

  getNodeType(): string {
    return this.utilsService.getTranslatedNodeType(this.curriculumNode.nodeType);
  }

  onLearningObjectivesChange(newSkills: TreeNode[]) {
    this.curriculumNode.learningObjectives = newSkills.filter(skill => skill.data).map(skill => skill.data);
    this.saveDraft.emit();
  }

  buildSkillOptions() {
    const tempTree: TreeNode[] = [];
    const conceptSet: Set<string> = new Set();
    this.curriculumNode.learningObjectives.forEach(learningObj => conceptSet.add(learningObj.concept));
    this.curriculumNode.bokConcepts.forEach(concept => conceptSet.add(concept));
    conceptSet.forEach(concept => {
      const conceptTree: TreeNode[] = [
        {
          label: "Level 1: Remember",
          key: concept + '-1',
          expanded: false,
          leaf: false
        },
        {
          label: "Level 2: Understand",
          key: concept + '-2',
          expanded: false,
          leaf: false
        },
        {
          label: "Level 3: Apply",
          key: concept + '-3',
          expanded: false,
          leaf: false
        },
        {
          label: "Level 4: Analyze",
          key: concept + '-4',
          expanded: false,
          leaf: false
        },
        {
          label: "Level 5: Evaluate",
          key: concept + '-5',
          expanded: false,
          leaf: false
        },
        {
          label: "Level 6: Create",
          key: concept + '-6',
          expanded: false,
          leaf: false
        },
        {
          label: "Unclassified",
          key: concept + '-0',
          expanded: false,
          leaf: false
        }
      ]
      this.bokService.getConceptSkills(concept).pipe(
        switchMap(skills => {
          skills.forEach(skill => {
            const levelNode: TreeNode | undefined = conceptTree.at(skill.bloomLevel - 1);
            if (!levelNode) return
            levelNode.children ??= [];
            levelNode.children.push({
              key: `${skill.bloomLevel}-${concept}-${skill.bloomVerb != '' ? skill.bloomVerb : this.getUnclassifiedHash(skill.name)}`,
              label: skill.name,
              children: [],
              leaf: true,
              expanded: false,
              type: 'leaf',
              data: new BloomSkill({ 
                level: skill.bloomLevel,
                verb: skill.bloomVerb, 
                label: skill.name,
                concept: concept
              })
            })
          })
          return this.bokService.getConceptName(concept)
        }),
        take(1)
      ).subscribe(conceptName => {
        tempTree.push({
          label: `[${concept}] ${conceptName}`,
          key: concept,
          expanded: true,
          leaf: false,
          children: conceptTree,
          selectable: false
        })
      });
    })
    tempTree.forEach(levelNode => {
      levelNode.children = this.getSortedArray(levelNode.children ?? []);
    })
    this.skillOptions.set(tempTree);
    this.saveDraft.emit();
    this.curriculumNodeChanged.emit()
  }
  
  private getSortedArray(values: TreeNode[]) {
    if (values.length > 0) {
      return [...values].sort((a, b) =>
        (a.label || '').localeCompare(b.label || '')
      );
    }
    return values;
  }

  private getUnclassifiedHash(data: string): string {
    let hash = 0;
    for (const char of data) {
      hash = (hash << 5) - hash + char.charCodeAt(0);
      hash |= 0;
    }
    return hash.toString();
  }

}