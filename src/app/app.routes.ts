import { Routes } from '@angular/router';
import { Globe } from './components/globe/globe';
import { About } from './components/about/about';

export const routes: Routes = [
    { path: '', component: Globe },
    { path: 'about', component: About },
    { path: '**', redirectTo: '' }
];
