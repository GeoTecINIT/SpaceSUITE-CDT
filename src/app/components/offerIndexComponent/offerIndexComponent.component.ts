import { Component, EventEmitter, Input, Output, signal, SimpleChanges, WritableSignal} from "@angular/core";
import { CommonModule } from "@angular/common";
import { MenuItem, TreeNode } from "primeng/api";
import { EducationalOffer } from "../../model/coreModel/educationalOffer";
import { CurriculumNode } from "../../model/coreModel/curriculumNode";
import { PanelModule } from "primeng/panel";
import { TabsModule } from 'primeng/tabs';
import { OrganizationChartModule } from 'primeng/organizationchart';

@Component({
  standalone: true,
  selector: 'offer-index-component',
  templateUrl: './offerIndexComponent.component.html',
  styleUrls: ['./offerIndexComponent.component.css'],
  imports: [CommonModule, PanelModule, TabsModule, OrganizationChartModule],
})
export class OfferIndexComponent {
  @Input() offer!: EducationalOffer;
  @Input() selectedNode: string = "";
  @Output() selectedNodeChanged: EventEmitter<string> = new EventEmitter();
  selectedMenuItemId: WritableSignal<string> = signal<string>("");
  menuItemsRoot: WritableSignal<MenuItem | undefined> = signal<MenuItem | undefined>(undefined);
  treeNodeRoot: WritableSignal<TreeNode[]> = signal<TreeNode[]>([]);
  selectedTreeNode: WritableSignal<TreeNode | undefined> = signal<TreeNode | undefined>(undefined);

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
    return ({
      id: node.id,
      label: node.name,
      items: node.getChildren().map(child => this.buildMenuItem(child))
    });
  }

  private buildTreeNode(node: CurriculumNode): TreeNode[] {
    const children = node.getChildren().map(child => this.buildTreeNode(child)).flat();
    const leaf: boolean = children.length === 0;
    return ([{
      key: node.id,
      label: node.name,
      children: children,
      leaf: leaf,
      expanded: !leaf,
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

  public mockTree: TreeNode[] = [
    {
      "key": "node-0",
      "label": "Root (L0)",
      "children": [
        {
          "key": "node-2",
          "label": "Node 2 (L1)",
          "children": [
            {
              "key": "node-3",
              "label": "Node 3 (L2)",
              "children": [
                {
                  "key": "node-4",
                  "label": "Node 4 (L3)",
                  "children": [
                    { "key": "node-5", "label": "Node 5 (L4)", "children": [], "leaf": true, "expanded": true },
                    { "key": "node-6", "label": "Node 6 (L4)", "children": [], "leaf": true, "expanded": true }
                  ],
                  "leaf": false,
                  "expanded": true
                },
                {
                  "key": "node-7",
                  "label": "Node 7 (L3)",
                  "children": [
                    { "key": "node-8", "label": "Node 8 (L4)", "children": [], "leaf": true, "expanded": true },
                    { "key": "node-9", "label": "Node 9 (L4)", "children": [], "leaf": true, "expanded": true }
                  ],
                  "leaf": false,
                  "expanded": true
                },
                {
                  "key": "node-10",
                  "label": "Node 10 (L3)",
                  "children": [
                    { "key": "node-11", "label": "Node 11 (L4)", "children": [], "leaf": true, "expanded": true },
                    { "key": "node-12", "label": "Node 12 (L4)", "children": [], "leaf": true, "expanded": true }
                  ],
                  "leaf": false,
                  "expanded": true
                }
              ],
              "leaf": false,
              "expanded": true
            }
          ],
          "leaf": false,
          "expanded": true
        }
      ],
      "leaf": false,
      "expanded": true
    }
  ]
}