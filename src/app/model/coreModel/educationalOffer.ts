import { Affiliation } from "./affiliation";
import { CurriculumNode } from "./curriculumNode";
import { DomainError } from "./domainError";

export class EducationalOffer {
  public readonly id: string;
  private root: CurriculumNode;
  private nodesById: Map<string, CurriculumNode>;

  public affiliations: Affiliation[];
  public isPublic: boolean;
  public createdAt: Date;
  public updatedAt?: Date;

  public userId: string;
  public orgId: string;
  public orgName: string;
  public division: string;

  constructor(rootNode: CurriculumNode, partialOffer?: Partial<EducationalOffer>) {
    this.id = partialOffer?.id || '';
    this.root = rootNode;
    this.nodesById = new Map<string, CurriculumNode>();
		this.affiliations = partialOffer?.affiliations || [];
    this.isPublic = partialOffer?.isPublic ?? false;
    this.createdAt = partialOffer?.createdAt || new Date();
    this.updatedAt = partialOffer?.updatedAt;  
    this.userId = partialOffer?.userId || '';
    this.orgId = partialOffer?.orgId || '';
    this.orgName = partialOffer?.orgName || '';
    this.division = partialOffer?.division || '';

    this.nodesById.set(this.root.id, this.root);
  }

  public getRoot(): CurriculumNode {
    return this.root;
  }

  public getNodeById(id: string): CurriculumNode | undefined {
    return this.nodesById.get(id);
  }

  public addNode(node: CurriculumNode, parentId: string): void {
    // Ensure parent node exists
    const parentNode = this.nodesById.get(parentId);
    if (!parentNode) {
      throw new DomainError(
        'PARENT_NODE_NOT_FOUND', 
        `Parent node with id ${parentId} not found in educational offer ${this.id}`
      );
    }

    // Add node to parent's children and store in map
    parentNode.addChild(node);
    this.nodesById.set(node.id, node);
  }

  public removeNode(nodeId: string): void {
    // Ensure node exists and is not the root
    const nodeToRemove = this.nodesById.get(nodeId);
    if (!nodeToRemove) {
      throw new DomainError(
        'NODE_NOT_FOUND', 
        `Node with id ${nodeId} not found in educational offer ${this.id}`
      );
    }
    if (nodeToRemove === this.root) {
      throw new DomainError(
        'ROOT_NODE_CANNOT_BE_REMOVED',
        `Cannot remove root node from educational offer ${this.id}`
      );
    }

    // Find parent node iteratively
    let parentNode: CurriculumNode | undefined;
    const stack: CurriculumNode[] = [this.root];
    while (stack.length > 0) {
      const currentNode = stack.pop()!;
      const children = currentNode.getChildren();
      if (children.some(child => child.id === nodeId)) {
        parentNode = currentNode;
        break;
      }
      stack.push(...children);
    }    
    if (!parentNode) {
      throw new DomainError(
        'PARENT_NODE_NOT_FOUND',
        `Parent node for node with id ${nodeId} not found in educational offer ${this.id}`
      );
    }

    // Remove node from parent's children and delete from map
    parentNode.removeChild(nodeId);
    this.nodesById.delete(nodeId);
  }
}