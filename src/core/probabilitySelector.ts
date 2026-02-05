import type {Sector} from "@mertercelik/react-prize-wheel";


export const selectWinningSector = (sectors: Sector[]): number => {
    const totalProbability = sectors.reduce((sum, sector) => sum + (sector.probability || 1), 0);
    let random = Math.random() * totalProbability;

    for (let i = 0; i < sectors.length; i++) {
        random -= sectors[i].probability || 1;
        if (random <= 0) return i;
    }

    return 0;
};