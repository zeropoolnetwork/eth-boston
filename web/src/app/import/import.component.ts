import { Component, OnInit } from '@angular/core';
import { Router } from "@angular/router";

@Component({
  selector: 'app-import',
  templateUrl: './import.component.html',
  styleUrls: ['./import.component.css']
})
export class ImportComponent implements OnInit {

  constructor(private router: Router) {

  }

  ngOnInit() {
  }

  generateWallet() {
    // TODO: put jub-jub hd wallet generation here
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }
}
