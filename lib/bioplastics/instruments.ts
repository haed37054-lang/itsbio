import fitTables from "@/data/bioplastics/instruments.json";

type InstrumentRow = [manufacturer: string, instrument: string, block: string, markers: string[]];
export const BIOPLASTICS_INSTRUMENTS = fitTables as unknown as Record<string, InstrumentRow[]>;
