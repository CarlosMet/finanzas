"use client";

import { useEffect, useState } from "react";
import {
  getRegistros,
  deleteRegistro,
  saveRegistro,
} from "@/lib/storage";

export default function TablaRegistros() {
  const [registros, setRegistros] = useState<any[]>([]);

  const cargar = () => {
    const data = getRegistros().sort((a, b) =>
      b.fecha.localeCompare(a.fecha)
    );
    setRegistros(data);
  };

  useEffect(() => {
    cargar();
  }, []);

  const handleChange = (
    index: number,
    field: string,
    value: number
  ) => {
    const nuevos = [...registros];
    nuevos[index][field] = value;
    setRegistros(nuevos);
  };

  const guardarFila = (fila: any) => {
    saveRegistro(fila);
  };

  const eliminar = (fecha: string) => {
    deleteRegistro(fecha);
    cargar();
  };

  return (
    <div className="bg-white p-4 rounded shadow overflow-auto">
      <h3 className="font-semibold mb-3">Historial</h3>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b">
            <th>Fecha</th>
            <th>Ingreso</th>
            <th>Combustible</th>
            <th>Otros</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          {registros.map((r, i) => (
            <tr key={r.fecha} className="border-b">
              <td>{r.fecha}</td>

              <td>
                <input
                  type="number"
                  value={r.ingreso}
                  onChange={(e) =>
                    handleChange(i, "ingreso", +e.target.value)
                  }
                  onBlur={() => guardarFila(r)}
                  className="w-24 border p-1 rounded"
                />
              </td>

              <td>
                <input
                  type="number"
                  value={r.combustible}
                  onChange={(e) =>
                    handleChange(
                      i,
                      "combustible",
                      +e.target.value
                    )
                  }
                  onBlur={() => guardarFila(r)}
                  className="w-24 border p-1 rounded"
                />
              </td>

              <td>
                <input
                  type="number"
                  value={r.otrosGastos}
                  onChange={(e) =>
                    handleChange(
                      i,
                      "otrosGastos",
                      +e.target.value
                    )
                  }
                  onBlur={() => guardarFila(r)}
                  className="w-24 border p-1 rounded"
                />
              </td>

              <td>
                <button
                  onClick={() => eliminar(r.fecha)}
                  className="text-red-500"
                >
                  ✕
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}