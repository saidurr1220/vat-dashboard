"use client";

import { useState } from "react";
import Link from "next/link";

interface UploadResult {
  success: boolean;
  message: string;
  imported?: number;
  errors?: string[];
}

export default function ImportsUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      if (!selectedFile.name.toLowerCase().endsWith(".csv")) {
        alert("Please select a CSV file");
        return;
      }
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file first");
      return;
    }

    setUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/imports/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        setFile(null);
        // Reset file input
        const fileInput = document.getElementById(
          "file-input"
        ) as HTMLInputElement;
        if (fileInput) {
          fileInput.value = "";
        }
      }
    } catch (error) {
      console.error("Upload error:", error);
      setResult({
        success: false,
        message: "Failed to upload file. Please try again.",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Import BoE Data</h1>
          <p className="text-gray-600">
            Upload CSV file containing Bill of Entry records
          </p>
        </div>
        <Link
          href="/imports"
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium"
        >
          Back to Imports
        </Link>
      </div>

      <div className="max-w-2xl">
        {/* Upload Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Upload CSV File</h2>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="file-input"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Select CSV File
              </label>
              <input
                id="file-input"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            {file && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  Selected File:
                </h3>
                <div className="text-sm text-gray-600">
                  <p>
                    <strong>Name:</strong> {file.name}
                  </p>
                  <p>
                    <strong>Size:</strong> {(file.size / 1024).toFixed(2)} KB
                  </p>
                  <p>
                    <strong>Type:</strong> {file.type || "text/csv"}
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              {uploading ? "Uploading..." : "Upload and Import"}
            </button>
          </div>
        </div>

        {/* Result */}
        {result && (
          <div
            className={`rounded-lg p-6 ${
              result.success
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            <div
              className={`flex items-center mb-3 ${
                result.success ? "text-green-800" : "text-red-800"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full mr-3 ${
                  result.success ? "bg-green-500" : "bg-red-500"
                }`}
              ></div>
              <h3 className="font-medium">
                {result.success ? "Upload Successful!" : "Upload Failed"}
              </h3>
            </div>

            <p
              className={`mb-3 ${
                result.success ? "text-green-700" : "text-red-700"
              }`}
            >
              {result.message}
            </p>

            {result.success && result.imported && (
              <div className="text-green-700">
                <p>
                  <strong>Records imported:</strong> {result.imported}
                </p>
                <Link
                  href="/imports"
                  className="inline-block mt-3 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
                >
                  View Imported Records
                </Link>
              </div>
            )}

            {result.errors && result.errors.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-red-800 mb-2">Errors:</h4>
                <ul className="list-disc list-inside text-red-700 text-sm space-y-1">
                  {result.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* CSV Format Guide */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">CSV Format Requirements</h2>
            <a
              href="/sample-boe-import.csv"
              download
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium text-sm"
            >
              Download Sample CSV
            </a>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">
                Required Columns:
              </h3>
              <div className="bg-gray-50 rounded p-3 text-sm font-mono">
                boe_no, boe_date, office_code, item_no, hs_code, description,
                assessable_value, base_vat, sd, vat, at, qty, unit
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">Example Row:</h3>
              <div className="bg-gray-50 rounded p-3 text-sm font-mono overflow-x-auto">
                BOE123456, 2025-10-15, DHK001, 1, 6403.99.00, Footwear, 50000,
                7500, 0, 8625, 0, 100, Pair
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">Notes:</h3>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                <li>Date format should be YYYY-MM-DD</li>
                <li>Numeric values should not contain currency symbols</li>
                <li>Use comma (,) as the delimiter</li>
                <li>First row should contain column headers</li>
                <li>Duplicate BoE numbers will be skipped</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
