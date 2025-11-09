const PDFDocument = require('pdfkit');
const puppeteer = require('puppeteer');
const S3Service = require('./s3');

class PdfService {
  async createPdf(htmlContent) {
    return new Promise((resolve, reject) => {
      try {
        // Create a document
        const doc = new PDFDocument();
        const chunks = [];

        // Capture all chunks in memory
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));

        // Parse the HTML-like template strings into PDF content
        const lines = htmlContent
          .split('\n')
          .map(line => line.trim())
          .filter(line => line);

        // Set initial position
        let y = 50;

        // Process each line
        lines.forEach(line => {
          if (line.startsWith('<h1>')) {
            doc.fontSize(24);
            doc.text(line.replace(/<\/?h1>/g, ''), 50, y);
            y += 40;
          } else if (line.startsWith('<h2>')) {
            doc.fontSize(14);
            doc.text(line.replace(/<\/?h2>/g, ''), 50, y);
            y += 25;
          }

          // Add a new page if we're near the bottom
          if (y > 700) {
            doc.addPage();
            y = 50;
          }
        });

        // Finalize the PDF
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  // Function to generate PDF and save it
  async generatePDF(html, filename, options = {}) {
    let browser = null;
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ]
        });
        
        const page = await browser.newPage();
        
        // Set content with base styles
        await page.setContent(html, { waitUntil: 'networkidle0' });
        
        // Generate PDF with provided settings or defaults
        const pdfOptions = {
            printBackground: true,
            ...options
        };
        
        const buffer = await page.pdf(pdfOptions);

        // Upload PDF to S3 using the imported S3Service instance
        const pdfUrl = await S3Service.uploadPdf(buffer, filename);
        
        return {
            buffer,
            pdfUrl
        };
    } catch (error) {
        console.error('PDF Generation Error Details:', {
            message: error.message,
            stack: error.stack
        });
        throw error;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
  }

  async generateMembershipCardPdf(memberData) {
    try {
        const ejs = require('ejs');
        const path = require('path');
        const fs = require('fs').promises;

        // Prepare the form data for the membership card
        const membershipFormData = {
            memberName: memberData.name || "Member Name",
            assistHealthId: memberData.memberId || "AH123456",
            validDate: memberData.validDate ? new Date(memberData.validDate).toLocaleString('en-US', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            }) : "Not Specified"
        };

        // Read the EJS template
        const templatePath = path.join(__dirname, 'membership_card.ejs');
        const template = await fs.readFile(templatePath, 'utf-8');
        
        // Render the template with the data
        const html = ejs.render(template, membershipFormData);

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `membership-cards/${membershipFormData.assistHealthId}/membership-card-${membershipFormData.memberName}-${timestamp}.pdf`;
        
        // Use the existing generatePDF method to create and upload the PDF
        const { pdfUrl } = await this.generatePDF(html, filename, {
            // Specific options for membership card PDF
            width: '85.6mm',
            height: '53.98mm',
            printBackground: true,
            margin: {
                top: '0',
                right: '0',
                bottom: '0',
                left: '0'
            }
        });
        
        return {
            success: true,
            message: 'Membership card PDF generated successfully', 
            s3Url: pdfUrl
        };
    } catch (error) {
        console.error('Membership Card Generation Error:', error);
        throw error;
    }
  }
}

module.exports = new PdfService();