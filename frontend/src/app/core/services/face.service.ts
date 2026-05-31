import { Injectable, signal } from '@angular/core';
import * as faceapi from '@vladmandic/face-api';

@Injectable({
  providedIn: 'root'
})
export class FaceService {
  // Reactive Signal checking if models are loaded
  public readonly modelsLoaded = signal<boolean>(false);
  private loadingPromise: Promise<void> | null = null;

  // Asynchronously load face detection, landmarking, and recognition models from CDN
  loadModels(): Promise<void> {
    if (this.modelsLoaded()) {
      return Promise.resolve();
    }
    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    const CDN_MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
    console.log('🔄 Loading AI Face Recognition Models from CDN:', CDN_MODEL_URL);

    this.loadingPromise = Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri(CDN_MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(CDN_MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(CDN_MODEL_URL)
    ])
      .then(() => {
        console.log('✅ AI Face Recognition Models Loaded Successfully!');
        this.modelsLoaded.set(true);
      })
      .catch(error => {
        console.error('❌ Failed to load AI face recognition models:', error);
        this.loadingPromise = null;
        throw error;
      });

    return this.loadingPromise;
  }

  // Detect a single face in a video stream frame and return landmarks and descriptors
  async detectFace(videoElement: HTMLVideoElement): Promise<any> {
    if (!this.modelsLoaded()) {
      await this.loadModels();
    }
    
    // SSD MobileNet with threshold 0.5
    const options = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 });
    
    return faceapi
      .detectSingleFace(videoElement, options)
      .withFaceLandmarks()
      .withFaceDescriptor();
  }

  // Detect all faces in a video stream frame
  async detectAllFaces(videoElement: HTMLVideoElement): Promise<any> {
    if (!this.modelsLoaded()) {
      await this.loadModels();
    }

    const options = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 });

    return faceapi
      .detectAllFaces(videoElement, options)
      .withFaceLandmarks()
      .withFaceDescriptors();
  }

  // Calculate Euclidean Distance between two descriptors
  calculateDistance(embeddingA: number[], embeddingB: number[]): number {
    if (!embeddingA || !embeddingB || embeddingA.length !== embeddingB.length) {
      return Infinity;
    }
    let sum = 0;
    for (let i = 0; i < embeddingA.length; i++) {
      sum += Math.pow(embeddingA[i] - embeddingB[i], 2);
    }
    return Math.sqrt(sum);
  }

  // Draw custom high-performance overlay box around face on canvas
  drawFaceOverlay(
    canvas: HTMLCanvasElement, 
    detection: any, 
    label: string = 'Scanning...', 
    confidence: number = 0,
    isMatched: boolean = false
  ): void {
    const ctx = canvas.getContext('2d');
    if (!ctx || !detection) return;

    // Clear previous drawing
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Resize detection landmarks to fit canvas size
    const resizedDetections = faceapi.resizeResults(detection, {
      width: canvas.width,
      height: canvas.height
    });

    const box = resizedDetections.detection.box;

    // Draw Bounding Box with beautiful colors
    ctx.lineWidth = 4;
    ctx.strokeStyle = isMatched ? '#10b981' : '#f59e0b'; // Green if matched, Orange if scanning
    ctx.shadowBlur = 15;
    ctx.shadowColor = isMatched ? '#10b981' : '#f59e0b';
    ctx.strokeRect(box.x, box.y, box.width, box.height);

    // Draw Corner Brackets (Enterprise design look)
    ctx.shadowBlur = 0; // Reset shadow for details
    const bracketSize = 20;
    ctx.fillStyle = isMatched ? '#10b981' : '#f59e0b';
    
    // Top-Left corner
    ctx.fillRect(box.x, box.y, bracketSize, 4);
    ctx.fillRect(box.x, box.y, 4, bracketSize);

    // Top-Right corner
    ctx.fillRect(box.x + box.width - bracketSize, box.y, bracketSize, 4);
    ctx.fillRect(box.x + box.width - 4, box.y, 4, bracketSize);

    // Bottom-Left corner
    ctx.fillRect(box.x, box.y + box.height - 4, bracketSize, 4);
    ctx.fillRect(box.x, box.y + box.height - bracketSize, 4, bracketSize);

    // Bottom-Right corner
    ctx.fillRect(box.x + box.width - bracketSize, box.y + box.height - 4, bracketSize, 4);
    ctx.fillRect(box.x + box.width - 4, box.y + box.height - bracketSize, 4, bracketSize);

    // Draw label pill above the box
    ctx.font = 'bold 14px "Outfit", "Inter", sans-serif';
    const text = confidence > 0 ? `${label} (${confidence}%)` : label;
    const textWidth = ctx.measureText(text).width;
    const pillHeight = 26;
    const pillWidth = textWidth + 24;

    ctx.fillStyle = isMatched ? '#10b981' : '#f59e0b';
    ctx.beginPath();
    ctx.roundRect(box.x, box.y - pillHeight - 6, pillWidth, pillHeight, 6);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 0;
    ctx.fillText(text, box.x + 12, box.y - 14);
  }
}
