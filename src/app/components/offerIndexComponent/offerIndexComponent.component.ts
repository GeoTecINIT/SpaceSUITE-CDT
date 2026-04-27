import { Component, EventEmitter, Input, Output, signal, SimpleChanges, WritableSignal} from "@angular/core";
import { CommonModule } from "@angular/common";
import { MenuItem, TreeNode } from "primeng/api";
import { EducationalOffer } from "../../model/coreModel/educationalOffer";
import { CurriculumNode } from "../../model/coreModel/curriculumNode";
import { PanelModule } from "primeng/panel";
import { TabsModule } from 'primeng/tabs';
import { OrganizationChartModule } from 'primeng/organizationchart';
import { SliderModule } from 'primeng/slider';
import { FormsModule } from "@angular/forms";

@Component({
  standalone: true,
  selector: 'offer-index-component',
  templateUrl: './offerIndexComponent.component.html',
  styleUrls: ['./offerIndexComponent.component.css'],
  imports: [CommonModule, PanelModule, TabsModule, OrganizationChartModule, SliderModule, FormsModule],
})
export class OfferIndexComponent {
  @Input() offer!: EducationalOffer;
  @Input() selectedNode: string = "";
  @Output() selectedNodeChanged: EventEmitter<string> = new EventEmitter();
  selectedMenuItemId: WritableSignal<string> = signal<string>("");
  menuItemsRoot: WritableSignal<MenuItem | undefined> = signal<MenuItem | undefined>(undefined);
  treeNodeRoot: WritableSignal<TreeNode[]> = signal<TreeNode[]>([]);
  selectedTreeNode: WritableSignal<TreeNode | undefined> = signal<TreeNode | undefined>(undefined);

  scale: WritableSignal<number> = signal(1);
  updateScale = (newValue: number) => this.scale.set(newValue);

  onMenuItemSelection(nodeId: string) {
    this.selectedMenuItemId.set(nodeId);
    this.selectedTreeNode.set(this.getTreeNodeById(nodeId));
    this.selectedNodeChanged.emit(nodeId);
  }

  onTreeNodeSelection(node: TreeNode) {
    this.selectedTreeNode.set(node);
    this.selectedMenuItemId.set(node.key!);
    this.selectedNodeChanged.emit(node.key!);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['offer'] && changes['offer'].currentValue?.root !== changes['offer'].previousValue?.root) {
      this.menuItemsRoot.set(this.buildMenuItem(changes['offer'].currentValue.root));
      this.treeNodeRoot.set(this.buildTreeNode(changes['offer'].currentValue.root));
    }

    if (changes['selectedNode'] && changes['selectedNode'].currentValue !== changes['selectedNode'].previousValue) {
      this.selectedMenuItemId.set(changes['selectedNode'].currentValue);
      this.selectedTreeNode.set(this.getTreeNodeById(changes['selectedNode'].currentValue));
    }
  }
  
  private buildMenuItem(node: CurriculumNode): MenuItem {
    const formattedName = this.getFormattedName(node.constructor.name);
    return ({
      id: node.id,
      label: node.name,
      items: node.getChildren().map(child => this.buildMenuItem(child)),
      data: formattedName
    });
  }

  private buildTreeNode(node: CurriculumNode): TreeNode[] {
    const children = node.getChildren().map(child => this.buildTreeNode(child)).flat();
    const leaf: boolean = children.length === 0;
    const formattedName = this.getFormattedName(node.constructor.name);
    return ([{
      key: node.id,
      label: node.name,
      children: children,
      leaf: leaf,
      expanded: !leaf,
      data: formattedName
    }]);
  }

  private getTreeNodeById(nodeId: string): TreeNode | undefined {
    let node: TreeNode | undefined;
    const stack: TreeNode[] = [...this.treeNodeRoot()];
    while (stack.length > 0) {
      const currentNode = stack.pop()!;
      if (currentNode.key === nodeId) {
        node = currentNode;
        break;
      }
      stack.push(...currentNode.children ?? []);
    }
    return node;
  }

  public getFormattedName(value: string): string {
    return value.match(/[A-Z]+(?![a-z])|[A-Z]?[a-z]+|\d+/g)?.join(' ') ?? "";
  }
}