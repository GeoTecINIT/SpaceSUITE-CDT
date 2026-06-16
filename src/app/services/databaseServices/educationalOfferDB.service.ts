import { inject, Injectable } from "@angular/core";
import { collection, collectionData, CollectionReference, doc, docData, DocumentData, DocumentReference, Firestore, getDocs, WriteBatch, writeBatch } from "@angular/fire/firestore";
import { combineLatest, defaultIfEmpty, filter, from, map, Observable, of, switchMap } from "rxjs";
import { CurriculumNodeDB } from "../../model/databaseModel/curriculumNodeDB";
import { EducationalOfferDB } from "../../model/databaseModel/educationalOfferDB";
import { LectureDB } from "../../model/databaseModel/lectureDB";
import { CourseDB } from "../../model/databaseModel/courseDB";
import { GroupingDB } from "../../model/databaseModel/groupingDB";
import { StudyProgramDB } from "../../model/databaseModel/studyProgramDB";
import { DomainError } from "../../model/domainError";


@Injectable({
    providedIn: 'root',
})
export class EducationalOfferDBService {
  private educationalOfferCollection: CollectionReference;
  private firestore: Firestore = inject(Firestore);

  constructor() {
    this.educationalOfferCollection = collection(this.firestore, 'EducationalOffers');
  }

  public createEducationalOffer(educationalOffer: EducationalOfferDB, curriculumNodes: CurriculumNodeDB[]): Observable<string> {
    const docRef = doc(this.educationalOfferCollection);
    const batch = writeBatch(this.firestore);
    
    const plainEducationalOffer = educationalOffer.toPlainObject();
    plainEducationalOffer['id'] = docRef.id;

    const nodeMap: Map<string, CurriculumNodeDB> = new Map();
    curriculumNodes.forEach(node => nodeMap.set(node.id, node));

    const root = nodeMap.get(educationalOffer.root);
    if (!root) {
      throw new DomainError(
        'ROOT_NODE_NOT_FOUND',
        `Root node with id ${educationalOffer.root} was not found.`
      );
    }

    plainEducationalOffer['root'] = this.AddNodesToBatch(root, nodeMap, docRef, batch);

    batch.set(docRef, plainEducationalOffer);

    return from(batch.commit()).pipe(
      map(() => docRef.id)
    );
  }

  private AddNodesToBatch(
    currentNode: CurriculumNodeDB, 
    nodeMap: Map<string, CurriculumNodeDB>, 
    eduOfferDocRef: DocumentReference, 
    batch: WriteBatch,
    createSet?: Set<string>
  ): string {
    const childrenIds: string[] = currentNode.children.map(childId => {
      const child = nodeMap.get(childId);
      if (!child) {
        throw new DomainError('CHILD_NODE_NOT_FOUND', `Child node with id ${childId} was not found.`);
      }
      return this.AddNodesToBatch(child, nodeMap, eduOfferDocRef, batch);
    });

    let newDocRef: DocumentReference;
    if (createSet && createSet.has(currentNode.id)) {
      newDocRef = this.getSubCollectionDocRef(currentNode, eduOfferDocRef);
    }
    else {
      newDocRef = this.getSubCollectionDocRef(currentNode, eduOfferDocRef, currentNode.id);
    }

    const plainNode = currentNode.toPlainObject();
    plainNode['children'] = childrenIds;
    plainNode['id'] = newDocRef.id;

    batch.set(newDocRef, plainNode);

    return newDocRef.id;
  }

  public deleteEducationalOffer(educationalOfferId: string): Observable<void> {
    return from(this.deleteEducationalOfferInternal(educationalOfferId)).pipe(
      map(() => undefined)
    );
  }

  private async deleteEducationalOfferInternal(educationalOfferId: string): Promise<void> {
    const docRef = doc(this.educationalOfferCollection, educationalOfferId);
    const subcollections = ['lectures', 'courses', 'groupings', 'studyPrograms'];

    const batch = writeBatch(this.firestore);

    for (const subcollectionName of subcollections) {
      const snapshot = await getDocs(collection(docRef, subcollectionName));
      snapshot.docs.forEach(d => batch.delete(d.ref));
    }

    batch.delete(docRef);

    await batch.commit();
  }

