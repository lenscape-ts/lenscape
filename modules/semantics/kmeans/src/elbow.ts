import {LabeledVector} from "./labeledVector";
import {DistanceFunction, kMeans, squaredDistance} from "./kmeans.clustering";

export interface ElbowPoint {
    k: number;
    inertia: number;
    avgInertia: number;
}

export function evaluateKRange(
    data: LabeledVector[],
    minK: number,
    maxK: number,
    distanceFn?: DistanceFunction,
    maxIterations: number = 100,
): ElbowPoint[] {
    const results: ElbowPoint[] = [];
    for (let k = minK; k <= maxK; k++) {
        const result = kMeans(data, k, 100, distanceFn);
        results.push({
            k,
            inertia: result.inertia,
            avgInertia: result.inertia / data.length
        });
    }
    return results;
}

export function findElbow(results: ElbowPoint[]): ElbowPoint | null {
    if (results.length < 3) return null;

    const first = results[0];
    const last = results[results.length - 1];

    const lineVec = [last.k - first.k, last.inertia - first.inertia];
    const lineLen = Math.sqrt(lineVec[0] ** 2 + lineVec[1] ** 2);

    let maxDistance = -1;
    let bestK: ElbowPoint | null = null;

    for (let i = 1; i < results.length - 1; i++) {
        const point = results[i];
        const vec = [point.k - first.k, point.inertia - first.inertia];
        const projection =
            (vec[0] * lineVec[0] + vec[1] * lineVec[1]) / lineLen;
        const projPoint = [
            first.k + (projection * lineVec[0]) / lineLen,
            first.inertia + (projection * lineVec[1]) / lineLen
        ];
        const dist = Math.sqrt(
            (point.k - projPoint[0]) ** 2 + (point.inertia - projPoint[1]) ** 2
        );
        if (dist > maxDistance) {
            maxDistance = dist;
            bestK = point;
        }
    }

    return bestK;
}


/**
 * Checks if the next k after the elbow improves inertia significantly.
 */
export function maybeAdjustElbow(results: ElbowPoint[], elbow: ElbowPoint, threshold = 0.98): ElbowPoint {
    const next = results.find(r => r.k === elbow.k + 1);
    if (!next) return elbow;

    const gain = next.inertia / elbow.inertia;

    return gain < threshold ? next : elbow;
}

export function findElbowAdjustAndThenKMeans(vectors: LabeledVector[],
                                             minK: number,
                                             maxK: number,
                                             distanceFn: DistanceFunction = squaredDistance,
                                             maxIterations: number = 100,) {
    const elbowPoints = evaluateKRange(vectors, minK, maxK, distanceFn,maxIterations);

    const elbow = findElbow(elbowPoints)
    const adjusted = maybeAdjustElbow(elbowPoints, elbow)
    const result = kMeans(vectors, adjusted.k, maxIterations, distanceFn)
    return {elbowPoints,elbow, adjusted, result}
}