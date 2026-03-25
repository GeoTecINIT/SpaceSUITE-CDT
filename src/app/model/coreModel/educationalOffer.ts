import { Affiliation } from "./affiliation";
import { CurriculumNode } from "./curriculumNode";
import { DomainError } from "../domainError";

/**
 * EducationalOffer class:
 * 
 * Represents an educational offer, which is a structured curriculum with associated metadata.
 * It contains a root curriculum node and supports operations to manage the curriculum structure.
 * The educational offer also includes affiliations, visibility settings, and organizational information.
 * The curriculum structure is managed through a tree of CurriculumNode objects, allowing for flexible representation of courses, modules, and other educational components.
 * The class provides methods to retrieve nodes by ID, add new nodes under a specified parent, and remove nodes while ensuring the integrity of the curriculum structure.
 * When a node is added, the system checks for the existence of the parent node to maintain a valid tree structure. 
 * When a node is removed, it ensures that the root node cannot be removed and that the specified node exists within the curriculum.
 * When a node is removed, all of its children are also removed from the curriculum, ensuring that the tree structure remains consistent and valid.
 */
export class EducationalOffer {
  public id: string;
  public root: CurriculumNode;

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
		this.affiliations = partialOffer?.affiliations || [];
    this.isPublic = partialOffer?.isPublic ?? false;
    this.createdAt = partialOffer?.createdAt || new Date();
    this.updatedAt = partialOffer?.updatedAt;  
    this.userId = partialOffer?.userId || '';
    this.orgId = partialOffer?.orgId || '';
    this.orgName = partialOffer?.orgName || '';
    this.division = partialOffer?.division || '';
  }

  public getNodeById(id: string): CurriculumNode | undefined {
    let node: CurriculumNode | undefined;
    const stack: CurriculumNode[] = [this.root];
    while (stack.length > 0) {
      const currentNode = stack.pop()!;
      if (currentNode.id === id) {
        node = currentNode;
        break;
      }
      stack.push(...currentNode.getChildren());
    }
    return node;
  }

  public addNode(node: CurriculumNode, parentId: string): void {
    // Ensure parent node exists
    const parentNode = this.getNodeById(parentId);
    if (!parentNode) {
      throw new DomainError(
        'PARENT_NODE_NOT_FOUND', 
        `Parent node with id ${parentId} not found in educational offer ${this.id}`
      );
    }

    // Add node to parent's children
    parentNode.addChild(node);
  }

  public removeNode(nodeId: string): void {
    // Ensure is not the root
    if (nodeId === this.root.id) {
      throw new DomainError(
        'ROOT_NODE_CANNOT_BE_REMOVED',
        `Cannot remove root node from educational offer ${this.id}`
      );
    }

    // Find node & parent iteratively
    let parentNode: CurriculumNode | undefined;
    const stack: CurriculumNode[] = [this.root];
    while (stack.length > 0) {
      const currentNode = stack.pop()!;
      const children = currentNode.getChildren();
      for (const child of children) {
        if (child.id === nodeId) {
          parentNode = currentNode;
          break;
        }
      }
      stack.push(...children);
    }
    if (!parentNode) {
      throw new DomainError(
        'NODE_NOT_FOUND', 
        `Node with id ${nodeId} not found in educational offer ${this.id}`
      );
    }

    // Remove node from parent's children
    parentNode.removeChild(nodeId);
  }

  public getAllNodes(): CurriculumNode[] {
    const nodes: CurriculumNode[] = [];
    const stack: CurriculumNode[] = [this.root];
    while (stack.length > 0) {
      const currentNode = stack.pop()!;
      nodes.push(currentNode);
      stack.push(...currentNode.getChildren());
    }
    return nodes;
  }
}