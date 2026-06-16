import { inject, Injectable } from "@angular/core";
import { DomainError } from "../../model/domainError";
import { StudyProgram } from "../../model/coreModel/studyProgram";
import { StudyProgramDB } from "../../model/databaseModel/studyProgramDB";
import { GroupingDB } from "../../model/databaseModel/groupingDB";
import { Grouping } from "../../model/coreModel/grouping";
import { CourseDB } from "../../model/databaseModel/courseDB";
import { Course } from "../../model/coreModel/course";
import { LectureDB } from "../../model/databaseModel/lectureDB";
import { Lecture } from "../../model/coreModel/lecture";
import { CurriculumNodeDB } from "../../model/databaseModel/curriculumNodeDB";
import { CurriculumNode } from "../../model/coreModel/curriculumNode";
import { EducationalOffer } from "../../model/coreModel/educationalOffer";
import { EducationalOfferDB } from "../../model/databaseModel/educationalOfferDB";
import { concatMap, forkJoin, map, Observable, of, take } from "rxjs";
import { EducationalOfferDBService } from "./educationalOfferDB.service";
import { Timestamp } from "@angular/fire/firestore";
import { BokInformationService } from "@eo4geo/ngx-bok-visualization";
import { Duration } from "../../model/coreModel/duration";
import { ISCEDFArea } from "../../model/coreModel/iscedfArea";
import { ESCOSkill } from "../../model/coreModel/escoSkill";
import { TrainingMaterial } from "../../model/coreModel/trainingMaterial";
import { Affiliation } from "../../model/coreModel/affiliation";

@Injectable({
    providedIn: 'root',
})
export class EducationalOfferAdapterService {
  private educationalOfferDBService = inject(EducationalOfferDBService);
  private bokInformationService = inject(BokInformationService);

  public createEducationalOffer(educationalOffer: EducationalOffer): Observable<string> {
    const educationalOfferDB = this.parseEducationalOffer(educationalOffer);
    const curriculumNodesDBObservables = educationalOffer.getAllNodes().map(node => this.parseCurriculumNode(node));
    return forkJoin(curriculumNodesDBObservables).pipe(
      concatMap(curriculumNodesDB => this.educationalOfferDBService.createEducationalOffer(educationalOfferDB, curriculumNodesDB))
    );
  }

  public deleteEducationalOffer(educationalOfferId: string): Observable<void> {
    return this.educationalOfferDBService.deleteEducationalOffer(educationalOfferId);
  }

  public getEdcationalOffers(): Observable<EducationalOffer[]> {
    return this.educationalOfferDBService.getEdcationalOffers().pipe(
      map(educationalOffersWithNodes => {
        return educationalOffersWithNodes.map(({ educationalOffer, curriculumNodes }) => {
          return this.parseEducationalOfferDB(educationalOffer, curriculumNodes);
        });
      })
    );
  }

  public getEducationalOffer(educationalOfferId: string): Observable<EducationalOffer | undefined> {
    return this.educationalOfferDBService.getEducationalOffer(educationalOfferId).pipe(
      map((educationalOfferWithNodes) => {
        if (!educationalOfferWithNodes) return undefined;
        return this.parseEducationalOfferDB(educationalOfferWithNodes.educationalOffer, educationalOfferWithNodes.curriculumNodes);
      })
    );
  }

  public updateEducationalOffer(updatedOffer: EducationalOffer, oldOffer: EducationalOffer) {
    const educationalOfferDB = this.parseEducationalOffer(updatedOffer);
    const curriculumNodesDBObservables = updatedOffer.getAllNodes().map(node => this.parseCurriculumNode(node));
    const oldCurriculumNodesDBObservables = oldOffer.getAllNodes().map(node => this.parseCurriculumNode(node));
    return forkJoin(curriculumNodesDBObservables).pipe(
      concatMap(curriculumNodesDB => forkJoin(oldCurriculumNodesDBObservables).pipe(
        concatMap(oldCurriculumNodesDB => this.educationalOfferDBService.updateEducationalOffer(educationalOfferDB, curriculumNodesDB, oldCurriculumNodesDB))
      )
    ));
  }

