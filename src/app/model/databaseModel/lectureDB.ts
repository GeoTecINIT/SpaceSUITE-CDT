import { CurriculumNodeDB } from "./curriculumNodeDB";

export class LectureDB extends CurriculumNodeDB {
  public isPractical: boolean;

  constructor(currentNode?: Partial<LectureDB>, id?: string) {
    super(currentNode, id);
    this.children = [];
    this.isPractical = currentNode?.isPractical || false;
  }

  public override toPlainObject(): any {
    return {
      ...super.toPlainObject(),
      isPractical: this.isPractical,
    };
  }
}