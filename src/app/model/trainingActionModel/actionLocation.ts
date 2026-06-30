export class ActionLocation {
	public name: string;
	public coordinates?: [number, number]; //LonLat

	private googleMapsQueryBaseURI: string = 'https://www.google.com/maps/search/?api=1&query=';
	private openStreetMapQueryBaseURI: string = 'https://www.openstreetmap.org/search?zoom=17&';

	constructor(data?: Partial<ActionLocation>) {
		this.name = data?.name || '';
		this.coordinates = data?.coordinates;
	}

	public getGoogleMapURI(): string {
		return this.googleMapsQueryBaseURI + encodeURI(this.coordinates?.slice().reverse().join(',') || this.name);
	}

	public getOpenStreetMapURI(): string {
		if (this.coordinates && this.coordinates.length >= 2) return this.openStreetMapQueryBaseURI + encodeURI(`lat=${this.coordinates[1]}&lon=${this.coordinates[0]}`);
		else return this.openStreetMapQueryBaseURI + encodeURI(`query=${this.name}`);
	}
}