import { inject, Injectable } from "@angular/core";
import { collection, collectionData, CollectionReference, deleteDoc, doc, docData, DocumentReference, Firestore, setDoc } from "@angular/fire/firestore";
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

      const lectureOps = this.addNodeToCollection(lectureCollection, lectureNodes);
      const courseOps = this.addNodeToCollection(courseCollection, courseNodes);
      const moduleOps = this.addNodeToCollection(moduleCollection, moduleNodes);
      const studyProgramOps = this.addNodeToCollection(studyProgramCollection, studyProgramNodes);

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
}
