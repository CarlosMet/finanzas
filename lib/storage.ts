// /lib/storage.ts

import { RegistroDiario } from "@/types";

const KEY = "finanzas";
const META_KEY = "meta_financiera";

// 📥 Obtener registros
export function getRegistros(): RegistroDiario[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(KEY);
  return data ? JSON.parse(data) : [];
}

// 💾 Guardar / crear
export function saveRegistro(nuevo: RegistroDiario) {
  const registros = getRegistros();
  const index = registros.findIndex((r) => r.fecha === nuevo.fecha);
  if (index >= 0) {
    registros[index] = nuevo;
  } else {
    registros.push(nuevo);
  }
  localStorage.setItem(KEY, JSON.stringify(registros));
}

// ✏️ Actualizar un registro existente (busca por fecha)
export function updateRegistro(actualizado: RegistroDiario) {
  const registros = getRegistros();
  const index = registros.findIndex((r) => r.fecha === actualizado.fecha);
  if (index === -1) return;
  registros[index] = actualizado;
  localStorage.setItem(KEY, JSON.stringify(registros));
}

// ❌ Eliminar por fecha
export function deleteRegistro(fecha: string) {
  const registros = getRegistros().filter((r) => r.fecha !== fecha);
  localStorage.setItem(KEY, JSON.stringify(registros));
}

// 🎯 Meta
export function getMeta(): number {
  if (typeof window === "undefined") return 0;
  return Number(localStorage.getItem(META_KEY)) || 0;
}

export function saveMeta(valor: number) {
  localStorage.setItem(META_KEY, String(valor));
}
