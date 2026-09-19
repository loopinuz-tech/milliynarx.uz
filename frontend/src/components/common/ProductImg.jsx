import React, { useState } from 'react';
import SolarIcon from './SolarIcon';

const CATEGORY_ICONS = {
  "yoqilg'i": "GasStation", "energiya": "GasStation",
  "o'g'it": "Leaf", "agrokimyo": "Leaf",
  "oziq-ovqat": "Cup", "qishloq": "Cup",
  "qurilish": "Buildings", "metall": "Widget", "metallurgiya": "Widget",
  "moy": "WaterDrop", "surkov": "WaterDrop",
  "kimyo": "TestTube", "plastik": "Box", "polimer": "Box",
  "to'qimachilik": "Hanger", "tekstil": "Hanger", "paxta": "Leaf",
  "smartfon": "Smartphone", "telefon": "Smartphone",
  "noutbuk": "Laptop", "kompyuter": "Laptop",
  "televizor": "Monitor", "maishiy": "Fridge", "texnika": "Fridge",
  "mebel": "Armchair", "kiyim": "Hanger",
  "tibbiyot": "Heart", "farmatsevtika": "Heart",
  "sanoat": "Widget", "stanok": "Widget",
};

export function getCategoryIcon(categoryName) {
  if (!categoryName) return "Box";
  const lower = categoryName.toLowerCase();
  for (const [keyword, icon] of Object.entries(CATEGORY_ICONS)) {
    if (lower.includes(keyword)) return icon;
  }
  return "Box";
}

export default function ProductImg({ src, alt, categoryName, className, iconSize = 24, iconContainerClass = "w-12 h-12" }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className={`${iconContainerClass} rounded-xl bg-orange-50 dark:bg-orange-950/40 flex items-center justify-center`}>
        <SolarIcon name={getCategoryIcon(categoryName)} size={iconSize} className="text-orange-400 dark:text-orange-500" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt || ''}
      className={className}
      onError={() => setFailed(true)}
      loading="lazy"
    />
  );
}
