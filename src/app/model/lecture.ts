import { CurriculumNode } from "./curriculumNode";

export class Course extends CurriculumNode {
  public isPractical: boolean;

  // Common Module/Course/Lecture
  public ects: number;

  // Common to Course/Lecture
  public bibliography: string[];

  // TODO - fix children to avoid childrens of the same class, StudyProgram and Module

  protected constructor(currentNode: Partial<Course> | undefined) {
    super(currentNode);
    this.isPractical = currentNode?.isPractical || false;
    this.ects = currentNode?.ects || 0;
    this.bibliography = currentNode?.bibliography || [];
  }
}