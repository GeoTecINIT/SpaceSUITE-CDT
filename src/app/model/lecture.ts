import { CurriculumNode } from "./curriculumNode";
import { DomainError } from "./domainError";

export class Lecture extends CurriculumNode {
  public isPractical: boolean;

  // Common to Course/Lecture
  public bibliography: string[];

  protected constructor(currentNode?: Partial<Lecture>, id?: string) {
    super(currentNode, id);
    this.children = [];
    this.isPractical = currentNode?.isPractical || false;
    this.bibliography = currentNode?.bibliography || [];
  }

  public override validateChildCandidate(_: CurriculumNode): void {
    throw new DomainError(
      'LECTURE_HAS_CHILDREN', 
      `Lectures are leaf nodes and cannot have children. Move content up to a Course or Module.`
    );
  }
}