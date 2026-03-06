import { CurriculumNode } from "./curriculumNode";
import { DomainError } from "./domainError";

export class StudyProgram extends CurriculumNode {

  protected validateChildCandidate(child: CurriculumNode): void {
    if (child instanceof StudyProgram) {
      throw new DomainError(
        'HIERARCHY_INVALID', 
        `Cannot add a StudyProgram as child of StudyProgram. Use lower-level nodes (StudyProgram > Course > Lecture).`
      );
    }
  }
}