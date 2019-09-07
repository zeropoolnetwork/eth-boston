import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { WelcomeComponent } from "./welcome/welcome.component";
import { DashboardComponent } from "./dashboard/dashboard.component";
import { DepositComponent } from "./deposit/deposit.component";
import { TransferComponent } from "./transfer/transfer.component";
import { ImportComponent } from "./import/import.component";
import { PageNotFoundComponent } from "./page-not-found/page-not-found.component";

const routes: Routes = [
  {
    path: 'welcome',
    component: WelcomeComponent
  },
  {
    path: '',
    component: WelcomeComponent
  },
  {
    path: 'import',
    component: ImportComponent
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    // children: [
    //   {
    //     path: 'deposit',
    //     component: DepositComponent
    //   },
    //   {
    //     path: 'transfer',
    //     component: TransferComponent
    //   },
    //   {
    //     path: 'withdraw',
    //     component: WelcomeComponent
    //   },
    // ]
  },
  {
    path: '**',
    component: PageNotFoundComponent,
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
