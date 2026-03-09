"use client";

import React, { FC, useState, useCallback } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";

const CUSTOMERS_IMPORT_COLUMNS = [
  "id_customer",
  "name",
  "cif",
  "country",
  "address",
  "phone",
  "email",
  "website",
  "industry",
  "segment",
  "owner",
  "source",
  "status",
  "contact_name",
  "contact_role",
  "contact_email",
  "contact_phone",
] as const;

const EXPECTED_STRUCTURE = `La primera fila debe ser la cabecera con exactamente estas columnas (en cualquier orden):
${CUSTOMERS_IMPORT_COLUMNS.join(" | ")}

Ejemplo (cuenta/empresa + contacto principal):
id_customer | name                    | cif        | country | address              | phone           | email              | website    | industry        | segment  | owner          | source | status  | contact_name      | contact_role           | contact_email           | contact_phone
cust-005    | Nuevas Ventanas S.L.   | B11222333  | España  | C/ Mayor 1, Madrid   | +34 911 222 333 | info@nuevasv.es    | https://.. | Carpintería      | Empresa  | Laura Martínez | Web    | activo | Juan López        | Director Comercial     | j.lopez@nuevasv.es      | +34 600 111 222`;

type ImportPhase = "upload" | "processing" | "result";

function parseCSV(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length === 0) return [];
  return lines.map((line) => {
    const row: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        inQuotes = !inQuotes;
      } else if ((c === "," || c === ";") && !inQuotes) {
        row.push(current.trim());
        current = "";
      } else {
        current += c;
      }
    }
    row.push(current.trim());
    return row;
  });
}

function parseFileToRows(file: File): Promise<string[][]> {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "csv") {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result ?? "");
        resolve(parseCSV(text));
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file, "UTF-8");
    });
  }
  if (ext === "xlsx" || ext === "xls") {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = new Uint8Array(reader.result as ArrayBuffer);
          const wb = XLSX.read(data, { type: "array" });
          const firstSheet = wb.SheetNames[0];
          const sheet = wb.Sheets[firstSheet];
          const rows = XLSX.utils.sheet_to_json<string[]>(sheet, {
            header: 1,
            defval: "",
          }) as string[][];
          resolve(rows);
        } catch (e) {
          reject(e);
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  }
  return Promise.reject(new Error("Formato no soportado. Use CSV o Excel (.xlsx)."));
}

function validateRows(rows: string[][]): { valid: boolean; error?: string; count?: number } {
  if (!rows.length) return { valid: false, error: "El archivo está vacío." };
  const header = rows[0].map((c) => String(c).trim().toLowerCase());
  const normalizedExpected = CUSTOMERS_IMPORT_COLUMNS.map((c) => c.toLowerCase());
  for (const col of normalizedExpected) {
    if (!header.includes(col)) {
      return {
        valid: false,
        error: `Falta la columna requerida: ${col}. Cabecera encontrada: ${header.join(", ")}`,
      };
    }
  }
  const dataRows = rows.slice(1).filter((row) => row.some((cell) => String(cell).trim() !== ""));
  return { valid: true, count: dataRows.length };
}

const ImportCustomersPage: FC = () => {
  const [phase, setPhase] = useState<ImportPhase>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [validation, setValidation] = useState<{
    valid: boolean;
    error?: string;
    count?: number;
  } | null>(null);
  const [importResult, setImportResult] = useState<{ success: number; errors: number } | null>(null);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setFile(f ?? null);
    setValidation(null);
    if (!f) return;
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (ext !== "csv" && ext !== "xlsx" && ext !== "xls") {
      setValidation({
        valid: false,
        error: "Solo se aceptan archivos CSV o Excel (.xlsx, .xls).",
      });
      return;
    }
    parseFileToRows(f)
      .then((rows) => setValidation(validateRows(rows)))
      .catch(() =>
        setValidation({
          valid: false,
          error: "No se pudo leer el archivo. Revise el formato.",
        })
      );
  }, []);

  const handleContinue = useCallback(() => {
    if (!validation?.valid || !file) return;
    setPhase("processing");
    setImportResult(null);
    setTimeout(() => {
      setImportResult({ success: validation.count ?? 0, errors: 0 });
      setPhase("result");
    }, 2000);
  }, [validation, file]);

  const backUrl = "/logged/pages/management/sm/customers_db";

  return (
    <div className="flex flex-col w-full min-w-0 bg-white">
      <div className="w-full flex items-center justify-between gap-4 bg-blue-950/70 p-5 text-white">
        <p className="text-2xl">Importar cuentas (Companies)</p>
        <Link
          href={backUrl}
          className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
        >
          ← Volver a Customers
        </Link>
      </div>

      <div className="p-12 w-full max-w-2xl">
        {phase === "upload" && (
          <>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <p className="text-sm font-semibold text-amber-800 mb-2">
                Estructura esperada (Excel o CSV) — Cuentas / Empresas
              </p>
              <pre className="text-xs text-amber-900 whitespace-pre-wrap font-sans overflow-x-auto">
                {EXPECTED_STRUCTURE}
              </pre>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
              <p className="text-sm font-semibold text-gray-700">Subir archivo</p>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={onFileChange}
                className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
              />
              {file && (
                <p className="text-xs text-gray-500">
                  Archivo: <span className="font-medium">{file.name}</span>
                </p>
              )}
              {validation && !validation.valid && (
                <p className="text-sm text-red-600">{validation.error}</p>
              )}
              {validation?.valid && (
                <p className="text-sm text-green-600">
                  Archivo válido. {validation.count} fila(s) de datos.
                </p>
              )}
              <button
                type="button"
                onClick={handleContinue}
                disabled={!validation?.valid}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continuar
              </button>
            </div>
          </>
        )}

        {phase === "processing" && (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
            <div className="inline-block w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-700">Procesando importación...</p>
            <p className="text-sm text-gray-500 mt-1">Espere un momento.</p>
          </div>
        )}

        {phase === "result" && importResult && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
            <p className="text-sm font-semibold text-gray-700">Resultado de la importación</p>
            <p className="text-gray-600">
              Cuentas importadas: <span className="font-medium text-green-600">{importResult.success}</span>
              {importResult.errors > 0 && (
                <span className="ml-2">
                  | Errores: <span className="font-medium text-red-600">{importResult.errors}</span>
                </span>
              )}
            </p>
            <div className="flex gap-3 pt-4">
              <Link
                href={backUrl}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Volver a Customers
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportCustomersPage;
