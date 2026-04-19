
import { RegistroDiario } from "@/types";

export function filtrarPorPeriodo(
  registros: RegistroDiario[],
  tipo: "dia" | "semana" | "mes",
  fecha: string
) {
  const base = new Date(fecha);

  return registros.filter(r => {
    const d = new Date(r.fecha);

    if (tipo === "dia") {
      return r.fecha === fecha;
    }

    if (tipo === "semana") {
      const inicio = new Date(base);
      inicio.setDate(base.getDate() - base.getDay());

      const fin = new Date(inicio);
      fin.setDate(inicio.getDate() + 6);

      return d >= inicio && d <= fin;
    }

    if (tipo === "mes") {
      return (
        d.getMonth() === base.getMonth() &&
        d.getFullYear() === base.getFullYear()
      );
    }
  });
}

export function calcularTotales(registros: RegistroDiario[]) {
  return registros.reduce(
    (acc, r) => {
      acc.ingreso += r.ingreso;
      acc.combustible += r.combustible;
      acc.otros += r.otrosGastos;
      return acc;
    },
    { ingreso: 0, combustible: 0, otros: 0 }
  );
}