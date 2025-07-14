// PointPlot.tsx

import React from 'react';
import {Scatter} from 'react-chartjs-2';
import {Chart as ChartJS, Legend, LinearScale, PointElement, Title, Tooltip} from 'chart.js';
import {LabeledVector, projectTo2D} from '@lenscape/semantics_kmeans';

ChartJS.register(PointElement, LinearScale, Title, Tooltip, Legend);

interface PointPlotProps {
    clusters: Record<number, LabeledVector[]>,
    centroids: number[][]
}

const clusterColors = [
    '#3366CC', '#DC3912', '#FF9900', '#109618', '#990099',
    '#3B3EAC', '#0099C6', '#DD4477', '#66AA00', '#B82E2E'
];

export const PointPlot: React.FC<PointPlotProps> = ({clusters, centroids}) => {
    const {projectedPoints, projectedCentroids} = projectTo2D(clusters, centroids);

    const clusterGroups: Record<string, { x: number; y: number }[]> = {};
    projectedPoints.forEach(p => {
        if (!clusterGroups[p.label]) clusterGroups[p.label] = [];
        clusterGroups[p.label].push({x: p.x, y: p.y});
    });

    const datasets = Object.entries(clusterGroups).map(([label, points], i) => ({
        label: `Cluster ${label}`,
        data: points,
        backgroundColor: clusterColors[i % clusterColors.length],
        pointRadius: 4
    }));

    datasets.push({
        label: 'Centroids',
        data: projectedCentroids.map(c => ({x: c.x, y: c.y})),
        backgroundColor: 'rgba(255, 99, 132, 1)',
        pointRadius: 10,
        // pointStyle: 'triangle'
    });

    return (
        <div>
            <h3>Data Point Scatter Plot (2D PCA)</h3>
            <Scatter data={{datasets}}/>
        </div>
    );
};
