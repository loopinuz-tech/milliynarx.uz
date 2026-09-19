/**
 * Formats a number to Uzbek sum format: "4 590 000 so'm"
 */
export function formatPrice(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return "0\u00A0so'm";
  }
  const formatted = Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0");
  return `${formatted}\u00A0so'm`;
}

/**
 * Formats a date string to localized Uzbek format: "17 Sen, 2026"
 */
export function formatDate(dateString) {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    const months = [
      "Yan", "Fev", "Mar", "Apr", "May", "Iyun",
      "Iyul", "Avg", "Sen", "Okt", "Noy", "Dek"
    ];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month}, ${year}`;
  } catch (e) {
    return dateString;
  }
}

/**
 * Formats a percentage: "+2.4%" or "-1.5%"
 */
export function formatPercent(val) {
  if (val === undefined || val === null || isNaN(val)) return "-";
  const sign = val > 0 ? "+" : "";
  return `${sign}${val.toFixed(1)}%`;
}
