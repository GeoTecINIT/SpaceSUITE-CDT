import { inject, Injectable } from "@angular/core";
import { Auth, authState } from "@angular/fire/auth";
import { collection, CollectionReference, doc, docData, Firestore } from "@angular/fire/firestore";
import { BehaviorSubject, Observable, of, switchMap } from "rxjs";
import { User } from "../model/userModel/user";

@Injectable({
    providedIn: 'root',
})
export class UserService {
  private auth: Auth;
  private db: Firestore;
  private userCollection: CollectionReference;

  private loggedUser: BehaviorSubject<User | undefined>;

  constructor() {
    this.auth = inject(Auth);
    this.db = inject(Firestore);
    this.userCollection = collection(this.db, 'Users');

    this.loggedUser = new BehaviorSubject<User | undefined>(undefined);

    authState(this.auth).pipe(
      switchMap(user => {
        if (!user) return of(undefined);
        const userDocRef = doc(this.userCollection, user.uid);
        return docData(userDocRef) as Observable<User>;
      })
    ).subscribe(user => this.loggedUser.next(user));
  }

  getLoggedUser(): Observable<User | undefined> {
    return this.loggedUser.asObservable();
  }
}