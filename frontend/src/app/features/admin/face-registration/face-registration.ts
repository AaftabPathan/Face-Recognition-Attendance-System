import { Component, ElementRef, OnDestroy, OnInit, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { StudentService } from '../../../core/services/student.service';
import { FaceService } from '../../../core/services/face.service';
import { ToastService } from '../../../core/services/toast.service';
import { Sidebar } from '../../../shared/components/sidebar/sidebar';
import { Navbar } from '../../../shared/components/navbar/navbar';

@Component({
  selector: 'app-face-registration',
  standalone: true,
  imports: [Sidebar, Navbar, FormsModule],
  templateUrl: './face-registration.html',
  styleUrl: './face-registration.css'
})
export class FaceRegistration implements OnInit, OnDestroy {
  private readonly studentService = inject(StudentService);
  private readonly faceService = inject(FaceService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;

  students = signal<any[]>([]);
  selectedStudentId = signal<string>('');

  // Webcam states
  webcamActive = signal<boolean>(false);
  modelsLoading = signal<boolean>(false);
  scanning = signal<boolean>(false);
  captureProgress = signal<number>(0); // 0% to 100%

  // Captured data
  capturedEmbeddings: number[][] = [];
  capturedImageBase64 = '';

  private mediaStream: MediaStream | null = null;
  private animationFrameId: number | null = null;

  ngOnInit(): void {
    this.loadStudents();
    this.checkQueryParams();
  }

  ngOnDestroy(): void {
    this.stopWebcam();
  }

  // Pre-load all students to register
  private loadStudents(): void {
    this.studentService.getAllStudents().subscribe({
      next: res => {
        if (res.success) {
          // Keep only students that haven't enrolled yet, or allow re-enrolling
          this.students.set(res.data);
        }
      }
    });
  }

  // Prefill student selector if redirected from student CRUD table
  private checkQueryParams(): void {
    this.route.queryParams.subscribe(params => {
      if (params['studentId']) {
        this.selectedStudentId.set(params['studentId'].toString());
      }
    });
  }

  // Request camera and load weights
  async startWebcam(): Promise<void> {
    if (!this.selectedStudentId()) {
      this.toast.warning('Please select a student to enroll first.');
      return;
    }

    try {
      this.modelsLoading.set(true);
      // Load AI models weights
      await this.faceService.loadModels();
      this.modelsLoading.set(false);

      // Launch Webcam
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false
      });

      this.videoElement.nativeElement.srcObject = this.mediaStream;
      this.webcamActive.set(true);
      this.scanning.set(true);
      this.captureProgress.set(0);
      this.capturedEmbeddings = [];

      // Kickoff real-time frame capturing loop
      this.animationFrameId = requestAnimationFrame(() => this.scanFrameLoop());
      this.toast.success('Webcam initialized. Align face to capture biometric credentials.');

    } catch (error: any) {
      this.modelsLoading.set(false);
      this.toast.error('Could not access camera. Please grant permissions.');
      console.error(error);
    }
  }

  // Frame processing recursive loop
  private async scanFrameLoop(): Promise<void> {
    if (!this.webcamActive() || !this.scanning()) return;

    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      try {
        const detection = await this.faceService.detectFace(video);
        
        if (detection) {
          const progress = this.captureProgress();
          
          if (progress < 100) {
            // Collect embeddings
            const emb = Array.from(detection.descriptor) as number[];
            this.capturedEmbeddings.push(emb);
            
            const nextProgress = Math.min(100, progress + 25); // Collects exactly 4 stable samples
            this.captureProgress.set(nextProgress);

            // Draw orange scanning frame
            this.faceService.drawFaceOverlay(canvas, detection, 'Capturing Biometrics...', nextProgress, false);

            if (nextProgress === 100) {
              this.scanning.set(false);
              this.saveCanvasSnapshot(video);
              this.toast.success('Biometric markers successfully mapped! Template finalized.');
            }
          }
        } else {
          // If no face, clear canvas and warn user
          const ctx = canvas.getContext('2d');
          if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      } catch (err) {
        console.error(err);
      }
    }

    if (this.scanning()) {
      this.animationFrameId = requestAnimationFrame(() => this.scanFrameLoop());
    }
  }

  // Take a clean snapshot frame from the webcam
  private saveCanvasSnapshot(video: HTMLVideoElement): void {
    const snapCanvas = document.createElement('canvas');
    snapCanvas.width = video.videoWidth;
    snapCanvas.height = video.videoHeight;
    const ctx = snapCanvas.getContext('2d');
    
    if (ctx) {
      // Mirror the draw just like webcam
      ctx.translate(snapCanvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, snapCanvas.width, snapCanvas.height);
      this.capturedImageBase64 = snapCanvas.toDataURL('image/png');
    }
  }

  // Save the complete biometrics payload to Express
  saveBiometricTemplate(): void {
    if (this.capturedEmbeddings.length === 0 || !this.capturedImageBase64) {
      this.toast.warning('No biometric template captured yet. Restart webcam to capture.');
      return;
    }

    const payload = {
      studentId: Number(this.selectedStudentId()),
      embeddings: this.capturedEmbeddings,
      imageBase64: this.capturedImageBase64
    };

    this.studentService.registerFaceEmbeddings(payload).subscribe({
      next: res => {
        if (res.success) {
          this.toast.success('Biometric template registered and profile updated!');
          this.stopWebcam();
          this.router.navigate(['/admin/students']); // Redirect back to lists
        }
      },
      error: err => {
        this.toast.error(err.error?.message || 'Biometrics registration failed.');
        console.error(err);
      }
    });
  }

  // Gracefully stop all webcam tracks
  stopWebcam(): void {
    this.scanning.set(false);
    this.webcamActive.set(false);

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    const canvas = this.canvasElement?.nativeElement;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
}
