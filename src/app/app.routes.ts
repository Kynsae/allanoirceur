import { Routes } from '@angular/router';
import { Home } from './features/home/home';
import { Records } from './features/records/records';

export const routes: Routes = [
    {
        path: '',
        component: Home
    },
    {
        path: 'records',
        component: Records
    }
];