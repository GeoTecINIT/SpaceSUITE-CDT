export class TrainingMaterial {
    public title: string;
    public description: string;
    public url: string;

    constructor(partialMaterial: Partial<TrainingMaterial>) {
        this.title = partialMaterial.title || '';
        this.description = partialMaterial.description || '';
        this.url = partialMaterial.url || '';
    }
}