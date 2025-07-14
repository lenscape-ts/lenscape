// kmeans.ts - Modern, lightweight K-means in TypeScript

import { LabeledVector } from "./labeledVector";

export interface KMeansResult {
    centroids: number[][];
    labeled: {
        id: string;
        label: number;
    }[];
    clusterMembers: Record<number, LabeledVector[]>;
    counts: number[];
    iterations: number;
    inertia: number;
}

export type DistanceFunction = (a: number[], b: number[]) => number;

export function kMeans(
    data: LabeledVector[],
    k: number,
    maxIterations = 100,
    distanceFn: DistanceFunction = squaredDistance
): KMeansResult {
    if (data.length === 0 || data[0].vector.length === 0) throw new Error("Data is empty or malformed");
    if (k <= 0 || k > data.length) throw new Error("Invalid number of clusters");

    const dims = data[0].vector.length;
    const vectors = data.map(d => Array.from(d.vector)); // Convert all to plain number[]

    // Step 1: Initialize centroids using KMeans++
    const centroids: number[][] = [vectors[Math.floor(Math.random() * vectors.length)].slice()];
    while (centroids.length < k) {
        const distances = vectors.map(p => Math.min(...centroids.map(c => distanceFn(p, c))));
        const sum = distances.reduce((acc, d) => acc + d, 0);
        const threshold = Math.random() * sum;
        let cumulative = 0;
        for (let i = 0; i < vectors.length; i++) {
            cumulative += distances[i];
            if (cumulative >= threshold) {
                centroids.push(vectors[i].slice());
                break;
            }
        }
    }

    let labels = new Array(vectors.length).fill(0);
    let changed = true;
    let iterations = 0;
    let counts = Array(k).fill(0);

    while (changed && iterations < maxIterations) {
        changed = false;
        iterations++;

        // Step 2: Assign labels
        labels = vectors.map((point, idx) => {
            const closest = closestCentroid(point, centroids, distanceFn);
            if (closest !== labels[idx]) changed = true;
            return closest;
        });

        // Step 3: Update centroids
        const newCentroids = Array.from({ length: k }, () => Array(dims).fill(0));
        counts = Array(k).fill(0);

        vectors.forEach((point, i) => {
            const cluster = labels[i];
            counts[cluster]++;
            for (let d = 0; d < dims; d++) newCentroids[cluster][d] += point[d];
        });

        for (let c = 0; c < k; c++) {
            if (counts[c] === 0) continue; // Empty cluster
            for (let d = 0; d < dims; d++) newCentroids[c][d] /= counts[c];
        }

        centroids.splice(0, k, ...newCentroids);
    }

    const labeled = data.map((item, i) => ({ id: item.id, label: labels[i] }));

    const clusterMembers: Record<number, LabeledVector[]> = {};
    data.forEach((vector, i) => {
        const label = labels[i];
        if (!clusterMembers[label]) clusterMembers[label] = [];
        clusterMembers[label].push(vector);
    });

    // Step 4: Calculate total inertia (sum of squared distances to assigned centroids)
    const inertia = vectors.reduce((sum, vec, i) => {
        return sum + distanceFn(vec, centroids[labels[i]]) ** 2;
    }, 0);

    return { centroids, labeled, clusterMembers, counts, iterations, inertia };
}

export function squaredDistance(a: number[], b: number[]): number {
    return a.reduce((sum, val, i) => sum + (val - b[i]) ** 2, 0);
}

export function cosineDistance(a: number[], b: number[]): number {
    const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const normA = Math.sqrt(a.reduce((sum, val) => sum + val ** 2, 0));
    const normB = Math.sqrt(b.reduce((sum, val) => sum + val ** 2, 0));
    return 1 - dot / (normA * normB);
}

function closestCentroid(point: number[], centroids: number[][], distanceFn: DistanceFunction): number {
    let minDist = Infinity;
    let minIdx = -1;
    centroids.forEach((centroid, i) => {
        const dist = distanceFn(point, centroid);
        if (dist < minDist) {
            minDist = dist;
            minIdx = i;
        }
    });
    return minIdx;
}
