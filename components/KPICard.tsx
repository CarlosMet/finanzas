"use client";

import { motion } from "framer-motion";

export default function KPICard({
  title,
  value,
  icon,
  color = "green",
}: any) {
  const colors: any = {
    green: "text-green-600 bg-green-100",
    red: "text-red-500 bg-red-100",
    blue: "text-blue-600 bg-blue-100",
    orange: "text-orange-500 bg-orange-100",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white p-4 rounded-2xl shadow flex justify-between items-center"
    >
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-xl font-bold">{value}</p>
      </div>

      <div className={`p-3 rounded-full ${colors[color]}`}>
        {icon}
      </div>
    </motion.div>
  );
}