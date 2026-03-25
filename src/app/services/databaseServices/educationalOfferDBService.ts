import { inject, Injectable } from "@angular/core";
import { collection, collectionData, CollectionReference, doc, docData, Firestore, setDoc } from "@angular/fire/firestore";
import { concatMap, defaultIfEmpty, filter, forkJoin, from, map, Observable, of } from "rxjs";
import { CurriculumNode } from "../../model/coreModel/curriculumNode";
import { EducationalOffer } from "../../model/coreModel/educationalOffer";
import { CurriculumNodeDB } from "../../model/databaseModel/curriculumNodeDB";
import { EducationalOfferDB } from "../../model/databaseModel/educationalOfferDB";
import { DomainError } from "../../model/domainError";
import { Lecture } from "../../model/coreModel/lecture";
import { LectureDB } from "../../model/databaseModel/lectureDB";
import { CourseDB } from "../../model/databaseModel/courseDB";
import { ModuleDB } from "../../model/databaseModel/moduleDB";
import { StudyProgramDB } from "../../model/databaseModel/studyProgramDB";
import { Course } from "../../model/coreModel/course";
import { Module } from "../../model/coreModel/module";
import { StudyProgram } from "../../model/coreModel/studyProgram";

@Injectable({
    providedIn: 'root',
})
export class EducationalOfferDBService {
  private educationalOfferCollection: CollectionReference;
  private firestore: Firestore;

  constructor() {
    this.firestore = inject(Firestore);
    this.educationalOfferCollection = collection(this.firestore, 'educationalOffers');
  }

  private addNodeToCollection(collection: CollectionReference, items: CurriculumNodeDB[]): Observable<void>[] {
    return items.map( item => {
      const docRef = doc(collection);
      item.id = docRef.id;
      const plainItem = item.toPlainObject();
      return from(setDoc(docRef, plainItem));
    })
  }

  public createEducationalOffer(educationalOffer: EducationalOffer): Observable<void> {
    const plainEducationalOffer = this.parseEducationalOffer(educationalOffer).toPlainObject();
    const docRef = doc(this.educationalOfferCollection);
    return from(setDoc(docRef, plainEducationalOffer)).pipe(concatMap( () => {
      const nodes = educationalOffer.getAllNodes();
      const lectureNodes = nodes.filter(node => node instanceof Lecture).map(node => this.parseCurriculumNode(node));
      const courseNodes = nodes.filter(node => node instanceof Course).map(node => this.parseCurriculumNode(node));
      const moduleNodes = nodes.filter(node => node instanceof Module).map(node => this.parseCurriculumNode(node));
      const studyProgramNodes = nodes.filter(node => node instanceof StudyProgram).map(node => this.parseCurriculumNode(node));

      const lectureCollection = collection(docRef, 'lectures');
      const courseCollection = collection(docRef, 'courses');
      const moduleCollection = collection(docRef, 'modules');
      const studyProgramCollection = collection(docRef, 'studyPrograms');

      const lectureOps = this.addNodeToCollection(lectureCollection, lectureNodes);
      const courseOps = this.addNodeToCollection(courseCollection, courseNodes);
      const moduleOps = this.addNodeToCollection(moduleCollection, moduleNodes);
      const studyProgramOps = this.addNodeToCollection(studyProgramCollection, studyProgramNodes);

      return forkJoin([...lectureOps, ...courseOps, ...moduleOps, ...studyProgramOps]).pipe(defaultIfEmpty(undefined), map(() => undefined));
    }));
  }

  public deleteEducationalOffer(educationalOfferId: string): Observable<void> {
    const docRef = doc(this.educationalOfferCollection, educationalOfferId);
    return from(setDoc(docRef, {})).pipe(map(() => undefined));
  }

  public getEdcationalOffers(): Observable<EducationalOffer[]> {
    return collectionData(this.educationalOfferCollection).pipe(
      map(items => items as EducationalOfferDB[]),
      concatMap(educationalOffersDB => {
        if (educationalOffersDB.length === 0) return of([]);
        const educationalOffers$ = educationalOffersDB.map(
          offerDB => this.getEducationalOffer(offerDB.id).pipe(filter(offer => offer !== undefined))
        );
        return forkJoin(educationalOffers$);
      })
    );
  }

  public getEducationalOffer(educationalOfferId: string): Observable<EducationalOffer | undefined> {
    const educationalOfferDocRef = doc(this.educationalOfferCollection, educationalOfferId);
    return docData(educationalOfferDocRef).pipe(
      concatMap(educationalOfferData => {
        if (!educationalOfferData) return of(undefined);

        const lectureCollection = collection(educationalOfferDocRef, 'lectures');
        const courseCollection = collection(educationalOfferDocRef, 'courses');
        const moduleCollection = collection(educationalOfferDocRef, 'modules');
        const studyProgramCollection = collection(educationalOfferDocRef, 'studyPrograms');

        const lectures$ = collectionData(lectureCollection).pipe(map(items => items as LectureDB[]));
        const courses$ = collectionData(courseCollection).pipe(map(items => items as CourseDB[]));
        const modules$ = collectionData(moduleCollection).pipe(map(items => items as ModuleDB[]));
        const studyPrograms$ = collectionData(studyProgramCollection).pipe(map(items => items as StudyProgramDB[]));

        return forkJoin([lectures$, courses$, modules$, studyPrograms$]).pipe(defaultIfEmpty([]), map(([lectures, courses, modules, studyPrograms]) => {
          const allNodes = [...lectures, ...courses, ...modules, ...studyPrograms];
          return this.parseEducationalOfferDB(educationalOfferData as EducationalOfferDB, allNodes);
        }));
      })
    );
  }

  private parseEducationalOffer(educationalOffer: EducationalOffer): EducationalOfferDB {
    return new EducationalOfferDB({
      id: educationalOffer.id,
      root: educationalOffer.root.id,
      affiliations: educationalOffer.affiliations,
      isPublic: educationalOffer.isPublic,
      createdAt: educationalOffer.createdAt,
      updatedAt: educationalOffer.updatedAt,
      userId: educationalOffer.userId,
      orgId: educationalOffer.orgId,
      orgName: educationalOffer.orgName,
      division: educationalOffer.division,
    });
  }

  private parseCurriculumNode(node: CurriculumNode): CurriculumNodeDB {
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
            bokConcepts: lectureNode.bokConcepts,
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
            bokConcepts: courseNode.bokConcepts,
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
            bokConcepts: moduleNode.bokConcepts,
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
            bokConcepts: studyProgramNode.bokConcepts,
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
  }

  private parseEducationalOfferDB(educationalOfferDB: EducationalOfferDB, curriculumNodesDB: CurriculumNodeDB[]): EducationalOffer {
    const nodeMap = new Map<string, CurriculumNode>();
    curriculumNodesDB.forEach(nodeDB => {
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
        createdAt: educationalOfferDB.createdAt,
        updatedAt: educationalOfferDB.updatedAt,
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
            bokConcepts: lectureDB.bokConcepts,
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
            bokConcepts: courseDB.bokConcepts,
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
            bokConcepts: moduleDB.bokConcepts,
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
            bokConcepts: studyProgramDB.bokConcepts,
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
}
