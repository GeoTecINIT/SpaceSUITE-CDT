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
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { Tooltip } from "primeng/tooltip";
import { MeterGroup, MeterItem } from 'primeng/metergroup';
import { Divider } from "primeng/divider";
import { BokInformationService } from "@eo4geo/ngx-bok-visualization";
import { forkJoin, map, Observable, of, take } from "rxjs";
import { BadgeModule } from 'primeng/badge';

@Component({
  standalone: true,
  selector: 'offer-index-component',
  templateUrl: './offerIndexComponent.component.html',
  styleUrls: ['./offerIndexComponent.component.css'],
  imports: [CommonModule, PanelModule, TabsModule, OrganizationChartModule, SliderModule, FormsModule, TreeModule, ButtonModule, DialogModule,
    TranslateModule, Tooltip, MeterGroup, Divider, BadgeModule],
})
export class OfferIndexComponent {
  @Input() offer!: EducationalOffer;
  @Input() selectedNode: string = "";
  @Output() selectedNodeChanged: EventEmitter<string> = new EventEmitter();
  @Output() expandedChanged: EventEmitter<boolean> = new EventEmitter();

  expanded: boolean = false;

  treeNodeRoot: WritableSignal<TreeNode[]> = signal<TreeNode[]>([]);
  selectedTreeNode: WritableSignal<TreeNode | undefined> = signal<TreeNode | undefined>(undefined);

  scale: WritableSignal<number> = signal(1);
  updateScale = (newValue: number) => this.scale.set(newValue);

  knowledgeDistributions: WritableSignal<Map<string, MeterItem[]>> = signal(new Map());

  private utilsService: UtilsService = inject(UtilsService);
  private translate: TranslateService = inject(TranslateService);
  private bokInfo: BokInformationService = inject(BokInformationService);

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
      this.knowledgeDistributions.set(new Map());
      const newOffer: EducationalOffer = changes['offer'].currentValue
      newOffer.getAllNodes().forEach((node: CurriculumNode) => {
        this.getKnowledgeAreaDistribution(node).subscribe(newDistribution => this.knowledgeDistributions.update(map => map.set(node.id, newDistribution)));
      })
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
      data: {
        type: node.nodeType
      },
      icon: this.getTreeNodeIcon(node.nodeType)
    }]);
  }

  private getKnowledgeAreaDistribution(node: CurriculumNode): Observable<MeterItem[]> {
    const conceptsAreas = node.bokConcepts.map((concept) => {
      if (concept === 'GIST') return concept;
      return concept.substring(0, 2).toUpperCase();
    });

    const counts = new Map<string, number>();
    const total = node.bokConcepts.length;

    conceptsAreas.forEach((area) => {
      counts.set(area, (counts.get(area) || 0) + 1);
    });

    const knowledgeDistribution = Array.from(counts.entries()).map(
      ([label, count]) => {
        return {
          label: label,
          value: Math.round((count / total) * 100),
          color$: this.bokInfo.getConceptColor(label).pipe(take(1))
        }
      }
    );
    

    return forkJoin(
      knowledgeDistribution.sort((a, b) => a.label.localeCompare(b.label)).map(item =>
        item.color$.pipe(
          map(color => ({
            label: item.label,
            value: item.value,
            color: color
          }))
        )
      )
    );
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

  updateExpanded() {
    this.expanded = !this.expanded;
    this.expandedChanged.emit(this.expanded);
  }

  getExpandedIcon() {
    if (this.expanded) return 'pi pi-angle-double-right'
    return 'pi pi-angle-double-left'
  }

  getExpandedTooltip(selectedTabIndex: number) {
    const selectedTabText: string = 
      selectedTabIndex == 0 ? 
      this.translate.instant('offerIndex.tablist.index') : 
      this.translate.instant('offerIndex.tablist.tree'); 
    if (this.expanded) {
      return this.translate.instant('offerIndex.collapseTooltip', {selectedTab: selectedTabText});
    }
    else return this.translate.instant('offerIndex.expandTooltip', {selectedTab: selectedTabText});
  }
}