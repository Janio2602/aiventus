import { LineChart, Line, CartesianGrid, Legend } from "recharts";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx";
import { useRef, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";

function exportToExcel(data, sheetName = "Data") {
  const exportData = [...data, {}, { Note: "BY JANIO VILLALBA" }];
  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${sheetName}.xlsx`);
}

function calculateMonthlySpending(supplies) {
  const spending = {};
  supplies.forEach(({ requestedDate, stock, price }) => {
    const month = requestedDate?.slice(0, 7);
    if (!month) return;
    if (!spending[month]) spending[month] = 0;
    spending[month] += stock * price;
  });
  return Object.entries(spending).map(([month, amount]) => ({ month, amount }));
}

function generateAISuggestions(supplies) {
  const suggestions = [];
  supplies.forEach((supply) => {
    if (supply.stock < 5) {
      suggestions.push(`Low stock warning: "${supply.item}" is below 5 units.`);
    }
    const today = new Date();
    const requested = new Date(supply.requestedDate);
    if (supply.requestedDate && !supply.receivedDate && (today - requested) / (1000 * 60 * 60 * 24) > 3) {
      suggestions.push(`Delivery delay: "${supply.item}" has not arrived since ${supply.requestedDate}.`);
    }
  });
  if (suggestions.length === 0) {
    suggestions.push("No urgent recommendations at this time.");
  }
  return suggestions;
}

export function getAISuggestionsFromSupplies(supplies) {
  return generateAISuggestions(supplies).join("\n");
}

export function respondToChatMessage(message, supplies) {
  const lower = message.toLowerCase();
  if (lower.includes("supply") || lower.includes("stock") || lower.includes("recommendation")) {
    return getAISuggestionsFromSupplies(supplies);
  }
  return null;
}

export default function Dashboard({ supplies = [], setSupplies = () => {}, projectChart = [] }) {
  const fileInputRef = useRef(null);
  const [editedSupplies, setEditedSupplies] = useState(supplies);
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    const generated = generateAISuggestions(editedSupplies);
    setSuggestions(generated);
    if (generated.length > 0 && generated[0] !== "No urgent recommendations at this time.") {
      setChatLog((prev) => [...prev, { sender: 'AI Assistant', text: generated.join("\n") }]);
    }
  }, [editedSupplies]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);
      setSupplies(data);
      setEditedSupplies(data);
    };
    reader.readAsBinaryString(file);
  };

  const handleEdit = (index, field, value) => {
    const updated = [...editedSupplies];
    updated[index][field] = value;
    setEditedSupplies(updated);
    setSupplies(updated);
  };

  useEffect(() => {
    const generated = generateAISuggestions(editedSupplies);
    if (generated.length > 0 && generated[0] !== "No urgent recommendations at this time.") {
      const toast = document.createElement("div");
      toast.textContent = "⚠️ AI Recommendations Available - Check Chat or Dashboard";
      toast.className = "fixed top-4 right-4 bg-yellow-400 text-black p-3 rounded shadow-lg z-50 animate-bounce";
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 6000);
    }
  }, []);

  return null; // Reemplazado con solo lógica para exportación
}
