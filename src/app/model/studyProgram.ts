import { Affiliation } from "./affiliation";
import { CurriculumNode } from "./curriculumNode";
import { ISCEDFArea } from "./iscedfArea";

export class StudyProgram extends CurriculumNode {
  public affiliation: Affiliation;
  public eqf: number;
  public studyAreas: ISCEDFArea[];

  //Common StudyProgramm/Module/Course
  public numSemesters: number;

  // TODO - fix children to avoid childrens of the same class

  // fits better on Courses; Can be linked to the TCT;
  public trainingMaterialUrl: string;

  protected constructor(currentNode: Partial<StudyProgram> | undefined) {
    super(currentNode);
    this.affiliation = currentNode?.affiliation || new Affiliation();
    this.eqf = currentNode?.eqf || 0;
    this.studyAreas = currentNode?.studyAreas || [];
    this.numSemesters = currentNode?.numSemesters || 0;
    this.trainingMaterialUrl = currentNode?.trainingMaterialUrl || "";
  }
}