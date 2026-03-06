import { DBBokInput } from "./dbBokInput";
import { DBCompetence } from "./dbCompetence";
import { DBField } from "./dbField";

export class DBLecture {
  public _id: string;
  public name: string;
  public description: string;
  public ects: number;
  public bibliography: DBBokInput[];
  public isPractical: boolean;
  public concepts: string[];
  public linksToBok: DBBokInput[];
  public depth = 3;
  public userId: string;
  public affiliation: string;
  public levelPublic: Boolean;
  public children: null;
  public _children: null;
  public eqf: number;
  public field?: DBField;
  public fields: DBField[];
  public orgId: string;
  public orgName: string;
  public division: string;
  public learningObjectives: DBBokInput[];
  public customCompetences: string[];
  public competences: DBCompetence[];
  public isEdited: Boolean;
  public urlAff: string;
  public urlTM: string;

  constructor(public currentNode: Partial<DBLecture>) {
    this._id = currentNode._id || '';
    this.name = currentNode.name || '';
    this.description = currentNode.description || '';
    this.ects = currentNode.ects || 0;
    this.bibliography = currentNode.bibliography || [];
    this.isPractical = currentNode.isPractical || false;
    this.concepts = currentNode.concepts || [];
    this.linksToBok = currentNode.linksToBok || [];
    this.userId = currentNode.userId || '';
    this.affiliation = currentNode.affiliation || '';
    this.levelPublic = currentNode.levelPublic || false;
    this.children = null;
    this._children = null;
    this.eqf = currentNode.eqf || 0;
    this.field = currentNode.field;
    this.fields = currentNode.fields || [];
    if (this.field && this.fields.length === 0) {
      this.fields.push(this.field);
    }
    this.orgId = currentNode.orgId || '';
    this.orgName =currentNode.orgName || '';
    this.division = currentNode.division || '';
    this.learningObjectives = currentNode.learningObjectives || [];
    this.competences = currentNode.competences || [];
    this.customCompetences = currentNode.customCompetences || [];
    this.isEdited = currentNode.isEdited || false;
    this.urlAff = currentNode.urlAff || '';
    this.urlTM = currentNode.urlTM || '';
  }
}