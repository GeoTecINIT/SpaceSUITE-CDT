import { ESCOSkill } from "./escoSkill";
import { DomainError } from "../domainError";
import { Duration } from "./duration";
import { ISCEDFArea } from "./iscedfArea";
import { TrainingMaterial } from "./trainingMaterial";
import { Affiliation } from "./affiliation";

export enum NodeType {
  StudyProgram = "Study Program",
  Module = "Module",
  Course = "Course",
  Lecture = "Lecture"
}

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
  public abstract nodeType: NodeType;

  constructor(currentNode?: Partial<CurriculumNode>, id?: string) {
    this.id = id || currentNode?.id || '';
    this.name = currentNode?.name || '';
    this.description = currentNode?.description || '';
    this.children = currentNode?.getChildren?.().map(child => child.clone()) || [];
    this.bokConcepts = [...currentNode?.bokConcepts || []];
    this.prerequisites = [...currentNode?.prerequisites || []];
    this.eqf = currentNode?.eqf || 0;
    this.ects = currentNode?.ects || 0;
    this.timeRequired = new Duration(currentNode?.timeRequired);
    this.studyAreas = currentNode?.studyAreas?.map(area => new ISCEDFArea(area)) || [];
    this.transversalSkills = currentNode?.transversalSkills?.map(skill => new ESCOSkill(skill)) || [];
    this.customTransversalSkills = [...currentNode?.customTransversalSkills || []];
    this.learningObjectives = [...currentNode?.learningObjectives || []];
    this.trainingMaterials = currentNode?.trainingMaterials?.map(material => new TrainingMaterial(material)) || [];
    this.bibliography = [...currentNode?.bibliography || []];
    this.affiliations = currentNode?.affiliations?.map(affiliation => new Affiliation(affiliation)) || [];
  }

  protected abstract validateChildCandidate(child: CurriculumNode): void;

  public abstract clone(): CurriculumNode;

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