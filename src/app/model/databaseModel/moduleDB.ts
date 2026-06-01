import { NodeType } from "../coreModel/curriculumNode";
import { ModuleType } from "../coreModel/module";
import { CurriculumNodeDB } from "./curriculumNodeDB";

export class ModuleDB extends CurriculumNodeDB {
  public moduleType: ModuleType;
  public override nodeType: NodeType;

  constructor(currentNode?: Partial<ModuleDB>, id?: string) {
    super(currentNode, id);
    this.moduleType = currentNode?.moduleType || ModuleType.Course;
    this.nodeType = NodeType.Module;
  }

  public override toPlainObject(): any {
    return {
      ...super.toPlainObject(),
      moduleType: this.moduleType,
    };
  }
}