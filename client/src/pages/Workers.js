import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { getBatches as fetchBatches } from '../utils/batchUtils';
import { exportWorkers } from '../utils/reportUtils';
import * as faceapi from 'face-api.js';
// Function to compress image
const compressImage = (imageDataUrl, quality = 0.7) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Calculate new dimensions (reduce to 50% of original)
      const maxWidth = 300;
      const maxHeight = 300;
      let width = img.width;
      let height = img.height;
      
      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw image on canvas
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to base64 with compression
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedDataUrl);
    };
    img.src = imageDataUrl;
  });
};

const Workers = () => {
  const [workers, setWorkers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Batch selection state
  const [selectedBatch, setSelectedBatch] = useState('');
  const [availableBatches, setAvailableBatches] = useState([]);  const navigate = useNavigate();

  // Check authentication
  useEffect(() => {
    const storedAdmin = localStorage.getItem('admin');
    if (!storedAdmin) {
      navigate('/admin/login');
    }
  }, [navigate]);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    department: '',
    salary: '',
    rfid: '',
    batch: '' // Add batch field
  });  
  const [isEditing, setIsEditing] = useState(false);
  const [editingWorkerId, setEditingWorkerId] = useState(null);
  
  // Face capture state for multiple images
  const [showFaceCapture, setShowFaceCapture] = useState(false);
  const [faceImages, setFaceImages] = useState([]); // Array to store multiple face images
  const [capturing, setCapturing] = useState(false);
  const [captureCompleted, setCaptureCompleted] = useState(false); // Track if capture session is completed
  const [faceDetectionActive, setFaceDetectionActive] = useState(false); // Track if face detection is active
  const [faceDetected, setFaceDetected] = useState(false); // Track if a face is currently detected
  const [faceQualityScore, setFaceQualityScore] = useState(0); // Quality score for face position and clarity
  const [faceDetectionStatus, setFaceDetectionStatus] = useState(''); // Status message for face detection
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  // Face review state
  const [showFaceReview, setShowFaceReview] = useState(false);
  const [reviewWorker, setReviewWorker] = useState(null);
  const [reviewFaceImages, setReviewFaceImages] = useState([]);

  // RFID state
  const [showRFIDModal, setShowRFIDModal] = useState(false);
  const [rfidInput, setRfidInput] = useState('');
  const [scanningRFID, setScanningRFID] = useState(false);

  // Add a callback ref to ensure proper attachment
  const setVideoRef = useCallback((element) => {
    console.log('setVideoRef called with element:', element);
    if (element) {
      console.log('Video element attached to ref:', element);
      videoRef.current = element;
      
      // If we're showing the face capture and not capturing yet, try to access camera
      if (showFaceCapture && !captureCompleted && !capturing) {
        console.log('Video element attached and face capture is active, attempting to access camera...');
        
        // Try to access camera immediately
        const constraints = { 
          video: { 
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 }
          } 
        };
        
        navigator.mediaDevices.getUserMedia(constraints)
          .then(stream => {
            console.log('Camera access granted via ref callback, setting stream to video element...');
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              setCapturing(true);
              console.log('Camera stream successfully set to video element via ref callback');
            }
          })
          .catch(err => {
            console.error('Error accessing camera via ref callback:', err);
            // Try fallback
            const fallbackConstraints = { video: { facingMode: 'user' } };
            navigator.mediaDevices.getUserMedia(fallbackConstraints)
              .then(stream => {
                console.log('Camera access granted with fallback via ref callback...');
                if (videoRef.current) {
                  videoRef.current.srcObject = stream;
                  setCapturing(true);
                  console.log('Camera stream successfully set to video element with fallback via ref callback');
                }
              })
              .catch(fallbackErr => {
                console.error('Error accessing camera with fallback via ref callback:', fallbackErr);
                let errorMessage = 'Could not access camera. ';
                if (fallbackErr.name === 'NotAllowedError') {
                  errorMessage += 'Please grant camera permission in your browser settings.';
                } else {
                  errorMessage += 'Please ensure you have given permission and that your camera is not in use.';
                }
                setError(errorMessage);
                setCapturing(false);
              });
          });
      }
    } else {
      console.log('Video element ref cleared');
      videoRef.current = null;
    }
  }, [showFaceCapture, captureCompleted, capturing]);

  // Cleanup function for video streams
  const cleanupVideoStream = () => {
    try {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach(track => {
          console.log('Cleaning up track on unmount:', track);
          track.stop();
        });
        videoRef.current.srcObject = null;
      }
    } catch (err) {
      console.error('Error cleaning up video stream:', err);
    }
  };

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      cleanupVideoStream();
    };
  }, []);

  // Handle camera access when face capture modal is shown
  useEffect(() => {
    if (showFaceCapture && !captureCompleted && !capturing) {
      // Check if browser supports media devices
      if (!navigator.mediaDevices) {
        console.error('Browser does not support media devices');
        setError('Your browser does not support camera access. Please try a different browser.');
        return;
      }
      
      console.log('Face capture modal shown, will attempt camera access when video element is ready');
      
      // Camera access will be handled in the video element's ref callback
      // This ensures we only try to access the camera when the element is definitely available
    }
  }, [showFaceCapture, captureCompleted, capturing]);

  // Watch for when the video element should be available and try to access camera
  useEffect(() => {
    if (showFaceCapture && !captureCompleted && !capturing) {
      console.log('Face capture is active, watching for video element...');
      
      // Clear any existing intervals
      if (window.faceCaptureInterval) {
        clearInterval(window.faceCaptureInterval);
      }
      if (window.faceCaptureTimeout) {
        clearTimeout(window.faceCaptureTimeout);
      }
      
      // Try to find the video element in the DOM periodically
      window.faceCaptureInterval = setInterval(() => {
        const videoElement = document.getElementById('face-capture-video');
        if (videoElement && !videoRef.current) {
          console.log('Found video element in DOM, setting ref:', videoElement);
          videoRef.current = videoElement;
          
          // Try to access camera
          const constraints = { video: { facingMode: 'user' } };
          navigator.mediaDevices.getUserMedia(constraints)
            .then(stream => {
              console.log('Camera access granted via DOM query, setting stream to video element...');
              videoElement.srcObject = stream;
              setCapturing(true);
              // Clear interval once we have access
              if (window.faceCaptureInterval) {
                clearInterval(window.faceCaptureInterval);
                window.faceCaptureInterval = null;
              }
            })
            .catch(err => {
              console.error('Error accessing camera via DOM query:', err);
              // Don't clear interval here, let user try manually
            });
        }
      }, 500);
      
      // Clear interval after 10 seconds
      window.faceCaptureTimeout = setTimeout(() => {
        if (window.faceCaptureInterval) {
          clearInterval(window.faceCaptureInterval);
          window.faceCaptureInterval = null;
        }
      }, 10000);
      
      // Cleanup
      return () => {
        if (window.faceCaptureInterval) {
          clearInterval(window.faceCaptureInterval);
          window.faceCaptureInterval = null;
        }
        if (window.faceCaptureTimeout) {
          clearTimeout(window.faceCaptureTimeout);
          window.faceCaptureTimeout = null;
        }
      };
    }
  }, [showFaceCapture, captureCompleted, capturing]);

  // Fetch workers and departments from the backend
  useEffect(() => {
    fetchWorkers();
    fetchDepartments();
  }, []);
  
  // Load batches when component mounts
  const loadBatches = async () => {
    try {
      const batches = await fetchBatches();
      setAvailableBatches(batches);
    } catch (error) {
      console.error('Error loading batches:', error);
    }
  };
  
  useEffect(() => {
    loadBatches();
  }, []);
  const fetchWorkers = async () => {
    try {
      const res = await api.get('/workers');

      setWorkers(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch workers');
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/departments');
      setDepartments(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch departments');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Special handling for salary to ensure proper type and validation
    if (name === 'salary') {
      // Allow empty values and valid numbers only
      if (value === '' || /^\d*\.?\d*$/.test(value)) {
        setFormData({
          ...formData,
          [name]: value
        });
      }
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value
      });
    }
  };
  
  // Handle batch selection
  const handleBatchChange = (e) => {
    const batchId = e.target.value;
    setSelectedBatch(batchId);
    // Update form data with selected batch
    setFormData({
      ...formData,
      batch: batchId
    });
  };
  const startFaceCapture = () => {
    setShowFaceCapture(true);
    setCapturing(true); // Start with true to immediately show camera
    setCaptureCompleted(false);
    setFaceImages([]); // Clear previous images when starting new capture session
    
    // Ensure any existing stream is stopped first
    if (videoRef.current && videoRef.current.srcObject) {
      try {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      } catch (err) {
        console.log('No existing stream to stop or error stopping tracks:', err);
      }
    }
    
    // Immediately try to access camera
    setTimeout(() => {
      if (videoRef.current) {
        const constraints = { 
          video: { 
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 }
          } 
        };
        
        navigator.mediaDevices.getUserMedia(constraints)
          .then(stream => {
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              setCapturing(true);
              // Start face detection after camera access
              setTimeout(() => {
                setFaceDetectionActive(true);
              }, 1000);
            }
          })
          .catch(err => {
            console.error('Error accessing camera:', err);
            // Try fallback
            const fallbackConstraints = { video: { facingMode: 'user' } };
            navigator.mediaDevices.getUserMedia(fallbackConstraints)
              .then(stream => {
                if (videoRef.current) {
                  videoRef.current.srcObject = stream;
                  setCapturing(true);
                  // Start face detection after camera access
                  setTimeout(() => {
                    setFaceDetectionActive(true);
                  }, 1000);
                }
              })
              .catch(fallbackErr => {
                console.error('Error accessing camera with fallback:', fallbackErr);
                let errorMessage = 'Could not access camera. ';
                if (fallbackErr.name === 'NotAllowedError') {
                  errorMessage += 'Please grant camera permission in your browser settings.';
                } else {
                  errorMessage += 'Please ensure you have given permission and that your camera is not in use.';
                }
                setError(errorMessage);
                setCapturing(false);
              });
          });
      }
    }, 100);
  };
  
  // Function to calculate face quality score
  const calculateFaceQuality = (detection, videoElement) => {
    if (!detection || !videoElement) return 0;
    
    const box = detection.detection.box;
    const videoWidth = videoElement.videoWidth;
    const videoHeight = videoElement.videoHeight;
    
    // Calculate face size relative to video dimensions
    const faceWidthRatio = box.width / videoWidth;
    const faceHeightRatio = box.height / videoHeight;
    
    // Calculate face position (should be roughly centered)
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;
    const xCenterRatio = Math.abs(centerX - videoWidth / 2) / (videoWidth / 2);
    const yCenterRatio = Math.abs(centerY - videoHeight / 2) / (videoHeight / 2);
    
    // Quality factors:
    // - Face size should be between 20% and 60% of video
    const sizeFactor = Math.min(1, Math.max(0, (Math.min(faceWidthRatio, faceHeightRatio) - 0.2) / 0.4));
    // - Face should be centered (closer to center is better)
    const centerFactor = Math.max(0, 1 - Math.sqrt(xCenterRatio * xCenterRatio + yCenterRatio * yCenterRatio));
    
    // Combined quality score (0-1 scale)
    const qualityScore = (sizeFactor * 0.6 + centerFactor * 0.4);
    
    return Math.round(qualityScore * 100);
  };
  
  // Function to detect faces in video
  const detectFaceInVideo = async () => {
    if (!videoRef.current || !faceDetectionActive) return;
    
    try {
      const detections = await faceapi.detectSingleFace(videoRef.current)
        .withFaceLandmarks()
        .withFaceDescriptor();
        
      if (detections) {
        const qualityScore = calculateFaceQuality(detections, videoRef.current);
        setFaceDetected(true);
        setFaceQualityScore(qualityScore);
        
        if (qualityScore >= 70) {
          setFaceDetectionStatus('Good face position detected! Ready to capture.');
        } else if (qualityScore >= 50) {
          setFaceDetectionStatus('Face detected, adjust position for better quality.');
        } else {
          setFaceDetectionStatus('Please position your face in the center and closer to the camera.');
        }
      } else {
        setFaceDetected(false);
        setFaceQualityScore(0);
        setFaceDetectionStatus('No face detected. Please position your face in front of the camera.');
      }
    } catch (error) {
      console.error('Error detecting face:', error);
    }
  };
  
  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      try {
        await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
        await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
        console.log('Face API models loaded successfully');
      } catch (error) {
        console.error('Error loading face API models:', error);
      }
    };
    
    loadModels();
  }, []);
  
  // Start face detection when capturing
  useEffect(() => {
    if (capturing && faceDetectionActive && videoRef.current && videoRef.current.readyState === 4) {
      // Start face detection interval
      const detectionInterval = setInterval(detectFaceInVideo, 300); // Detect every 300ms
      
      return () => {
        clearInterval(detectionInterval);
      };
    }
  }, [capturing, faceDetectionActive]);

  const captureFace = () => {
    // Check if videoRef and canvasRef are available
    if (!videoRef.current || !canvasRef.current) {
      console.error('Video or canvas element not available');
      return;
    }

    const video = videoRef.current;
    
    // Check if video stream is available
    if (!video.srcObject) {
      console.error('Video stream not available');
      return;
    }
    
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert to base64 image
    const imageData = canvas.toDataURL('image/jpeg');
    
    // Add to face images array
    setFaceImages(prev => {
      const newImages = [...prev, imageData];
      // If we've reached 4 images, stop capturing
      if (newImages.length >= 4) {
        setCapturing(false);
        setCaptureCompleted(true);
        // Stop face detection when we're done
        setFaceDetectionActive(false);
      }
      return newImages;
    });
    
    // Automatically continue capturing if we haven't reached 4 images
    if (faceImages.length < 3) {
      // Keep capturing after a short delay
      setTimeout(() => {
        if (videoRef.current && videoRef.current.srcObject) {
          // Restart the video feed for next capture
          setCapturing(true);
        }
      }, 500);
    } else {
      // We've captured 4 images, stop the stream
      try {
        const stream = video.srcObject;
        if (stream) {
          const tracks = stream.getTracks();
          tracks.forEach(track => track.stop());
        }
      } catch (err) {
        console.error('Error stopping video stream:', err);
      }
    }
  };

  const removeFaceImage = (index) => {
    setFaceImages(prev => prev.filter((_, i) => i !== index));
  };

  const confirmFaceImages = () => {
    // Close the face capture modal and keep the captured images
    setShowFaceCapture(false);
    setCaptureCompleted(false);
    setFaceDetectionActive(false); // Stop face detection
    setFaceDetected(false);
    setFaceQualityScore(0);
    setFaceDetectionStatus('');
    
    // Stop any active video streams
    try {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
      }
    } catch (err) {
      console.error('Error stopping video stream:', err);
    }
  };

  const closeFaceCapture = () => {
    setShowFaceCapture(false);
    setCapturing(false);
    setCaptureCompleted(false);
    setFaceDetectionActive(false); // Stop face detection
    setFaceDetected(false);
    setFaceQualityScore(0);
    setFaceDetectionStatus('');
    setFaceImages([]); // Clear images when canceling
    
    // Stop any active video streams
    try {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach(track => {
          console.log('Stopping track:', track);
          track.stop();
        });
        videoRef.current.srcObject = null;
      }
    } catch (err) {
      console.error('Error stopping video stream:', err);
    }
    
    // Clear any pending intervals or timeouts
    if (window.faceCaptureInterval) {
      clearInterval(window.faceCaptureInterval);
      window.faceCaptureInterval = null;
    }
    if (window.faceCaptureTimeout) {
      clearTimeout(window.faceCaptureTimeout);
      window.faceCaptureTimeout = null;
    }
  };

  // Face review functions
  const openFaceReview = (worker) => {
    setReviewWorker(worker);
    setReviewFaceImages(worker.faceData || []);
    setShowFaceReview(true);
  };

  const closeFaceReview = () => {
    setShowFaceReview(false);
    setReviewWorker(null);
    setReviewFaceImages([]);
    
    // Stop any active video streams in case they were started
    try {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach(track => {
          console.log('Stopping track on review close:', track);
          track.stop();
        });
        videoRef.current.srcObject = null;
      }
    } catch (err) {
      console.error('Error stopping video stream:', err);
    }
  };

  const removeReviewFaceImage = (index) => {
    setReviewFaceImages(prev => prev.filter((_, i) => i !== index));
  };

  const addReviewFaceImage = () => {
    // Close review modal and open capture modal
    setShowFaceReview(false);
    // Open capture with existing images
    setFaceImages(reviewFaceImages);
    setShowFaceCapture(true);
    setCapturing(false); // Start with capturing false, will be set to true when stream is ready
    setCaptureCompleted(false);
    
    // Ensure any existing stream is stopped first
    if (videoRef.current && videoRef.current.srcObject) {
      try {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      } catch (err) {
        console.log('No existing stream to stop or error stopping tracks:', err);
      }
    }
  };

  const saveFaceReview = async () => {
    try {
      // Compress images before saving
      setError('Compressing images...');
      const compressedImages = await Promise.all(
        reviewFaceImages.map(image => compressImage(image, 0.7))
      );
      
      // Update worker with new face data
      await api.put(`/workers/${reviewWorker._id}`, {
        ...reviewWorker,
        faceData: compressedImages
      });
      
      setError('');
      setSuccess('Face images updated successfully');
      closeFaceReview();
      fetchWorkers(); // Refresh the list
    } catch (err) {
      console.error(err);
      setError('Failed to update face images');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.email) {
      setError('Name and Email are required');
      return;
    }
    
    if (!isEditing && !formData.password) {
      setError('Password is required for new workers');
      return;
    }
    
    try {
      // Prepare data for submission
      const submitData = {
        name: formData.name,
        email: formData.email,
        department: formData.department || null,
        salary: formData.salary !== '' ? Number(formData.salary) : null, // Convert salary to number or null
        rfid: formData.rfid || null, // Include RFID if provided
        batch: selectedBatch || null // Include batch if selected
      };
      
      // Add password only if it's provided (for both create and update)
      if (formData.password) {
        submitData.password = formData.password;
      }
      
      // Add face data
      if (faceImages.length > 0) {
        submitData.faceData = faceImages;
      }
      
      if (isEditing) {
        // Update existing worker
        await api.put(`/workers/${editingWorkerId}`, submitData);
        setSuccess('Worker updated successfully');
      } else {
        // Add password for new workers
        if (!formData.password) {
          throw new Error('Password is required for new workers');
        }
        submitData.password = formData.password;
        
        // Create new worker
        await api.post('/workers', submitData);
        setSuccess('Worker created successfully');
      }
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        password: '',
        department: '',
        salary: '',
        rfid: '',
        batch: '' // Reset batch field
      });
      
      setIsEditing(false);
      setEditingWorkerId(null);
      setShowModal(false);
      setFaceImages([]);
      fetchWorkers(); // Refresh the list
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || `Failed to ${isEditing ? 'update' : 'create'} worker`);
    }
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const openCreateModal = () => {
    // Reload batches to ensure we have the latest data
    loadBatches();
    
    setFormData({
      name: '',
      email: '',
      password: '',
      department: '',
      salary: '',
      rfid: generateRFID(), // Generate RFID when opening modal
      batch: '' // Reset batch field
    });
    setFaceImages([]);
    setIsEditing(false);
    setEditingWorkerId(null);
    setShowModal(true);
    // Reset batch selection
    setSelectedBatch('');
  };
  
  const closeModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setEditingWorkerId(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      department: '',
      salary: '',
      rfid: '',
      batch: '' // Reset batch field
    });
    setError('');
    setSuccess('');
    setFaceImages([]);
    // Reset batch selection
    setSelectedBatch('');
  };

  const handleEdit = (worker) => {
    // Reload batches to ensure we have the latest data
    loadBatches();
    
    setFormData({
      name: worker.name,
      email: worker.email,
      password: '', // Don't prefill password for security
      department: worker.department?._id || '',
      salary: worker.salary !== undefined && worker.salary !== null ? worker.salary.toString() : '', // Include salary if exists
      rfid: worker.rfid || '', // Include RFID if exists
      batch: worker.batch?._id || '' // Include batch if exists
    });
    
    // Set face images if available
    if (worker.faceData && Array.isArray(worker.faceData)) {
      setFaceImages(worker.faceData);
    } else if (worker.faceData) {
      // Handle case where faceData is a single string (backward compatibility)
      setFaceImages([worker.faceData]);
    } else {
      setFaceImages([]);
    }
    
    setIsEditing(true);
    setEditingWorkerId(worker._id);
    setShowModal(true);
    // Set the selected batch to the worker's batch
    setSelectedBatch(worker.batch?._id || '');
  };
  // Generate RFID with 2 letters + 4 digits format
  const generateRFID = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const letter1 = letters.charAt(Math.floor(Math.random() * letters.length));
    const letter2 = letters.charAt(Math.floor(Math.random() * letters.length));
    const digits = Math.floor(1000 + Math.random() * 9000); // 4-digit number between 1000-9999
    return `${letter1}${letter2}${digits}`;
  };

  // RFID Functions
  // const openRFIDModal = () => {
  //   setShowRFIDModal(true);
  //   setScanningRFID(true);
  //   setRfidInput('');
  // };

  const closeRFIDModal = () => {
    setShowRFIDModal(false);
    setScanningRFID(false);
    setRfidInput('');
  };

  const handleRFIDScan = (e) => {
    setRfidInput(e.target.value);
    
    // Auto-submit when RFID is scanned (assuming RFID scanners append Enter key)
    if (e.key === 'Enter' && e.target.value) {
      recordRFIDAttendance(e.target.value);
    }
  };

  const recordRFIDAttendance = async (rfid) => {
    try {
      setScanningRFID(false);
      const response = await axios.post('/api/workers/attendance', {
        rfid,
        method: 'checkIn'
      });
      
      setSuccess(`Attendance recorded for ${response.data.attendanceRecord.workerName || 'worker'}`);
      closeRFIDModal();
      fetchWorkers(); // Refresh the list
    } catch (err) {
      console.error(err);
      setError('Failed to record attendance');
      setScanningRFID(false);
    }
  };

  const manualRFIDSubmit = () => {
    if (rfidInput) {
      recordRFIDAttendance(rfidInput);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this worker?')) {
      try {
        await axios.delete(`/api/workers/${id}`);
        fetchWorkers(); // Refresh the list
        setSuccess('Worker deleted successfully');
      } catch (err) {
        console.error(err);
        setError('Failed to delete worker');
      }
    }
  };

  /* ── styles ─────────────────────────────────────────────── */
  const S = {
    page: { minHeight: '100vh', backgroundColor: '#F9FAFB', padding: '28px 24px', fontFamily: "'Inter', sans-serif" },
    card: (extra = {}) => ({ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', ...extra }),
    input: { backgroundColor: '#FFFFFF', border: '1px solid #D1D5DB', borderRadius: 10, padding: '10px 14px', color: '#111827', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box', transition: 'border-color 0.15s ease, box-shadow 0.15s ease' },
    label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#4B5563', marginBottom: 6 },
    th: { padding: '12px 16px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6B7280', textAlign: 'left', borderBottom: '1px solid #E5E7EB', backgroundColor: '#F9FAFB' },
    td: { padding: '14px 16px', fontSize: 13.5, color: '#374151', borderBottom: '1px solid #E5E7EB', verticalAlign: 'middle' },
    btnPrimary: { padding: '10px 20px', borderRadius: 8, border: 'none', backgroundColor: '#2563EB', color: '#FFFFFF', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(37,99,235,0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },
    btnSecondary: { padding: '10px 20px', borderRadius: 8, border: '1px solid #D1D5DB', backgroundColor: '#FFFFFF', color: '#374151', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },
    btnDanger: { padding: '10px 20px', borderRadius: 8, border: 'none', backgroundColor: '#EF4444', color: '#FFFFFF', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s' },
  };

  if (loading) return (
    <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid #E5E7EB', borderTopColor: '#3B82F6', animation: 'spin 0.8s linear infinite', margin: '0 auto 14px' }} />
        <p style={{ color: '#6B7280', fontSize: 14, fontWeight: 500 }}>Loading workers…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={S.page}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(59,130,246,0.25)'
          }}>
            <svg width="22" height="22" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111827', margin: 0, fontFamily: "'Outfit',sans-serif" }}>
              Workers Management
            </h1>
            <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>Manage your repair shop workers</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => {}} style={{...S.btnSecondary, opacity: 0, pointerEvents: 'none', display: 'none'}} />
          <button onClick={openCreateModal} style={S.btnPrimary}>+ Add New Worker</button>
        </div>
      </div>

      {error && !showModal && !showFaceCapture && !showFaceReview && (
        <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', borderRadius: 12, padding: '12px 16px', fontSize: 14, marginBottom: 16 }}>{error}</div>
      )}

      {success && !showModal && !showFaceCapture && !showFaceReview && (
        <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', color: '#16A34A', borderRadius: 12, padding: '12px 16px', fontSize: 14, marginBottom: 16 }}>{success}</div>
      )}

      {/* RFID Modal */}
      {showRFIDModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 }}>
          <div style={{ ...S.card({ width: '100%', maxWidth: 400, padding: 0, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }) }}>
            <div style={{ borderBottom: '1px solid #E5E7EB', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F9FAFB' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#111827' }}>RFID Attendance</h3>
              <button onClick={closeRFIDModal} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#6B7280' }}>×</button>
            </div>
            <div style={{ padding: 24, textAlign: 'center' }}>
              {scanningRFID ? (
                <>
                  <div style={{ width: 80, height: 80, borderRadius: '50%', backgroundColor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <svg style={{ width: 40, height: 40, color: '#6B7280' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"></path>
                    </svg>
                  </div>
                  <p style={{ color: '#4B5563', fontSize: 14, marginBottom: 16 }}>Scan your RFID card or enter RFID manually</p>
                  <input
                    type="text" value={rfidInput} onChange={(e) => setRfidInput(e.target.value)} onKeyPress={handleRFIDScan}
                    placeholder="Enter RFID" style={{ ...S.input, marginBottom: 16 }} autoFocus
                  />
                  <button onClick={manualRFIDSubmit} disabled={!rfidInput} style={{ ...S.btnPrimary, backgroundColor: '#16A34A', width: '100%', opacity: !rfidInput ? 0.5 : 1 }}>
                    Submit RFID
                  </button>
                </>
              ) : (
                <div style={{ padding: '24px 0' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #E5E7EB', borderTopColor: '#16A34A', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
                  <p style={{ color: '#4B5563', fontSize: 14 }}>Recording attendance...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Worker Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 }}>
          <div style={{ ...S.card({ width: '100%', maxWidth: 600, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden' }) }}>
            <div style={{ borderBottom: '1px solid #E5E7EB', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F9FAFB' }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#111827' }}>
                {isEditing ? 'Edit Worker' : 'Add New Worker'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#6B7280' }}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={S.label}>Full Name *</label>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} style={S.input} placeholder="e.g. John Doe" required />
                </div>
                <div>
                  <label style={S.label}>Email *</label>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} style={S.input} placeholder="e.g. john@example.com" required />
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={S.label}>{isEditing ? 'New Password (optional)' : 'Password *'}</label>
                  <input type="password" name="password" value={formData.password} onChange={handleInputChange} style={S.input} placeholder={isEditing ? "Leave blank to keep current" : "Enter password"} required={!isEditing} />
                </div>
                <div>
                  <label style={S.label}>Department</label>
                  <select name="department" value={formData.department} onChange={handleInputChange} style={S.input}>
                    <option value="">Select Department</option>
                    {departments.map(dept => <option key={dept._id} value={dept._id}>{dept.name}</option>)}
                  </select>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={S.label}>Salary (₹)</label>
                  <input type="number" name="salary" value={formData.salary} onChange={handleInputChange} style={S.input} placeholder="Enter salary" min="0" onWheel={e => e.target.blur()} />
                </div>
                <div>
                  <label style={S.label}>RFID</label>
                  <div style={{ display: 'flex' }}>
                    <input type="text" name="rfid" value={formData.rfid} onChange={handleChange} style={{ ...S.input, borderTopRightRadius: !isEditing ? 0 : 10, borderBottomRightRadius: !isEditing ? 0 : 10, backgroundColor: isEditing ? '#F3F4F6' : '#FFFFFF' }} placeholder="RFID" readOnly={isEditing} />
                    {!isEditing && (
                      <button type="button" onClick={() => setFormData({...formData, rfid: generateRFID()})} style={{ ...S.btnSecondary, borderTopLeftRadius: 0, borderBottomLeftRadius: 0, backgroundColor: '#F3F4F6', borderLeft: 0, padding: '10px 12px' }}>
                        Gen
                      </button>
                    )}
                  </div>
                  <p style={{ margin: '4px 0 0 0', fontSize: 11, color: '#6B7280' }}>Format: 2 letters + 4 digits (e.g., AB1234)</p>
                </div>
              </div>
              
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ ...S.label, marginBottom: 0 }}>Select Batch</label>
                  <span style={{ fontSize: 11, color: '#6B7280', fontStyle: 'italic' }}>{isEditing ? "Current worker's batch" : "Assign batch"}</span>
                </div>
                <select value={selectedBatch} onChange={handleBatchChange} style={S.input}>
                  <option value="">Select a Batch</option>
                  {availableBatches.map(batch => (
                    <option key={batch._id} value={batch._id}>
                      {batch.name} ({batch.workingTime.from} - {batch.workingTime.to})
                    </option>
                  ))}
                </select>
                {selectedBatch && (() => {
                  const batch = availableBatches.find(b => b._id === selectedBatch);
                  return batch ? (
                    <div style={{ marginTop: 8, padding: 12, backgroundColor: '#EFF6FF', borderRadius: 8, border: '1px solid #BFDBFE' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1E40AF', marginBottom: 4 }}>Selected Batch: {batch.name}</div>
                      <div style={{ fontSize: 12, color: '#2563EB', display: 'flex', flexWrap: 'wrap', gap: '0 12px' }}>
                        <span><strong style={{ fontWeight: 600 }}>Work:</strong> {batch.workingTime.from} - {batch.workingTime.to}</span>
                        {batch.lunchTime?.enabled && <span><strong style={{ fontWeight: 600 }}>Lunch:</strong> {batch.lunchTime.from} - {batch.lunchTime.to}</span>}
                        {batch.breakTime?.enabled && <span><strong style={{ fontWeight: 600 }}>Break:</strong> {batch.breakTime.from} - {batch.breakTime.to}</span>}
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
              
              <div style={{ padding: 16, backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 12 }}>
                <label style={{ ...S.label, display: 'flex', justifyContent: 'space-between' }}>
                  <span>Face Enrollment</span>
                  <span style={{ color: '#2563EB' }}>{faceImages.length}/4 images</span>
                </label>
                
                {faceImages.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: faceImages.length < 4 ? 12 : 0 }}>
                    {faceImages.map((img, i) => (
                      <div key={i} style={{ position: 'relative', paddingTop: '100%', borderRadius: 8, overflow: 'hidden', border: '1px solid #E5E7EB' }}>
                        <img src={img} alt={`Face ${i+1}`} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button type="button" onClick={() => removeFaceImage(i)} style={{ position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.9)', color: '#FFF', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, cursor: 'pointer', padding: 0 }}>×</button>
                      </div>
                    ))}
                  </div>
                )}
                
                {faceImages.length < 4 ? (
                  <button type="button" onClick={startFaceCapture} style={{ width: '100%', padding: 20, border: '2px dashed #D1D5DB', borderRadius: 8, backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'border-color 0.2s' }} onMouseEnter={e => e.currentTarget.style.borderColor = '#93C5FD'} onMouseLeave={e => e.currentTarget.style.borderColor = '#D1D5DB'}>
                    <svg style={{ width: 32, height: 32, color: '#9CA3AF', marginBottom: 8 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                    </svg>
                    <span style={{ fontSize: 13, color: '#4B5563', fontWeight: 500 }}>Click to capture face ({4 - faceImages.length} remaining)</span>
                  </button>
                ) : (
                  <div style={{ textAlign: 'center', fontSize: 13, color: '#16A34A', fontWeight: 600, padding: '8px 0' }}>Maximum of 4 face images captured</div>
                )}
              </div>
            </form>
            
            <div style={{ borderTop: '1px solid #E5E7EB', padding: '16px 24px', backgroundColor: '#F9FAFB', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button type="button" onClick={closeModal} style={S.btnSecondary}>Cancel</button>
              <button type="submit" onClick={handleSubmit} style={S.btnPrimary}>{isEditing ? 'Update Worker' : 'Create Worker'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Face Capture Modal */}
      {showFaceCapture && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div style={{ ...S.card({ width: '100%', maxWidth: 450, overflow: 'hidden' }) }}>
            <div style={{ borderBottom: '1px solid #E5E7EB', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#111827' }}>Capture Face ({faceImages.length}/4)</h3>
              <button onClick={closeFaceCapture} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#6B7280' }}>×</button>
            </div>
            
            <div style={{ padding: 24 }}>
              {captureCompleted ? (
                <div style={{ textAlign: 'center' }}>
                  <h4 style={{ fontSize: 16, fontWeight: 600, color: '#111827', margin: '0 0 16px 0' }}>Confirm Face Images</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 24 }}>
                    {faceImages.map((img, i) => (
                      <div key={i} style={{ position: 'relative', paddingTop: '100%', borderRadius: 8, overflow: 'hidden', border: '1px solid #E5E7EB' }}>
                        <img src={img} alt={`Face ${i}`} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{ position: 'absolute', bottom: 4, left: 4, backgroundColor: 'rgba(0,0,0,0.6)', color: '#FFF', fontSize: 11, padding: '2px 6px', borderRadius: 4 }}>{i+1}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                    <button onClick={closeFaceCapture} style={S.btnSecondary}>Retake All</button>
                    <button onClick={confirmFaceImages} style={S.btnPrimary}>Confirm Images</button>
                  </div>
                </div>
              ) : capturing ? (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ position: 'relative', width: '100%', borderRadius: 12, overflow: 'hidden', backgroundColor: '#000', marginBottom: 16 }}>
                    <video ref={setVideoRef} autoPlay playsInline style={{ width: '100%', display: 'block', minHeight: 250 }} id="face-capture-video" />
                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                    {faceDetected && (
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                        <div style={{ width: `${Math.min(80, Math.max(40, faceQualityScore * 0.6))}%`, height: `${Math.min(80, Math.max(40, faceQualityScore * 0.6))}%`, maxWidth: 250, maxHeight: 250, borderRadius: '50%', border: `3px solid ${faceQualityScore >= 70 ? '#22C55E' : faceQualityScore >= 50 ? '#EAB308' : '#EF4444'}` }} />
                      </div>
                    )}
                  </div>
                  
                  <div style={{ marginBottom: 20 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: faceQualityScore >= 70 ? '#16A34A' : faceQualityScore >= 50 ? '#CA8A04' : '#DC2626', margin: '0 0 8px 0' }}>
                      {faceDetectionStatus || 'Initializing face detection...'}
                    </p>
                    {faceDetected && (
                      <div style={{ width: '100%', height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${faceQualityScore}%`, backgroundColor: faceQualityScore >= 70 ? '#16A34A' : faceQualityScore >= 50 ? '#EAB308' : '#DC2626', transition: 'width 0.2s' }} />
                      </div>
                    )}
                  </div>
                  
                  <button onClick={captureFace} disabled={!capturing || faceQualityScore < 60} style={{ ...S.btnPrimary, width: '100%', padding: '14px', fontSize: 15, opacity: (!capturing || faceQualityScore < 60) ? 0.5 : 1 }}>
                    Capture Face {faceImages.length + 1}/4
                  </button>
                  <p style={{ fontSize: 12, color: '#6B7280', marginTop: 12, marginBottom: 0 }}>Captured: {faceImages.length} of 4 images</p>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #E5E7EB', borderTopColor: '#2563EB', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
                  <p style={{ color: '#4B5563', fontSize: 14, marginBottom: 24 }}>Preparing camera...</p>
                  <button onClick={() => {
                    let videoElement = videoRef.current || document.getElementById('face-capture-video');
                    if(videoElement) {
                      navigator.mediaDevices.getUserMedia({video: {facingMode:'user'}}).then(stream => { videoElement.srcObject = stream; setCapturing(true); }).catch(e => setError('Camera access failed.'));
                    }
                  }} style={S.btnPrimary}>Request Camera Access</button>
                  <div style={{ marginTop: 12 }}>
                    <button onClick={closeFaceCapture} style={{ background: 'none', border: 'none', color: '#6B7280', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Face Review Modal */}
      {showFaceReview && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div style={{ ...S.card({ width: '100%', maxWidth: 400, overflow: 'hidden' }) }}>
            <div style={{ borderBottom: '1px solid #E5E7EB', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F9FAFB' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#111827' }}>Face Enrollment: {reviewWorker?.name}</h3>
              <button onClick={closeFaceReview} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#6B7280' }}>×</button>
            </div>
            
            <div style={{ padding: 24 }}>
              {reviewFaceImages.length > 0 ? (
                <>
                  <p style={{ fontSize: 13, color: '#4B5563', marginBottom: 16, marginTop: 0 }}>Review enrolled face images:</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 20 }}>
                    {reviewFaceImages.map((img, i) => (
                      <div key={i} style={{ position: 'relative', paddingTop: '100%', borderRadius: 8, overflow: 'hidden', border: '1px solid #E5E7EB' }}>
                        <img src={img} alt={`Face ${i}`} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button onClick={() => removeReviewFaceImage(i)} style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%', backgroundColor: '#EF4444', color: '#FFF', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>×</button>
                      </div>
                    ))}
                  </div>
                  {reviewFaceImages.length < 4 && (
                    <button onClick={addReviewFaceImage} style={{ width: '100%', padding: 12, border: '2px dashed #D1D5DB', borderRadius: 8, backgroundColor: '#FFFFFF', color: '#4B5563', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', marginBottom: 24 }}>
                      <span>+ Add More Images ({4 - reviewFaceImages.length} remaining)</span>
                    </button>
                  )}
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <svg style={{ width: 32, height: 32, color: '#9CA3AF' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path></svg>
                  </div>
                  <p style={{ color: '#4B5563', fontSize: 14, marginBottom: 20 }}>No face images enrolled for this worker.</p>
                  <button onClick={addReviewFaceImage} style={S.btnPrimary}>Enroll Face Images</button>
                </div>
              )}
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: reviewFaceImages.length > 0 ? 0 : 24 }}>
                <button onClick={closeFaceReview} style={S.btnSecondary}>Cancel</button>
                {reviewFaceImages.length > 0 && <button onClick={saveFaceReview} style={S.btnPrimary}>Save Changes</button>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main List Table */}
      <div style={S.card({ overflow: 'hidden' })}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F9FAFB', flexWrap: 'wrap', gap: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#111827' }}>Workers List ({workers.length})</h3>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => exportWorkers(api, 'pdf')} style={{ ...S.btnDanger, backgroundColor: '#EF4444' }}>Export PDF</button>
            <button onClick={() => exportWorkers(api, 'excel')} style={{ ...S.btnPrimary, backgroundColor: '#10B981' }}>Export Excel</button>
          </div>
        </div>
        
        {workers.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.5 }}>👥</div>
            <p style={{ color: '#6B7280', fontSize: 15, fontWeight: 500 }}>No workers found. Click "+ Add New Worker" to add one.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={S.th}>Name</th>
                  <th style={S.th}>Email</th>
                  <th style={S.th}>Salary (₹)</th>
                  <th style={S.th}>Department</th>
                  <th style={S.th}>RFID</th>
                  <th style={S.th}>Actions</th>
                </tr>
              </thead>
              <tbody style={{ backgroundColor: '#FFFFFF' }}>
                {workers.map(worker => (
                  <tr key={worker._id} style={{ transition: 'background-color 0.15s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F9FAFB'} onMouseLeave={e => e.currentTarget.style.backgroundColor = '#FFFFFF'}>
                    <td style={{ ...S.td, fontWeight: 600, color: '#111827' }}>{worker.name}</td>
                    <td style={S.td}>{worker.email}</td>
                    <td style={{ ...S.td, fontWeight: 500 }}>{worker.salary && !isNaN(worker.salary) ? `₹${worker.salary}` : '—'}</td>
                    <td style={S.td}>
                      {worker.department ? <span style={{ padding: '4px 10px', borderRadius: 20, backgroundColor: '#F3F4F6', fontSize: 12, fontWeight: 500 }}>{worker.department.name}</span> : '—'}
                    </td>
                    <td style={{ ...S.td, fontFamily: 'monospace', fontSize: 12, color: worker.rfid ? '#4B5563' : '#9CA3AF' }}>{worker.rfid || 'Not assigned'}</td>
                    <td style={S.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <button onClick={() => openFaceReview(worker)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }} title="Face Enrollment">
                          <div style={{ position: 'relative' }}>
                            <svg style={{ width: 20, height: 20, color: '#6B7280' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path></svg>
                            {(worker.faceData && worker.faceData.length > 0) ? (
                              <div style={{ position: 'absolute', bottom: -2, right: -4, backgroundColor: '#FFF', borderRadius: '50%', padding: 1 }}>
                                <svg style={{ width: 12, height: 12, color: '#10B981' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                              </div>
                            ) : (
                              <div style={{ position: 'absolute', bottom: -2, right: -4, backgroundColor: '#FFF', borderRadius: '50%', padding: 1 }}>
                                <svg style={{ width: 12, height: 12, color: '#EF4444' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
                              </div>
                            )}
                          </div>
                        </button>
                        <button onClick={() => handleEdit(worker)} style={{ background: 'none', border: 'none', color: '#2563EB', fontWeight: 600, fontSize: 13, cursor: 'pointer', padding: 0 }}>Edit</button>
                        <button onClick={() => handleDelete(worker._id)} style={{ background: 'none', border: 'none', color: '#EF4444', fontWeight: 600, fontSize: 13, cursor: 'pointer', padding: 0 }}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Workers;