"use client";

import { useEffect, useState } from "react";
import { getRegistros, saveRegistro } from "@/lib/storage";
import { useRouter } from "next/navigation";

export default function FormRegistro() {
  const router = useRouter();

  const [fecha, setFecha] = useState("");
  const [ingreso, setIngreso] = useState<number | "">("");
  const [combustible, setCombustible] = useState<number | "">("");
  const [otros, setOtros] = useState<number | "">("");

  // 👉 Fecha por defecto (HOY)
  useEffect(() => {
    const hoy = new Date().toISOString().split("T")[0];
    setFecha(hoy);
  }, []);

  // 👉 Cargar si existe
  useEffect(() => {
    if (!fecha) return;

    const registros = getRegistros();
    const existente = registros.find((r) => r.fecha === fecha);

    if (existente) {
      setIngreso(existente.ingreso);
      setCombustible(existente.combustible);
      setOtros(existente.otrosGastos);
    } else {
      setIngreso("");
      setCombustible("");
      setOtros("");
    }
  }, [fecha]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    saveRegistro({
      fecha,
      ingreso: Number(ingreso) || 0,
      combustible: Number(combustible) || 0,
      otrosGastos: Number(otros) || 0,
    });

    // 🚀 Volver al dashboard automáticamente
    router.push("/");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 max-w-md bg-white p-6 rounded shadow"
    >
      <h2 className="text-xl font-semibold">Registrar día</h2>

      <input
        type="date"
        value={fecha}
        onChange={(e) => setFecha(e.target.value)}
        className="w-full border p-2 rounded"
      />

      <input
        type="number"
        placeholder="Ingreso"
        value={ingreso}
        onChange={(e) =>
          setIngreso(e.target.value === "" ? "" : +e.target.value)
        }
        className="w-full border p-2 rounded"
      />

      <input
        type="number"
        placeholder="Combustible"
        value={combustible}
        onChange={(e) =>
          setCombustible(e.target.value === "" ? "" : +e.target.value)
        }
        className="w-full border p-2 rounded"
      />

      <input
        type="number"
        placeholder="Otros gastos"
        value={otros}
        onChange={(e) =>
          setOtros(e.target.value === "" ? "" : +e.target.value)
        }
        className="w-full border p-2 rounded"
      />

      <button className="w-full bg-blue-500 text-white py-2 rounded">
        Guardar
      </button>
    </form>
  );
}