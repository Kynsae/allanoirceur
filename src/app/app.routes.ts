import { Routes } from '@angular/router';
import { Home } from './features/home/home';
import { Records } from './features/records/records';
import { RecordDetail } from './features/record-detail/record-detail';

export const routes: Routes = [
    {
        path: '',
        component: Home
    },
    {
        path: 'records',
        component: Records
    },
    {
        path: 'records/:id',
        component: RecordDetail
    }
];