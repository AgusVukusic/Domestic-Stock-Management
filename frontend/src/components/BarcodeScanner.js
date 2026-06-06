import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X } from 'lucide-react';

const BarcodeScanner = ({ onScan, onClose }) => {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    scanner.render(
      (decodedText) => {
        scanner.clear();
        onScan(decodedText);
      },
      (error) => {
        // Silently ignore scan errors (it errors on every frame that doesn't have a barcode)
      }
    );

    return () => {
      scanner.clear().catch(error => {
        console.error("Failed to clear html5QrcodeScanner. ", error);
      });
    };
  }, [onScan]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
        <div className="modal-header">
          <h2>Escanear Código de Barras</h2>
          <button className="modal-close" onClick={onClose}><X size={24} /></button>
        </div>
        <div className="modal-body" style={{ padding: '20px', textAlign: 'center' }}>
          <div id="reader" style={{ width: '100%', border: 'none', borderRadius: '12px', overflow: 'hidden' }}></div>
          <p style={{ marginTop: '15px', color: 'var(--text-secondary)' }}>
            Apunta la cámara al código de barras del producto.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;
