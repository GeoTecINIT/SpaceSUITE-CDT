import { ESCOSkill } from "./escoSkill";
import { DomainError } from "./domainError";
import { Duration } from "./duration";

export abstract class CurriculumNode {
  public readonly id: string;
  public name: string;
  public description: string;
  protected children: CurriculumNode[];
  public bokConcepts: string[];
  public prerequisites: string[];
  public eqf: number;
  public ects: number;
  public timeRequired: Duration;
  public transversalSkills: ESCOSkill[];
  public customTransversalSkills: string[];
  public learningObjectives: string[];

  constructor(currentNode?: Partial<CurriculumNode>, id?: string) {
    this.id = id || currentNode?.id || '';
    this.name = currentNode?.name || '';
    this.description = currentNode?.description || '';
    this.children = currentNode?.getChildren?.() || [];
    this.bokConcepts = currentNode?.bokConcepts || [];
    this.prerequisites = currentNode?.prerequisites || [];
    this.eqf = currentNode?.eqf || 0;
    this.ects = currentNode?.ects || 0;
    this.timeRequired = currentNode?.timeRequired || new Duration();
    this.transversalSkills = currentNode?.transversalSkills || [];
    this.customTransversalSkills = currentNode?.customTransversalSkills || [];
    this.learningObjectives = currentNode?.learningObjectives || [];
  }

  protected abstract validateChildCandidate(child: CurriculumNode): void;

  public addChild(child: CurriculumNode): void {
    this.validateChildCandidate(child);
    this.children.push(child);
  }

  public removeChild(childId: string): void {
    const index = this.children.findIndex(child => child.id === childId);
    if (index === -1) {
      throw new DomainError(
        'CHILD_NODE_NOT_FOUND', 
        `No child with id ${childId} found among children of node ${this.id}`
      );
    }
    this.children.splice(index, 1);
  }

  public getChildren(): CurriculumNode[] {
    return this.children;
  }
}