import { CourseType } from "../coreModel/course";
import { NodeType } from "../coreModel/curriculumNode";
import {CurriculumNodeDB } from "./curriculumNodeDB";

export class CourseDB extends CurriculumNodeDB {
  public assessment: string;
  public courseType?: CourseType;
  public override nodeType: NodeType;

  constructor(currentNode?: Partial<CourseDB>, id?: string) {
    super(currentNode, id);
    this.assessment = currentNode?.assessment || "";
    this.courseType = currentNode?.courseType;
    this.nodeType = NodeType.Course;
  }

  public override toPlainObject(): any {
    return {
      ...super.toPlainObject(),
      assessment: this.assessment,
      courseType: this.courseType ?? null,
    };
  }
}