import { Injectable } from "@angular/core";
import { EducationalOffer } from "../../model/coreModel/educationalOffer";
import { CurriculumNode } from "../../model/coreModel/curriculumNode";
import { Course } from "../../model/coreModel/course";
import { Grouping } from "../../model/coreModel/grouping";
import { Lecture } from "../../model/coreModel/lecture";

@Injectable({ providedIn: 'root' })
export class JsonService {

  public getJSONUrl(model: EducationalOffer): string {
    const json = JSON.stringify(this.getEducationalOfferJSON(model), null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    return window.URL.createObjectURL(blob);
  }
  
  public getEducationalOfferJSON(offer: EducationalOffer): Object {
    return {
      isPublic: offer.isPublic,
      createdAt: new Date(offer.createdAt),
      updatedAt: offer.updatedAt ? new Date(offer.updatedAt) : undefined,
      organization: offer.orgName,
      division: offer.division,
      root: this.getCurriculumNodeJSON(offer.root)
    }
  }

  public getCurriculumNodeJSON(node: CurriculumNode): Object {
    return {
      name: node.name,
      description: node.description,
      bokConcepts: [...node.bokConcepts],
      prerequisites: [...node.prerequisites],
      eqf: node.eqf,
      ects: node.ects,
      timeRequired: node.timeRequired.toPlainObject(),
      studyAreas: node.studyAreas.map(value => value.toPlainObject()),
      transversalSkills: node.transversalSkills.map(value => value.toPlainObject()),
      customTransversalSkills: [...node.customTransversalSkills],
      learningObjetives: [...node.learningObjectives],
      trainingMaterials: node.trainingMaterials.map(value => value.toPlainObject()),
      bibliography: [...node.bibliography],
      affiliations: node.affiliations.map(value => value.toPlainObject()),
      nodeType: node.nodeType,
      ...(node instanceof Course && {
        assessment: node.assessment,
        courseType: node.courseType
      }),
      ...(node instanceof Grouping && {
        groupingType: node.groupingType,
        groupingName: node.groupingName
      }),
      ...(node instanceof Lecture && {
        isPractical: node.isPractical
      }),
      children: node.getChildren().map(value => this.getCurriculumNodeJSON(value))
    }
  }
}