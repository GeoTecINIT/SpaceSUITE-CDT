import { CurriculumNode } from "./curriculumNode";
import { DomainError } from "../domainError";

export class Lecture extends CurriculumNode {
  public isPractical: boolean;

  constructor(currentNode?: Partial<Lecture>, id?: string) {
    super(currentNode, id);
    this.children = [];
    this.isPractical = currentNode?.isPractical || false;
  }

  public override validateChildCandidate(_: CurriculumNode): void {
    throw new DomainError(
      'LECTURE_HAS_CHILDREN', 
      `Lectures are leaf nodes and cannot have children. Move content up to a Course or Module.`
    );
  }
}