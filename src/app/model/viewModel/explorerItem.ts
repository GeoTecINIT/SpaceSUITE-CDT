import { Affiliation } from "../coreModel/affiliation";

export enum ExplorerItemType {
    StudyProgram,
    Module,
    Course,
    Lecture
}

export class ExplorerItem {
    public id: string;
    public name: string;
    public description: string;
    public type: ExplorerItemType;
    public eqf: number;
    public affiliations: Affiliation[];
    public orgName: string;
    public orgId: string;
    public division: string;
    public lastUpdated: Date;

    constructor(public item: Partial<ExplorerItem>) {
        this.id = item.id || '';
        this.name = item.name || '';
        this.description = item.description || '';
        this.type = item.type || ExplorerItemType.StudyProgram;
        this.eqf = item.eqf || 0;
        this.affiliations = item.affiliations || [];
        this.orgName = item.orgName || '';
        this.orgId = item.orgId || '';
        this.division = item.division || '';
        this.lastUpdated = item.lastUpdated || new Date();
    }
}
