import { CurriculumNode } from "./curriculumNode";
import { DomainError } from "./domainError";
import { Lecture } from "./lecture";

export enum CourseType {
  Common,
  Specialization,
  Elective
}

export class Course extends CurriculumNode {
  public assesment: string;
  public courseType?: CourseType;

  // Common to Course/Lecture
  public bibliography: string[];

  protected constructor(currentNode?: Partial<Course>, id?: string) {
    super(currentNode, id);
    this.assesment = currentNode?.assesment || "";
    this.bibliography = currentNode?.bibliography || [];
  }

  protected override validateChildCandidate(child: CurriculumNode): void {
    if (!(child instanceof Lecture)) {
      throw new DomainError(
        'HIERARCHY_INVALID', 
        `Cannot add a StudyProgram, Module or Course as child of Course. Use lower-level nodes (StudyProgram > Module > Course > Lecture).`
      );
    }
  }
}