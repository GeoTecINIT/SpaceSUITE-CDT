import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { TreeNode } from 'primeng/api';


@Injectable({
  providedIn: 'root'
})
export class ESCOService {

  constructor(private http: HttpClient) {}

  getTransversalSkillsFromJson(): Observable<TreeNode[]> {
    return this.http.get('assets/transversalSkills.json').pipe(map( data => data as TreeNode<any>[]));
  }
}