  private parseEducationalOffer(educationalOffer: EducationalOffer): EducationalOfferDB {
    return new EducationalOfferDB({
      id: educationalOffer.id,
      root: educationalOffer.root.id,
      isPublic: educationalOffer.isPublic,
      createdAt: Timestamp.fromDate(educationalOffer.createdAt),
      updatedAt: educationalOffer.updatedAt ? Timestamp.fromDate(educationalOffer.updatedAt) : undefined,
      userId: educationalOffer.userId,
      orgId: educationalOffer.orgId,
      orgName: educationalOffer.orgName,
      division: educationalOffer.division,
    });
  }

  private parseCurriculumNode(node: CurriculumNode): Observable<CurriculumNodeDB> {
    const parsedBokConcepts: Observable<string[]> = this.formatConceptsToFirestore(node.bokConcepts);
    return parsedBokConcepts.pipe(map(formatedBokConcepts => {
      switch (true) {
        case node instanceof Lecture:
          const lectureNode = node as Lecture;
          return new LectureDB(
            {
              id: lectureNode.id,
              name: lectureNode.name,
              description: lectureNode.description,
              children: lectureNode.getChildren().map(child => child.id),
              bokConcepts: formatedBokConcepts,
              prerequisites: lectureNode.prerequisites,
              eqf: lectureNode.eqf,
              ects: lectureNode.ects,
              transversalSkills: lectureNode.transversalSkills.map(skill => skill.toPlainObject()),
              customTransversalSkills: lectureNode.customTransversalSkills,
              learningObjectives: lectureNode.learningObjectives,
              bibliography: lectureNode.bibliography,
              affiliations: lectureNode.affiliations.map(affiliation => affiliation.toPlainObject()),
              trainingMaterials: lectureNode.trainingMaterials.map(material => material.toPlainObject()),
              timeRequired: lectureNode.timeRequired.toPlainObject(),
              studyAreas: lectureNode.studyAreas.map(area => area.toPlainObject()),
              isPractical: lectureNode.isPractical
            }
          );
        case node instanceof Course:
          const courseNode = node as Course;
          return new CourseDB(
            {
              id: courseNode.id,
              name: courseNode.name,
              description: courseNode.description,
              children: courseNode.getChildren().map(child => child.id),
              bokConcepts: formatedBokConcepts,
              prerequisites: courseNode.prerequisites,
              eqf: courseNode.eqf,
              ects: courseNode.ects,
              transversalSkills: courseNode.transversalSkills.map(skill => skill.toPlainObject()),
              customTransversalSkills: courseNode.customTransversalSkills,
              learningObjectives: courseNode.learningObjectives,
              bibliography: courseNode.bibliography,
              affiliations: courseNode.affiliations.map(affiliation => affiliation.toPlainObject()),
              trainingMaterials: courseNode.trainingMaterials.map(material => material.toPlainObject()),
              timeRequired: courseNode.timeRequired.toPlainObject(),
              studyAreas: courseNode.studyAreas.map(area => area.toPlainObject()),
              assesment: courseNode.assesment,
              courseType: courseNode.courseType
            }
          );
        case node instanceof Grouping:
          const groupingNode = node as Grouping;
          return new GroupingDB(
            {
              id: groupingNode.id,
              name: groupingNode.name,
              description: groupingNode.description,
              children: groupingNode.getChildren().map(child => child.id),
              bokConcepts: formatedBokConcepts,
              prerequisites: groupingNode.prerequisites,
              eqf: groupingNode.eqf,
              ects: groupingNode.ects,
              transversalSkills: groupingNode.transversalSkills.map(skill => skill.toPlainObject()),
              customTransversalSkills: groupingNode.customTransversalSkills,
              learningObjectives: groupingNode.learningObjectives,
              bibliography: groupingNode.bibliography,
              affiliations: groupingNode.affiliations.map(affiliation => affiliation.toPlainObject()),
              trainingMaterials: groupingNode.trainingMaterials.map(material => material.toPlainObject()),
              timeRequired: groupingNode.timeRequired.toPlainObject(),
              studyAreas: groupingNode.studyAreas.map(area => area.toPlainObject()),
              groupingType: groupingNode.groupingType
            }
          );
        case node instanceof StudyProgram:
          const studyProgramNode = node as StudyProgram;
          return new StudyProgramDB(
            {
              id: studyProgramNode.id,
              name: studyProgramNode.name,
              description: studyProgramNode.description,
              children: studyProgramNode.getChildren().map(child => child.id),
              bokConcepts: formatedBokConcepts,
              prerequisites: studyProgramNode.prerequisites,
              eqf: studyProgramNode.eqf,
              ects: studyProgramNode.ects,
              transversalSkills: studyProgramNode.transversalSkills.map(skill => skill.toPlainObject()),
              customTransversalSkills: studyProgramNode.customTransversalSkills,
              learningObjectives: studyProgramNode.learningObjectives,
              bibliography: studyProgramNode.bibliography,
              affiliations: studyProgramNode.affiliations.map(affiliation => affiliation.toPlainObject()),
              trainingMaterials: studyProgramNode.trainingMaterials.map(material => material.toPlainObject()),
              timeRequired: studyProgramNode.timeRequired.toPlainObject(),
              studyAreas: studyProgramNode.studyAreas.map(area => area.toPlainObject()),          
            }
          );
        default:
          throw new DomainError(
          'NODE_TYPE_INVALID', 
          `Unknown node type: ${node.nodeType}. Cannot parse curriculum node with id ${node.id} to database model.`
        );
      }
    }))
  }

