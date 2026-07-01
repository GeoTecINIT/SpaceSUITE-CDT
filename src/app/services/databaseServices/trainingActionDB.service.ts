import { inject, Injectable } from "@angular/core";
import { collection, CollectionReference, doc, Firestore, serverTimestamp, setDoc } from "@angular/fire/firestore";
import { forkJoin, map, Observable, of, switchMap, take, tap } from "rxjs";
import { TrainingAction } from "../../model/trainingActionModel/trainingAction";
import { EducationalOffer } from "../../model/coreModel/educationalOffer";
import { WorkloadUnit } from "../../model/trainingActionModel/trainingItem";
import { BokInformationService } from "@eo4geo/ngx-bok-visualization";

@Injectable({
    providedIn: 'root',
})
export class TrainingActionDBService {
  private bokInformationService: BokInformationService = inject(BokInformationService);
  private db: Firestore = inject(Firestore);
  private actionCollection: CollectionReference;

  constructor() { 
    this.actionCollection = collection(this.db, 'TrainingActions');
  }

  public createActionFromOffer(offer: EducationalOffer): Observable<string> {
    return this.OfferToActionAdapter(offer).pipe(
      switchMap(newAction => this.setTrainingAction(newAction))
    );  
  }

  private setTrainingAction(newAction: TrainingAction): Observable<string> {
    const newDocRef = doc(this.actionCollection);
    const timestamp = serverTimestamp();
    newAction.created = timestamp;
    newAction.updatedAt = timestamp;
    newAction._id = newDocRef.id;
    return of(setDoc(newDocRef, newAction.toPlain())).pipe(map(() => newAction._id));
  }

  private OfferToActionAdapter(offer: EducationalOffer): Observable<TrainingAction> {
    const subjects: string[] = [];
    const concepts: string[] = [];

    offer.root.bokConcepts.forEach(value => {
      if (value.length == 2 || value == 'GIST') subjects.push(value);
      else concepts.push(value);
    });

    const newTrainingAction = new TrainingAction(
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

    return this.formatConceptsToFirestore(newTrainingAction.concepts).pipe(
      tap(formattedConcepts => {
        newTrainingAction.concepts = formattedConcepts;
      }),
      map(() => newTrainingAction)
    );
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
