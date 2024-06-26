import PDFDocument from "pdfkit";
import { Response } from "express";
const doc = new PDFDocument({
  size: "A4",
  margin: 50,
  layout: "portrait",
});

export function generateCertificate(
  stream: Response,
  name: string,
  course: string,
  date: Date
) {
  doc.pipe(stream);
  const logoPath = "src/public/ppBlue.png";

  // Adding a light blue border
  const borderWidth = 2;
  const borderPadding = 10;
  doc
    .lineWidth(borderWidth)
    .strokeColor("#ADD8E6") // Light blue color
    .rect(
      borderPadding,
      borderPadding,
      doc.page.width - 2 * borderPadding,
      doc.page.height - 2 * borderPadding
    )
    .stroke();

  // Adding a logo
  if (logoPath) {
    doc.image(logoPath, doc.page.width / 2 - 50, 40, { width: 100 });
    doc.moveDown(2);
  }

  // Title
  doc
    .font("Helvetica-Bold")
    .fontSize(30)
    .fillColor("#000000")
    .text("Certificate of Completion", {
      align: "center",
    })
    .moveDown(1);

  // Decorative line
  doc
    .moveTo(doc.page.width / 4, doc.y)
    .lineTo((doc.page.width / 4) * 3, doc.y)
    .stroke()
    .moveDown(1);

  // Subtitle
  doc
    .font("Helvetica")
    .fontSize(20)
    .text("This is to certify that", {
      align: "center",
    })
    .moveDown(1);

  // Recipient's name
  doc
    .font("Helvetica-Bold")
    .fontSize(25)
    .fillColor("#003366")
    .text(name.toUpperCase(), {
      align: "center",
    })
    .moveDown(1);

  // Course details
  doc
    .font("Helvetica")
    .fontSize(20)
    .fillColor("#000000")
    .text("has successfully completed the", {
      align: "center",
    })
    .moveDown(1)
    .font("Helvetica-Bold")
    .fontSize(25)
    .fillColor("#003366")
    .text(course.toUpperCase(), {
      align: "center",
    })
    .moveDown(1);

  // Format the date
  const formattedDate = date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Date
  doc
    .font("Helvetica")
    .fontSize(20)
    .fillColor("#000000")
    .text(`course on ${formattedDate}.`, {
      align: "center",
    })
    .moveDown(3);

  // Instructor Signature
  doc
    .fontSize(15)
    .fillColor("#000000")
    .text("______________________________", {
      align: "center",
    })
    .text("Instructor Signature", {
      align: "center",
    });

  // Footer (optional)

  // Finalize PDF file
  doc.end();
}

export function generateInvoice(
  stream: Response,
  studentName: string,
  courseName: string,
  price: number,
  description: string,
  date: Date
) {
  const doc = new PDFDocument({ margin: 50 });

  // Write to the stream
  doc.pipe(stream);

  // Generate header
  doc
    .image("src/public/ppBlue.png", 50, 45, { width: 100 })
    .fillColor("#444444")
    // .fontSize(20)
    // .fontSize(10)
    // .text("123 Main Street", 200, 65, { align: "right" })
    // .text("New York, NY, 10025", 200, 80, { align: "right" })
    .moveDown();

  // Generate customer information
  doc
    .text(`Student Name: ${studentName}`, 50, 200)
    .text(`Course Name: ${courseName}`, 50, 215)
    .text(`Invoice Date: ${date.toDateString()}`, 50, 230)
    .text(`Price: ${price}`, 50, 245)
    .moveDown();

  // Generate invoice table header
  doc.font("Helvetica-Bold");
  generateTableRow(
    300,
    "Item",
    "Description",
    "Unit Price",
    "Quantity",
    "Amount"
  );
  doc.font("Helvetica");
const descrip = `${description.substring(0,5)}...`
  // Generate invoice table
  let invoiceTableTop = 330;
  generateTableRow(
    invoiceTableTop,
    courseName,
    descrip,
    price.toString(),
    "1",
    price.toString()
  );

  // Generate footer

  // Finalize PDF
  doc.end();

  // Function to generate a table row
  function generateTableRow(
    y: number,
    c1: string,
    c2: string,
    c3: string,
    c4: string,
    c5: string
  ) {
    doc
      .fontSize(10)
      .text(c1, 50, y)
      .text(c2, 150, y)  
      .text(c3, 280, y, { width: 90, align: "right" })
      .text(c4, 370, y, { width: 90, align: "right" })
      .text(c5, 0, y, { align: "right" });
  }
}
