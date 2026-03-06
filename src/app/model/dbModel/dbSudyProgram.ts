import { DBBokInput } from "./dbBokInput";
import { DBField } from "./dbField";
import { DBCompetence } from "./dbCompetence";
import { DBModule } from "./dbModule";

export class DBStudyProgram {
  public _id: string;
  public name: string;
  public description: string;
  public affiliation: string;
  public levelPublic: Boolean;
  public eqf: number;
  public children: DBModule[];
  public _children: DBModule[];
  public numSemesters: number;
  public field?: DBField;
  public fields: DBField[];
  public userId: string;
  public concepts: string[];
  public linksToBok: DBBokInput[];
  public depth = 0;
  public bibliography: DBBokInput[];
  public orgId: string;
  public orgName: string;
  public division: string;
  public isEdited: Boolean;
  public learningObjectives: DBBokInput[];
  public inheritedLearningObjectives: DBBokInput[];
  public customCompetences: string[];
  public competences: DBCompetence[];
  public updatedAt: any;
  public createdAt: any;
  public urlAff: string;
  public urlTM: string;

  constructor(public currentNode: Partial<DBStudyProgram>) {
    this._id = currentNode?._id || "";
    this.name = currentNode?.name || 'New Educational Offer';
    this.description = currentNode?.description || '';
    this.affiliation = currentNode?.affiliation || '';
    this.eqf = currentNode?.eqf || 0;
    this.children = currentNode?.children || [];
    this._children = currentNode?._children || [];
    this.numSemesters = currentNode?.numSemesters || 0;
    this.field = currentNode?.field;
    this.fields = currentNode?.fields || [];
    if (this.field && this.fields.length === 0) {
      this.fields.push(this.field);
    }
    this.userId = currentNode?.userId || '';
    this.concepts = currentNode?.concepts || [];
    this.linksToBok = currentNode?.linksToBok || [];
    this.levelPublic = currentNode?.levelPublic || false;
    this.bibliography = currentNode?.bibliography || [];
    this.userId = currentNode?.userId || '';
    this.orgId = currentNode?.orgId || '';
    this.orgName = currentNode?.orgName || '';
    this.division = currentNode?.division || '';
    this.isEdited = currentNode?.isEdited || false;
    this.learningObjectives = currentNode?.learningObjectives || [];
    this.inheritedLearningObjectives = [];

    // Modules
    this.children.forEach(childM => {
      childM.learningObjectives.forEach(lo => {
        this.inheritedLearningObjectives.push(lo);
      });
      // Courses
      childM.children.forEach(childC => {
        childC.learningObjectives.forEach(lo => {
          this.inheritedLearningObjectives.push(lo);
        });
        // Lectures
        childC.children.forEach(childL => {
          childL.learningObjectives.forEach(lo => {
            this.inheritedLearningObjectives.push(lo);
          });
        });
      });
    });
    
    
    this.competences = currentNode?.competences || [];
    this.customCompetences = currentNode?.customCompetences || [];
    this.updatedAt = currentNode?.updatedAt;
    this.createdAt = currentNode?.createdAt || new Date();
    this.urlAff = currentNode?.urlAff || '';
    this.urlTM = currentNode?.urlTM || '';
  }
}