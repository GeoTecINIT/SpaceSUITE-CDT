import { inject, Injectable } from "@angular/core";
import { collection, collectionData, CollectionReference, deleteDoc, doc, docData, DocumentReference, Firestore, setDoc, updateDoc } from "@angular/fire/firestore";
import { concatMap, defaultIfEmpty, filter, forkJoin, from, map, Observable, of } from "rxjs";
import { CurriculumNodeDB } from "../../model/databaseModel/curriculumNodeDB";
import { EducationalOfferDB } from "../../model/databaseModel/educationalOfferDB";
import { LectureDB } from "../../model/databaseModel/lectureDB";
import { CourseDB } from "../../model/databaseModel/courseDB";
import { ModuleDB } from "../../model/databaseModel/moduleDB";
import { StudyProgramDB } from "../../model/databaseModel/studyProgramDB";


@Injectable({
    providedIn: 'root',
})
export class EducationalOfferDBService {
  private educationalOfferCollection: CollectionReference;
  private firestore: Firestore = inject(Firestore);

  constructor() {
    this.educationalOfferCollection = collection(this.firestore, 'EducationalOffers');
  }

  public createEducationalOffer(educationalOffer: EducationalOfferDB, curriculumNodes: CurriculumNodeDB[]): Observable<void> {
    const plainEducationalOffer = educationalOffer.toPlainObject();
    const docRef = doc(this.educationalOfferCollection);
    return from(setDoc(docRef, plainEducationalOffer)).pipe(concatMap( () => {
      const lectureNodes = curriculumNodes.filter(node => node instanceof LectureDB).map(node => node.toPlainObject());
      const courseNodes = curriculumNodes.filter(node => node instanceof CourseDB).map(node => node.toPlainObject());
      const moduleNodes = curriculumNodes.filter(node => node instanceof ModuleDB).map(node => node.toPlainObject());
      const studyProgramNodes = curriculumNodes.filter(node => node instanceof StudyProgramDB).map(node => node.toPlainObject());

      const lectureCollection = collection(docRef, 'lectures');
      const courseCollection = collection(docRef, 'courses');
      const moduleCollection = collection(docRef, 'modules');
      const studyProgramCollection = collection(docRef, 'studyPrograms');

      const lectureOps = this.addNodesToCollection(lectureCollection, lectureNodes);
      const courseOps = this.addNodesToCollection(courseCollection, courseNodes);
      const moduleOps = this.addNodesToCollection(moduleCollection, moduleNodes);
      const studyProgramOps = this.addNodesToCollection(studyProgramCollection, studyProgramNodes);

      return forkJoin([...lectureOps, ...courseOps, ...moduleOps, ...studyProgramOps]).pipe(defaultIfEmpty(undefined), map(() => undefined));
    }));
  }

  public deleteEducationalOffer(educationalOfferId: string): Observable<void> {
    const docRef = doc(this.educationalOfferCollection, educationalOfferId);
    return from(deleteDoc(docRef));
  }

  public getEdcationalOffers(): Observable<{educationalOffer: EducationalOfferDB, curriculumNodes: CurriculumNodeDB[]}[]> {
    return collectionData(this.educationalOfferCollection).pipe(
      map(items => items as EducationalOfferDB[]),
      concatMap(educationalOffersDB => {
        if (educationalOffersDB.length === 0) return of([]);
        const educationalOffers$ = educationalOffersDB.map(
          offerDB => {
            const offerDocRef = doc(this.educationalOfferCollection, offerDB.id);
            return this.getEducationalOfferNodes(offerDocRef).pipe(filter(offer => offer !== undefined))
          }
        );
        return forkJoin(educationalOffers$).pipe(map(offers => {
          return offers.map((curriculumNodes, index) => {
            return { educationalOffer: educationalOffersDB[index], curriculumNodes: curriculumNodes as CurriculumNodeDB[] };
          });
        }));
      })
    );
  }

  public getEducationalOffer(educationalOfferId: string): Observable<{educationalOffer: EducationalOfferDB, curriculumNodes: CurriculumNodeDB[]} | undefined> {
    const educationalOfferDocRef = doc(this.educationalOfferCollection, educationalOfferId);
    return docData(educationalOfferDocRef).pipe(
      concatMap(educationalOfferData => {
        if (!educationalOfferData) return of(undefined);

        return this.getEducationalOfferNodes(educationalOfferDocRef).pipe(map(curriculumNodes => {
          return { educationalOffer: educationalOfferData as EducationalOfferDB, curriculumNodes: curriculumNodes as CurriculumNodeDB[] };
        }));
      })
    );
  }

