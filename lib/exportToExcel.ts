// /lib/exportToExcel.ts
// Requiere: npm install xlsx

import * as XLSX from "xlsx";
import { RegistroDiario } from "@/types";

interface ResumenMes {
  ingreso: number;
  combustible: number;
  otros: number;
  balance: number;
  meta: number;
}

const formatCOP = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

export function exportarInformeMensual(
  registros: RegistroDiario[],
  resumen: ResumenMes,
  mesLabel: string // ej: "Abril 2025"
) {
  const wb = XLSX.utils.book_new();

  // ── Hoja 1: Resumen de KPIs ───────────────────────────────────────────────

  const kpiData = [
    ["INFORME MENSUAL", mesLabel],
    [],
    ["Concepto", "Valor"],
    ["Ingresos totales", formatCOP(resumen.ingreso)],
    ["Combustible", formatCOP(resumen.combustible)],
    ["Otros gastos", formatCOP(resumen.otros)],
    ["Total gastos", formatCOP(resumen.combustible + resumen.otros)],
    ["Balance neto", formatCOP(resumen.balance)],
    ["Meta mensual", formatCOP(resumen.meta)],
    ["Cumplimiento de meta", resumen.meta > 0
      ? `${Math.min(Math.round((resumen.balance / resumen.meta) * 100), 100)}%`
      : "—"],
  ];

  const wsKPI = XLSX.utils.aoa_to_sheet(kpiData);

  // anchos de columna
  wsKPI["!cols"] = [{ wch: 26 }, { wch: 20 }];

  // estilo de título (SheetJS community solo soporta anchos; el estilo completo requiere xlsx-style)
  XLSX.utils.book_append_sheet(wb, wsKPI, "Resumen");

  // ── Hoja 2: Registros del mes ─────────────────────────────────────────────

  const headers = [
    "Fecha",
    "Ingreso",
    "Combustible",
    "Otros gastos",
    "Total gastos",
    "Balance",
  ];

  const filas = registros.map((r) => {
    const ingreso = Number(r.ingreso) || 0;
    const combustible = Number(r.combustible) || 0;
    const otros = Number((r as any).otrosGastos) || 0;
    const totalGastos = combustible + otros;
    const balance = ingreso - totalGastos;
    return [
      r.fecha,
      formatCOP(ingreso),
      formatCOP(combustible),
      formatCOP(otros),
      formatCOP(totalGastos),
      formatCOP(balance),
    ];
  });

  // fila de totales al final
  const totalIngreso = registros.reduce((a, r) => a + (Number(r.ingreso) || 0), 0);
  const totalCombustible = registros.reduce((a, r) => a + (Number(r.combustible) || 0), 0);
  const totalOtros = registros.reduce((a, r) => a + (Number((r as any).otrosGastos) || 0), 0);
  const totalGastos = totalCombustible + totalOtros;
  const totalBalance = totalIngreso - totalGastos;

  const filaTotal = [
    "TOTAL",
    formatCOP(totalIngreso),
    formatCOP(totalCombustible),
    formatCOP(totalOtros),
    formatCOP(totalGastos),
    formatCOP(totalBalance),
  ];

  const wsRegistros = XLSX.utils.aoa_to_sheet([headers, ...filas, [], filaTotal]);

  wsRegistros["!cols"] = [
    { wch: 14 }, // Fecha
    { wch: 18 }, // Ingreso
    { wch: 18 }, // Combustible
    { wch: 18 }, // Otros gastos
    { wch: 18 }, // Total gastos
    { wch: 18 }, // Balance
  ];

  XLSX.utils.book_append_sheet(wb, wsRegistros, "Registros");

  // ── Descargar ─────────────────────────────────────────────────────────────

  const nombreArchivo = `informe-${mesLabel.toLowerCase().replace(/\s+/g, "-")}.xlsx`;
  XLSX.writeFile(wb, nombreArchivo);
}