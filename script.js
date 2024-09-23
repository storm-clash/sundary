const imageInput = document.getElementById('imageInput');
const imagePreview = document.getElementById('imagePreview');

imageInput.addEventListener('change', function() {
  const file = this.files[0];
  if (file) {
    const reader = new FileReader();

    reader.onload = function(e) {
      imagePreview.src = e.target.result;
      imagePreview.style.display = "block"; // Show the image
    }

    reader.readAsDataURL(file);
  }
});

const barcodeInput = document.getElementById('barcode_Input');
const barcodeSvg = document.getElementById('barcode');

barcodeInput.addEventListener('input', function() {
    let inputValue = barcodeInput.value;

    // Completar con ceros a la izquierda hasta que tenga 7 dígitos
    inputValue = inputValue.padStart(7, '0');

    // Agregar asteriscos al inicio y al final
    const barcodeValue = `*${inputValue}*`;

    // Generar el código de barras solo si hay un valor
    if (barcodeValue) {
      JsBarcode(barcodeSvg, barcodeValue, {
        format: "CODE128", // Especifica el formato del código de barras
        lineColor: "#000000", // Color del código de barras
        width: 2, // Ancho de las barras
        height: 30, // Altura del código de barras
        displayValue: true // Muestra el valor debajo del código de barras
      });
    } else {
      // Limpiar el SVG si el campo está vacío
      barcodeSvg.innerHTML = '';
    }
  });

  const saveButton = document.getElementById('save');
  const card = document.querySelector('.card');

  saveButton.addEventListener('click', async function() {
    const { jsPDF } = window.jspdf;

    const cardNameValue = document.getElementById('card_Name').value;
    const pdfFileName = `Lottus identification card for ${cardNameValue}.pdf`;

    // Generate the barcode
    let inputValue = barcodeInput.value;
    inputValue = inputValue.padStart(7, '0');
    const barcodeValue = `*${inputValue}*`;

    JsBarcode(barcodeSvg, barcodeValue, {
        format: "CODE128",
        lineColor: "#000000", // Black color for barcode
        width: 2,  // Reduced width for smaller barcode
        height: 30, // Adjust height
        displayValue: true
    });

    const uploadButton = document.querySelector('.upload-label');
    uploadButton.style.display = 'none';

    // Create an image from the barcode SVG
    const barcodeImage = await new Promise((resolve) => {
        const svgString = new XMLSerializer().serializeToString(barcodeSvg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
        };
        img.src = 'data:image/svg+xml;base64,' + btoa(svgString);
    });

    // Capture the card as a PNG using html2canvas
    const cardCanvas = await html2canvas(card, {
        scale: 1.5, // Increase resolution for better quality
        useCORS: true // Allow external resources
    });

    uploadButton.style.display = 'block';

    const cardImage = cardCanvas.toDataURL('image/png');

    // Create the PDF
    const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4' // A4 paper size
    });

    // Get page dimensions
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Calculate positions to center the card and barcode inside the card
    const cardWidth = cardCanvas.width * 0.15; // 30% of the original size
    const cardHeight = cardCanvas.height * 0.15;
    const cardX = (pageWidth - cardWidth) / 2;
    const cardY = (pageHeight - cardHeight) / 2;

    const barcodeWidth = 40; // Set smaller width for the barcode
    const barcodeHeight = 15; // Set smaller height for the barcode
    const barcodeX = cardX + (cardWidth - barcodeWidth) / 2; // Center the barcode within the card horizontally
    const barcodeY = cardY + cardHeight - 20; // Place it near the bottom of the card

    // Add the captured card image to the PDF
    pdf.addImage(cardImage, 'PNG', cardX, cardY, cardWidth, cardHeight);

    // Add the barcode inside the card, at the bottom
    pdf.addImage(barcodeImage, 'PNG', barcodeX, barcodeY, barcodeWidth, barcodeHeight);

    // Add a border to the card
    pdf.setLineWidth(1);
    pdf.setDrawColor(0, 0, 0); // Black border
    pdf.rect(cardX, cardY, cardWidth, cardHeight); // Draw border around the card

    // Save the PDF
    pdf.save(pdfFileName);
});


