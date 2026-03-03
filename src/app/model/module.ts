import { CurriculumNode } from "./curriculumNode";

export class Module extends CurriculumNode {
  // Common Module/Course/Lecture
  public ects: number;

  //Common StudyProgramm/Module/Course
  public numSemesters: number;

  // Common Module/Course
  public prerequisites: string[];

  // TODO - fix children to avoid childrens of the same class and StudyProgram

  protected constructor(currentNode: Partial<Module> | undefined) {
    super(currentNode);
    this.ects = currentNode?.ects || 0;
    this.numSemesters = currentNode?.numSemesters || 0;
    this.prerequisites = currentNode?.prerequisites || [];
  }
}