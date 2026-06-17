import { CurriculumNode, NodeType } from "./curriculumNode";
import { DomainError } from "../domainError";
import { StudyProgram } from "./studyProgram";
import { Course } from "./course";
import { Lecture } from "./lecture";

export enum GroupingType {
  StudyProgram = 'Study Program',
  Course = 'Course',
  Lecture = 'Lecture'
}

export class Grouping extends CurriculumNode {
  public groupingType: GroupingType;
  public groupingName: string;
  public override nodeType: NodeType;

  constructor(currentNode?: Partial<Grouping>, id?: string) {
    super(currentNode, id);
    this.groupingType = currentNode?.groupingType || GroupingType.Course;
    this.groupingName = currentNode?.groupingName || '';
    this.nodeType = NodeType.Grouping;
  }

  protected override validateChildCandidate(child: CurriculumNode): void {
    let isValid: boolean;

    switch (true) {
      case child instanceof StudyProgram:
        isValid = this.groupingType === GroupingType.StudyProgram;
        break;
      case child instanceof Course:
        isValid = this.groupingType === GroupingType.Course;
        break;
      case child instanceof Lecture:
        isValid = this.groupingType === GroupingType.Lecture;
        break;
      default:
        isValid = false;
    }

    if (!isValid) {
      throw new DomainError(
        'HIERARCHY_INVALID', 
        `Cannot add a child of type ${child.nodeType} to a Grouping of type ${this.groupingType}.`
      );
    }
  }

  public override clone(): CurriculumNode {
    return new Grouping(this);
  }
}