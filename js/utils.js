import { getSettings } from './db.js';

// Format Currency
export function formatCurrency(amount) {
  const settings = getSettings();
  const symbol = settings.currencySymbol || "₹";
  return `${symbol}${parseFloat(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })}`;
}

// Generate ID
export function generateId(prefix = "ID") {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${num}`;
}

// Format Date
export function formatDate(dateString, includeTime = false) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "-";
  
  const options = { day: 'numeric', month: 'short', year: 'numeric' };
  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }
  return date.toLocaleDateString('en-US', options);
}

// Toast Notifications System
export function showToast(title, message, type = "info") {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  
  let icon = "💡";
  if (type === "success") icon = "🟢";
  if (type === "warning") icon = "🟠";
  if (type === "error") icon = "🔴";

  toast.innerHTML = `
    <div style="font-size: 1.25rem;">${icon}</div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-msg">${message}</div>
    </div>
    <button class="toast-close">&times;</button>
  `;

  // Close event
  toast.querySelector(".toast-close").addEventListener("click", () => {
    toast.style.animation = "slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) reverse forwards";
    setTimeout(() => toast.remove(), 300);
  });

  container.appendChild(toast);

  // Auto remove after 4.5 seconds
  setTimeout(() => {
    if (toast.parentElement) {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(50px)";
      setTimeout(() => toast.remove(), 300);
    }
  }, 4500);
}

// CSV Export Utility
export function exportToCSV(headers, rows, filename = "export.csv") {
  const csvContent = [
    headers.join(","),
    ...rows.map(row => 
      row.map(val => {
        // Escape quotes
        const cleanVal = String(val).replace(/"/g, '""');
        return `"${cleanVal}"`;
      }).join(",")
    )
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("CSV Exported", `Saved file: ${filename}`, "success");
  }
}

// PDF Export Utility (using jsPDF & jspdf-autotable)
export function exportToPDF(title, headers, rows, filename = "report.pdf", summaries = []) {
  try {
    const { jsPDF } = window.jspdf;
    if (!jsPDF) {
      showToast("PDF Error", "PDF library not loaded. Please wait.", "error");
      return;
    }

    const doc = new jsPDF();
    const settings = getSettings();
    const shop = settings.shopName || "Paper Plane";

    // Set styling colors matching branding
    // Brand header
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(212, 175, 55); // Gold
    doc.text(shop, 14, 22);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // Muted grey
    doc.text("Festival Gift Hamper Builder - Operations Report", 14, 28);
    
    // Timestamp
    const timestampStr = `Generated on: ${formatDate(new Date(), true)}`;
    doc.text(timestampStr, 14, 33);
    
    // Page Title
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(15, 23, 42); // Slate 900
    doc.text(title, 14, 45);

    // Summary stats side block
    let startY = 52;
    if (summaries && summaries.length > 0) {
      doc.setFontSize(10);
      summaries.forEach((summary) => {
        doc.setFont("Helvetica", "bold");
        doc.setTextColor(71, 85, 105);
        doc.text(`${summary.label}: `, 14, startY);
        doc.setFont("Helvetica", "normal");
        doc.setTextColor(15, 23, 42);
        
        // Offset label length
        const labelWidth = doc.getTextWidth(`${summary.label}: `);
        doc.text(String(summary.value), 14 + labelWidth, startY);
        startY += 6;
      });
      startY += 4; // Extra margin after summary
    }

    // Generate table using autotable
    doc.autoTable({
      head: [headers],
      body: rows,
      startY: startY,
      theme: 'grid',
      headStyles: {
        fillColor: [212, 175, 55], // Gold header
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252] // Very light background
      },
      margin: { left: 14, right: 14 },
      styles: {
        fontSize: 9,
        cellPadding: 3
      }
    });

    // Save
    doc.save(filename);
    showToast("PDF Exported", `Report saved as: ${filename}`, "success");
  } catch (error) {
    console.error("PDF generation failed:", error);
    showToast("PDF Export Failed", "Error compiling elements.", "error");
  }
}
