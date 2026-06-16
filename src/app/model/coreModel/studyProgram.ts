import { CurriculumNode, NodeType } from "./curriculumNode";
import { DomainError } from "../domainError";
import { Grouping, GroupingType } from "./grouping";

export class StudyProgram extends CurriculumNode {

  public override nodeType: NodeType;

  constructor(currentNode?: Partial<StudyProgram>, id?: string) {
    super(currentNode, id);
    this.nodeType = NodeType.StudyProgram;
  }

  protected override validateChildCandidate(child: CurriculumNode): void {
    if (child instanceof StudyProgram || (child instanceof Grouping && child.groupingType === GroupingType.StudyProgram)) {
      throw new DomainError(
        'HIERARCHY_INVALID', 
        `Cannot add a StudyProgram as child of StudyProgram. Use lower-level nodes (StudyProgram > Course > Lecture).`
      );
    }
  }

  public override clone(): CurriculumNode {
    return new StudyProgram(this);
  }
}