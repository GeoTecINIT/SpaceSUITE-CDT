import { ESCOSkill } from "./escoSkill";

export abstract class CurriculumNode {
  public id: string;
  public name: string;
  public description: string;
  public children: CurriculumNode[];
  public bokConcepts: string[];
  public userId: string;
  public orgId: string;
  public orgName: string;
  public division: string;
  public transversalSkills: ESCOSkill[];
  public customTransversalSkills: string[];
  public learningObjectives: string[];
  public inheritedLearningObjectives: string[];
  public isPublic: boolean;
  public createdAt: Date;
  public updatedAt?: Date;

  protected constructor(currentNode: Partial<CurriculumNode> | undefined) {
    this.id = currentNode?.id || '';
    this.name = currentNode?.name || '';
    this.description = currentNode?.description || '';
    this.children = currentNode?.children || [];
    this.bokConcepts = currentNode?.bokConcepts || [];
    this.userId = currentNode?.userId || '';
    this.orgId = currentNode?.orgId || '';
    this.orgName = currentNode?.orgName || '';
    this.division = currentNode?.division || '';
    this.transversalSkills = currentNode?.transversalSkills || [];
    this.customTransversalSkills = currentNode?.customTransversalSkills || [];
    this.learningObjectives = currentNode?.learningObjectives || [];
    this.inheritedLearningObjectives = [];
    this.inheritedLearningObjectives.push(...this.computeInheritedObjectives(this.children));
    this.isPublic = currentNode?.isPublic ?? false;
    this.createdAt = currentNode?.createdAt || new Date();
    this.updatedAt = currentNode?.updatedAt;
  }

  private computeInheritedObjectives(children: CurriculumNode[]): string[] {
    const updatedObjetives: string[] = [];
    children.forEach(child => {
      child.learningObjectives.forEach(lo => updatedObjetives.push(lo));
      updatedObjetives.push(...this.computeInheritedObjectives(child.children));
    });
    return updatedObjetives;
  }
}
