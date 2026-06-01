import { CourseType } from "../coreModel/course";
import { NodeType } from "../coreModel/curriculumNode";
import {CurriculumNodeDB } from "./curriculumNodeDB";

export class CourseDB extends CurriculumNodeDB {
  public assesment: string;
  public courseType?: CourseType;
  public override nodeType: NodeType;

  constructor(currentNode?: Partial<CourseDB>, id?: string) {
    super(currentNode, id);
    this.assesment = currentNode?.assesment || "";
    this.courseType = currentNode?.courseType;
    this.nodeType = NodeType.Course;
  }

  public override toPlainObject(): any {
    return {
      ...super.toPlainObject(),
      assesment: this.assesment,
      courseType: this.courseType ?? null,
    };
  }
}