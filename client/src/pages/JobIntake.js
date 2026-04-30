import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import api from '../services/api';
import WhatsAppService from '../services/whatsappService';
import logoImage from '../assets/logo.png';

const JobIntake = () => {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const navigate = useNavigate();

  // Check authentication
  useEffect(() => {
    const storedAdmin = localStorage.getItem('admin');
    if (!storedAdmin) {
      navigate('/admin/login');
    }
  }, [navigate]);

  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    customerAddress: '',
    aadharNumber: '',
    device_brand: '',
    device_model: '',
    imei_number: '',
    serial_number: '',
    device_condition: '',
    reported_issue: '',
    repair_type: 'hardware',
    urgency_level: 'normal',
    estimated_delivery_date: '',
    service_charges: '',
    parts_cost: '',
    advance_payment: '',
    payment_method: 'cash',
    total_amount: '',
    taken_by_worker_id: '',
    job_card_number: ''
  });

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [workersRes, nextBillRes] = await Promise.all([
          api.get('/workers'),
          api.get('/jobs/next-bill-number')
        ]);

        setWorkers(workersRes.data);

        setFormData(prevData => ({
          ...prevData,
          job_card_number: nextBillRes.data.nextBillNumber
        }));

        setLoading(false);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch data');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Customer photo capture state
  const [photo, setPhoto] = useState(null);
  // Device video capture state
  const [deviceVideo, setDeviceVideo] = useState(null);
  const [cameraFacingMode, setCameraFacingMode] = useState('user');
  const [showCamera, setShowCamera] = useState(false);
  const [cameraMode, setCameraMode] = useState('photo');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const recordingTimerRef = useRef(null);

  // UPDATED: Generate optimized detailed PDF for WhatsApp (with compression)
  const generatePDFForWhatsApp = async (jobCardNumber) => {
    console.log('Generating OPTIMIZED detailed PDF for WhatsApp...');

    try {
      const dateObj = new Date();
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const formattedDate = `${dateObj.getDate()}/${monthNames[dateObj.getMonth()]}/${dateObj.getFullYear()}`;

      const pdfContent = document.createElement('div');
      pdfContent.style.width = '210mm';
      pdfContent.style.minHeight = '297mm';
      pdfContent.style.padding = '8mm'; // Reduced padding
      pdfContent.style.backgroundColor = '#ffffff';
      pdfContent.style.boxSizing = 'border-box';
      pdfContent.style.position = 'absolute';
      pdfContent.style.left = '-9999px';
      pdfContent.style.top = '0';
      pdfContent.style.fontFamily = "'Nirmala UI', 'Arial', sans-serif"; // Simplified font stack

      // OPTIMIZED HTML - removed unnecessary styling, compressed content
      pdfContent.innerHTML = `
      <div style="border: 1px solid #000; padding: 5px; height: 100%;">
        <!-- OPTIMIZED HEADER - Reduced font sizes -->
        <div style="text-align: center; margin-bottom: 3px; position: relative;">
          ${logoImage ? `<div style="position: absolute; top: 0; left: 5px;">
             <img src="${logoImage}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover;" onerror="this.style.display='none'" />
          </div>` : ''}
          
          ${photo ? `<div style="position: absolute; top: 0; right: 5px;">
             <img src="${photo}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover;" onerror="this.style.display='none'" />
          </div>` : ''}
          
          <h1 style="font-size: 16px; font-weight: bold; margin: 0; padding-top: 5px;">ஸ்ரீ ரமணர் மொபைல் & லேப்டாப் சர்வீஸ் சென்டர்</h1>
          
          <p style="font-size: 10px; margin: 2px 0;">
            1E, கட்டபொம்மன் தெரு, வல்லப விநாயகர் அருகில்,<br/>
            திருவண்ணாமலை - 606601.
          </p>
          <p style="font-size: 11px; font-weight: bold; margin: 2px 0;">
            Mobile : 94430 19097, 94438 11231.
          </p>
          <p style="font-size: 9px; margin: 3px 0;">
            அனைத்து விதமான செல்போன் மற்றும் லேப்டாப் சாதனங்களும் சிறந்த<br/>
            முறையில் பழுது நீக்கி தரப்படும்
          </p>
        </div>

        <!-- OPTIMIZED WORK HOURS SECTION -->
        <div style="display: flex; justify-content: space-between; font-size: 10px; font-weight: bold; margin-bottom: 5px;">
          <div style="width: 40%;">
            <div>வேலை நேரம்</div>
            <div>9.00 a.m. to 9.30 p.m.</div>
            <div style="margin-top: 3px;">செவ்வாய் விடுமுறை</div>
          </div>
          <div style="width: 40%; text-align: right;">
            <div>உணவு இடைவேளை</div>
            <div>1.00 p.m. to 2.30 p.m.</div>
            <div style="margin-top: 3px;">
              <span style="margin-right: 10px;">Bill No.: ${jobCardNumber}</span>
              <span>Date: ${formattedDate}</span>
            </div>
          </div>
        </div>

        <hr style="border-top: 1px solid #000; margin: 2px 0;" />

        <!-- OPTIMIZED CUSTOMER DETAILS -->
        <div style="display: flex; justify-content: space-between; padding: 5px 0; font-size: 11px;">
          <div style="width: 60%;">
            <table style="width: 100%; border: none;">
              <tr>
                <td style="width: 50px; font-weight: bold;">பெயர்</td>
                <td style="font-weight: bold;">: ${formData.customerName.toUpperCase()}</td>
              </tr>
              <tr>
                <td style="vertical-align: top; font-weight: bold;">முகவரி</td>
                <td style="font-weight: bold;">: ${formData.customerAddress || 'T.V.MALAI'}</td>
              </tr>
              ${formData.aadharNumber ? `<tr>
                <td style="font-weight: bold;">ஆதார்</td>
                <td style="font-weight: bold;">: ${formData.aadharNumber}</td>
              </tr>` : ''}
            </table>
          </div>
          <div style="width: 35%;">
             <table style="width: 100%; border: none;">
              <tr>
                <td style="width: 50px; font-weight: bold;">செல்</td>
                <td style="font-weight: bold;">: ${formData.customerPhone}</td>
              </tr>
              ${formData.customerEmail ? `<tr>
                <td style="font-weight: bold;">இ.மெயில்</td>
                <td>: ${formData.customerEmail}</td>
              </tr>` : ''}
            </table>
          </div>
        </div>

        <!-- OPTIMIZED DEVICE TABLE -->
        <div style="margin-bottom: 0;">
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 11px;">
            <thead>
              <tr style="height: 30px;">
                <th style="border: 1px solid #000; text-align: left; padding: 3px; width: 40%;">Brand & Model</th>
                <th style="border: 1px solid #000; text-align: left; padding: 3px; width: 40%;">Fault</th>
                <th style="border: 1px solid #000; text-align: right; padding: 3px; width: 20%;">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr style="height: 40px; vertical-align: top;">
                <td style="border: 1px solid #000; padding: 5px; font-weight: bold;">
                  ${formData.device_brand ? formData.device_brand + ' ' : ''}${formData.device_model}
                </td>
                <td style="border: 1px solid #000; padding: 5px; font-weight: bold;">
                  ${formData.reported_issue.toUpperCase()}
                </td>
                <td style="border: 1px solid #000; padding: 5px; text-align: right; font-weight: bold;">
                  ₹${(formData.total_amount === '' ? 0 : parseFloat(formData.total_amount)).toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- OPTIMIZED ACCESSORIES -->
        <div style="border-bottom: 1px solid #000; padding: 5px 3px; font-size: 11px; font-weight: bold;">
          <span style="margin-right: 20px;">Battery : No</span>
          <span style="margin-right: 20px;">MMC : No</span>
          <span>Sim : No</span>
          <div style="margin-top: 3px;">
            பழுது நீக்க பொருள் : <span style="font-weight:normal">${formData.customerName}</span>
          </div>
        </div>

        <!-- CONDENSED TERMS & CONDITIONS (Reduced by 50%) -->
        <div style="padding: 5px 0; font-size: 9px; line-height: 1.3;">
          <div style="font-weight: bold; margin-bottom: 3px;">
            கீழ்கண்ட விதிமுறைகளுக்கு உட்பட்டு பொருட்கள் பழுது பார்த்தலுக்கு எடுத்துக்கொள்ளப்படும்:
          </div>
          
          <div style="display: flex; margin-bottom: 3px;">
            <span style="width: 12px; flex-shrink: 0; font-weight: bold;">1.</span>
            <span>Job Cardல் குறிக்கப்படாத உதிரி பாகங்களுக்கு கடை உரிமையாளர் பொறுப்பல்ல</span>
          </div>

          <div style="display: flex; margin-bottom: 3px;">
            <span style="width: 12px; flex-shrink: 0; font-weight: bold;">2.</span>
            <span>பழுதான உதிரி பாகங்கள் திருப்பி கொடுக்கப்படமாட்டாது</span>
          </div>

          <div style="display: flex; margin-bottom: 3px;">
            <span style="width: 12px; flex-shrink: 0; font-weight: bold;">3.</span>
            <span>பழுதின் கடினத்தைப் பொறுத்து திரும்பக்கொடுக்கும் தேதி மாறுபடும்</span>
          </div>

          <div style="display: flex; margin-bottom: 3px;">
            <span style="width: 12px; flex-shrink: 0; font-weight: bold;">4.</span>
            <span>பழுது பார்க்கும் போது ஏற்கனவே பழுதான பாகங்கள் மேலும் பழுது அடைந்தால் கடை உரிமையாளர்கள் பொறுப்பல்ல</span>
          </div>

          <div style="display: flex; margin-bottom: 3px;">
            <span style="width: 12px; flex-shrink: 0; font-weight: bold;">5.</span>
            <span>அறிவிப்பு தேதியில் இருந்து 2 வாரங்களுக்குள் பொருளை பெற்றுக் கொள்ளாவிட்டால் கடை உரிமையாளர் பொறுப்பல்ல</span>
          </div>

          <div style="display: flex; margin-bottom: 3px;">
            <span style="width: 12px; flex-shrink: 0; font-weight: bold;">6.</span>
            <span>தண்ணீரில் விழுந்த செல்போன்களுக்கும் குறைந்தபட்ச கட்டணம் ரூ 150</span>
          </div>
        </div>

        <!-- OPTIMIZED PAYMENT SUMMARY -->
        <div style="border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 5px 3px; font-size: 11px; font-weight: bold; display: flex; justify-content: space-between;">
          <div>Total: ₹${(formData.total_amount === '' ? 0 : parseFloat(formData.total_amount)).toFixed(2)}</div>
          <div>Advance: ₹${(formData.advance_payment === '' ? 0 : parseFloat(formData.advance_payment)).toFixed(2)}</div>
          <div>Balance: ₹${((formData.total_amount === '' ? 0 : parseFloat(formData.total_amount)) - (formData.advance_payment === '' ? 0 : parseFloat(formData.advance_payment))).toFixed(2)}</div>
        </div>

        <!-- OPTIMIZED SIGNATURE SECTION -->
        <div style="padding: 10px 3px; font-size: 11px; margin-top: 5px;">
           <div style="font-weight: bold; margin-bottom: 20px;">
             நான் எனது பொருளை Job Card ல் கூறப்பட்டுள்ளது போல் நல்ல முறையில் பெற்றுக்கொண்டேன்
           </div>
           
           <div style="display: flex; justify-content: flex-end;">
             <div style="text-align: center;">
               <div style="margin-bottom: 3px;">கையொப்பம்</div>
               <div style="font-size: 9px;">பொருளின் உரிமையாளர் அல்லது முகவர்</div>
             </div>
           </div>
        </div>

        <div style="text-align: center; font-size: 9px; font-weight: bold; margin-top: 5px;">
          *Computer Generated Receipt*
        </div>
      </div>
    `;

      document.body.appendChild(pdfContent);

      // Wait for content to render
      await new Promise(resolve => setTimeout(resolve, 100));

      console.log('Rendering OPTIMIZED PDF canvas...');

      // CRITICAL OPTIMIZATION: Use lower scale and JPEG compression
      const canvas = await html2canvas(pdfContent, {
        scale: 1.2, // Reduced from 1.8 to 1.2 (33% reduction)
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        imageTimeout: 3000,
        removeContainer: false,
        // Optimize rendering
        allowTaint: true,
        useCORS: true,
        // Reduce quality for size
        quality: 0.7 // Lower quality for smaller file
      });

      console.log('Optimized canvas created:', canvas.width, 'x', canvas.height);

      // Use JPEG with lower quality for SIGNIFICANT size reduction
      const imgData = canvas.toDataURL('image/jpeg', 0.6); // 0.6 quality (40% reduction)

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Compress the image in PDF
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, '', 'FAST'); // FAST compression

      const pdfBlob = pdf.output('blob');

      document.body.removeChild(pdfContent);

      console.log('OPTIMIZED PDF generated for WhatsApp:', (pdfBlob.size / 1024).toFixed(2), 'KB');

      // Check if PDF is under 5MB
      if (pdfBlob.size > 5 * 1024 * 1024) {
        console.warn('⚠️ PDF still too large. Trying ultra-compression...');

        // If still too large, generate an even more compressed version
        return await generateUltraCompressedPDF(jobCardNumber, formattedDate);
      }

      return pdfBlob;
    } catch (err) {
      console.error('Error generating optimized PDF for WhatsApp:', err);

      // Fallback: Try to generate a simple text-based PDF
      return await generateSimpleTextPDF(jobCardNumber);
    }
  };

  // EXTREME COMPRESSION VERSION for when regular optimization isn't enough
  const generateUltraCompressedPDF = async (jobCardNumber, formattedDate) => {
    console.log('Generating ULTRA-COMPRESSED PDF...');

    try {
      const pdfContent = document.createElement('div');
      pdfContent.style.width = '210mm';
      pdfContent.style.minHeight = '297mm';
      pdfContent.style.padding = '5mm';
      pdfContent.style.backgroundColor = '#ffffff';
      pdfContent.style.boxSizing = 'border-box';
      pdfContent.style.position = 'absolute';
      pdfContent.style.left = '-9999px';
      pdfContent.style.top = '0';
      pdfContent.style.fontFamily = "Arial, sans-serif"; // Simple fonts only

      // ULTRA-MINIMAL CONTENT - Only essential information
      pdfContent.innerHTML = `
      <div style="border: 1px solid #000; padding: 3px; height: 100%;">
        <!-- MINIMAL HEADER -->
        <div style="text-align: center; margin-bottom: 2px;">
          <h1 style="font-size: 14px; font-weight: bold; margin: 0;">Sri Ramanar Mobile Service</h1>
          <p style="font-size: 9px; margin: 1px 0;">Tiruvannamalai - 606601</p>
          <p style="font-size: 10px; font-weight: bold; margin: 1px 0;">94430 19097, 94438 11231</p>
        </div>

        <!-- ESSENTIAL INFO ONLY -->
        <div style="font-size: 9px; margin-bottom: 3px;">
          <div><strong>Bill No:</strong> ${jobCardNumber} | <strong>Date:</strong> ${formattedDate}</div>
          <div><strong>Hours:</strong> 9AM-9:30PM | <strong>Holiday:</strong> Tuesday</div>
        </div>

        <hr style="border-top: 1px solid #000; margin: 1px 0;" />

        <!-- CUSTOMER INFO - Minimal -->
        <div style="font-size: 10px; margin-bottom: 3px;">
          <div><strong>Customer:</strong> ${formData.customerName.toUpperCase()}</div>
          <div><strong>Phone:</strong> ${formData.customerPhone}</div>
          ${formData.customerAddress ? `<div><strong>Address:</strong> ${formData.customerAddress}</div>` : ''}
        </div>

        <!-- DEVICE INFO - Minimal -->
        <div style="font-size: 10px; margin-bottom: 3px;">
          <div><strong>Device:</strong> ${formData.device_brand ? formData.device_brand + ' ' : ''}${formData.device_model}</div>
          <div><strong>Issue:</strong> ${formData.reported_issue.toUpperCase()}</div>
        </div>

        <!-- PAYMENT - Minimal -->
        <div style="font-size: 11px; font-weight: bold; border: 1px solid #000; padding: 3px; margin-bottom: 3px;">
          <div style="display: flex; justify-content: space-between;">
            <span>Total:</span>
            <span>₹${(formData.total_amount === '' ? 0 : parseFloat(formData.total_amount)).toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Advance:</span>
            <span>₹${(formData.advance_payment === '' ? 0 : parseFloat(formData.advance_payment)).toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; border-top: 1px solid #000; padding-top: 2px;">
            <span>Balance:</span>
            <span>₹${((formData.total_amount === '' ? 0 : parseFloat(formData.total_amount)) - (formData.advance_payment === '' ? 0 : parseFloat(formData.advance_payment))).toFixed(2)}</span>
          </div>
        </div>

        <!-- SHORT TERMS -->
        <div style="font-size: 7px; margin-bottom: 3px; line-height: 1.2;">
          <div><strong>Terms:</strong> 1. Not responsible for non-listed parts. 2. Faulty parts not returned. 3. Delivery date may vary. 4. Minimum 2 days for cost estimate.</div>
        </div>

        <!-- SIGNATURE -->
        <div style="font-size: 9px; text-align: center; margin-top: 10px;">
          <div style="margin-bottom: 15px;">I have received my device as described above</div>
          <div>_________________________</div>
          <div>Customer/Agent Signature</div>
        </div>

        <div style="text-align: center; font-size: 7px; margin-top: 5px;">
          *Computer Generated Receipt*
        </div>
      </div>
    `;

      document.body.appendChild(pdfContent);

      await new Promise(resolve => setTimeout(resolve, 50));

      console.log('Rendering ultra-compressed canvas...');

      const canvas = await html2canvas(pdfContent, {
        scale: 1.0, // Minimum scale
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        quality: 0.5, // Very low quality
        imageTimeout: 2000
      });

      // Use JPEG with very low quality
      const imgData = canvas.toDataURL('image/jpeg', 0.4);

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, '', 'FAST');

      const pdfBlob = pdf.output('blob');

      document.body.removeChild(pdfContent);

      console.log('ULTRA-COMPRESSED PDF generated:', (pdfBlob.size / 1024).toFixed(2), 'KB');

      return pdfBlob;
    } catch (err) {
      console.error('Error generating ultra-compressed PDF:', err);
      return null;
    }
  };

  // SIMPLE TEXT-ONLY FALLBACK
  const generateSimpleTextPDF = async (jobCardNumber) => {
    console.log('Generating SIMPLE TEXT PDF as fallback...');

    try {
      const dateObj = new Date();
      const formattedDate = `${dateObj.getDate()}/${dateObj.getMonth() + 1}/${dateObj.getFullYear()}`;

      const pdf = new jsPDF();

      // Add text directly to PDF (no images = very small file)
      pdf.setFontSize(16);
      pdf.text('Sri Ramanar Mobile Service', 105, 20, { align: 'center' });

      pdf.setFontSize(10);
      pdf.text('Tiruvannamalai - 606601 | 94430 19097', 105, 30, { align: 'center' });

      pdf.setFontSize(12);
      pdf.text(`Bill No: ${jobCardNumber}`, 20, 45);
      pdf.text(`Date: ${formattedDate}`, 150, 45);

      pdf.line(20, 50, 190, 50);

      pdf.setFontSize(11);
      pdf.text(`Customer: ${formData.customerName.toUpperCase()}`, 20, 60);
      pdf.text(`Phone: ${formData.customerPhone}`, 20, 70);

      pdf.text(`Device: ${formData.device_brand ? formData.device_brand + ' ' : ''}${formData.device_model}`, 20, 85);
      pdf.text(`Issue: ${formData.reported_issue}`, 20, 95);

      pdf.setFontSize(12);
      pdf.text(`Total Amount: ₹${(formData.total_amount === '' ? 0 : parseFloat(formData.total_amount)).toFixed(2)}`, 20, 115);
      pdf.text(`Advance: ₹${(formData.advance_payment === '' ? 0 : parseFloat(formData.advance_payment)).toFixed(2)}`, 20, 125);
      pdf.text(`Balance: ₹${((formData.total_amount === '' ? 0 : parseFloat(formData.total_amount)) - (formData.advance_payment === '' ? 0 : parseFloat(formData.advance_payment))).toFixed(2)}`, 20, 135);

      pdf.setFontSize(10);
      pdf.text('Thank you for choosing our service!', 105, 180, { align: 'center' });
      pdf.text('*Computer Generated Receipt*', 105, 190, { align: 'center' });

      const pdfBlob = pdf.output('blob');
      console.log('Simple text PDF generated:', (pdfBlob.size / 1024).toFixed(2), 'KB');

      return pdfBlob;
    } catch (err) {
      console.error('Error generating simple text PDF:', err);
      return null;
    }
  };

  // Function to generate and download PDF (full quality for local)
  const generateAndDownloadPDF = async (jobData) => {
    console.log('Generating local PDF for download...');

    try {
      const dateObj = new Date();
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const formattedDate = `${dateObj.getDate()}/${monthNames[dateObj.getMonth()]}/${dateObj.getFullYear()}`;

      const pdfContent = document.createElement('div');
      pdfContent.style.width = '210mm';
      pdfContent.style.minHeight = '297mm';
      pdfContent.style.padding = '10mm';
      pdfContent.style.backgroundColor = '#ffffff';
      pdfContent.style.boxSizing = 'border-box';
      pdfContent.style.position = 'absolute';
      pdfContent.style.left = '-9999px';
      pdfContent.style.fontFamily = "'Nirmala UI', 'Arial Unicode MS', 'Arial', sans-serif";

      // Use the SAME detailed content for consistency
      pdfContent.innerHTML = `
      <div style="border: 1px solid #000; padding: 10px; height: 100%; position: relative;">
        <div style="text-align: center; margin-bottom: 5px; position: relative;">
          <div style="position: absolute; top: 0; left: 10px;">
             <img src="${logoImage}" style="width: 70px; height: 70px; border-radius: 50%; object-fit: cover;" onerror="this.style.display='none'" />
          </div>
          
          ${photo ? `<div style="position: absolute; top: 0; right: 10px;">
             <img src="${photo}" style="width: 70px; height: 70px; border-radius: 50%; object-fit: cover;" />
          </div>` : ''}
          
          <h1 style="font-size: 20px; font-weight: bold; margin: 0; padding-top: 5px;">ஸ்ரீ ரமணர் மொபைல் & லேப்டாப் சர்வீஸ் சென்டர்</h1>
          
          <p style="font-size: 12px; margin: 4px 0;">
            1E, கட்டபொம்மன் தெரு, வல்லப விநாயகர் அருகில்,<br/>
            திருவண்ணாமலை - 606601.
          </p>
          <p style="font-size: 13px; font-weight: bold; margin: 4px 0;">
            Mobile : 94430 19097, 94438 11231.
          </p>
          <p style="font-size: 11px; margin: 5px 0;">
            அனைத்து விதமான செல்போன் மற்றும் லேப்டாப் சாதனங்களும் சிறந்த<br/>
            முறையில் பழுது நீக்கி தரப்படும்
          </p>
        </div>

        <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: bold; margin-bottom: 10px;">
          <div style="width: 40%;">
            <div>வேலை நேரம்</div>
            <div>9.00 a.m. to 9.30 p.m.</div>
            <div style="margin-top: 5px;">செவ்வாய் விடுமுறை</div>
          </div>
          <div style="width: 40%; text-align: right;">
            <div>உணவு இடைவேளை</div>
            <div>1.00 p.m. to 2.30 p.m.</div>
            <div style="margin-top: 5px;">
              <span style="margin-right: 15px;">Bill No.: ${jobData.job_card_number || jobData._id.slice(-4)}</span>
              <span>Date: ${formattedDate}</span>
            </div>
          </div>
        </div>

        <hr style="border-top: 1px solid #000; margin: 0;" />

        <div style="display: flex; justify-content: space-between; padding: 10px 0; font-size: 13px;">
          <div style="width: 60%;">
            <table style="width: 100%; border: none;">
              <tr>
                <td style="width: 60px; font-weight: bold;">பெயர்</td>
                <td style="font-weight: bold;">: ${formData.customerName.toUpperCase()}</td>
              </tr>
              <tr>
                <td style="vertical-align: top; font-weight: bold;">முகவரி</td>
                <td style="font-weight: bold;">: ${formData.customerAddress || 'T.V.MALAI'}</td>
              </tr>
              ${formData.aadharNumber ? `<tr>
                <td style="font-weight: bold;">ஆதார்</td>
                <td style="font-weight: bold;">: ${formData.aadharNumber}</td>
              </tr>` : ''}
            </table>
          </div>
          <div style="width: 35%;">
             <table style="width: 100%; border: none;">
              <tr>
                <td style="width: 60px; font-weight: bold;">செல்</td>
                <td style="font-weight: bold;">: ${formData.customerPhone}</td>
              </tr>
              <tr>
                <td style="font-weight: bold;">இ.மெயில்</td>
                <td>: ${formData.customerEmail || ''}</td>
              </tr>
            </table>
          </div>
        </div>

        <div style="margin-bottom: 0;">
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 13px;">
            <thead>
              <tr style="height: 40px;">
                <th style="border: 1px solid #000; text-align: left; padding: 5px; width: 40%;">Brand & Model</th>
                <th style="border: 1px solid #000; text-align: left; padding: 5px; width: 40%;">Fault</th>
                <th style="border: 1px solid #000; text-align: right; padding: 5px; width: 20%;">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr style="height: 50px; vertical-align: top;">
                <td style="border: 1px solid #000; padding: 10px; font-weight: bold;">
                  ${formData.device_brand ? formData.device_brand + ' ' : ''}${formData.device_model}
                </td>
                <td style="border: 1px solid #000; padding: 10px; font-weight: bold;">
                  ${formData.reported_issue.toUpperCase()}
                </td>
                <td style="border: 1px solid #000; padding: 10px; text-align: right; font-weight: bold;">
                  ${(formData.total_amount === '' ? 0 : parseFloat(formData.total_amount)).toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style="border-bottom: 1px solid #000; padding: 10px 5px; font-size: 13px; font-weight: bold;">
          <span style="margin-right: 30px;">Battery : No</span>
          <span style="margin-right: 30px;">MMC : No</span>
          <span>Sim : No</span>
          <div style="margin-top: 5px;">
            பழுது நீக்கவேண்டிய பொருள் யாரால் கொண்டுவரப்பட்டது : <span style="font-weight:normal">${formData.customerName}</span>
          </div>
        </div>

        <div style="padding: 10px 0; font-size: 11px; line-height: 1.4;">
          <div style="font-weight: bold; margin-bottom: 5px;">
            கீழ்கண்ட கட்டுப்பாடுகள் மற்றும் விதிமுறைகளுக்கு உட்பட்டு தங்களுடைய பொருட்கள் பழுது பார்த்தலுக்கு எடுத்துக்கொள்ளப்படும்:
          </div>
          
          <div style="display: flex; margin-bottom: 5px;">
            <span style="width: 15px; flex-shrink: 0; font-weight: bold;">1.</span>
            <span>Job Cardல் குறிக்கப்படாத உதிரி பாகங்களுக்கு கடை உரிமையாளர் பொறுப்பல்ல</span>
          </div>

          <div style="display: flex; margin-bottom: 5px;">
            <span style="width: 15px; flex-shrink: 0; font-weight: bold;">2.</span>
            <span>பழுதான உதிரி பாகங்கள் (பேட்டரி உட்பட) திருப்பி கொடுக்கப்படமாட்டாது</span>
          </div>

          <div style="display: flex; margin-bottom: 5px;">
            <span style="width: 15px; flex-shrink: 0; font-weight: bold;">3.</span>
            <span>பழுதின் கடினத்தைப் பொறுத்தும் உதிரிபாகங்கள் கிடைப்பதைப் பொறுத்தும் திரும்பக்கொடுக்கும் தேதி மாறுபடும்.</span>
          </div>

          <div style="display: flex; margin-bottom: 5px;">
            <span style="width: 15px; flex-shrink: 0; font-weight: bold;">4.</span>
            <span>பழுதின் செலவினங்களை கணக்கிட்டு சொல்வதற்கு குறைந்தது இரண்டு நாட்கள் தரப்படவேண்டும்.</span>
          </div>

          <div style="display: flex; margin-bottom: 5px;">
            <span style="width: 15px; flex-shrink: 0; font-weight: bold;">5.</span>
            <span>பழுது பார்க்கும் போது ஏற்கனவே பழுதான பாகங்கள் மேலும் பழுது அடைந்தால் கடை உரிமையாளர்கள் பொறுப்பல்ல</span>
          </div>

          <div style="display: flex; margin-bottom: 5px;">
            <span style="width: 15px; flex-shrink: 0; font-weight: bold;">6.</span>
            <span>பழுதுபார்த்தலுக்கு தரப்பட்ட பொருட்கள் தொடர்பான தஸ்தாவேஜிகளில் ஏதாவது தவறு இருந்தால் அதற்கு கடை உரிமையாளர் பொறுப்பல்ல.</span>
          </div>

          <div style="display: flex; margin-bottom: 5px;">
            <span style="width: 15px; flex-shrink: 0; font-weight: bold;">7.</span>
            <span>அறிவிப்பு தேதியில் இருந்து குறைந்தது இரண்டு வாரங்களுக்குள் வாடிக்கையாளர் தமது பொருளை பெற்றுக் கொள்ளாவிட்டால் எந்தவிதமான உரிமை கொண்டாடுவதற்கும் கடை உரிமையாளர் பொறுப்பல்ல.</span>
          </div>

          <div style="display: flex; margin-bottom: 5px;">
            <span style="width: 15px; flex-shrink: 0; font-weight: bold;">8.</span>
            <span>தண்ணீரில் விழுந்த அனைத்துவிதமான செல்போன்களுக்கும் குறைந்தபட்ச பழுது கட்டணமாக ரூ 150 கண்டிப்பாக வசூலிக்கப்படும்.</span>
          </div>
        </div>

        <div style="border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 10px 5px; font-size: 13px; font-weight: bold; display: flex; justify-content: space-between;">
          <div>Total Amount: ${(formData.total_amount === '' ? 0 : parseFloat(formData.total_amount)).toFixed(2)}</div>
          <div>Advance: ${(formData.advance_payment === '' ? 0 : parseFloat(formData.advance_payment)).toFixed(2)}</div>
          <div>Net Amount: ${((formData.total_amount === '' ? 0 : parseFloat(formData.total_amount)) - (formData.advance_payment === '' ? 0 : parseFloat(formData.advance_payment))).toFixed(2)}</div>
        </div>

        <div style="padding: 20px 5px; font-size: 13px; margin-top: 10px;">
           <div style="font-weight: bold; margin-bottom: 30px;">
             நான் எனது பொருளை Job Card ல் கூறப்பட்டுள்ளது போல் நல்ல முறையில் பெற்றுக்கொண்டேன்
           </div>
           
           <div style="display: flex; justify-content: flex-end;">
             <div style="text-align: center;">
               <div style="margin-bottom: 5px;">கையொப்பம்</div>
               <div>பொருளின் உரிமையாளர் அல்லது முகவர்</div>
             </div>
           </div>
        </div>

        <div style="text-align: center; font-size: 11px; font-weight: bold; margin-top: 10px;">
          *Computer Generated Receipt*
        </div>
      </div>
    `;

      document.body.appendChild(pdfContent);

      const canvas = await html2canvas(pdfContent, {
        scale: 2, // Higher scale for better download quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

      const filename = `Bill_${jobData.job_card_number || jobData._id}_${formData.customerName}.pdf`;
      pdf.save(filename);

      document.body.removeChild(pdfContent);

      console.log('Local PDF downloaded:', filename);
    } catch (err) {
      console.error('Error generating local PDF:', err);
      throw err;
    }
  };

  // Helper function to convert video blob URL to actual blob
  const getVideoBlob = async (videoBlobUrl) => {
    if (!videoBlobUrl) return null;

    try {
      const response = await fetch(videoBlobUrl);
      const blob = await response.blob();
      console.log('Video blob retrieved:', (blob.size / 1024 / 1024).toFixed(2), 'MB');
      return blob;
    } catch (error) {
      console.error('Error fetching video blob:', error);
      return null;
    }
  };

  // Function to reset form after successful submission
  const resetForm = async () => {
    setFormData({
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      customerAddress: '',
      aadharNumber: '',
      device_brand: '',
      device_model: '',
      imei_number: '',
      serial_number: '',
      device_condition: '',
      reported_issue: '',
      repair_type: 'hardware',
      urgency_level: 'normal',
      estimated_delivery_date: '',
      service_charges: '',
      parts_cost: '',
      advance_payment: '',
      payment_method: 'cash',
      total_amount: '',
      taken_by_worker_id: '',
      job_card_number: ''
    });

    setPhoto(null);
    setDeviceVideo(null);

    try {
      const nextBillRes = await api.get('/jobs/next-bill-number');
      setFormData(prevData => ({
        ...prevData,
        job_card_number: nextBillRes.data.nextBillNumber
      }));
    } catch (err) {
      console.error('Error fetching next bill number:', err);
    }
  };

  // FIXED: handleSubmit with proper PDF sending
  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsProcessing(true);
    setError('');
    setSuccess('');
    setProcessingStatus('Creating job...');

    const startTime = Date.now();

    try {
      // Prepare data for submission
      const intakeAmount = formData.total_amount === '' ? 0 : parseFloat(formData.total_amount);
      const submitData = {
        ...formData,
        service_charges: intakeAmount, // Set service_charges to the total_amount entered at intake
        parts_cost: formData.parts_cost === '' ? 0 : parseFloat(formData.parts_cost),
        advance_payment: formData.advance_payment === '' ? 0 : parseFloat(formData.advance_payment),
        total_amount: intakeAmount,
        customer_photo: photo,
        device_video: deviceVideo
      };

      console.log('='.repeat(50));
      console.log('STEP 1: Creating job...');

      // 1. Create job
      const response = await api.post('/jobs', submitData);
      const jobId = response.data.job._id;
      const jobCardNumber = formData.job_card_number;

      console.log('Job created:', jobId, `(${Date.now() - startTime}ms)`);
      setProcessingStatus('Job created. Generating PDF...');

      // 2. Generate PDF for WhatsApp FIRST (before download)
      console.log('STEP 2: Generating PDF for WhatsApp...');
      let pdfBlob = null;

      try {
        pdfBlob = await generatePDFForWhatsApp(jobCardNumber);
        if (pdfBlob) {
          console.log('PDF for WhatsApp generated:', (pdfBlob.size / 1024).toFixed(2), 'KB', `(${Date.now() - startTime}ms)`);
        } else {
          console.warn('PDF generation returned null');
        }
      } catch (pdfError) {
        console.error('PDF generation error:', pdfError);
      }

      // 3. Download local PDF (parallel with WhatsApp)
      console.log('STEP 3: Starting parallel operations...');
      setProcessingStatus('Downloading PDF & sending WhatsApp...');

      // Start PDF download (don't wait)
      const downloadPromise = generateAndDownloadPDF({
        job_card_number: jobCardNumber,
        _id: jobId
      }).then(() => {
        console.log('Local PDF downloaded', `(${Date.now() - startTime}ms)`);
      }).catch(err => {
        console.error('PDF download error:', err);
      });

      // In handleSubmit function, around line 670-690:

      // 4. Get video blob if exists
      let videoBlobData = null;
      if (deviceVideo) {
        console.log('Getting video blob...');
        videoBlobData = await getVideoBlob(deviceVideo);
        console.log('Video blob size:', videoBlobData ? `${(videoBlobData.size / 1024 / 1024).toFixed(2)}MB` : 'null');
      }

      // In handleSubmit function:
      console.log('STEP 4: Sending WhatsApp template with PDF...');
      console.log('PDF status:', pdfBlob ? `${(pdfBlob.size / 1024).toFixed(2)}KB` : 'None');

      let whatsappResult = { success: false, message: 'Not attempted' };

      try {
        // ALWAYS try to send with PDF first
        if (pdfBlob) {
          console.log('Calling sendJobIntakeWithMedia for template document...');
          whatsappResult = await WhatsAppService.sendJobIntakeWithMedia(
            jobId,
            pdfBlob // Send only PDF
          );
        } else {
          console.log('No PDF available, falling back to simple notification...');
          whatsappResult = await WhatsAppService.sendJobIntakeNotification(jobId);
        }
        console.log('WhatsApp result:', whatsappResult);
      } catch (whatsappError) {
        console.error('WhatsApp error:', whatsappError);
        whatsappResult = {
          success: false,
          message: whatsappError.message || 'WhatsApp notification failed'
        };
      }

      // ✅✅✅ MISSING CODE - ADD THIS!
      // STEP 5: Send device video separately
      let videoResult = null;
      if (videoBlobData && formData.customerPhone) {
        console.log('🎬 STEP 5: Calling sendDeviceVideo API...');
        console.log(`Phone: ${formData.customerPhone}, Video size: ${(videoBlobData.size / 1024 / 1024).toFixed(2)}MB`);

        setProcessingStatus('Sending device video...');

        try {
          // THIS IS THE MISSING API CALL!
          videoResult = await WhatsAppService.sendDeviceVideo(
            jobId,
            formData.customerPhone,
            videoBlobData
          );

          console.log('Device video API response:', videoResult);

          if (videoResult?.success) {
            console.log('✅ Device video sent successfully');
          } else {
            console.warn('⚠️ Device video sending failed:', videoResult?.message);
          }
        } catch (videoError) {
          console.error('❌ Error sending device video:', videoError);
          videoResult = {
            success: false,
            message: videoError.message || 'Video sending failed'
          };
        }
      } else {
        console.log('📹 No device video to send:', {
          hasVideo: !!videoBlobData,
          hasPhone: !!formData.customerPhone,
          videoSize: videoBlobData?.size
        });
      }

      // Wait for PDF download to complete
      await downloadPromise;

      // 6. Set success message
      const totalTime = Date.now() - startTime;
      console.log('='.repeat(50));
      console.log(`COMPLETED in ${totalTime}ms`);
      console.log('='.repeat(50));

      let successMessage = `✅ Job #${jobCardNumber} created! PDF downloaded.`;

      if (whatsappResult?.success) {
        const mediaStatus = [];
        if (whatsappResult.results?.pdf?.sent) mediaStatus.push('PDF');
        if (whatsappResult.results?.photo?.sent) mediaStatus.push('Photo');

        if (mediaStatus.length > 0) {
          successMessage += ` WhatsApp sent with: ${mediaStatus.join(', ')} ✓`;
        } else if (whatsappResult.results?.template?.sent) {
          successMessage += ' WhatsApp template sent ✓';
        }
      } else if (whatsappResult?.results?.template?.sent) {
        successMessage += ' WhatsApp template sent ✓';

        // Show which media failed
        const failed = [];
        if (whatsappResult.results?.pdf?.error) failed.push('PDF');
        if (whatsappResult.results?.photo?.error) failed.push('Photo');

        if (failed.length > 0) {
          successMessage += ` (${failed.join(', ')} failed)`;
        }
      } else {
        successMessage += ` (WhatsApp: ${whatsappResult?.message || 'failed'})`;
      }

      // ✅ Add video status to success message
      if (videoResult) {
        if (videoResult.success) {
          successMessage += ' Video sent ✓';
        } else {
          successMessage += ` (Video: ${videoResult.message || 'failed'})`;
        }
      }

      successMessage += ` [${(totalTime / 1000).toFixed(1)}s]`;

      setSuccess(successMessage);
      setProcessingStatus('');

      // 7. Reset form
      await resetForm();

    } catch (err) {
      console.error('Job creation error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to create job. Please try again.');
      setProcessingStatus('');
    } finally {
      setIsProcessing(false);
    }
  };

  // Initialize camera
  const initCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: cameraFacingMode }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Could not access camera. Please ensure you have given permission.');
    }
  }, [cameraFacingMode]);

  // Capture customer photo from camera
  const captureCustomerPhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Use JPEG with good quality
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      console.log('Photo captured, size:', (dataUrl.length / 1024).toFixed(2), 'KB');

      setPhoto(dataUrl);
      setShowCamera(false);
      setCameraMode('photo');

      if (video.srcObject) {
        const tracks = video.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    }
  };

  // Update startDeviceVideoRecording function in your React component:

  const startDeviceVideoRecording = async () => {
    if (videoRef.current && videoRef.current.srcObject) {
      try {
        const mediaStream = videoRef.current.srcObject;

        // ✅ Lower quality for better WhatsApp compatibility
        const options = {
          mimeType: 'video/webm;codecs=vp8',
          videoBitsPerSecond: 1000000, // 1 Mbps for smaller file
          audioBitsPerSecond: 64000    // 64 Kbps for audio
        };

        // Try different mimeTypes if needed
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options.mimeType = 'video/mp4';
        }

        const recorder = new MediaRecorder(mediaStream, options);
        const chunks = [];

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };

        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: options.mimeType });
          const videoUrl = URL.createObjectURL(blob);
          console.log('Video recorded, size:', (blob.size / 1024 / 1024).toFixed(2), 'MB');
          setDeviceVideo(videoUrl);

          // Cleanup
          if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current);
            recordingTimerRef.current = null;
          }
          setRecordingTime(0);
        };

        // Limit recording to 15 seconds max
        recorder.start();
        setMediaRecorder(recorder);
        setIsRecording(true);

        setRecordingTime(0);
        recordingTimerRef.current = setInterval(() => {
          setRecordingTime(prev => {
            // Auto-stop at 15 seconds
            if (prev >= 15) {
              stopDeviceVideoRecording();
              return prev;
            }
            return prev + 1;
          });
        }, 1000);

      } catch (err) {
        console.error('Error starting recording:', err);
        setError('Could not start recording. Please try again.');
      }
    }
  };

  // Stop device video recording
  const stopDeviceVideoRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);

      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      setRecordingTime(0);
    }
  };

  // Switch camera (front/back)
  const switchCamera = () => {
    setCameraFacingMode(prevMode => prevMode === 'user' ? 'environment' : 'user');
  };

  // Remove customer photo
  const removeCustomerPhoto = () => {
    setPhoto(null);
  };

  // Remove device video
  const removeDeviceVideo = () => {
    setDeviceVideo(null);
  };

  // Open camera for customer photo
  const openCustomerPhotoCamera = () => {
    setCameraMode('photo');
    setShowCamera(true);
  };

  // Open camera for device video
  const openDeviceVideoCamera = () => {
    setCameraMode('video');
    setShowCamera(true);
  };

  // Close camera
  const closeCamera = () => {
    if (isRecording) {
      stopDeviceVideoRecording();
    }
    setShowCamera(false);
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setRecordingTime(0);
  };

  // Handle camera cancel
  const handleCameraCancel = () => {
    closeCamera();
  };

  // Effect to reinitialize camera when facing mode changes
  useEffect(() => {
    if (showCamera) {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }

      initCamera();
    }
  }, [cameraFacingMode, showCamera, initCamera]);

  // Cleanup camera streams on unmount
  useEffect(() => {
    const videoElement = videoRef.current;
    return () => {
      if (videoElement && videoElement.srcObject) {
        const tracks = videoElement.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  /* ── Wizard step state (UI only) ─────────────────────────── */
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [step, setStep] = React.useState(1);
  const TOTAL_STEPS = 4;

  const STEPS = [
    { num: 1, label: 'Customer',  icon: '👤' },
    { num: 2, label: 'Device',    icon: '📱' },
    { num: 3, label: 'Service',   icon: '🔧' },
    { num: 4, label: 'Review',    icon: '✅' },
  ];

  const canNext = () => {
    if (step === 1) return formData.customerName && formData.customerPhone;
    if (step === 2) return formData.device_model;
    if (step === 3) return formData.reported_issue && formData.total_amount !== '';
    return true;
  };

  /* ── shared styles (Light Theme) ───────────────────────── */
  const S = {
    page: {
      minHeight: '100vh',
      backgroundColor: '#F9FAFB',
      padding: '28px 20px',
      fontFamily: "'Inter', sans-serif",
    },
    card: {
      backgroundColor: '#FFFFFF',
      border: '1px solid #E5E7EB',
      borderRadius: 16,
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
      maxWidth: 800,
      margin: '0 auto',
      padding: '32px',
    },
    label: {
      display: 'block',
      fontSize: 13,
      fontWeight: 600,
      color: '#4B5563',
      marginBottom: 8,
    },
    input: {
      width: '100%',
      backgroundColor: '#F9FAFB',
      border: '1px solid #D1D5DB',
      borderRadius: 8,
      padding: '10px 14px',
      color: '#111827',
      fontSize: 14,
      outline: 'none',
      boxSizing: 'border-box',
      transition: 'border-color 0.15s, box-shadow 0.15s',
    },
    select: {
      width: '100%',
      backgroundColor: '#F9FAFB',
      border: '1px solid #D1D5DB',
      borderRadius: 8,
      padding: '10px 14px',
      color: '#111827',
      fontSize: 14,
      outline: 'none',
      boxSizing: 'border-box',
    },
    textarea: {
      width: '100%',
      backgroundColor: '#F9FAFB',
      border: '1px solid #D1D5DB',
      borderRadius: 8,
      padding: '10px 14px',
      color: '#111827',
      fontSize: 14,
      outline: 'none',
      boxSizing: 'border-box',
      resize: 'vertical',
      minHeight: '80px',
    },
    fieldRow: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))',
      gap: 20,
      marginBottom: 20,
    },
    btnPrimary: {
      padding: '12px 28px', borderRadius: 8, border: 'none',
      backgroundColor: '#2563EB',
      color: '#FFFFFF', fontWeight: 600, fontSize: 14.5,
      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
      boxShadow: '0 1px 2px rgba(37,99,235,0.1)',
    },
    btnSecondary: {
      padding: '12px 28px', borderRadius: 8,
      border: '1px solid #D1D5DB',
      backgroundColor: '#FFFFFF',
      color: '#374151', fontWeight: 600, fontSize: 14,
      cursor: 'pointer',
    },
    reviewRow: (label, value) => (
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #F3F4F6' }}>
        <span style={{ color: '#6B7280', fontSize: 14 }}>{label}</span>
        <span style={{ color: '#111827', fontSize: 14, fontWeight: 600, textAlign: 'right', maxWidth: '60%' }}>{value || '—'}</span>
      </div>
    ),
  };

  const handleInputFocus = (e) => {
    e.target.style.borderColor = '#3B82F6';
    e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
  };
  const handleInputBlur = (e) => {
    e.target.style.borderColor = '#D1D5DB';
    e.target.style.boxShadow = 'none';
  };

  /* ── Loader ────────────────────────────────────────────── */
  if (loading) return (
    <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid #E5E7EB', borderTopColor: '#3B82F6', animation: 'spin 0.8s linear infinite', margin: '0 auto 14px' }} />
        <p style={{ color: '#6B7280', fontSize: 14, fontWeight: 500 }}>Loading Intake Form…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={S.page}>
      {/* Messages */}
      {error && <div style={{ maxWidth: 800, margin: '0 auto 16px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', padding: '12px 16px', borderRadius: 8, fontSize: 14 }}>{error}</div>}
      {success && <div style={{ maxWidth: 800, margin: '0 auto 16px', backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', color: '#16A34A', padding: '12px 16px', borderRadius: 8, fontSize: 14 }}>{success}</div>}

      <div style={S.card}>
        {/* Header / Wizard Progress */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111827', margin: '0 0 8px 0' }}>New Job Intake</h1>
          <p style={{ color: '#6B7280', fontSize: 14, margin: 0 }}>Create a new repair job ticket</p>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, position: 'relative' }}>
            <div style={{ position: 'absolute', top: 20, left: 0, right: 0, height: 2, backgroundColor: '#E5E7EB', zIndex: 0 }} />
            <div style={{ position: 'absolute', top: 20, left: 0, height: 2, backgroundColor: '#3B82F6', zIndex: 0, transition: 'width 0.3s', width: `${((step - 1) / (TOTAL_STEPS - 1)) * 100}%` }} />
            
            {STEPS.map((s, idx) => {
              const active = step === s.num;
              const completed = step > s.num;
              return (
                <div key={s.num} style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: completed ? 'pointer' : 'default' }} onClick={() => completed && setStep(s.num)}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: active || completed ? '#3B82F6' : '#FFFFFF', border: active || completed ? '2px solid #3B82F6' : '2px solid #E5E7EB', color: active || completed ? '#FFFFFF' : '#9CA3AF', fontWeight: 700, fontSize: 16, transition: 'all 0.3s' }}>
                    {completed ? '✓' : s.num}
                  </div>
                  <span style={{ marginTop: 8, fontSize: 12, fontWeight: active ? 700 : 500, color: active ? '#111827' : '#6B7280' }}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* STEP 1: Customer */}
          {step === 1 && (
            <div style={{ animation: 'fadeIn 0.3s' }}>
              <h2 style={{ fontSize: 18, color: '#111827', marginBottom: 20, fontWeight: 700 }}>Customer Details</h2>
              <div style={S.fieldRow}>
                <div>
                  <label style={S.label}>Customer Name *</label>
                  <input type="text" value={formData.customerName} onChange={e => setFormData({ ...formData, customerName: e.target.value })} style={S.input} onFocus={handleInputFocus} onBlur={handleInputBlur} required />
                </div>
                <div>
                  <label style={S.label}>Phone Number *</label>
                  <input type="tel" value={formData.customerPhone} onChange={e => setFormData({ ...formData, customerPhone: e.target.value })} style={S.input} onFocus={handleInputFocus} onBlur={handleInputBlur} required />
                </div>
              </div>
              <div style={S.fieldRow}>
                <div>
                  <label style={S.label}>Email Address</label>
                  <input type="email" value={formData.customerEmail} onChange={e => setFormData({ ...formData, customerEmail: e.target.value })} style={S.input} onFocus={handleInputFocus} onBlur={handleInputBlur} />
                </div>
                <div>
                  <label style={S.label}>City / Address</label>
                  <input type="text" value={formData.customerAddress} onChange={e => setFormData({ ...formData, customerAddress: e.target.value })} placeholder="e.g. T.V.MALAI" style={S.input} onFocus={handleInputFocus} onBlur={handleInputBlur} />
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={S.label}>Aadhar Number</label>
                <input type="text" value={formData.aadharNumber} onChange={e => setFormData({ ...formData, aadharNumber: e.target.value.replace(/[^0-9]/g, '').slice(0, 12) })} style={S.input} onFocus={handleInputFocus} onBlur={handleInputBlur} />
              </div>

              {/* Camera Trigger */}
              <div style={{ marginBottom: 20, padding: 16, backgroundColor: '#F9FAFB', borderRadius: 8, border: '1px dashed #D1D5DB' }}>
                <label style={S.label}>Customer Photo</label>
                {photo ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <img src={photo} alt="Customer" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid #E5E7EB' }} />
                    <button type="button" onClick={removeCustomerPhoto} style={{ padding: '6px 12px', borderRadius: 6, backgroundColor: '#FEF2F2', color: '#DC2626', border: 'none', fontWeight: 500, fontSize: 13, cursor: 'pointer' }}>Remove Photo</button>
                  </div>
                ) : (
                  <button type="button" onClick={openCustomerPhotoCamera} style={{ padding: '8px 16px', borderRadius: 6, backgroundColor: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', fontWeight: 500, fontSize: 13, cursor: 'pointer' }}>📷 Take Customer Photo</button>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: Device */}
          {step === 2 && (
            <div style={{ animation: 'fadeIn 0.3s' }}>
              <h2 style={{ fontSize: 18, color: '#111827', marginBottom: 20, fontWeight: 700 }}>Device Information</h2>
              <div style={S.fieldRow}>
                <div>
                  <label style={S.label}>Device Brand</label>
                  <input type="text" value={formData.device_brand} onChange={e => setFormData({ ...formData, device_brand: e.target.value })} placeholder="e.g. Samsung" style={S.input} onFocus={handleInputFocus} onBlur={handleInputBlur} />
                </div>
                <div>
                  <label style={S.label}>Device Model *</label>
                  <input type="text" value={formData.device_model} onChange={e => setFormData({ ...formData, device_model: e.target.value })} placeholder="e.g. Galaxy S21" style={S.input} onFocus={handleInputFocus} onBlur={handleInputBlur} required />
                </div>
              </div>
              <div style={S.fieldRow}>
                <div>
                  <label style={S.label}>IMEI Number</label>
                  <input type="text" value={formData.imei_number} onChange={e => setFormData({ ...formData, imei_number: e.target.value })} style={S.input} onFocus={handleInputFocus} onBlur={handleInputBlur} />
                </div>
                <div>
                  <label style={S.label}>Serial Number</label>
                  <input type="text" value={formData.serial_number} onChange={e => setFormData({ ...formData, serial_number: e.target.value })} style={S.input} onFocus={handleInputFocus} onBlur={handleInputBlur} />
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={S.label}>Device Condition</label>
                <textarea value={formData.device_condition} onChange={e => setFormData({ ...formData, device_condition: e.target.value })} placeholder="Scratches, screen cracks..." style={S.textarea} onFocus={handleInputFocus} onBlur={handleInputBlur} />
              </div>

              {/* Video Trigger */}
              <div style={{ marginBottom: 20, padding: 16, backgroundColor: '#F9FAFB', borderRadius: 8, border: '1px dashed #D1D5DB' }}>
                <label style={S.label}>Device Video</label>
                {deviceVideo ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <video src={deviceVideo} controls style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid #E5E7EB', backgroundColor: '#000' }} />
                    <button type="button" onClick={removeDeviceVideo} style={{ padding: '6px 12px', borderRadius: 6, backgroundColor: '#FEF2F2', color: '#DC2626', border: 'none', fontWeight: 500, fontSize: 13, cursor: 'pointer' }}>Remove Video</button>
                  </div>
                ) : (
                  <button type="button" onClick={openDeviceVideoCamera} style={{ padding: '8px 16px', borderRadius: 6, backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', fontWeight: 500, fontSize: 13, cursor: 'pointer' }}>🎥 Record Device Video</button>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Service & Finance */}
          {step === 3 && (
            <div style={{ animation: 'fadeIn 0.3s' }}>
              <h2 style={{ fontSize: 18, color: '#111827', marginBottom: 20, fontWeight: 700 }}>Service & Financials</h2>
              <div style={{ marginBottom: 20 }}>
                <label style={S.label}>Reported Fault / Issue *</label>
                <textarea value={formData.reported_issue} onChange={e => setFormData({ ...formData, reported_issue: e.target.value })} placeholder="e.g. Screen broken, not charging" style={S.textarea} onFocus={handleInputFocus} onBlur={handleInputBlur} required />
              </div>
              
              <div style={S.fieldRow}>
                <div>
                  <label style={S.label}>Repair Type</label>
                  <select value={formData.repair_type} onChange={e => setFormData({ ...formData, repair_type: e.target.value })} style={S.select} onFocus={handleInputFocus} onBlur={handleInputBlur}>
                    <option value="hardware">Hardware</option>
                    <option value="software">Software</option>
                    <option value="diagnostics">Diagnostics</option>
                  </select>
                </div>
                <div>
                  <label style={S.label}>Urgency Level</label>
                  <select value={formData.urgency_level} onChange={e => setFormData({ ...formData, urgency_level: e.target.value })} style={S.select} onFocus={handleInputFocus} onBlur={handleInputBlur}>
                    <option value="normal">Normal</option>
                    <option value="express">Express</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div style={{ height: 1, backgroundColor: '#E5E7EB', margin: '24px 0' }} />

              <div style={S.fieldRow}>
                <div>
                  <label style={S.label}>Total Service Charge (₹) *</label>
                  <input type="number" value={formData.total_amount} onChange={e => setFormData({ ...formData, total_amount: e.target.value === '' ? '' : parseFloat(e.target.value) || 0 })} style={S.input} onFocus={handleInputFocus} onBlur={handleInputBlur} min="0" step="1" required />
                </div>
                <div>
                  <label style={S.label}>Advance Payment (₹)</label>
                  <input type="number" value={formData.advance_payment} onChange={e => setFormData({ ...formData, advance_payment: e.target.value === '' ? '' : parseFloat(e.target.value) || 0 })} style={S.input} onFocus={handleInputFocus} onBlur={handleInputBlur} min="0" step="1" />
                </div>
              </div>

              <div style={S.fieldRow}>
                <div>
                  <label style={S.label}>Payment Method</label>
                  <select value={formData.payment_method} onChange={e => setFormData({ ...formData, payment_method: e.target.value })} style={S.select} onFocus={handleInputFocus} onBlur={handleInputBlur}>
                    <option value="cash">Cash</option><option value="card">Card</option><option value="upi">UPI</option><option value="bank_transfer">Bank Transfer</option>
                  </select>
                </div>
                <div>
                  <label style={S.label}>Delivery Date</label>
                  <input type="date" value={formData.estimated_delivery_date} onChange={e => setFormData({ ...formData, estimated_delivery_date: e.target.value })} style={S.input} onFocus={handleInputFocus} onBlur={handleInputBlur} />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Review & Submit */}
          {step === 4 && (
            <div style={{ animation: 'fadeIn 0.3s' }}>
              <h2 style={{ fontSize: 18, color: '#111827', marginBottom: 20, fontWeight: 700 }}>Review & Confirm</h2>
              
              <div style={{ backgroundColor: '#F9FAFB', borderRadius: 12, padding: 20, marginBottom: 24, border: '1px solid #E5E7EB' }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#374151', marginBottom: 12 }}>Customer & Device</h3>
                {S.reviewRow('Name', formData.customerName)}
                {S.reviewRow('Phone', formData.customerPhone)}
                {S.reviewRow('Device', `${formData.device_brand} ${formData.device_model}`.trim())}
                {S.reviewRow('Issue', formData.reported_issue)}
                
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#374151', margin: '24px 0 12px' }}>Financials & Admin</h3>
                {S.reviewRow('Total Amount', `₹${formData.total_amount}`)}
                {S.reviewRow('Advance', `₹${formData.advance_payment || 0}`)}
                {S.reviewRow('Balance', `₹${Number(formData.total_amount || 0) - Number(formData.advance_payment || 0)}`)}
                
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #E5E7EB' }}>
                  <label style={S.label}>Taken By (Worker)</label>
                  <select value={formData.taken_by_worker_id} onChange={e => setFormData({ ...formData, taken_by_worker_id: e.target.value })} style={{ ...S.select, backgroundColor: '#FFFFFF' }} onFocus={handleInputFocus} onBlur={handleInputBlur}>
                    <option value="">Admin / Self</option>
                    {workers.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                  </select>
                </div>
                
                <div style={{ marginTop: 16 }}>
                  <label style={S.label}>Job Card Number (Bill No)</label>
                  <input type="text" value={formData.job_card_number} onChange={e => setFormData({ ...formData, job_card_number: e.target.value })} style={{ ...S.input, backgroundColor: '#FFFFFF' }} onFocus={handleInputFocus} onBlur={handleInputBlur} />
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32, paddingTop: 20, borderTop: '1px solid #E5E7EB' }}>
            {step > 1 ? (
              <button type="button" onClick={() => setStep(s => s - 1)} style={S.btnSecondary}>← Back</button>
            ) : <div />}

            {step < TOTAL_STEPS ? (
              <button type="button" onClick={() => setStep(s => s + 1)} disabled={!canNext()} style={{ ...S.btnPrimary, opacity: canNext() ? 1 : 0.5, backgroundColor: '#3B82F6' }}>
                Next Step →
              </button>
            ) : (
              <button type="submit" disabled={isProcessing} style={{ ...S.btnPrimary, backgroundColor: '#10B981', boxShadow: '0 4px 6px rgba(16,185,129,0.2)' }}>
                {isProcessing ? 'Processing...' : '✅ Confirm & Create Job'}
              </button>
            )}
          </div>
        </form>
      </div>

      {/* CAMERA MODAL */}
      {showCamera && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20, backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: 16, width: '100%', maxWidth: 480, overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: 16, borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{cameraMode === 'photo' ? 'Take Photo' : 'Record Video'}</h3>
              <button onClick={handleCameraCancel} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#6B7280' }}>×</button>
            </div>
            <div style={{ padding: 16 }}>
              <div style={{ position: 'relative', backgroundColor: '#000', borderRadius: 12, overflow: 'hidden', marginBottom: 16, aspectRatio: '4/3' }}>
                <video ref={videoRef} autoPlay playsInline muted={isRecording} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                {isRecording && (
                  <div style={{ position: 'absolute', top: 12, left: 12, backgroundColor: '#EF4444', color: '#FFF', padding: '4px 8px', borderRadius: 4, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, backgroundColor: '#FFF', borderRadius: '50%', animation: 'pulse 1s infinite' }} /> REC {recordingTime}s
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="button" onClick={switchCamera} style={{ flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#F3F4F6', color: '#4B5563', border: 'none', fontWeight: 600, cursor: 'pointer' }}>🔄 Flip</button>
                {!isRecording ? (
                  cameraMode === 'photo' ? (
                    <button type="button" onClick={captureCustomerPhoto} style={{ flex: 2, padding: 12, borderRadius: 8, backgroundColor: '#2563EB', color: '#FFF', border: 'none', fontWeight: 600, cursor: 'pointer' }}>📷 Capture</button>
                  ) : (
                    <button type="button" onClick={startDeviceVideoRecording} style={{ flex: 2, padding: 12, borderRadius: 8, backgroundColor: '#EF4444', color: '#FFF', border: 'none', fontWeight: 600, cursor: 'pointer' }}>⏺️ Record</button>
                  )
                ) : (
                  <button type="button" onClick={stopDeviceVideoRecording} style={{ flex: 2, padding: 12, borderRadius: 8, backgroundColor: '#1F2937', color: '#FFF', border: 'none', fontWeight: 600, cursor: 'pointer' }}>⏹️ Stop</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </div>
  );
};

export default JobIntake;
