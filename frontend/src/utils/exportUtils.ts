import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const exportDiagramToPDF = async () => {
  try {
    // Get the React Flow container
    const element = document.querySelector('.react-flow');
    
    if (!element) {
      throw new Error('Diagram not found - make sure the React Flow diagram is visible');
    }

    console.log('📸 Capturing diagram screenshot...');
    
    // Create canvas from the diagram
    const canvas = await html2canvas(element as HTMLElement, {
      backgroundColor: 'white',
      useCORS: true,
      scale: 2, // Higher quality
      width: element.scrollWidth,
      height: element.scrollHeight,
      scrollX: 0,
      scrollY: 0,
    });

    const imgData = canvas.toDataURL('image/png');

    // Calculate PDF dimensions
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = imgHeight / imgWidth;

    // A4 size in points (landscape orientation)
    const pageWidth = 841.89; // A4 landscape width
    const pageHeight = 595.28; // A4 landscape height

    let pdfWidth = pageWidth - 40; // Leave margins
    let pdfHeight = (pageWidth - 40) * ratio;

    // If image is too tall, scale down to fit page
    if (pdfHeight > pageHeight - 60) { // Leave space for title
      pdfHeight = pageHeight - 60;
      pdfWidth = pdfHeight / ratio;
    }

    console.log('📄 Generating PDF...');

    // Create PDF in landscape mode
    const pdf = new jsPDF('landscape', 'pt', 'a4');

    // Add title
    pdf.setFontSize(20);
    pdf.setTextColor(59, 130, 246); // Blue color
    pdf.text('Database Schema Diagram', 40, 40);

    // Add timestamp
    pdf.setFontSize(10);
    pdf.setTextColor(107, 114, 128); // Gray color
    const timestamp = `Generated: ${new Date().toLocaleString()}`;
    pdf.text(timestamp, 40, 55);

    // Add the diagram image
    pdf.addImage(imgData, 'PNG', 40, 70, pdfWidth, pdfHeight);

    // Generate filename with timestamp
    const filename = `database-diagram-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.pdf`;

    console.log('💾 Saving PDF:', filename);

    // Save the PDF
    pdf.save(filename);

    return { 
      success: true, 
      message: `PDF exported successfully as ${filename}` 
    };
  } catch (error) {
    console.error('❌ Export failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
};

// Export utility for high-quality PNG images
export const exportDiagramToPNG = async () => {
  try {
    const element = document.querySelector('.react-flow');
    
    if (!element) {
      throw new Error('Diagram not found');
    }

    console.log('📸 Capturing high-quality PNG...');

    const canvas = await html2canvas(element as HTMLElement, {
      backgroundColor: 'white',
      useCORS: true,
      scale: 3, // Very high quality
      width: element.scrollWidth,
      height: element.scrollHeight,
    });

    // Create download link
    const link = document.createElement('a');
    link.download = `database-diagram-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return { 
      success: true, 
      message: 'PNG exported successfully' 
    };
  } catch (error) {
    console.error('❌ PNG export failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
};