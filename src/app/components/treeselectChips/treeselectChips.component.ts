import { Component, EventEmitter, Input, Output, SimpleChanges } from "@angular/core";
import { FloatLabelModule } from "primeng/floatlabel";
import { FormsModule } from "@angular/forms";
import { IconFieldModule } from 'primeng/iconfield';
import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';
import { CommonModule } from "@angular/common";
import { TreeSelectModule } from "primeng/treeselect";
import { TreeNode } from "primeng/api";

@Component({
  standalone: true,
  selector: 'treeselect-chips',
  templateUrl: './treeselectChips.component.html',
  styleUrls: ['./treeselectChips.component.css'],
  imports: [FloatLabelModule, FormsModule, IconFieldModule, ButtonModule, ChipModule, CommonModule, TreeSelectModule],
})
export class TreeselectChipsComponent {

  @Input() treeSelection: TreeNode[] = []
  @Output() treeSelectionChange: EventEmitter<TreeNode[]> = new EventEmitter();

  chips: string[] = [];
  
  @Input() treeselectOptions: TreeNode[] = [];

  @Input() fieldName: string = 'Field Name';

  @Input() error: boolean = false;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['treeSelection']) {
      const currentValue: TreeNode[] = changes['treeSelection'].currentValue;
      this.chips = currentValue.map(value => value.label ?? '');
    }
  }

  deleteElement(element: string) {
    this.treeSelection = this.treeSelection.filter(value => value.label != element)
    this.treeSelectionChange.emit(this.treeSelection);
  }

  treeselectChange(values: TreeNode[]) {
    this.treeSelection = values || [];
    this.treeSelectionChange.emit(this.treeSelection);
  }
}