  private parseEducationalOfferDB(educationalOfferDB: EducationalOfferDB, curriculumNodesDB: CurriculumNodeDB[]): EducationalOffer {
    const nodeMap = new Map<string, CurriculumNode>();
    curriculumNodesDB.forEach((nodeDB: CurriculumNodeDB) => {
      const node = this.parseCurriculumNodeDB(nodeDB);
      nodeMap.set(node.id, node);
    });

    for (const nodeDB of curriculumNodesDB) {
      const node = nodeMap.get(nodeDB.id);
      nodeDB.children.forEach(childId => {
        const childNode = nodeMap.get(childId);
        if (childNode) {
          node?.addChild(childNode);
        } else {
          throw new DomainError(
            'CHILD_NODE_NOT_FOUND',
            `Child node with id ${childId} not found for parent node with id ${nodeDB.id} while parsing educational offer from database.`
          );
        }
      });
    }

    const rootNode = nodeMap.get(educationalOfferDB.root);
    if (!rootNode) {
      throw new DomainError(
        'ROOT_NODE_NOT_FOUND',
        `Root node with id ${educationalOfferDB.root} not found among curriculum nodes while parsing educational offer from database.`
      );
    }

    return new EducationalOffer(
      rootNode,
      {
        id: educationalOfferDB.id,
        isPublic: educationalOfferDB.isPublic,
        createdAt: educationalOfferDB.createdAt.toDate(),
        updatedAt: educationalOfferDB.updatedAt ? educationalOfferDB.updatedAt.toDate() : undefined,
        userId: educationalOfferDB.userId,
        orgId: educationalOfferDB.orgId,
        orgName: educationalOfferDB.orgName,
        division: educationalOfferDB.division,
      }
    );
  }

