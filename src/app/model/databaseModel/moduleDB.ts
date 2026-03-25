import { CurriculumNodeDB } from "./curriculumNodeDB";

export enum ModuleType {
  StudyProgram,
  Course,
  Lecture
}

export class ModuleDB extends CurriculumNodeDB {
  public moduleType: ModuleType;

  constructor(currentNode?: Partial<ModuleDB>, id?: string) {
    super(currentNode, id);
    this.moduleType = currentNode?.moduleType || ModuleType.Course;
  }

  public override toPlainObject(): any {
    return {
      ...super.toPlainObject(),
      moduleType: this.moduleType,
    };
  }
}