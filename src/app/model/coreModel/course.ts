import { CurriculumNode, NodeType } from "./curriculumNode";
import { DomainError } from "../domainError";
import { Lecture } from "./lecture";
import { Grouping, GroupingType } from "./grouping";

export enum CourseType {
  Common = 'Common',
  Specialization = 'Specialization',
  Elective = 'Elective'
}

export class Course extends CurriculumNode {
  public assessment: string;
  public courseType?: CourseType;
  public override nodeType: NodeType;

  constructor(currentNode?: Partial<Course>, id?: string) {
    super(currentNode, id);
    this.assessment = currentNode?.assessment || "";
    this.courseType = currentNode?.courseType;
    this.nodeType = NodeType.Course;
  }

  protected override validateChildCandidate(child: CurriculumNode): void {
    if (!(child instanceof Lecture || (child instanceof Grouping && child.groupingType === GroupingType.Lecture))) {
      throw new DomainError(
        'HIERARCHY_INVALID', 
        `Cannot add a StudyProgram, Grouping or Course as child of Course. Use lower-level nodes (StudyProgram > Course > Lecture).`
      );
    }
  }

  public override clone(): CurriculumNode {
    return new Course(this);
  }
}