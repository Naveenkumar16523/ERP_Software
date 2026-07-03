import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

export default function RealBarcode({ value, format = "CODE128", width = 1.5, height = 40, displayValue = false, className = "" }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, value, {
          format,
          width,
          height,
          displayValue,
          margin: 0,
          background: "transparent",
          lineColor: "currentColor",
        });
      } catch (err) {
        console.error("Barcode generation failed for", value, err);
      }
    }
  }, [value, format, width, height, displayValue]);

  if (!value) return null;

  return <svg ref={svgRef} className={`max-w-full ${className}`} />;
}
