import { CanMatchFn } from '@angular/router';
import { inject } from '@angular/core';
import { map, take } from 'rxjs';
import { OrganizationDBService } from '../services/databaseServices/organizationDB.service';

export const UserOrgsGuard: CanMatchFn = () => {
  const orgService = inject(OrganizationDBService);
  return orgService.getUserOrganizations().pipe(
    take(1),
    map(orgs => orgs.length > 0)
  );
};