export function formatIsoDate(value: string) {
  const [datePart] = value.split("T");
  const [year, month, day] = datePart.split("-");

  if (!year || !month || !day) {
    return value;
  }

  return `${day}/${month}/${year}`;
}

export function formatIsoDateTime(value: string) {
  const [datePart, timePart = ""] = value.split("T");
  const date = formatIsoDate(datePart);
  const [hours = "00", minutes = "00"] = timePart.split(":");

  return `${date} ${hours}:${minutes}`;
}
