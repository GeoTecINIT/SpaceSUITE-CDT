import { inject, Injectable } from "@angular/core";
import { collection, CollectionReference, doc, Firestore, serverTimestamp, setDoc } from "@angular/fire/firestore";
import { map, Observable, of } from "rxjs";
import { TrainingAction } from "../../model/trainingActionModel/trainingAction";
import { EducationalOffer } from "../../model/coreModel/educationalOffer";
import { WorkloadUnit } from "../../model/trainingActionModel/trainingItem";

@Injectable({
    providedIn: 'root',
})
export class TrainingActionDBService {
  private db: Firestore = inject(Firestore);
  private actionCollection: CollectionReference;

  constructor() { 
    this.actionCollection = collection(this.db, 'TrainingActions');
  }

  public createActionFromOffer(offer: EducationalOffer): Observable<string> {
    const newAction: TrainingAction = this.OfferToActionAdapter(offer);
    return this.setTrainingAction(newAction);
  }

  private setTrainingAction(newAction: TrainingAction): Observable<string> {
    const newDocRef = doc(this.actionCollection);
    const timestamp = serverTimestamp();
    newAction.created = timestamp;
    newAction.updatedAt = timestamp;
    newAction._id = newDocRef.id;
    return of(setDoc(newDocRef, newAction.toPlain())).pipe(map(() => newAction._id));
  }

  private OfferToActionAdapter(offer: EducationalOffer): TrainingAction {
    const subjects: string[] = [];
    const concepts: string[] = [];
    offer.root.bokConcepts.forEach(value => {
      if (value.length == 2 || value == 'GIST') subjects.push(value);
      else concepts.push(value);
    });
    return new TrainingAction(
      {
        title: offer.root.name,
        subject: subjects,
        description: offer.root.description,
        learningOutcomes: [...offer.root.learningObjectives],
        educationLevel: [offer.root.eqf.toString()],
        workload: offer.root.ects,
        workloadUnit: WorkloadUnit.ECTS,
        prerequisites: [...offer.root.prerequisites],
        concepts: concepts,
        orgId: offer.orgId,
        orgName: offer.orgName,
        division: offer.division,
        userId: offer.userId,
        isPublic: false,
        //isPublic: offer.isPublic,
      }
    );
  }
}
