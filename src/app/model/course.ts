import { CourseType } from "./courseType";
import { CurriculumNode } from "./curriculumNode";

export class Course extends CurriculumNode {
  public assesment: string;
  public courseType?: CourseType;

  // Common Module/Course/Lecture
  public ects: number;

  //Common StudyProgramm/Module/Course
  public numSemesters: number;

  // Common to Module/Course
  public prerequisites: string[];

  // Common to Course/Lecture
  public bibliography: string[];

  // TODO - fix children to avoid childrens of the same class, StudyProgram and Module

  protected constructor(currentNode: Partial<Course> | undefined) {
    super(currentNode);
    this.assesment = currentNode?.assesment || "";
    this.ects = currentNode?.ects || 0;
    this.numSemesters = currentNode?.numSemesters || 0;
    this.prerequisites = currentNode?.prerequisites || [];
    this.bibliography = currentNode?.bibliography || [];
  }
}