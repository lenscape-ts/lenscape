// TsnePlot.tsx - Render t-SNE projected points with centroids

import React from 'react';
import { Scatter } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    PointElement,
    LinearScale,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { ProjectedPoint, ProjectedCentroid } from '@lenscape/semantics_kmeans';

ChartJS.register(PointElement, LinearScale, Title, Tooltip, Legend);

interface TsnePlotProps {
    points: ProjectedPoint[];
    centroids: ProjectedCentroid[];
}

const clusterColors = [
    '#3366CC', '#DC3912', '#FF9900', '#109618', '#990099',
    '#3B3EAC', '#0099C6', '#DD4477', '#66AA00', '#B82E2E'
];

export const TsnePlot: React.FC<TsnePlotProps> = ({ points, centroids }) => {
    const grouped: Record<number, { x: number; y: number }[]> = {};
    points.forEach(p => {
        if (!grouped[p.label]) grouped[p.label] = [];
        grouped[p.label].push({ x: p.x, y: p.y });
    });

    const datasets = Object.entries(grouped).map(([label, pts], i) => ({
        label: `Cluster ${label}`,
        data: pts,
        backgroundColor: clusterColors[Number(label) % clusterColors.length],
        pointRadius: 4
    }));

    // centroids.forEach((c) => {
    //     datasets.push({
    //         label: `Cluster ${c.label}`,
    //         data: [{ x: c.x, y: c.y }],
    //         backgroundColor: clusterColors[c.label % clusterColors.length],
    //         pointRadius: 10,
    //     });
    // });

    return (
        <div>
            <h3>t-SNE Cluster Visualization</h3>
            <Scatter data={{ datasets }} />
        </div>
    );
};
