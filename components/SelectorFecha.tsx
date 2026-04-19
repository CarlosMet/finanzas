"use client";

import { useEffect, useState } from "react";

export default function SelectorFecha({ value, onChange }: any) {
  const [fechas, setFechas] = useState<string[]>([]);

  useEffect(() => {
    const hoy = new Date();

    const lista: string[] = [];

    // 🔼 7 días atrás
    for (let i = 7; i > 0; i--) {
      const d = new Date();
      d.setDate(hoy.getDate() - i);
      lista.push(d.toISOString().split("T")[0]);
    }

    // 👉 hoy
    lista.push(hoy.toISOString().split("T")[0]);

    // 🔽 7 días adelante
    for (let i = 1; i <= 7; i++) {
      const d = new Date();
      d.setDate(hoy.getDate() + i);
      lista.push(d.toISOString().split("T")[0]);
    }

    setFechas(lista);
  }, []);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="border p-2 rounded w-full"
    >
      {fechas.map((f, i) => (
        <option key={f} value={f}>
          {i === 7 ? `Hoy (${f})` : f}
        </option>
      ))}
    </select>
  );
}