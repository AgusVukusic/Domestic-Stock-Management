import React, { useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X } from 'lucide-react';

const BarcodeScanner = ({ onScan, onClose }) => {
  useEffect(() => {
    const html5QrCode = new Html5Qrcode("reader");
    let isScanning = false;

    html5QrCode.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => {
        if (isScanning) {
          isScanning = false;
          html5QrCode.stop().then(() => {
            onScan(decodedText);
          }).catch(err => console.error("Error stopping scanner", err));
        }
      },
      (error) => {
        // Silently ignore scan errors
      }
    ).then(() => {
      isScanning = true;
    }).catch(err => {
      console.error("Error starting environment camera", err);
      // Fallback
      html5QrCode.start(
        { facingMode: "user" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          if (isScanning) {
            isScanning = false;
            html5QrCode.stop().then(() => onScan(decodedText));
          }
        },
        () => {}
      ).then(() => {
        isScanning = true;
      }).catch(e => alert("No se pudo acceder a la cámara. Por favor verifica los permisos."));
    });

    return () => {
      if (isScanning) {
        html5QrCode.stop().catch(error => {
          console.error("Failed to clear scanner ", error);
        });
      }
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
