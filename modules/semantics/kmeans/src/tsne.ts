// tsne-utils.ts - Project high-dimensional clusters to 2D using tsne-js

import { LabeledVector } from './labeledVector';
import TSNE from 'tsne-js';

export interface ProjectedPoint {
    id: string;
    label: number;
    x: number;
    y: number;
}

export interface ProjectedCentroid {
    x: number;
    y: number;
    label: number;
}

export async function tsneProjectTo2D(
    clusters: Record<number, LabeledVector[]>,
    centroids: number[][]
): Promise<{
    projectedPoints: ProjectedPoint[];
    projectedCentroids: ProjectedCentroid[];
}> {
    const all: { id: string; label: number; vector: number[] }[] = [];

    for (const [label, members] of Object.entries(clusters)) {
        const clusterId = Number(label);
        for (const m of members) {
            all.push({
                id: m.id,
                label: clusterId,
                vector: Array.from(m.vector)
            });
        }
    }

    // Add centroids as fake points
    const centroidIds = centroids.map((vec, i) => {
        const id = `centroid-${i}`;
        all.push({ id, label: i, vector: vec });
        return id;
    });

    const model = new TSNE({ dim: 2, perplexity: 30, epsilon: 10 });
    model.init({ data: all.map(v => v.vector), type: 'dense' });

    await model.run();

    const output = model.getOutput();

    const projectedPoints: ProjectedPoint[] = [];
    const projectedCentroids: ProjectedCentroid[] = [];

    all.forEach((v, i) => {
        const pt = { x: output[i][0], y: output[i][1] };
        if (v.id.startsWith('centroid-')) {
            projectedCentroids.push({ ...pt, label: v.label });
        } else {
            projectedPoints.push({ ...pt, id: v.id, label: v.label });
        }
    });

    return { projectedPoints, projectedCentroids };
}
