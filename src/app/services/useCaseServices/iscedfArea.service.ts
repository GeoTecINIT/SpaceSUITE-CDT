import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, ReplaySubject, take } from 'rxjs';
import { ISCEDFArea } from '../../model/coreModel/iscedfArea';

@Injectable({
  providedIn: 'root',
})
export class IscedfAreaService {
  private fieldsSubject: ReplaySubject<ISCEDFArea[]> = new ReplaySubject<ISCEDFArea[]>(1);

  private http: HttpClient = inject(HttpClient);

  constructor() {
    this.http.get<ISCEDFArea[]>('/assets/fields.json')
      .pipe(take(1))
      .subscribe((fields) => {
        this.fieldsSubject.next(fields);
      });
  }

  public getFields(): Observable<ISCEDFArea[]> {
    return this.fieldsSubject.asObservable();
  }

  public getFieldByName(name: string): Observable<ISCEDFArea | undefined> {
    return this.fieldsSubject.pipe(take(1), map((fields) => {
      return fields.find((f) => f.name === name);
    }));
  }

  public getFieldsByNames(names: string[]): Observable<ISCEDFArea[]> {
    return this.fieldsSubject.pipe(take(1), map((fields) => {
      return fields.filter((f) => names.includes(f.name));
    }));
  }
}