"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  Download,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

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
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/imports"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Imports
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Bulk Import BoE Data
          </h1>
          <p className="text-gray-600">
            Upload CSV file containing Bill of Entry records
          </p>
        </div>
      </div>

      <div className="max-w-4xl">
        {/* Upload Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <Upload className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Upload CSV File
            </h2>
          </div>

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
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center gap-3 mb-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-medium text-blue-900">
                    Selected File:
                  </h3>
                </div>
                <div className="text-sm text-blue-800 space-y-1">
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
              className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-3 rounded-lg font-medium transition-colors"
            >
              <Upload className="w-4 h-4" />
              {uploading ? "Processing..." : "Upload and Import"}
            </button>
          </div>
        </div>

        {/* Modern Result Notification */}
        {result && (
          <div
            className={`p-6 rounded-lg shadow ${
              result.success
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            <div
              className={`flex items-center gap-3 mb-4 ${
                result.success ? "text-green-800" : "text-red-800"
              }`}
            >
              {result.success ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600" />
              )}
              <h3 className="text-lg font-semibold">
                {result.success ? "Upload Successful!" : "Upload Failed"}
              </h3>
            </div>

            <p
              className={`mb-4 ${
                result.success ? "text-green-700" : "text-red-700"
              }`}
            >
              {result.message}
            </p>

            {result.success && result.imported && (
              <div className="bg-white rounded-lg p-4 border border-green-200 mb-4">
                <div className="flex items-center gap-2 text-green-800 mb-2">
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-medium">Import Summary</span>
                </div>
                <p className="text-green-700">
                  <strong>{result.imported}</strong> records imported
                  successfully
                </p>
                <Link
                  href="/imports"
                  className="inline-flex items-center gap-2 mt-3 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  View Imported Records
                </Link>
              </div>
            )}

            {result.errors && result.errors.length > 0 && (
              <div className="bg-white rounded-lg p-4 border border-red-200">
                <div className="flex items-center gap-2 text-red-800 mb-3">
                  <AlertCircle className="w-4 h-4" />
                  <h4 className="font-medium">
                    Import Errors ({result.errors.length})
                  </h4>
                </div>
                <div className="max-h-40 overflow-y-auto">
                  <ul className="space-y-1 text-red-700 text-sm">
                    {result.errors.map((error, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-red-400 mt-1">•</span>
                        <span>{error}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {/* CSV Format Guide */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                CSV Format Requirements
              </h2>
            </div>
            <a
              href="/sample-boe-import.csv"
              download
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Sample CSV
            </a>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Required Columns:
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <code className="text-sm text-gray-800 break-all">
                  boe_no, boe_date, office_code, item_no, hs_code, description,
                  assessable_value, base_vat, sd, vat, at, qty, unit
                </code>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Example Row:
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 overflow-x-auto">
                <code className="text-sm text-gray-800 whitespace-nowrap">
                  BOE123456, 2025-10-15, DHK001, 1, 6403.99.00, Footwear, 50000,
                  7500, 0, 8625, 0, 100, Pair
                </code>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                Important Notes:
              </h3>
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <ul className="space-y-2 text-sm text-orange-800">
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-1">•</span>
                    <span>Date format should be YYYY-MM-DD</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-1">•</span>
                    <span>
                      Numeric values should not contain currency symbols
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-1">•</span>
                    <span>Use comma (,) as the delimiter</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-1">•</span>
                    <span>First row should contain column headers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-1">•</span>
                    <span>Duplicate BoE numbers will be skipped</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
