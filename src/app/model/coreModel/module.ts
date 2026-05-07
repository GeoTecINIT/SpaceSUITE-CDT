import { CurriculumNode } from "./curriculumNode";
import { DomainError } from "../domainError";
import { StudyProgram } from "./studyProgram";
import { Course } from "./course";
import { Lecture } from "./lecture";

export enum ModuleType {
  StudyProgram = 'Study Program',
  Course = 'Course',
  Lecture = 'Lecture'
}

export class Module extends CurriculumNode {
  public moduleType: ModuleType;

  constructor(currentNode?: Partial<Module>, id?: string) {
    super(currentNode, id);
    this.moduleType = currentNode?.moduleType || ModuleType.Course;
  }

  protected override validateChildCandidate(child: CurriculumNode): void {
    let isValid: boolean;

    switch (true) {
      case child instanceof StudyProgram:
        isValid = this.moduleType === ModuleType.StudyProgram;
        break;
      case child instanceof Course:
        isValid = this.moduleType === ModuleType.Course;
        break;
      case child instanceof Lecture:
        isValid = this.moduleType === ModuleType.Lecture;
        break;
      default:
        isValid = false;
    }

    if (!isValid) {
      throw new DomainError(
        'HIERARCHY_INVALID', 
        `Cannot add a child of type ${child.constructor.name} to a Module of type ${this.moduleType}.`
      );
    }
  }
}