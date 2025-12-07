// backend/config/reportPdf.js
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * generateReportPdf(sheet, options)
 * sheet: either a single sheet object OR { title, subsheets: [sheet,...] } OR an array of sheets
 * options: { writeToDisk: true } - when false, file will still be created in memory and buffer returned,
 *                                   but file on disk will be deleted after generation (so no long-term disk save)
 * Returns: { buffer, filename, filePath }
 */
export async function generateReportPdf(sheet = {}, options = { writeToDisk: true }) {
    // normalize sheets into an array of sheets
    const sheetsArr = Array.isArray(sheet)
        ? sheet
        : (Array.isArray(sheet.subsheets) ? sheet.subsheets : [sheet]);

    // existing reports dir creation (unchanged)
    const reportsDir = path.join(__dirname, "..", "reports");
    if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
    }

    // choose main title from first sheet if available
    const mainTitle = (sheetsArr[0] && sheetsArr[0].title) ? sheetsArr[0].title : "Compliance Report";
    const safeTitle = String(mainTitle).replace(/[^a-z0-9_\-]/gi, "_").toLowerCase();
    const timestamp = Date.now();
    const filename = `${ safeTitle }_${ timestamp }.pdf`;
    const filePath = path.join(reportsDir, filename);

    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ size: "A4", margin: 36, autoFirstPage: true });
            const chunks = [];

            // collect in-memory
            doc.on("data", (c) => chunks.push(c));

            // if writeToDisk is true (default) create write stream; otherwise create write stream then delete later
            const writeStream = fs.createWriteStream(filePath);
            doc.pipe(writeStream);

            // --- render content: iterate sheetsArr and reuse your table rendering code for each sub-sheet ---
            // Header for whole document
            doc.fillColor("#000").fontSize(18).font("Helvetica-Bold").text(mainTitle, { align: "left" });
            doc.moveDown(0.25);

            // ⭐ UPDATED: add full date + time when PDF is created
            const now = new Date();
            const dateStr = now.toISOString().slice(0, 10);   // YYYY-MM-DD
            const timeStr = now.toTimeString().slice(0, 8);   // HH:mm:ss

            doc
                .fontSize(10)
                .font("Helvetica")
                .text(`Generated: ${dateStr} ${timeStr}, { align: "left" }`);

            doc.moveDown(0.6);

            // Reusable table rendering function (based on your previous logic)
            function renderSheet(s) {
                if (!s) return;
                // sub-title
                if (s.title) {
                    doc.moveDown(0.2);
                    doc.font("Helvetica-Bold").fontSize(13).text(String(s.title), { align: "left" });
                    doc.moveDown(0.2);
                }

                const headers = Array.isArray(s.headers) ? s.headers : [];
                const rows = Array.isArray(s.rows) ? s.rows : [];

                // normalise object rows to arrays like before
                if (headers.length === 0 && rows.length > 0 && typeof rows[0] === "object" && !Array.isArray(rows[0])) {
                    const keys = Object.keys(rows[0]);
                    s.headers = keys;
                    s.rows = rows.map((r) => keys.map((k) => r[k]));
                }

                const startX = doc.x;
                const usableWidth = doc.page.width - doc.options.margin * 2;
                const colCount = Math.max((s.headers || []).length, 1);
                const colWidth = usableWidth / colCount;
                let y = doc.y;

                // header background and titles
                if ((s.headers || []).length > 0) {
                    doc.save();
                    doc.rect(startX - 2, y - 4, usableWidth + 4, 22).fillOpacity(0.06).fill("#000000");
                    doc.restore();

                    doc.font("Helvetica-Bold").fontSize(10);
                    s.headers.forEach((h, i) => {
                        const x = startX + i * colWidth;
                        doc.fillColor("#000").text(String(h), x + 4, y + 6, { width: colWidth - 8, align: "left" });
                    });
                    y += 26;
                }

                doc.font("Helvetica").fontSize(10);
                function addRowCells(row) {
                    row.forEach((cell, i) => {
                        const x = startX + i * colWidth;
                        const text = cell === null || cell === undefined ? "" : String(cell);
                        doc.text(text, x + 4, y + 6, { width: colWidth - 8, align: "left" });
                    });
                    y += 26;
                }

                (s.rows || []).forEach((row, idx) => {
                    if (!Array.isArray(row) && (s.headers || []).length > 0) {
                        row = (s.headers || []).map((k) => (row[k] === undefined ? "" : row[k]));
                    }

                    if (y + 40 > doc.page.height - doc.options.margin) {
                        doc.addPage();
                        y = doc.y;
                        if ((s.headers || []).length > 0) {
                            doc.save();
                            doc.rect(startX - 2, y - 4, usableWidth + 4, 22).fillOpacity(0.06).fill("#000000");
                            doc.restore();
                            doc.font("Helvetica-Bold").fontSize(10);
                            s.headers.forEach((h, i) => {
                                const x = startX + i * colWidth;
                                doc.fillColor("#000").text(String(h), x + 4, y + 6, { width: colWidth - 8, align: "left" });
                            });
                            y += 26;
                            doc.font("Helvetica").fontSize(10);
                        }
                    }

                    if (idx % 2 === 0 && (s.headers || []).length > 0) {
                        doc.save();
                        doc.rect(startX - 2, y - 4, usableWidth + 4, 22).fillOpacity(0.03).fill("#000000");
                        doc.restore();
                    }

                    addRowCells(row);
                });

                // notes (if present)
                if (s.notes) {
                    doc.moveDown(0.6);
                    if (doc.y + 120 > doc.page.height - doc.options.margin) doc.addPage();
                    doc.moveDown(0.2);
                    doc.font("Helvetica-Oblique").fontSize(10).text("Notes:");
                    doc.moveDown(0.2);
                    doc.font("Helvetica").fontSize(10).text(String(s.notes), { align: "left" });
                }

                // after each subsheet, add some spacing
                doc.moveDown(0.6);
            }

            // Render all sheets sequentially; first sheet already had the main header, so we just iterate
            sheetsArr.forEach((s, idx) => {
                if (idx > 0) {
                    doc.addPage();
                }
                renderSheet(s);
            });

            // Footer (same as before)
            const footerText = `Generated by Compliance Mailer — ${mainTitle}`;
            doc.fontSize(9).fillColor("gray");
            doc.text(footerText, doc.options.margin, doc.page.height - 40, { align: "left" });

            // finalise PDF
            doc.end();

            writeStream.on("finish", async () => {
                try {
                    const buffer = Buffer.concat(chunks);

                    if (!options.writeToDisk) {
                        // if caller requested no on-disk file, delete the file we wrote, but still return buffer
                        try {
                            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                        } catch (err) {
                            // ignore deletion errors
                        }
                    }

                    resolve({ buffer, filename, filePath });
                } catch (err) {
                    reject(err);
                }
            });

            writeStream.on("error", (err) => reject(err));
        } catch (err) {
            reject(err);
        }
    });
}