import { Injectable, inject } from '@angular/core';
import { ToastController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastController = inject(ToastController);

  async success(message: string, duration: number = 2500) {
    const toast = await this.toastController.create({
      message,
      duration,
      position: 'bottom',
      color: 'success',
      icon: 'checkmark-circle',
      cssClass: 'glass-toast'
    });
    await toast.present();
  }

  async error(message: string, duration: number = 4000) {
    const toast = await this.toastController.create({
      message,
      duration,
      position: 'bottom',
      color: 'danger',
      icon: 'alert-circle',
      cssClass: 'glass-toast'
    });
    await toast.present();
  }

  async info(message: string, duration: number = 2500) {
    const toast = await this.toastController.create({
      message,
      duration,
      position: 'bottom',
      color: 'primary',
      icon: 'information-circle',
      cssClass: 'glass-toast'
    });
    await toast.present();
  }
}
