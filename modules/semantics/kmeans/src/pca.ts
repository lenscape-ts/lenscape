// pca-utils.ts (revised to use cluster members)

import { EigenvalueDecomposition, Matrix } from 'ml-matrix';
import { LabeledVector } from './labeledVector';

export interface ProjectedPoint {
    id: string;
    label: number;
    x: number;
    y: number;
}

/**
 * Reduces high-dimensional vectors to 2D using PCA.
 * Returns the projected points and centroids.
 */
export function projectTo2D(
    clusters: Record<number, LabeledVector[]>,
    centroids: number[][]
): {
    projectedPoints: ProjectedPoint[];
    projectedCentroids: { x: number; y: number; label: number }[];
} {
    const vectors: { id: string; label: number; vector: number[] }[] = [];

    for (const [label, members] of Object.entries(clusters)) {
        const clusterId = Number(label);
        for (const member of members) {
            vectors.push({
                id: member.id,
                label: clusterId,
                vector: Array.from(member.vector)
            });
        }
    }

    const vectorMatrix = new Matrix(vectors.map(v => v.vector));

    // Center the data
    const mean = vectorMatrix.mean('column');
    const centered = vectorMatrix.subRowVector(mean);

    // Compute covariance matrix
    const covarianceMatrix = centered.transpose().mmul(centered).div(vectorMatrix.rows - 1);

    // Eigenvalue decomposition
    const evd = new EigenvalueDecomposition(covarianceMatrix);
    const eigenvectors = evd.eigenvectorMatrix;

    // Get the two principal components
    const pc1 = eigenvectors.getColumnVector(0);
    const pc2 = eigenvectors.getColumnVector(1);
    const projectionMatrix = new Matrix([pc1.to1DArray(), pc2.to1DArray()]).transpose();

    // Project the original centered data
    const projected = centered.mmul(projectionMatrix).to2DArray();

    const projectedPoints = vectors.map((v, i) => ({
        id: v.id,
        label: v.label,
        x: projected[i][0],
        y: projected[i][1]
    }));

    // Center and project centroids using the same mean and projection matrix
    const centeredCentroids = new Matrix(centroids).subRowVector(mean);
    const projectedCentroidsMatrix = centeredCentroids.mmul(projectionMatrix).to2DArray();

    const projectedCentroids = projectedCentroidsMatrix.map((proj, i) => ({
        x: proj[0],
        y: proj[1],
        label: i
    }));

    return { projectedPoints, projectedCentroids };
}
