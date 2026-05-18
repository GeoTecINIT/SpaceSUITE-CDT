import { CurriculumNode } from "./curriculumNode";
import { DomainError } from "../domainError";
import { Module, ModuleType } from "./module";

export class StudyProgram extends CurriculumNode {

  protected override validateChildCandidate(child: CurriculumNode): void {
    if (child instanceof StudyProgram || (child instanceof Module && child.moduleType === ModuleType.StudyProgram)) {
      throw new DomainError(
        'HIERARCHY_INVALID', 
        `Cannot add a StudyProgram as child of StudyProgram. Use lower-level nodes (StudyProgram > Course > Lecture).`
      );
    }
  }

  public override clone(): CurriculumNode {
    return new StudyProgram(this);
  }
}