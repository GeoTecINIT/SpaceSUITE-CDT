import { CourseType } from "../coreModel/course";
import {CurriculumNodeDB } from "./curriculumNodeDB";

export class CourseDB extends CurriculumNodeDB {
  public assesment: string;
  public courseType?: CourseType;

  constructor(currentNode?: Partial<CourseDB>, id?: string) {
    super(currentNode, id);
    this.assesment = currentNode?.assesment || "";
    this.courseType = currentNode?.courseType;
  }

  public override toPlainObject(): any {
    return {
      ...super.toPlainObject(),
      assesment: this.assesment,
      courseType: this.courseType ?? null,
    };
  }
}