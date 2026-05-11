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

  @Input() chips: string[] = [];
  @Output() chipsChange: EventEmitter<string[]> = new EventEmitter();

  treeSelection: TreeNode[] = []
  @Input() treeselectOptions: TreeNode[] = [];

  @Input() fieldName: string = 'Field Name';

  @Input() error: boolean = false;

  chipAnimations: Record<string, boolean> = {}

  ngOnInit() {
    this.chips.forEach(chip => {
      this.chipAnimations[chip] = false;
    })
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['treeselectOptions']) {
      const currentValue: TreeNode[] = changes['treeselectOptions'].currentValue;
      this.treeSelection = this.getNodesMatchingChips(currentValue, this.chips);
    }
    if (changes['chips'] && !changes['chips'].firstChange) {
      const currentValue: string[] = changes['chips'].currentValue;
      if (this.treeSelection.some(node => !currentValue.includes(node.data)) || currentValue.some(chip => !this.treeSelection.some(node => node.data === chip))) {
        this.treeSelection = this.getNodesMatchingChips(this.treeselectOptions, currentValue);
      }
    }
  }

  private getNodesMatchingChips(nodes: TreeNode[], chips: string[]): TreeNode[] {
    let matched: TreeNode[] = [];
    for (const node of nodes) {
      if (chips.includes(node.data)) {
        matched.push(node);
      }
      if (node.children) {
        matched = matched.concat(this.getNodesMatchingChips(node.children, chips));
      }
    }
    return matched;
  }

  deleteElement(element: string) {
    this.treeSelection = this.treeSelection.filter(value => value.data != element)
    this.chipsChange.emit(this.chips.filter(value => value != element));
  }

  treeselectChange(values: TreeNode[]) {
    this.treeSelection = values || [];
    const selectedValues = this.treeSelection.map(node => node.data);
    this.chips = selectedValues;
    this.chipsChange.emit(this.chips);
  }
}