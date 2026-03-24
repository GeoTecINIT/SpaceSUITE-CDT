import { ESCOSkill } from "./escoSkill";
import { DomainError } from "./domainError";
import { Duration } from "./duration";
import { ISCEDFArea } from "./iscedfArea";
import { TrainingMaterial } from "./trainingMaterial";
import { Affiliation } from "./affiliation";

export abstract class CurriculumNode {
  public id: string;
  public name: string;
  public description: string;
  protected children: CurriculumNode[];
  public bokConcepts: string[];
  public prerequisites: string[];
  public eqf: number;
  public ects: number;
  public timeRequired: Duration;
  public studyAreas: ISCEDFArea[];
  public transversalSkills: ESCOSkill[];
  public customTransversalSkills: string[];
  public learningObjectives: string[];
  public trainingMaterials: TrainingMaterial[];
  public bibliography: string[];
  public affiliations: Affiliation[];

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
    this.studyAreas = currentNode?.studyAreas || [];
    this.transversalSkills = currentNode?.transversalSkills || [];
    this.customTransversalSkills = currentNode?.customTransversalSkills || [];
    this.learningObjectives = currentNode?.learningObjectives || [];
    this.trainingMaterials = currentNode?.trainingMaterials || [];
    this.bibliography = currentNode?.bibliography || [];
    this.affiliations = currentNode?.affiliations || [];
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

  public toPlainObject(): any {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      children: this.children.map(child => child.id), // Store only child IDs to avoid circular references
      bokConcepts: this.bokConcepts,
      prerequisites: this.prerequisites,
      eqf: this.eqf,
      ects: this.ects,
      timeRequired: this.timeRequired.toPlainObject(),
      studyAreas: this.studyAreas.map(area => area.toPlainObject()),
      transversalSkills: this.transversalSkills.map(skill => skill.toPlainObject()),
      customTransversalSkills: this.customTransversalSkills,
      learningObjectives: this.learningObjectives,
      trainingMaterials: this.trainingMaterials.map(material => material.toPlainObject()),
      bibliography: this.bibliography,
      affiliations: this.affiliations.map(affiliation => affiliation.toPlainObject())
    };
  }
}