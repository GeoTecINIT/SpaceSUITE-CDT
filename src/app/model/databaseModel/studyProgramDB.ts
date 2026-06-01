import { NodeType } from "../coreModel/curriculumNode";
import { CurriculumNodeDB } from "./curriculumNodeDB";

export class StudyProgramDB extends CurriculumNodeDB {
  public override nodeType: NodeType;

  constructor(currentNode?: Partial<StudyProgramDB>, id?: string) {
    super(currentNode, id);
    this.nodeType = NodeType.StudyProgram;
  }
}