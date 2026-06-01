import { CurriculumNode, NodeType } from "./curriculumNode";
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
  public override nodeType: NodeType;

  constructor(currentNode?: Partial<Module>, id?: string) {
    super(currentNode, id);
    this.moduleType = currentNode?.moduleType || ModuleType.Course;
    this.nodeType = NodeType.Module;
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
        `Cannot add a child of type ${child.nodeType} to a Module of type ${this.moduleType}.`
      );
    }
  }

  public override clone(): CurriculumNode {
    return new Module(this);
  }
}