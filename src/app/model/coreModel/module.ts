import { CurriculumNode } from "./curriculumNode";
import { DomainError } from "./domainError";

export enum ModuleType {
  StudyProgram,
  Course,
  Lecture
}

export class Module extends CurriculumNode {
  public moduleType: ModuleType;

  protected constructor(currentNode?: Partial<Module>, id?: string) {
    super(currentNode, id);
    this.moduleType = currentNode?.moduleType || ModuleType.Course;
  }

  protected override validateChildCandidate(child: CurriculumNode): void {
    if (child.constructor.name !== this.moduleType.toString()) {
      throw new DomainError(
        'HIERARCHY_INVALID', 
        `Cannot add a child of type ${child.constructor.name} to a Module of type ${this.moduleType}.`
      );
    }
  }

  public override toPlainObject(): any {
    return {
      ...super.toPlainObject(),
      moduleType: this.moduleType,
    };
  }
}