import { Component, EventEmitter, inject, Input, Output, SimpleChanges } from "@angular/core";
import { ToastModule } from "primeng/toast";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { take } from "rxjs";
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
import { IscedfAreaService } from "../../services/useCaseServices/iscedfArea.service";
import { ISCEDFArea } from "../../model/coreModel/iscedfArea";
import { TreeselectChipsComponent } from "../treeselectChips/treeselectChips.component";
import { ESCOService } from "../../services/useCaseServices/esco.service";
import { DurationUnit } from "../../model/coreModel/duration";
import { UtilsService } from "../../services/useCaseServices/utils.service";
import { DividerModule } from "primeng/divider";
import { TrainingMaterial } from "../../model/coreModel/trainingMaterial";
import { Affiliation } from "../../model/coreModel/affiliation";
import { Course, CourseType } from "../../model/coreModel/course";
import { Lecture } from "../../model/coreModel/lecture";
import { SelectButtonModule } from "primeng/selectbutton";

@Component({
  standalone: true,
  selector: 'curriuclum-node-form',
  templateUrl: './curriculumNodeForm.component.html',
  styleUrls: ['./curriculumNodeForm.component.css'],
  imports: [ToastModule, ConfirmDialogModule, InputTextModule, FloatLabelModule, FormsModule, InputIconModule, IconFieldModule, PanelModule, InputNumberModule,
            StepperModule, SelectModule, TooltipModule, ButtonModule, DialogModule, TextareaModule, BokModalComponent, TextChipsComponent,
            CustomSelectComponent, MultiselectChipsComponent, TreeselectChipsComponent, DividerModule, SelectButtonModule],
})
export class CurriculumNodeFormComponent {
  @Input() errorMap: Map<string, string | undefined> = new Map();
  @Input() curriculumNode!: CurriculumNode;
  @Output() nodeNameChange: EventEmitter<undefined> = new EventEmitter();

  public showCustomTransversalSkills: boolean = false;
  public transversalSkills: TreeNode<any>[] = [];

  public selectedTransversalSkills: string[] = [];
  public selectedStudyAreas: string[] = [];

  public readonly DURATION_UNIT: object[] = [
    {
      label: 'Years',
      value: DurationUnit.Years
    },
    {
      label: 'Semesters',
      value: DurationUnit.Semesters
    },
    {
      label: 'Trimesters',
      value: DurationUnit.Trimesters
    },
    {
      label: 'Months',
      value: DurationUnit.Months
    },
    {
      label: 'Weeks',
      value: DurationUnit.Weeks
    },
    {
      label: 'Days',
      value: DurationUnit.Days
    },
    {
      label: 'Hours',
      value: DurationUnit.Hours
    },
    {
      label: 'Minutes',
      value: DurationUnit.Minutes
    },
  ];

  public readonly COURSE_TYPE: object[] = [
    {
      label: 'Common',
      value: CourseType.Common
    },
    {
      label: 'Elective',
      value: CourseType.Elective
    },
    {
      label: 'Specialization',
      value: CourseType.Specialization
    }
  ];

  public readonly LECTURE_ISPRACTICAL: any[] = [{ label: 'Practical', value: true },{ label: 'Theoretical', value: false }];

  private iscedfAreaService: IscedfAreaService = inject(IscedfAreaService);
  private escoService: ESCOService = inject(ESCOService);
  private utilsService: UtilsService = inject(UtilsService);

  ngOnInit() {
    this.escoService.getTransversalSkillsFromJson().pipe(take(1)).subscribe(
      data => {
        this.transversalSkills = data;
      }
    );
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['curriculumNode']) {
      const newNode: CurriculumNode = changes['curriculumNode'].currentValue;
      const oldNode: CurriculumNode = changes['curriculumNode'].previousValue;
      if (changes['curriculumNode'].isFirstChange() || (newNode != undefined && oldNode != undefined && newNode.id != oldNode.id)) {
        this.selectedTransversalSkills = newNode.transversalSkills.map(skill => skill.preferredLabel);
        this.selectedStudyAreas = newNode.studyAreas.map(area => area.name);
        this.showCustomTransversalSkills = newNode.customTransversalSkills.length > 0;
      }
    }
  }

  onNameChange(newName: string) {
    this.curriculumNode.name = newName;
    this.nodeNameChange.emit();
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
    this.curriculumNode.transversalSkills = this.selectedTransversalSkills.map(skillLabel => {
      const skillNode = this.transversalSkills.find(skill => skill.data.preferredLabel === skillLabel);
      return skillNode ? skillNode.data : { preferredLabel: skillLabel };
    });
  }

  getSelectedNodeType(): string {
    return this.utilsService.getNodeType(this.curriculumNode);
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
}