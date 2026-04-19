"use client";

import React from "react";

import { useEffect, useState, useRef } from "react";
import { getRegistros, deleteRegistro, updateRegistro } from "@/lib/storage";
import { filtrarPorPeriodo, calcularTotales } from "@/lib/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { TrendingUp, TrendingDown, Wallet, Fuel } from "lucide-react";
import SelectorFecha from "@/components/SelectorFecha";
import TablaRegistros from "@/components/TablaRegistros";

type TipoPeriodo = "dia" | "semana" | "mes";

// ─── helpers ────────────────────────────────────────────────────────────────

const toNumber = (v: any): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const formatCOP = (n: number) =>
  new Intl.NumberFormat("es-CO").format(Math.round(toNumber(n)));

// ─── sub-components ─────────────────────────────────────────────────────────

interface KPIProps {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  valueColor?: string;
}

function KPICard({ label, value, sub, icon, iconBg, iconColor, valueColor }: KPIProps) {
  return (
    <div
      style={{
        background: "#ffffff",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span
          style={{
            fontSize: 12,
            color: "var(--color-text-secondary)",
            letterSpacing: ".01em",
          }}
        >
          {label}
        </span>
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: "var(--border-radius-md)",
            background: iconBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: iconColor,
          }}
        >
          <span style={{ width: 15, height: 15, display: "flex" }}>{icon}</span>
        </div>
      </div>
      <div
        style={{
          fontSize: 20,
          fontWeight: 500,
          color: valueColor ?? "var(--color-text-primary)",
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>{sub}</div>
    </div>
  );
}

// ─── ring progress ───────────────────────────────────────────────────────────

interface RingProps {
  pct: number; // 0-100
}

function RingProgress({ pct }: RingProps) {
  const r = 50;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(pct, 100) / 100) * circ;

  return (
    <div style={{ position: "relative", width: 120, height: 120 }}>
      <svg
        viewBox="0 0 120 120"
        width={120}
        height={120}
        style={{ transform: "rotate(-90deg)" }}
      >
        <circle cx={60} cy={60} r={r} fill="none" stroke="#EEEDFE" strokeWidth={10} />
        <circle
          cx={60}
          cy={60}
          r={r}
          fill="none"
          stroke="#534AB7"
          strokeWidth={10}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span style={{ fontSize: 22, fontWeight: 500, color: "var(--color-text-primary)" }}>
          {Math.round(pct)}%
        </span>
        <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>logrado</span>
      </div>
    </div>
  );
}

// ─── mini progress bar ────────────────────────────────────────────────────────

function MiniBar({ label, value, pct, color }: { label: string; value: string; pct: number; color: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
        <span style={{ color: "var(--color-text-secondary)" }}>{label}</span>
        <span style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>{value}</span>
      </div>
      <div
        style={{
          width: "100%",
          height: 5,
          background: "var(--color-background-secondary)",
          borderRadius: 99,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${Math.min(pct, 100)}%`,
            background: color,
            borderRadius: 99,
          }}
        />
      </div>
    </div>
  );
}

// ─── custom tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "var(--color-background-primary)",
        border: "0.5px solid var(--color-border-secondary)",
        borderRadius: "var(--border-radius-md)",
        padding: "8px 12px",
        fontSize: 12,
      }}
    >
      <p style={{ color: "var(--color-text-secondary)", marginBottom: 4 }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color, fontWeight: 500 }}>
          {p.dataKey === "ingreso" ? "Ingresos" : "Gastos"}: ${formatCOP(p.value)}
        </p>
      ))}
    </div>
  );
}

// ─── status badge ─────────────────────────────────────────────────────────────

function Badge({ positive }: { positive: boolean }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 99,
        fontSize: 11,
        fontWeight: 500,
        background: positive ? "#EAF3DE" : "#FCEBEB",
        color: positive ? "#3B6D11" : "#A32D2D",
      }}
    >
      {positive ? "Positivo" : "Negativo"}
    </span>
  );
}

// ─── editable meta ───────────────────────────────────────────────────────────

const META_KEY = "dashboard_meta_mensual";
const META_DEFAULT = 4_000_000;

function useMetaMensual() {
  const [meta, setMetaState] = useState<number>(() => {
    if (typeof window === "undefined") return META_DEFAULT;
    const stored = localStorage.getItem(META_KEY);
    const parsed = stored ? Number(stored) : NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : META_DEFAULT;
  });

  const setMeta = (value: number) => {
    setMetaState(value);
    if (typeof window !== "undefined") localStorage.setItem(META_KEY, String(value));
  };

  return [meta, setMeta] as const;
}

interface MetaEditorProps {
  meta: number;
  onSave: (value: number) => void;
}

function MetaEditor({ meta, onSave }: MetaEditorProps) {
  const [editing, setEditing] = useState(false);
  const [raw, setRaw] = useState("");

  const open = () => {
    setRaw(String(meta));
    setEditing(true);
  };

  const confirm = () => {
    const n = Number(raw.replace(/\D/g, ""));
    if (Number.isFinite(n) && n > 0) onSave(n);
    setEditing(false);
  };

  const cancel = () => setEditing(false);

  if (!editing) {
    return (
      <button
        onClick={open}
        title="Editar meta"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "2px 4px",
          borderRadius: 4,
          color: "var(--color-text-tertiary)",
          display: "flex",
          alignItems: "center",
          fontSize: 12,
          transition: "color .15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-text-secondary)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-tertiary)")}
      >
        {/* pencil icon */}
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </button>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>$</span>
      <input
        autoFocus
        type="text"
        inputMode="numeric"
        value={raw}
        onChange={(e) => setRaw(e.target.value.replace(/\D/g, ""))}
        onKeyDown={(e) => { if (e.key === "Enter") confirm(); if (e.key === "Escape") cancel(); }}
        style={{
          width: 100,
          fontSize: 12,
          padding: "3px 6px",
          border: "0.5px solid var(--color-border-secondary)",
          borderRadius: "var(--border-radius-md)",
          background: "var(--color-background-primary)",
          color: "var(--color-text-primary)",
          outline: "none",
        }}
      />
      <button
        onClick={confirm}
        style={{
          fontSize: 11,
          padding: "3px 8px",
          border: "0.5px solid #534AB7",
          borderRadius: "var(--border-radius-md)",
          background: "#534AB7",
          color: "#fff",
          cursor: "pointer",
        }}
      >
        Ok
      </button>
      <button
        onClick={cancel}
        style={{
          fontSize: 11,
          padding: "3px 8px",
          border: "0.5px solid var(--color-border-tertiary)",
          borderRadius: "var(--border-radius-md)",
          background: "transparent",
          color: "var(--color-text-secondary)",
          cursor: "pointer",
        }}
      >
        ✕
      </button>
    </div>
  );
}

// ─── row editor modal ─────────────────────────────────────────────────────────

interface RowEditorProps {
  registro: any;
  onSave: (updated: any) => void;
  onCancel: () => void;
}

function RowEditor({ registro, onSave, onCancel }: RowEditorProps) {
  const [form, setForm] = useState({
    fecha: registro.fecha ?? "",
    ingreso: String(registro.ingreso ?? ""),
    combustible: String(registro.combustible ?? ""),
    otrosGastos: String(registro.otrosGastos ?? ""),
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const fieldStyle: React.CSSProperties = {
    width: "100%",
    fontSize: 13,
    padding: "6px 8px",
    border: "0.5px solid var(--color-border-secondary)",
    borderRadius: "var(--border-radius-md)",
    background: "#ffffff",
    color: "var(--color-text-primary)",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    color: "var(--color-text-secondary)",
    marginBottom: 4,
    display: "block",
    textTransform: "uppercase",
    letterSpacing: ".04em",
    fontWeight: 500,
  };

  return (
    <tr>
      <td
        colSpan={7}
        style={{ padding: "12px 10px", background: "#f9f8ff", borderBottom: "0.5px solid var(--color-border-tertiary)" }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
            gap: 12,
            alignItems: "end",
          }}
        >
          <div>
            <label style={labelStyle}>Fecha</label>
            <input type="date" value={form.fecha} onChange={(e) => set("fecha", e.target.value)} style={fieldStyle} />
          </div>
          <div>
            <label style={labelStyle}>Ingreso</label>
            <input type="number" value={form.ingreso} onChange={(e) => set("ingreso", e.target.value)} style={fieldStyle} />
          </div>
          <div>
            <label style={labelStyle}>Combustible</label>
            <input type="number" value={form.combustible} onChange={(e) => set("combustible", e.target.value)} style={fieldStyle} />
          </div>
          <div>
            <label style={labelStyle}>Otros gastos</label>
            <input type="number" value={form.otrosGastos} onChange={(e) => set("otrosGastos", e.target.value)} style={fieldStyle} />
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={() =>
                onSave({
                  ...registro,
                  fecha: form.fecha,
                  ingreso: Number(form.ingreso),
                  combustible: Number(form.combustible),
                  otrosGastos: Number(form.otrosGastos),
                })
              }
              style={{
                flex: 1,
                padding: "7px 0",
                fontSize: 12,
                fontWeight: 500,
                border: "none",
                borderRadius: "var(--border-radius-md)",
                background: "#534AB7",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              Guardar
            </button>
            <button
              onClick={onCancel}
              style={{
                flex: 1,
                padding: "7px 0",
                fontSize: 12,
                border: "0.5px solid var(--color-border-tertiary)",
                borderRadius: "var(--border-radius-md)",
                background: "transparent",
                color: "var(--color-text-secondary)",
                cursor: "pointer",
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

const PERIODOS: TipoPeriodo[] = ["dia", "semana", "mes"];

export default function Dashboard() {
  const [tipo, setTipo] = useState<TipoPeriodo>("semana");
  const [fecha, setFecha] = useState("");
  const [metaMensual, setMetaMensual] = useMetaMensual();

  const [totales, setTotales] = useState({ ingreso: 0, combustible: 0, otros: 0 });
  const [totalesMes, setTotalesMes] = useState({ ingreso: 0, combustible: 0, otros: 0 });
  const [dataGrafica, setDataGrafica] = useState<any[]>([]);
  const [registrosFiltrados, setRegistrosFiltrados] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const recargar = () => {
    if (!fecha) return;
    const registros = getRegistros() || [];
    const filtrados = filtrarPorPeriodo(registros, tipo, fecha) || [];
    const tot = calcularTotales(filtrados) || {};
    setTotales({
      ingreso: toNumber(tot.ingreso),
      combustible: toNumber(tot.combustible),
      otros: toNumber(tot.otros),
    });
    const filtradosMes = filtrarPorPeriodo(registros, "mes", fecha) || [];
    const totMes = calcularTotales(filtradosMes) || {};
    setTotalesMes({
      ingreso: toNumber(totMes.ingreso),
      combustible: toNumber(totMes.combustible),
      otros: toNumber(totMes.otros),
    });
    setDataGrafica(
      filtrados.map((r: any) => ({
        fecha: r.fecha,
        ingreso: toNumber(r.ingreso),
        gastos: toNumber(r.combustible) + toNumber(r.otrosGastos),
      }))
    );
    setRegistrosFiltrados(filtrados);
  };

  useEffect(() => {
    setFecha(new Date().toISOString().split("T")[0]);
  }, []);

  useEffect(() => {
    recargar();
  }, [tipo, fecha]);

  // derived values
  const gastos = totales.combustible + totales.otros;
  const balance = totales.ingreso - gastos;
  const gastosMes = totalesMes.combustible + totalesMes.otros;
  const balanceMes = totalesMes.ingreso - gastosMes;
  const pctMeta = metaMensual > 0 ? (balanceMes / metaMensual) * 100 : 0;
  const pctIngresos = metaMensual > 0 ? (totalesMes.ingreso / metaMensual) * 100 : 0;
  const pctGastos = totalesMes.ingreso > 0 ? (gastosMes / totalesMes.ingreso) * 100 : 0;

  return (
    <div
      style={{
        background: "#f4f4f5",
        minHeight: "100vh",
        width: "100%",
        padding: "1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
        fontFamily: "var(--font-sans)",
        boxSizing: "border-box",
      }}
    >
      {/* ── header / controls ── */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 500, color: "var(--color-text-primary)", margin: 0 }}>
            Panel financiero
          </h1>
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginTop: 2 }}>
            Resumen del período seleccionado
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {/* period tabs */}
          <div
            style={{
              display: "flex",
              background: "#ffffff",
              border: "0.5px solid var(--color-border-tertiary)",
              borderRadius: "var(--border-radius-md)",
              overflow: "hidden",
            }}
          >
            {PERIODOS.map((p, i) => {
              const active = tipo === p;
              return (
                <button
                  key={p}
                  onClick={() => setTipo(p)}
                  style={{
                    padding: "7px 18px",
                    fontSize: 13,
                    border: "none",
                    borderRight: i < PERIODOS.length - 1 ? "0.5px solid var(--color-border-tertiary)" : "none",
                    cursor: "pointer",
                    fontWeight: active ? 500 : 400,
                    background: active ? "#534AB7" : "transparent",
                    color: active ? "#ffffff" : "var(--color-text-secondary)",
                    transition: "background .15s, color .15s",
                    borderRadius: 0,
                    letterSpacing: active ? ".01em" : "normal",
                  }}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              );
            })}
          </div>

          <SelectorFecha value={fecha} onChange={setFecha} />
        </div>
      </div>

      {/* ── KPI cards ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 12,
        }}
      >
        <KPICard
          label="Ingresos"
          value={`$${formatCOP(totales.ingreso)}`}
          sub="período actual"
          iconBg="#EAF3DE"
          iconColor="#3B6D11"
          valueColor="#3B6D11"
          icon={<TrendingUp size={15} />}
        />
        <KPICard
          label="Gastos"
          value={`$${formatCOP(gastos)}`}
          sub="período actual"
          iconBg="#FCEBEB"
          iconColor="#A32D2D"
          valueColor="#A32D2D"
          icon={<TrendingDown size={15} />}
        />
        <KPICard
          label="Balance"
          value={`$${formatCOP(balance)}`}
          sub={balance >= 0 ? "positivo" : "negativo"}
          iconBg={balance >= 0 ? "#EEEDFE" : "#FCEBEB"}
          iconColor={balance >= 0 ? "#3C3489" : "#A32D2D"}
          valueColor={balance >= 0 ? "#3C3489" : "#A32D2D"}
          icon={<Wallet size={15} />}
        />
        <KPICard
          label="Combustible"
          value={`$${formatCOP(totales.combustible)}`}
          sub="gasto principal"
          iconBg="#FAEEDA"
          iconColor="#854F0B"
          icon={<Fuel size={15} />}
        />
      </div>

      {/* ── meta + chart ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0,1fr) minmax(0,2fr)",
          gap: "1.5rem",
        }}
      >
        {/* meta card */}
        <div
          style={{
            background: "#ffffff",
            border: "0.5px solid var(--color-border-tertiary)",
            borderRadius: "var(--border-radius-lg)",
            padding: "1.25rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: "var(--color-text-secondary)",
                letterSpacing: ".06em",
                textTransform: "uppercase",
              }}
            >
              Meta mensual
            </span>
            <MetaEditor meta={metaMensual} onSave={setMetaMensual} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
            <RingProgress pct={pctMeta} />
            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
              <MiniBar
                label="Ingresos"
                value={`$${formatCOP(totalesMes.ingreso)}`}
                pct={pctIngresos}
                color="#639922"
              />
              <MiniBar
                label="Gastos"
                value={`$${formatCOP(gastosMes)}`}
                pct={pctGastos}
                color="#E24B4A"
              />
              <MiniBar
                label="Meta"
                value={`$${formatCOP(metaMensual)}`}
                pct={100}
                color="#534AB7"
              />
            </div>
          </div>
        </div>

        {/* chart card */}
        <div
          style={{
            background: "#ffffff",
            border: "0.5px solid var(--color-border-tertiary)",
            borderRadius: "var(--border-radius-lg)",
            padding: "1.25rem",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1rem",
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: "var(--color-text-secondary)",
                letterSpacing: ".06em",
                textTransform: "uppercase",
              }}
            >
              Ingresos vs Gastos
            </span>

            {/* legend */}
            <div style={{ display: "flex", gap: 16 }}>
              {[
                { color: "#639922", label: "Ingresos" },
                { color: "#E24B4A", label: "Gastos" },
              ].map(({ color, label }) => (
                <span
                  key={label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: 12,
                    color: "var(--color-text-secondary)",
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: color,
                      display: "inline-block",
                    }}
                  />
                  {label}
                </span>
              ))}
            </div>
          </div>

          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={dataGrafica} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,.05)" vertical={false} />
              <XAxis
                dataKey="fecha"
                tick={{ fontSize: 11, fill: "#888" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#888" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                dataKey="ingreso"
                stroke="#639922"
                strokeWidth={2}
                dot={{ r: 3, fill: "#639922", strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
              <Line
                dataKey="gastos"
                stroke="#E24B4A"
                strokeWidth={2}
                strokeDasharray="5 4"
                dot={{ r: 3, fill: "#E24B4A", strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── tabla ── */}
      <div
        style={{
          background: "#ffffff",
          border: "0.5px solid var(--color-border-tertiary)",
          borderRadius: "var(--border-radius-lg)",
          padding: "1.25rem",
          overflowX: "auto",
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: "var(--color-text-secondary)",
            letterSpacing: ".06em",
            textTransform: "uppercase",
            display: "block",
            marginBottom: "1rem",
          }}
        >
          Registros recientes
        </span>

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
              {["Fecha", "Ingreso", "Combustible", "Otros gastos", "Balance", "Estado", ""].map((h, i) => (
                <th
                  key={i}
                  style={{
                    padding: "8px 10px",
                    fontSize: 11,
                    fontWeight: 500,
                    color: "var(--color-text-secondary)",
                    textAlign: i === 6 ? "right" : "left",
                    letterSpacing: ".04em",
                    textTransform: "uppercase",
                    whiteSpace: "nowrap",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {registrosFiltrados.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    padding: "2rem 10px",
                    textAlign: "center",
                    color: "var(--color-text-tertiary)",
                    fontSize: 13,
                  }}
                >
                  No hay registros para este período
                </td>
              </tr>
            ) : (
              registrosFiltrados.map((r: any, i: number) => {
                const rowId = r.id ?? String(i);
                const bal = toNumber(r.ingreso) - toNumber(r.combustible) - toNumber(r.otrosGastos);
                const isLast = i === registrosFiltrados.length - 1;
                const isEditing = editingId === rowId;

                return (
                  <React.Fragment key={rowId}>
                    <tr
                      style={{
                        borderBottom: isLast && !isEditing ? "none" : "0.5px solid var(--color-border-tertiary)",
                        background: isEditing ? "#f9f8ff" : "transparent",
                      }}
                    >
                      <td style={{ padding: "9px 10px", color: "var(--color-text-primary)" }}>{r.fecha}</td>
                      <td style={{ padding: "9px 10px", color: "#3B6D11", fontWeight: 500 }}>
                        ${formatCOP(r.ingreso)}
                      </td>
                      <td style={{ padding: "9px 10px", color: "var(--color-text-primary)" }}>
                        ${formatCOP(r.combustible)}
                      </td>
                      <td style={{ padding: "9px 10px", color: "var(--color-text-primary)" }}>
                        ${formatCOP(r.otrosGastos)}
                      </td>
                      <td style={{ padding: "9px 10px", fontWeight: 500, color: bal >= 0 ? "#3C3489" : "#A32D2D" }}>
                        ${formatCOP(bal)}
                      </td>
                      <td style={{ padding: "9px 10px" }}>
                        <Badge positive={bal >= 0} />
                      </td>
                      <td style={{ padding: "9px 10px", textAlign: "right", whiteSpace: "nowrap" }}>
                        {/* edit button */}
                        <button
                          onClick={() => setEditingId(isEditing ? null : rowId)}
                          title={isEditing ? "Cancelar" : "Editar"}
                          style={{
                            background: isEditing ? "#EEEDFE" : "transparent",
                            border: "0.5px solid " + (isEditing ? "#AFA9EC" : "var(--color-border-tertiary)"),
                            borderRadius: 6,
                            padding: "4px 7px",
                            cursor: "pointer",
                            color: isEditing ? "#534AB7" : "var(--color-text-secondary)",
                            marginRight: 4,
                            lineHeight: 0,
                          }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        {/* delete button */}
                        <button
                          onClick={() => {
                            if (window.confirm("¿Eliminar este registro?")) {
                              deleteRegistro(r.fecha);
                              recargar();
                            }
                          }}
                          title="Eliminar"
                          style={{
                            background: "transparent",
                            border: "0.5px solid var(--color-border-tertiary)",
                            borderRadius: 6,
                            padding: "4px 7px",
                            cursor: "pointer",
                            color: "var(--color-text-secondary)",
                            lineHeight: 0,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#FCEBEB";
                            e.currentTarget.style.border = "0.5px solid #F09595";
                            e.currentTarget.style.color = "#A32D2D";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.border = "0.5px solid var(--color-border-tertiary)";
                            e.currentTarget.style.color = "var(--color-text-secondary)";
                          }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                            <path d="M10 11v6M14 11v6"/>
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                          </svg>
                        </button>
                      </td>
                    </tr>
                    {isEditing && (
                      <RowEditor
                        key={`edit-${rowId}`}
                        registro={r}
                        onSave={(updated) => {
                          updateRegistro(updated);
                          setEditingId(null);
                          recargar();
                        }}
                        onCancel={() => setEditingId(null)}
                      />
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