  public updateEducationalOffer(updatedEducationalOffer: EducationalOfferDB, updatedNodes: CurriculumNodeDB[], oldEducationalOffer: EducationalOfferDB, oldNodes: CurriculumNodeDB[]): Observable<void> {
    // Define collections references
    const docRef = doc(this.educationalOfferCollection, updatedEducationalOffer.id);

    const lectureCollection = collection(docRef, 'lectures');
    const courseCollection = collection(docRef, 'courses');
    const moduleCollection = collection(docRef, 'modules');
    const studyProgramCollection = collection(docRef, 'studyPrograms');

    // Define allOps Array
    const allOps = [];

    // Update new nodes
    const newLectureNodes = updatedNodes.filter(node => node instanceof LectureDB && node.id == '').map(node => node.toPlainObject());
    const newCourseNodes = updatedNodes.filter(node => node instanceof CourseDB && node.id == '').map(node => node.toPlainObject());
    const newModuleNodes = updatedNodes.filter(node => node instanceof ModuleDB && node.id == '').map(node => node.toPlainObject());
    const newStudyProgramNodes = updatedNodes.filter(node => node instanceof StudyProgramDB && node.id == '').map(node => node.toPlainObject());

    const newLectureOps = this.addNodesToCollection(lectureCollection, newLectureNodes);
    const newCourseOps = this.addNodesToCollection(courseCollection, newCourseNodes);
    const newModuleOps = this.addNodesToCollection(moduleCollection, newModuleNodes);
    const newStudyProgramOps = this.addNodesToCollection(studyProgramCollection, newStudyProgramNodes);

    allOps.push([
      ...newLectureOps,
      ...newCourseOps,
      ...newModuleOps,
      ...newStudyProgramOps
    ]);

    // Update existing nodes
    const lectureUpdateNodes = updatedNodes.flatMap(node =>
      oldNodes
        .filter(oldNode => node instanceof LectureDB && node.id === oldNode.id)
        .map(oldNode => {
          const plainNode = node.toPlainObject();
          const plainOldNode = oldNode.toPlainObject();
          const updateObject = this.createUpdateObject(plainNode, plainOldNode, '', [], false);
          updateObject['id'] = node.id
          return updateObject
        })
    );

    const courseUpdateNodes = updatedNodes.flatMap(node =>
      oldNodes
        .filter(oldNode => node instanceof CourseDB && node.id === oldNode.id)
        .map(oldNode => {
          const plainNode = node.toPlainObject();
          const plainOldNode = oldNode.toPlainObject();
          const updateObject = this.createUpdateObject(plainNode, plainOldNode, '', [], false);
          updateObject['id'] = node.id
          return updateObject
        })
    );

    const moduleUpdateNodes = updatedNodes.flatMap(node =>
      oldNodes
        .filter(oldNode => node instanceof ModuleDB && node.id === oldNode.id)
        .map(oldNode => {
          const plainNode = node.toPlainObject();
          const plainOldNode = oldNode.toPlainObject();
          const updateObject = this.createUpdateObject(plainNode, plainOldNode, '', [], false);
          updateObject['id'] = node.id
          return updateObject
        })
    );

    const studyProgramUpdateNodes = updatedNodes.flatMap(node =>
      oldNodes
        .filter(oldNode => node instanceof StudyProgramDB && node.id === oldNode.id)
        .map(oldNode => {
          const plainNode = node.toPlainObject();
          const plainOldNode = oldNode.toPlainObject();
          const updateObject = this.createUpdateObject(plainNode, plainOldNode, '', [], false);
          updateObject['id'] = node.id
          return updateObject
        })
    );

    const updateLectureOps = this.updateNodesFromCollection(lectureCollection, lectureUpdateNodes);
    const updateCourseOps = this.updateNodesFromCollection(courseCollection, courseUpdateNodes);
    const updateModuleOps = this.updateNodesFromCollection(moduleCollection, moduleUpdateNodes);
    const updateStudyProgramOps = this.updateNodesFromCollection(studyProgramCollection, studyProgramUpdateNodes);

    allOps.push([
      ...updateLectureOps,
      ...updateCourseOps,
      ...updateModuleOps,
      ...updateStudyProgramOps
    ]);

    // Delete old nodes

    const deleteLectureOps = this.deleteNodesFromCollection(lectureCollection, oldNodes.filter(oldNode => oldNode instanceof LectureDB && !updatedNodes.some(node => node.id === oldNode.id)));
    const deleteCourseOps = this.deleteNodesFromCollection(courseCollection, oldNodes.filter(oldNode => oldNode instanceof CourseDB && !updatedNodes.some(node => node.id === oldNode.id)));
    const deleteModuleOps = this.deleteNodesFromCollection(moduleCollection, oldNodes.filter(oldNode => oldNode instanceof ModuleDB && !updatedNodes.some(node => node.id === oldNode.id)));
    const deleteStudyProgramOps = this.deleteNodesFromCollection(studyProgramCollection, oldNodes.filter(oldNode => oldNode instanceof StudyProgramDB && !updatedNodes.some(node => node.id === oldNode.id)));

    allOps.push([
      ...deleteLectureOps,
      ...deleteCourseOps,
      ...deleteModuleOps,
      ...deleteStudyProgramOps
    ]);

    // Update basic portfolio information

    const basicInfoUpdate: { [key: string]: any } = this.createUpdateObject(updatedEducationalOffer, oldEducationalOffer, '', ['updatedAt', 'createdAt'], false);

    if (Object.keys(basicInfoUpdate).length > 0) {
      allOps.push(from(updateDoc(docRef, basicInfoUpdate)))
    }

    return forkJoin(allOps).pipe(defaultIfEmpty(undefined), map(() => undefined));
  }

