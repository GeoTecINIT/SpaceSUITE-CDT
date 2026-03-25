import { Affiliation } from "../coreModel/affiliation";
import { Duration } from "../coreModel/duration";
import { ESCOSkill } from "../coreModel/escoSkill";
import { ISCEDFArea } from "../coreModel/iscedfArea";
import { TrainingMaterial } from "../coreModel/trainingMaterial";

export abstract class CurriculumNodeDB {
  public id: string;
  public name: string;
  public description: string;
  public children: string[];
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

  constructor(currentNode?: Partial<CurriculumNodeDB>, id?: string) {
    this.id = id || currentNode?.id || '';
    this.name = currentNode?.name || '';
    this.description = currentNode?.description || '';
    this.children = currentNode?.children || [];
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

  public toPlainObject(): any {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      children: this.children,
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