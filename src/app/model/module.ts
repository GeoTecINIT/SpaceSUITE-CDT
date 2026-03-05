import { CurriculumNode } from "./curriculumNode";
import { DomainError } from "./domainError";
import { StudyProgram } from "./studyProgram";

export class Module extends CurriculumNode {

  protected override validateChildCandidate(child: CurriculumNode): void {
    if (child instanceof Module || child instanceof StudyProgram) {
      throw new DomainError(
        'HIERARCHY_INVALID', 
        `Cannot add a StudyProgram or Module as child of Module. Use lower-level nodes (StudyProgram > Module > Course > Lecture).`
      );
    }
  }
}