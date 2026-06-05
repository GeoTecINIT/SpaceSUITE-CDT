import { Component, EventEmitter, inject, Input, Output, signal, SimpleChanges, WritableSignal} from "@angular/core";
import { CommonModule } from "@angular/common";
import { TreeNode } from "primeng/api";
import { EducationalOffer } from "../../model/coreModel/educationalOffer";
import { CurriculumNode, NodeType } from "../../model/coreModel/curriculumNode";
import { PanelModule } from "primeng/panel";
import { TabsModule } from 'primeng/tabs';
import { OrganizationChartModule } from 'primeng/organizationchart';
import { TreeModule } from 'primeng/tree';
import { SliderModule } from 'primeng/slider';
import { FormsModule } from "@angular/forms";
import { ButtonModule } from "primeng/button";
import { DialogModule } from "primeng/dialog";
import { UtilsService } from "../../services/useCaseServices/utils.service";
import { TranslateModule } from "@ngx-translate/core";

@Component({
  standalone: true,
  selector: 'offer-index-component',
  templateUrl: './offerIndexComponent.component.html',
  styleUrls: ['./offerIndexComponent.component.css'],
  imports: [CommonModule, PanelModule, TabsModule, OrganizationChartModule, SliderModule, FormsModule, TreeModule, ButtonModule, DialogModule, TranslateModule],
})
export class OfferIndexComponent {
  @Input() offer!: EducationalOffer;
  @Input() selectedNode: string = "";
  @Output() selectedNodeChanged: EventEmitter<string> = new EventEmitter();
  treeNodeRoot: WritableSignal<TreeNode[]> = signal<TreeNode[]>([]);
  selectedTreeNode: WritableSignal<TreeNode | undefined> = signal<TreeNode | undefined>(undefined);

  scale: WritableSignal<number> = signal(1);
  updateScale = (newValue: number) => this.scale.set(newValue);

  private utilsService: UtilsService = inject(UtilsService);

  onMenuItemSelection(nodeId: string) {
    this.selectedNodeChanged.emit(nodeId);
  }

  onTreeNodeSelection(node: TreeNode | TreeNode[] |  null) {
    if (!node) return;
    if (Array.isArray(node)) this.selectedNodeChanged.emit(node[0].key!);
    else this.selectedNodeChanged.emit(node.key!);
  }

  preventTreeNodeUnselect(event: { node: TreeNode }) {
    setTimeout(() => this.selectedTreeNode.set(undefined));
    setTimeout(() => this.selectedTreeNode.set(event.node));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['offer']) {
      this.treeNodeRoot.set(this.buildTreeNode(changes['offer'].currentValue.root));
    }

    if (changes['selectedNode'] && changes['selectedNode'].currentValue !== changes['selectedNode'].previousValue) {
      this.selectedTreeNode.set(this.getTreeNodeById(changes['selectedNode'].currentValue));
    }
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
      data: node.nodeType,
      icon: this.getTreeNodeIcon(node.nodeType)
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

  private getTreeNodeIcon(type: NodeType): string | undefined {
    switch(type) {
      case NodeType.StudyProgram:
        return 'pi pi-building-columns';
      case NodeType.Module:
        return 'pi pi-box';
      case NodeType.Course:
        return 'pi pi-book';
      case NodeType.Lecture:
        return 'pi pi-bookmark';
      default:
        return undefined;
    }
  }

  getNodeType(type: NodeType): string {
    return this.utilsService.getTranslatedNodeType(type);
  }
}