  private parseCurriculumNodeDB(nodeDB: CurriculumNodeDB): CurriculumNode {
    switch (true) {
      case nodeDB instanceof LectureDB:
        const lectureDB = nodeDB as LectureDB;
        return new Lecture(
          {
            id: lectureDB.id,
            name: lectureDB.name,
            description: lectureDB.description,
            bokConcepts: this.formatConceptsFromFirestore(lectureDB.bokConcepts),
            prerequisites: lectureDB.prerequisites,
            eqf: lectureDB.eqf,
            ects: lectureDB.ects,
            transversalSkills: lectureDB.transversalSkills.map(value => new ESCOSkill(value)),
            customTransversalSkills: lectureDB.customTransversalSkills,
            learningObjectives: lectureDB.learningObjectives,
            bibliography: lectureDB.bibliography,
            affiliations: lectureDB.affiliations.map(value => new Affiliation(value)),
            trainingMaterials: lectureDB.trainingMaterials.map(value => new TrainingMaterial(value)),
            timeRequired: new Duration(lectureDB.timeRequired),
            studyAreas: lectureDB.studyAreas.map(value => new ISCEDFArea(value)),
            isPractical: lectureDB.isPractical
          }
        );
      case nodeDB instanceof CourseDB:
        const courseDB = nodeDB as CourseDB;
        return new Course(
          {
            id: courseDB.id,
            name: courseDB.name,
            description: courseDB.description,
            bokConcepts: this.formatConceptsFromFirestore(courseDB.bokConcepts),
            prerequisites: courseDB.prerequisites,
            eqf: courseDB.eqf,
            ects: courseDB.ects,
            transversalSkills: courseDB.transversalSkills.map(value => new ESCOSkill(value)),
            customTransversalSkills: courseDB.customTransversalSkills,
            learningObjectives: courseDB.learningObjectives,
            bibliography: courseDB.bibliography,
            affiliations: courseDB.affiliations.map(value => new Affiliation(value)),
            trainingMaterials: courseDB.trainingMaterials.map(value => new TrainingMaterial(value)),
            timeRequired: new Duration(courseDB.timeRequired),
            studyAreas: courseDB.studyAreas.map(value => new ISCEDFArea(value)),
            assesment: courseDB.assesment,
            courseType: courseDB.courseType
          }
        );
      case nodeDB instanceof GroupingDB:
        const groupingDB = nodeDB as GroupingDB;
        return new Grouping(
          {
            id: groupingDB.id,
            name: groupingDB.name,
            description: groupingDB.description,
            bokConcepts: this.formatConceptsFromFirestore(groupingDB.bokConcepts),
            prerequisites: groupingDB.prerequisites,
            eqf: groupingDB.eqf,
            ects: groupingDB.ects,
            transversalSkills: groupingDB.transversalSkills.map(value => new ESCOSkill(value)),
            customTransversalSkills: groupingDB.customTransversalSkills,
            learningObjectives: groupingDB.learningObjectives,
            bibliography: groupingDB.bibliography,
            affiliations: groupingDB.affiliations.map(value => new Affiliation(value)),
            trainingMaterials: groupingDB.trainingMaterials.map(value => new TrainingMaterial(value)),
            timeRequired: new Duration(groupingDB.timeRequired),
            studyAreas: groupingDB.studyAreas.map(value => new ISCEDFArea(value)),
            groupingType: groupingDB.groupingType
          }
        );
      case nodeDB instanceof StudyProgramDB:
        const studyProgramDB = nodeDB as StudyProgramDB;
        return new StudyProgram(
          {
            id: studyProgramDB.id,
            name: studyProgramDB.name,
            description: studyProgramDB.description,
            bokConcepts: this.formatConceptsFromFirestore(studyProgramDB.bokConcepts),
            prerequisites: studyProgramDB.prerequisites,
            eqf: studyProgramDB.eqf,
            ects: studyProgramDB.ects,
            transversalSkills: studyProgramDB.transversalSkills.map(value => new ESCOSkill(value)),
            customTransversalSkills: studyProgramDB.customTransversalSkills,
            learningObjectives: studyProgramDB.learningObjectives,
            bibliography: studyProgramDB.bibliography,
            affiliations: studyProgramDB.affiliations.map(value => new Affiliation(value)),
            trainingMaterials: studyProgramDB.trainingMaterials.map(value => new TrainingMaterial(value)),
            timeRequired: new Duration(studyProgramDB.timeRequired),
            studyAreas: studyProgramDB.studyAreas.map(value => new ISCEDFArea(value)),       
          }
        );
      default:
        throw new DomainError(
        'NODE_TYPE_INVALID',
        `Unknown node type: ${nodeDB.nodeType}. Cannot parse curriculum database node with id ${nodeDB.id} to core model.`
      );
    }
  }

  private formatConceptsFromFirestore(concepts: string[]){
    const regex = /\[(.*?)\]/;
    return concepts.map(concept => concept.match(regex)?.[1])
      .filter(Boolean) as string[];
  }

  private formatConceptsToFirestore(concepts: string[]): Observable<string[]> {
    if (concepts.length <= 0) return of([]);
    return forkJoin(concepts.map(concept =>
      this.bokInformationService.getConceptName(concept).pipe(
        take(1),
        map(conceptName => `[${concept}] ${conceptName}`)
      )
    ))
  }
}