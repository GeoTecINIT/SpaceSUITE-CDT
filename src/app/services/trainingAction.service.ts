import { inject, Injectable } from "@angular/core";
import { forkJoin, map, Observable, of, switchMap, take, tap } from "rxjs";
import { TrainingAction } from "../model/trainingActionModel/trainingAction";
import { EducationalOffer } from "../model/coreModel/educationalOffer";
import { WorkloadUnit } from "../model/trainingActionModel/trainingItem";
import { BokInformationService } from "@eo4geo/ngx-bok-visualization";
import { AuthService } from "@eo4geo/ngx-bok-utils";

@Injectable({
    providedIn: 'root',
})
export class TrainingActionService {
  private bokInformationService: BokInformationService = inject(BokInformationService);
  private authService: AuthService = inject(AuthService);

  public createActionFromOffer(offer: EducationalOffer, orgId: string, orgName: string, division?: string): Observable<void> {
    return this.OfferToActionAdapter(offer, orgId, orgName, division).pipe(
      map(newAction => this.setTrainingAction(newAction))
    );
  }

  private setTrainingAction(newAction: TrainingAction): void {
    localStorage.setItem('curriculum-to-action', JSON.stringify(newAction));
  }

  private OfferToActionAdapter(offer: EducationalOffer, orgId: string, orgName: string, division?: string): Observable<TrainingAction> {
    const subjects: string[] = [];
    const concepts: string[] = [];

    offer.root.bokConcepts.forEach(value => {
      if (value.length == 2) subjects.push(value);
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
        orgId: orgId,
        orgName: orgName,
        division: division,
        isPublic: false
      }
    );

    return this.formatConceptsToFirestore(newTrainingAction.concepts).pipe(
      tap(formattedConcepts => newTrainingAction.concepts = formattedConcepts),
      switchMap(() => this.authService.getUserState()),
      tap(authState => newTrainingAction.userId = authState?.uid!),
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