  private getEducationalOfferNodes(educationalOfferDocRef: DocumentReference): Observable<CurriculumNodeDB[]> {
    const lectureCollection = collection(educationalOfferDocRef, 'lectures');
    const courseCollection = collection(educationalOfferDocRef, 'courses');
    const moduleCollection = collection(educationalOfferDocRef, 'modules');
    const studyProgramCollection = collection(educationalOfferDocRef, 'studyPrograms');

    const lectures$ = collectionData(lectureCollection).pipe(map(items => items as LectureDB[]));
    const courses$ = collectionData(courseCollection).pipe(map(items => items as CourseDB[]));
    const modules$ = collectionData(moduleCollection).pipe(map(items => items as ModuleDB[]));
    const studyPrograms$ = collectionData(studyProgramCollection).pipe(map(items => items as StudyProgramDB[]));

    return forkJoin([lectures$, courses$, modules$, studyPrograms$]).pipe(defaultIfEmpty([]), map(([lectures, courses, modules, studyPrograms]) => {
      return [...lectures, ...courses, ...modules, ...studyPrograms];
    }));
  }

  private addNodesToCollection(collection: CollectionReference, items: CurriculumNodeDB[]): Observable<void>[] {
    return items.map( item => {
      const docRef = doc(collection);
      item.id = docRef.id;
      const plainItem = item.toPlainObject();
      return from(setDoc(docRef, plainItem));
    })
  }

  private updateNodesFromCollection(collection: CollectionReference, items:  Array<{ id: string; [key: string]: any }>): Observable<void>[] {
    return items.map( ({ _id, ...data }) => {
      const docRef = doc(collection, _id);
      if (Object.keys(data).length > 0) {
        return from(updateDoc(docRef, data))
      }
      return of(void 0)
    })
  }

  private deleteNodesFromCollection(collection: CollectionReference, items: CurriculumNodeDB[]): Observable<void>[] {
    return items.map( item => {
      const docRef = doc(collection, item.id);
      return from(deleteDoc(docRef));
    })
  }

  private compareElements<T>(objectA: T, objectB: T): boolean {
    if (Array.isArray(objectA) && Array.isArray(objectB)) {
      if (objectA === objectB) return true;
      if (objectA.length != objectB.length) return false;
      for (var i = 0; i < objectA.length; ++i) {
        if (!this.compareElements(objectA[i], objectB[i])) return false;
      }
      return true;
    }
    if (typeof objectA === 'object' && objectA != null &&
        typeof objectB === "object" && objectB != null) {
      for (const key of Object.keys(objectA) as Array<keyof T>) {
        const aValue = objectA[key];
        const bValue = objectB[key];
        if (!this.compareElements(aValue, bValue)) return false;
      }
      return true;
    }
    return objectA === objectB;
  }

  private createUpdateObject<T extends object>(newObject: T, oldObject: T, prefix: string = '', specialObjects: string[] = [], ignoreArrays: boolean = true): any {
    const updateObject: { [key: string]: any } = {}
    if (newObject != null) {
      for (const key of Object.keys(newObject) as Array<keyof T>) {
        const newValue = newObject[key];
        const oldValue = oldObject != null ? oldObject[key] : null;
        const fullKey = `${prefix}${key as string}`;
        if ((ignoreArrays && Array.isArray(newValue)) || this.compareElements(newValue, oldValue)) continue
        if (typeof newValue == 'object') {
          if (specialObjects.includes(key as string) || Array.isArray(newValue)) updateObject[fullKey] = newValue;
          else {
            const subObject = this.createUpdateObject(newValue as object, oldValue as object, key as string + '.', specialObjects);
            for (const subKey of Object.keys(subObject)) {
              const fullSubKey = `${prefix}${subKey as string}`;
              updateObject[fullSubKey] = subObject[subKey];
            }
          }
        }
        else updateObject[fullKey] = newValue;
      }
    }
    else {
      if (prefix != '') {
        updateObject[prefix.slice(0, -1)] = null;
      }
    }
    return updateObject;
  }
}