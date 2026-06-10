import { CurriculumNode, NodeType } from "./curriculumNode";
import { DomainError } from "../domainError";

export class Lecture extends CurriculumNode {
  public isPractical: boolean;
  public override nodeType: NodeType;

  constructor(currentNode?: Partial<Lecture>, id?: string) {
    super(currentNode, id);
    this.children = [];
    this.isPractical = currentNode?.isPractical || false;
    this.nodeType = NodeType.Lecture;
  }

  protected override validateChildCandidate(_: CurriculumNode): void {
    throw new DomainError(
      'LECTURE_HAS_CHILDREN', 
      `Lectures are leaf nodes and cannot have children. Move content up to a Course or Module.`
    );
  }

  public override clone(): CurriculumNode {
    return new Lecture(this);
  }
}