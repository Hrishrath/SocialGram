import { Component, OnInit } from '@angular/core';

import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';

import { NgForm } from "@angular/forms";

import { finalize } from "rxjs/operators";

import { AngularFireStorage } from '@angular/fire/storage';

import { AngularFireDatabase } from '@angular/fire/database';

import { readAndCompressImage } from 'browser-image-resizer';

import { imageConfig } from './../../../utils/config';

//uuid

import { v4 as uuidv4} from "uuid";
import { PercentPipe } from '@angular/common';

@Component({
  selector: 'app-addpost',
  templateUrl: './addpost.component.html',
  styleUrls: ['./addpost.component.css']
})
export class AddpostComponent implements OnInit {

  locationName: string;
  description: string;
  picture: string = null;

  user = null;
  uploadPercent: number = null;
  constructor(private auth: AuthService,
    private router: Router,
    private db: AngularFireDatabase,
    private storage: AngularFireStorage,
    private toastr: ToastrService) 
    { 
      auth.getUser().subscribe((user) => {
        this.db.object(`/users ${user.uid}`)
        .valueChanges()
        .subscribe((user) => {
          this.user = user;
        })
      });
    }


  ngOnInit(): void {
  }

  onSubmit(){
    const uid = uuidv4();

    this.db.object(`/posts/${uid}`)
    .set({
      id: uid,
      locationName: this.locationName,
      description: this.description,
      picture: this.picture,
      //by: this.user.name,
      //instaId: this.user.instaUserName,
      date: Date.now()
    })
    .then(() => {
      this.toastr.success("Post added Successfully");
      this.router.navigateByUrl('/');
    })
    .catch((err) => {
      this.toastr.error("OOpss");
    })
  }

  async uploadFile(event){
    const file = event.target.files[0];
    let resizedImage = await readAndCompressImage(file, imageConfig)
    
    const filePath = file.name;
    const fileRef = this.storage.ref(filePath)

    const task = this.storage.upload(filePath, resizedImage);

    task.percentageChanges().subscribe((Percentage) => {
      this.uploadPercent = Percentage;
    })

    task.snapshotChanges().pipe(finalize(() => {
      fileRef.getDownloadURL().subscribe((url) => {
        this.picture = url;
        this.toastr.success("Image upload Successful");
      } )
    })).subscribe()
  }

}
