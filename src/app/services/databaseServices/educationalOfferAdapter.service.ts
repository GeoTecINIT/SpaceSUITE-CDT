import { inject, Injectable } from "@angular/core";
import { DomainError } from "../../model/domainError";
import { StudyProgram } from "../../model/coreModel/studyProgram";
import { StudyProgramDB } from "../../model/databaseModel/studyProgramDB";
import { ModuleDB } from "../../model/databaseModel/moduleDB";
import { Module } from "../../model/coreModel/module";
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

@Injectable({
    providedIn: 'root',
})
export class EducationalOfferAdapterService {
  private educationalOfferDBService = inject(EducationalOfferDBService);
  private bokInformationService = inject(BokInformationService);

  public createEducationalOffer(educationalOffer: EducationalOffer): Observable<void> {
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
    const oldEducationalOfferDB = this.parseEducationalOffer(oldOffer);
    const oldCurriculumNodesDBObservables = oldOffer.getAllNodes().map(node => this.parseCurriculumNode(node));
    return forkJoin(curriculumNodesDBObservables).pipe(
      concatMap(curriculumNodesDB => forkJoin(oldCurriculumNodesDBObservables).pipe(
        concatMap(oldCurriculumNodesDB => this.educationalOfferDBService.updateEducationalOffer(educationalOfferDB, curriculumNodesDB, oldEducationalOfferDB, oldCurriculumNodesDB))
      )
    ));
  }

  private parseEducationalOffer(educationalOffer: EducationalOffer): EducationalOfferDB {
    return new EducationalOfferDB({
      id: educationalOffer.id,
      root: educationalOffer.root.id,
      affiliations: educationalOffer.affiliations,
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
      const nodeType = node.constructor.name;
      switch (nodeType) {
        case 'Lecture':
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
        case 'Course':
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
        case 'Module':
          const moduleNode = node as Module;
          return new ModuleDB(
            {
              id: moduleNode.id,
              name: moduleNode.name,
              description: moduleNode.description,
              children: moduleNode.getChildren().map(child => child.id),
              bokConcepts: formatedBokConcepts,
              prerequisites: moduleNode.prerequisites,
              eqf: moduleNode.eqf,
              ects: moduleNode.ects,
              transversalSkills: moduleNode.transversalSkills.map(skill => skill.toPlainObject()),
              customTransversalSkills: moduleNode.customTransversalSkills,
              learningObjectives: moduleNode.learningObjectives,
              bibliography: moduleNode.bibliography,
              affiliations: moduleNode.affiliations.map(affiliation => affiliation.toPlainObject()),
              trainingMaterials: moduleNode.trainingMaterials.map(material => material.toPlainObject()),
              timeRequired: moduleNode.timeRequired.toPlainObject(),
              studyAreas: moduleNode.studyAreas.map(area => area.toPlainObject()),
              moduleType: moduleNode.moduleType
            }
          );
        case 'StudyProgram':
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
          `Unknown node type: ${nodeType}. Cannot parse curriculum node with id ${node.id} to database model.`
        );
      }
    }))
  }

  private parseEducationalOfferDB(educationalOfferDB: EducationalOfferDB, curriculumNodesDB: CurriculumNodeDB[]): EducationalOffer {
    const nodeMap = new Map<string, CurriculumNode>();
    curriculumNodesDB.forEach((nodeDB: CurriculumNodeDB) => {
      const nodeType = nodeDB.constructor.name;
      const node = this.parseCurriculumNodeDB(nodeDB, nodeType);
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
        affiliations: educationalOfferDB.affiliations,
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

  private parseCurriculumNodeDB(nodeDB: CurriculumNodeDB, nodeType: string): CurriculumNode {
    switch (nodeType) {
      case 'LectureDB':
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
            transversalSkills: lectureDB.transversalSkills,
            customTransversalSkills: lectureDB.customTransversalSkills,
            learningObjectives: lectureDB.learningObjectives,
            bibliography: lectureDB.bibliography,
            affiliations: lectureDB.affiliations,
            trainingMaterials: lectureDB.trainingMaterials,
            timeRequired: lectureDB.timeRequired,
            studyAreas: lectureDB.studyAreas,
            isPractical: lectureDB.isPractical
          }
        );
      case 'CourseDB':
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
            transversalSkills: courseDB.transversalSkills,
            customTransversalSkills: courseDB.customTransversalSkills,
            learningObjectives: courseDB.learningObjectives,
            bibliography: courseDB.bibliography,
            affiliations: courseDB.affiliations,
            trainingMaterials: courseDB.trainingMaterials,
            timeRequired: courseDB.timeRequired,
            studyAreas: courseDB.studyAreas,
            assesment: courseDB.assesment,
            courseType: courseDB.courseType
          }
        );
      case 'ModuleDB':
        const moduleDB = nodeDB as ModuleDB;
        return new Module(
          {
            id: moduleDB.id,
            name: moduleDB.name,
            description: moduleDB.description,
            bokConcepts: this.formatConceptsFromFirestore(moduleDB.bokConcepts),
            prerequisites: moduleDB.prerequisites,
            eqf: moduleDB.eqf,
            ects: moduleDB.ects,
            transversalSkills: moduleDB.transversalSkills,
            customTransversalSkills: moduleDB.customTransversalSkills,
            learningObjectives: moduleDB.learningObjectives,
            bibliography: moduleDB.bibliography,
            affiliations: moduleDB.affiliations,
            trainingMaterials: moduleDB.trainingMaterials,
            timeRequired: moduleDB.timeRequired,
            studyAreas: moduleDB.studyAreas,
            moduleType: moduleDB.moduleType
          }
        );
      case 'StudyProgramDB':
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
            transversalSkills: studyProgramDB.transversalSkills,
            customTransversalSkills: studyProgramDB.customTransversalSkills,
            learningObjectives: studyProgramDB.learningObjectives,
            bibliography: studyProgramDB.bibliography,
            affiliations: studyProgramDB.affiliations,
            trainingMaterials: studyProgramDB.trainingMaterials,
            timeRequired: studyProgramDB.timeRequired,
            studyAreas: studyProgramDB.studyAreas          
          }
        );
      default:
        throw new DomainError(
        'NODE_TYPE_INVALID',
        `Unknown node type: ${nodeType}. Cannot parse curriculum database node with id ${nodeDB.id} to core model.`
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