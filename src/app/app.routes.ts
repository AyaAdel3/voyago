import { Path } from './../../node_modules/path-to-regexp/dist/index.d';
import { Routes } from '@angular/router';
import { AuthLayout } from './core/layouts/auth-layout/auth-layout';
import { BlankLayout } from './core/layouts/blank-layout/blank-layout';
import { Login } from './core/Auth/login/login';
import { Register } from './core/Auth/register/register';
import { Home } from './features/home/home';

export const routes: Routes = [
   {path:'blank',component:BlankLayout , children:[
    {path:'home' , component:Home , title:"home page"},
    {path:'' , component:Home , title:"home page"},
    {path:'home' , component:Home , title:"home page"},
    {path:'home' , component:Home , title:"home page"},
    {path:'home' , component:Home , title:"home page"},
   ]},
];