  public getEdcationalOffers(): Observable<{educationalOffer: EducationalOfferDB, curriculumNodes: CurriculumNodeDB[]}[]> {
    return collectionData(this.educationalOfferCollection).pipe(
      map(items => items as EducationalOfferDB[]),
      switchMap(educationalOffersDB => {
        if (educationalOffersDB.length === 0) return of([]);
        const educationalOffers$ = educationalOffersDB.map(
          offerDB => {
            const offerDocRef = doc(this.educationalOfferCollection, offerDB.id);
            return this.getEducationalOfferNodes(offerDocRef).pipe(filter(offer => offer !== undefined))
          }
        );
        return combineLatest(educationalOffers$).pipe(map(offers => {
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
      switchMap(educationalOfferData => {
        if (!educationalOfferData) return of(undefined);

        return this.getEducationalOfferNodes(educationalOfferDocRef).pipe(map(curriculumNodes => {
          return { educationalOffer: educationalOfferData as EducationalOfferDB, curriculumNodes: curriculumNodes as CurriculumNodeDB[] };
        }));
      })
    );
  }

  public updateEducationalOffer(
    updatedEducationalOffer: EducationalOfferDB, 
    updatedNodes: CurriculumNodeDB[], 
    oldNodes: CurriculumNodeDB[]
  ): Observable<string> {
    const docRef = doc(this.educationalOfferCollection, updatedEducationalOffer.id);
    const batch = writeBatch(this.firestore);
    
    const plainEducationalOffer = updatedEducationalOffer.toPlainObject();

    const updatedNodeSet: Set<string> = new Set(updatedNodes.map(node => node.id));
    const oldNodeSet: Set<string> = new Set(oldNodes.map(node => node.id));

    const nodesToDelete = new Set<string>([...oldNodeSet].filter(x => !updatedNodeSet.has(x)));
    const nodesToCreate = new Set<string>([...updatedNodeSet].filter(x => !oldNodeSet.has(x)));

    // Delete from firebase deleted nodes

    const oldNodeMap: Map<string, CurriculumNodeDB> = new Map();
    oldNodes.forEach(node => oldNodeMap.set(node.id, node));

    nodesToDelete.forEach(id => {
      const currentNode = oldNodeMap.get(id);
      if (currentNode){
        batch.delete(this.getSubCollectionDocRef(currentNode, docRef, id));
      }
    });

    // Overwrite and create nodes

    const nodeMap: Map<string, CurriculumNodeDB> = new Map();
    updatedNodes.forEach(node => nodeMap.set(node.id, node));

    const root = nodeMap.get(updatedEducationalOffer.root);
    if (!root) {
      throw new DomainError(
        'ROOT_NODE_NOT_FOUND',
        `Root node with id ${updatedEducationalOffer.root} was not found.`
      );
    }

    plainEducationalOffer['root'] = this.AddNodesToBatch(root, nodeMap, docRef, batch, nodesToCreate);

    batch.set(docRef, plainEducationalOffer);

    return from(batch.commit()).pipe(
      map(() => docRef.id)
    );
  }

  private getEducationalOfferNodes(educationalOfferDocRef: DocumentReference): Observable<CurriculumNodeDB[]> {
    const lectureCollection = collection(educationalOfferDocRef, 'lectures');
    const courseCollection = collection(educationalOfferDocRef, 'courses');
    const groupingCollection = collection(educationalOfferDocRef, 'groupings');
    const studyProgramCollection = collection(educationalOfferDocRef, 'studyPrograms');

    const lectures$ = collectionData(lectureCollection).pipe(this.mapToClass(LectureDB));
    const courses$ = collectionData(courseCollection).pipe(this.mapToClass(CourseDB));
    const groupings$ = collectionData(groupingCollection).pipe(this.mapToClass(GroupingDB));
    const studyPrograms$ = collectionData(studyProgramCollection).pipe(this.mapToClass(StudyProgramDB));

    return combineLatest([lectures$, courses$, groupings$, studyPrograms$]).pipe(defaultIfEmpty([]), map(([lectures, courses, groupings, studyPrograms]) => {
      return [...lectures, ...courses, ...groupings, ...studyPrograms];
    }));
  }

  private getSubCollectionDocRef(currentNode: CurriculumNodeDB, parentDocRef: DocumentReference, docId?: string) {
    let newDocRef: DocumentReference;
    switch (true) {
      case currentNode instanceof LectureDB:
        const lectureRef = collection(parentDocRef, 'lectures');
        newDocRef = docId ? doc(lectureRef, docId) : doc(lectureRef);
        break;
      case currentNode instanceof CourseDB:
        const courseRef = collection(parentDocRef, 'courses');
        newDocRef = docId ? doc(courseRef, docId) : doc(courseRef);
        break;
      case currentNode instanceof GroupingDB:
        const groupingRef = collection(parentDocRef, 'groupings');
        newDocRef = docId ? doc(groupingRef, docId) : doc(groupingRef);
        break;
      case currentNode instanceof StudyProgramDB:
        const studyProgramRef = collection(parentDocRef, 'studyPrograms');
        newDocRef = docId ? doc(studyProgramRef, docId) : doc(studyProgramRef);
        break;
      default:
        throw new DomainError(
          'NODE_TYPE_INVALID', 
          `Unknown node type: ${currentNode.nodeType}.`
        );
    }
    return newDocRef;
  }

  private mapToClass<T extends object>(cls: new () => T) {
    return (source$: Observable<DocumentData[]>) =>
      source$.pipe(
        map(items => items.map(item => Object.assign(new cls(), item) as T))
      );
  }
}