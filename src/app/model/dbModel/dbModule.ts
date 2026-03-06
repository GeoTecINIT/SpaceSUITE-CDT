import { DBBokInput } from "./dbBokInput";
import { DBCompetence } from "./dbCompetence";
import { DBCourse } from "./dbCourse";
import { DBField } from "./dbField";

export class DBModule {
  public _id: string;
  public name: string;
  public numSemester: number;
  public description: string;
  public ects: number;
  public assessment: string;
  public prerequisites: DBBokInput[];
  public learningObjectives: DBBokInput[];
  public inheritedLearningObjectives: DBBokInput[];
  public children: DBCourse[];
  public _children: DBCourse[];
  public concepts: string[];
  public linksToBok: DBBokInput[];
  public depth = 1;
  public userId: string;
  public affiliation: string;
  public levelPublic: Boolean;
  public eqf: number;
  public field?: DBField;
  public fields: DBField[];
  public bibliography: DBBokInput[];
  public orgId: string;
  public orgName: string;
  public division: string;
  public customCompetences: string[];
  public competences: DBCompetence[];
  public isEdited: Boolean;
  public urlAff: string;
  public urlTM: string;

  constructor(public currentNode: Partial<DBModule>){
    this._id = currentNode?._id || '';
    this.name = currentNode?.name || '';
    this.description = currentNode?.description || '';
    this.numSemester = currentNode?.numSemester || 0;
    this.ects = currentNode?.ects || 0;
    this.assessment = currentNode?.assessment || '';
    this.prerequisites = currentNode?.prerequisites || [];
    this.children = currentNode?.children || [];
    this._children = currentNode?._children || [];
    this.concepts = currentNode?.concepts || [];
    this.learningObjectives = currentNode?.learningObjectives || [];
    this.inheritedLearningObjectives = [];
    this.children.forEach(child => {
      // Courses
      child.learningObjectives.forEach(lo => {
        this.inheritedLearningObjectives.push(lo);
      });
      // Lectures
      child.children.forEach(childL => {
        childL.learningObjectives.forEach(lo => {
          this.inheritedLearningObjectives.push(lo);
        });
      });
    });
    this.linksToBok = currentNode?.linksToBok || [];
    this.userId = currentNode?.userId || '';
    this.affiliation = currentNode?.affiliation || '';
    this.levelPublic = currentNode?.levelPublic || true;
    this.eqf = currentNode?.eqf || 0;
    this.field = currentNode?.field;
    this.fields = currentNode?.fields ? currentNode?.fields : [];
    if (this.field && this.fields.length === 0) {
      this.fields.push(this.field);
    }
    this.bibliography = currentNode?.bibliography || [];
    this.orgId = currentNode?.orgId || '';
    this.orgName = currentNode?.orgName || '';
    this.division = currentNode?.division || '';
    this.competences = currentNode?.competences || [];
    this.customCompetences = currentNode?.customCompetences || [];
    this.isEdited = currentNode?.isEdited || false;
    this.urlAff = currentNode?.urlAff || '';
    this.urlTM = currentNode?.urlTM || '';
  }
}