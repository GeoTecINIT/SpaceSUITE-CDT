import { inject, Injectable } from "@angular/core";
import { CollectionReference, doc, setDoc } from "@angular/fire/firestore";
import { from, Observable } from "rxjs";
import { CurriculumNode } from "../../model/coreModel/curriculumNode";

@Injectable({
    providedIn: 'root',
})
export class EducationalOfferDBService {
  private educationalOfferDBService: EducationalOfferDBService;

  constructor() {
    this.educationalOfferDBService = inject(EducationalOfferDBService);
  }

  private addNodeToCollection(collection: CollectionReference, items: CurriculumNode[]): Observable<void>[] {
    return items.map( item => {
      const docRef = doc(collection);
      item.id = docRef.id;
      const plainItem = item.toPlainObject();
      return from(setDoc(docRef, plainItem));
    })
  }
}