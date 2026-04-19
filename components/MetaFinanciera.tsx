"use client";

import { useEffect, useState } from "react";
import { getMeta, saveMeta } from "@/lib/storage";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";

export default function MetaFinanciera({ balance }: any) {
  const [meta, setMeta] = useState(0);

  // 🔒 función segura
  const toNumber = (v: any) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  // 🔧 cargar meta segura
  useEffect(() => {
    const m = getMeta();
    setMeta(Number.isFinite(m) && m > 0 ? m : 3000000);
  }, []);

  // 🔐 valores seguros
  const balanceSeguro = toNumber(balance);
  const metaSegura = toNumber(meta);

  // 🔥 cálculo blindado
  const progreso =
    metaSegura > 0
      ? Math.max(
          0,
          Math.min((balanceSeguro / metaSegura) * 100, 100)
        )
      : 0;

  // 🎯 data gráfica
  const data = [
    { name: "progreso", value: progreso },
    { name: "restante", value: 100 - progreso },
  ];

  const guardar = () => {
    const m = toNumber(meta);
    if (m > 0) {
      saveMeta(m);
    }
  };

  const formatCOP = (n: number) =>
    new Intl.NumberFormat("es-CO").format(toNumber(n));

  // 🔥 detectar pérdida
  const esNegativo = balanceSeguro < 0;

  return (
    <div className="bg-white p-4 rounded shadow space-y-4">
      <h3 className="font-semibold">Meta mensual</h3>

      {/* INPUT META */}
      <input
        type="number"
        value={meta}
        onChange={(e) => {
          const val = toNumber(e.target.value);
          setMeta(val);
        }}
        onBlur={guardar}
        className="border p-2 rounded w-full"
      />

      {/* DONUT */}
      <div className="w-full h-48">
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              innerRadius={60}
              outerRadius={80}
              dataKey="value"
              stroke="none"
            >
              <Cell fill={esNegativo ? "#ef4444" : "#22c55e"} />
              <Cell fill="#e5e7eb" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* TEXTO CENTRADO */}
        <div className="text-center -mt-32">
          <p className="text-xl font-bold">
            {Number.isFinite(progreso)
              ? progreso.toFixed(0)
              : 0}
            %
          </p>

          <p className="text-sm text-gray-500">
            ${formatCOP(balanceSeguro)} / $
            {formatCOP(metaSegura)}
          </p>
        </div>
      </div>
    </div>
  );
}