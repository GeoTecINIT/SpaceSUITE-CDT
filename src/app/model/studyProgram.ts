import { Affiliation } from "./affiliation";
import { CurriculumNode } from "./curriculumNode";
import { DomainError } from "./domainError";
import { ISCEDFArea } from "./iscedfArea";

export class StudyProgram extends CurriculumNode {
  public affiliation: Affiliation;
  public studyAreas: ISCEDFArea[];

  // fits better on Courses; Can be linked to the TCT;
  public trainingMaterialUrl: string;

  constructor(currentNode?: Partial<StudyProgram>, id?: string) {
    super(currentNode, id);
    this.affiliation = currentNode?.affiliation || new Affiliation();
    this.studyAreas = currentNode?.studyAreas || [];
    this.trainingMaterialUrl = currentNode?.trainingMaterialUrl || "";
  }

  protected validateChildCandidate(child: CurriculumNode): void {
    if (child instanceof StudyProgram) {
      throw new DomainError(
        'HIERARCHY_INVALID', 
        `Cannot add a StudyProgram as child of StudyProgram. Use lower-level nodes (StudyProgram > Module > Course > Lecture).`
      );
    }
  }
}