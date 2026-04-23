import { ApplicationConfig } from '@angular/core';
import { provideProtractorTestingSupport } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, Routes } from '@angular/router';
import { AuthGuard, exitWithoutSavingGuard, NotFoundPageComponent, OrganizationPageComponent, UserPageComponent } from '@eo4geo/ngx-bok-utils';
import { environment } from './environments/environment';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { Auth, getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { provideStorage, getStorage } from '@angular/fire/storage';
import { ItemExplorerComponent } from './app/components/itemExplorer/itemExplorer.component';
import { OfferPageComponent } from './app/components/offerPage/offerPage.component';
import { ConfirmationService, MessageService } from 'primeng/api';

const routes: Routes = [
    { path: '', component: ItemExplorerComponent },
    { path: 'profile', component: UserPageComponent, canMatch: [AuthGuard]},
    { path: 'organizations', component: OrganizationPageComponent, canMatch: [AuthGuard]},
    //{ path: 'new', component: CreatePageComponent, canMatch: [AuthGuard], canDeactivate: [exitWithoutSavingGuard]},
    //{ path: 'edit/:dynamicValue', component: EditPageComponent, canMatch: [AuthGuard], canDeactivate: [exitWithoutSavingGuard]},
    { path: 'not_found', component: NotFoundPageComponent},
    { path: ':dynamicValue', component: OfferPageComponent },
    { path: '**', component: NotFoundPageComponent}
];

export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(routes),
        provideHttpClient(),
        provideFirebaseApp(() => initializeApp(environment.FIREBASE)),
        provideAuth(() => getAuth()),
        provideFirestore(() => getFirestore()),
        provideStorage(() => getStorage()),
        provideProtractorTestingSupport(),
        provideAnimationsAsync(),
        providePrimeNG({
            theme: {
                preset: Aura,
                options: {
                    prefix: 'p',
                    darkModeSelector: false,
                    cssLayer: false
                }             
            }
        }),
        MessageService,
        ConfirmationService
    ]
};