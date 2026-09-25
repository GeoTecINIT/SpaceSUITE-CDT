import { Component, EventEmitter, inject, Input, Output, SimpleChanges, ViewChild} from "@angular/core";
import { FloatLabelModule } from "primeng/floatlabel";
import { FormsModule } from "@angular/forms";
import { IconFieldModule } from 'primeng/iconfield';
import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';
import { CommonModule } from "@angular/common";
import { MultiSelect, MultiSelectModule } from "primeng/multiselect";
import { BokInformationService } from "@eo4geo/ngx-bok-visualization";
import { TranslateModule } from "@ngx-translate/core";
import { Observable, take } from "rxjs";
import { BadgeModule } from "primeng/badge";
import { TooltipModule } from "primeng/tooltip";

@Component({
  standalone: true,
  selector: 'multiselect-learning-outcomes',
  templateUrl: './multiselectLearningOutcomes.component.html',
  styleUrls: ['./multiselectLearningOutcomes.component.css'],
  imports: [FloatLabelModule, FormsModule, IconFieldModule, ButtonModule, ChipModule, CommonModule, MultiSelectModule, TranslateModule, BadgeModule, TooltipModule],
})
export class MultiselectLearningOutcomesComponent {

  @Input() chips: string[] = [];
  @Output() chipsChange: EventEmitter<string[]> = new EventEmitter();

  @Input() customOptions?: any[];

  currentText: string = '';
  multiSelection: string[] = []
  multiselectOptions: any[] = [];

  @Input() fieldName: string = 'Field Name';
  @Input() icon: string = 'pi pi-users';
  @Input() error: boolean = false;
  @Input() filter: boolean = true;
  @Input() customValues: boolean = false;
  @Input() group: boolean = false;

  @ViewChild('pmulti', { read: MultiSelect }) multiSelectEl!: MultiSelect;
  
  chipAnimations: Record<string, boolean> = {}
  selectedConceptsColor: Map<string, string> = new Map();

  private bokInfo: BokInformationService = inject(BokInformationService);

  ngOnInit() {
    if (this.customOptions != undefined) {
      this.multiselectOptions = this.customOptions;
    } 
    this.chips.forEach(chip => {
      this.chipAnimations[chip] = false;
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['customOptions'] && !changes['customOptions'].isFirstChange()) {
      this.multiselectOptions = changes['customOptions'].currentValue;
    }
  }

  getGroupedOptionColor(code: string): Observable<string> {
    return this.bokInfo.getConceptColor(code).pipe(take(1));
  }

  getKnowledgeAreaName(code: string): Observable<string> {
    return this.bokInfo.getConceptName(code).pipe(take(1));
  }

  onDropdownOpen() {
    setTimeout(() => {
      const input = document.querySelector('.p-multiselect-filter-container .p-inputtext') as HTMLInputElement | null;
      if (input) {
        const keyHandler = (event: KeyboardEvent) => {
          if (event.key === 'Enter') {
            input.removeEventListener('keyup', keyHandler);
            this.clickButton();
          }
        };
        input.addEventListener('keyup', keyHandler);
      }
    }, 20);
  }

  clickButton() {
    const inputValue: string = this.currentText.trim();
    if (inputValue != '' && !this.chips.includes(inputValue)){
      this.chipsChange.emit(this.chips.concat(inputValue));
    }
    else if (inputValue != '') {
      this.chipAnimations[inputValue] = true;
      setTimeout(() => {
        this.chipAnimations[inputValue] = false;
      }, 800);
    }
    this.currentText = '';
    this.multiSelectEl.hide()
  }

  deleteElement(element: string) {
    this.multiSelection = this.multiSelection.filter(value => value != element)
    this.chipsChange.emit(this.chips.filter(value => value != element));
  }

  multiselectChange(values: string[]) {
    this.multiSelection = values || [];
    const include = this.multiSelection.filter(value => !this.chips.includes(value));
    let exclude: string[] = [];
    if(this.group) {
      let options: any[] = []
      this.multiselectOptions.map(x => x.items).forEach(value => options.push(...value));
      exclude = this.chips.filter(value => !this.multiSelection.includes(value) && options.map(x => x.value).includes(value));
    } else {
      exclude = this.chips.filter(value => !this.multiSelection.includes(value) && this.multiselectOptions.map(x => x.value).includes(value));
    }
    this.chipsChange.emit(this.chips.concat(include).filter(value => !exclude.includes(value)));
  }

  getSingularFieldName(): string {
    let value = this.fieldName.toLowerCase();
    value = value.replace("*","");
    value = value.trim();
    const rules: Array<[RegExp, string]> = [
      [/ies$/, 'y'],
      [/ses$/, 's'],
      [/xes$/, 'x'],
      [/s$/, ''],
    ];
    for (const [pattern, replacement] of rules) {
      if (pattern.test(value)) {
        return value.replace(pattern, replacement);
      }
    }
    return value;
  }
}