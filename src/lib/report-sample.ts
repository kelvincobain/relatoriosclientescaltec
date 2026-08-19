import { COL, type Row } from "./report-data";

/** Fictional demo base used only until a real spreadsheet is uploaded. */
const CITIES: Array<{ city: string; state: string; clients: string[] }> = [
  { city: "ITAPERUÇU", state: "PR", clients: ["Cliente Demo Alfa S.A.", "Cliente Demo Beta Ltda"] },
  { city: "CURITIBA", state: "PR", clients: ["Cliente Demo Alfa S.A.", "Cliente Demo Gama Ltda"] },
  { city: "CATANDUVA", state: "SP", clients: ["Cliente Demo Beta Ltda"] },
];

const CARRIERS = [
  "Transportadora Demo 1",
  "Transportadora Demo 2",
  "Transportadora Demo 3",
  "Transportadora Demo 4",
];

const pad = (n: number) => String(n).padStart(2, "0");
const fmt = (d: Date) =>
  `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;

export function buildSampleRows(): Row[] {
  const rows: Row[] = [];
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear];
  let seed = 7;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };

  for (const year of years) {
    for (let month = 1; month <= 12; month += 1) {
      for (const { city, state, clients } of CITIES) {
        for (const client of clients) {
          const loads = 2 + Math.floor(rnd() * 4);
          for (let i = 0; i < loads; i += 1) {
            const day = 1 + Math.floor(rnd() * 27);
            const pickup = new Date(year, month - 1, day, 8 + Math.floor(rnd() * 8), 15);
            const arrived = new Date(pickup.getTime() + (6 + rnd() * 10) * 3_600_000);
            const finished = new Date(arrived.getTime() + (1 + rnd() * 26) * 3_600_000);
            const hasDischarge = rnd() > 0.35;
            const cancelled = rnd() > 0.93;
            rows.push({
              [COL.city]: city,
              [COL.state]: state,
              [COL.client]: client,
              [COL.product]: "Cal industrial",
              [COL.weight]: Math.round(24000 + rnd() * 12000),
              [COL.plate]: `DEM${Math.floor(rnd() * 9)}${String.fromCharCode(65 + Math.floor(rnd() * 26))}${Math.floor(rnd() * 90) + 10}`,
              [COL.carrier]: CARRIERS[Math.floor(rnd() * CARRIERS.length)],
              [COL.otd]: rnd() > 0.08 ? "Aderente" : "Não Aderente",
              [COL.pickup]: fmt(pickup),
              [COL.arrived]: hasDischarge ? fmt(arrived) : "",
              [COL.finished]: hasDischarge ? fmt(finished) : "",
              [COL.plannedDelivery]: fmt(new Date(year, month - 1, day + 2, 5, 0)),
              [COL.status]: cancelled ? " Frete cancelado" : "Motorista descarregou",
            });
          }
        }
      }
    }
  }
  return rows;
}
