import { NodeType } from "../coreModel/curriculumNode";
import { GroupingType } from "../coreModel/grouping";
import { CurriculumNodeDB } from "./curriculumNodeDB";

export class GroupingDB extends CurriculumNodeDB {
  public groupingType: GroupingType;
  public override nodeType: NodeType;

  constructor(currentNode?: Partial<GroupingDB>, id?: string) {
    super(currentNode, id);
    this.groupingType = currentNode?.groupingType || GroupingType.Course;
    this.nodeType = NodeType.Grouping;
  }

  public override toPlainObject(): any {
    return {
      ...super.toPlainObject(),
      groupingType: this.groupingType,
    };
  }
}