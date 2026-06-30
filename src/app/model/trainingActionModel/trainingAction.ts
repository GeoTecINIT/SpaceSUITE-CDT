import { ActionLocation } from "./actionLocation";
import { TrainingItem } from "./trainingItem";

export interface TimePeriod {
  start: any;
  end?: any;
  showTime: boolean;
}

export class TrainingAction extends TrainingItem {
  actionModality?: string; 
  location: ActionLocation;
  certification?: string;
  timing: TimePeriod[];
  microcredentialAwardingBody?: string;
  relatedMaterials: string[] = [];

  constructor(data?: Partial<TrainingAction>) {
    super(data);
    this.actionModality = data?.actionModality;
    this.location = new ActionLocation(data?.location);
    this.certification = data?.certification;
    this.timing = data?.timing || [];
    this.microcredentialAwardingBody = data?.microcredentialAwardingBody;
    this.relatedMaterials = data?.relatedMaterials || [];
  }

  override toPlain(): Record<string, any> {
    return {
      ...super.toPlain(),
      actionModality: this.actionModality || null,
      location: {
        name: this.location.name,
        coordinates: this.location.coordinates || []
      },
      certification: this.certification || null,
      timing: this.timing.map(value => {
        return {
          start: value.start,
          end: value.end ?? null,
          showTime: value.showTime ?? false
        }
      }),
      license: this.microcredentialAwardingBody || "",
      relatedMaterials: this.relatedMaterials
    };
  }
}
