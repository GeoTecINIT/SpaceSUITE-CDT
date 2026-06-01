import { NodeType } from "../coreModel/curriculumNode";
import { CurriculumNodeDB } from "./curriculumNodeDB";

export class LectureDB extends CurriculumNodeDB {
  public isPractical: boolean;
  public override nodeType: NodeType;

  constructor(currentNode?: Partial<LectureDB>, id?: string) {
    super(currentNode, id);
    this.children = [];
    this.isPractical = currentNode?.isPractical || false;
    this.nodeType = NodeType.Lecture;
  }

  public override toPlainObject(): any {
    return {
      ...super.toPlainObject(),
      isPractical: this.isPractical,
    };
  }
}