import { CurriculumNode } from "./curriculumNode";
import { DomainError } from "./domainError";
import { Lecture } from "./lecture";
import { Module, ModuleType } from "./module";

export enum CourseType {
  Common,
  Specialization,
  Elective
}

export class Course extends CurriculumNode {
  public assesment: string;
  public courseType?: CourseType;

  protected constructor(currentNode?: Partial<Course>, id?: string) {
    super(currentNode, id);
    this.assesment = currentNode?.assesment || "";
    this.courseType = currentNode?.courseType;
  }

  protected override validateChildCandidate(child: CurriculumNode): void {
    if (!(child instanceof Lecture || (child instanceof Module && child.moduleType === ModuleType.Lecture))) {
      throw new DomainError(
        'HIERARCHY_INVALID', 
        `Cannot add a StudyProgram, Module or Course as child of Course. Use lower-level nodes (StudyProgram > Course > Lecture).`
      );
    }
  }

  public override toPlainObject(): any {
    return {
      ...super.toPlainObject(),
      assesment: this.assesment,
      courseType: this.courseType,
    };
  }
}