import {LabeledVector, ProjectedCentroid, ProjectedPoint, tsneProjectTo2D} from "@lenscape/semantics_kmeans";
import {PCAPlot} from "./display/pca.plot";
import {useEffect, useState} from "react";
import {TsnePlot} from "./display/tsne.plot";

export type AppProps = {
    clusters: Record<number, LabeledVector[]>
    centroids: number[][]

}

export function App({clusters, centroids}: AppProps) {
    const [tab, setTab] = useState('pca')
    const [projectedPoints, setProjectedPoints] = useState<ProjectedPoint[]>([]);
    const [projectedCentroids, setProjectedCentroids] = useState<ProjectedCentroid[]>([]);
    useEffect(() => {
        setTimeout(() =>
            tsneProjectTo2D(clusters, centroids).then(({projectedCentroids, projectedPoints}) => {
                setProjectedPoints(projectedPoints);
                setProjectedCentroids(projectedCentroids);
            }), 0)

    }, [clusters, centroids]);
    return (
        <>
            <div>
                <button onClick={() => setTab('pca')}>PCA</button>
                <button onClick={() => setTab('tSNE')}>t-SNE</button>
            </div>
            {tab === 'pca' && <PCAPlot clusters={clusters} centroids={centroids}/>}
            {tab === 'tSNE' && <TsnePlot points={projectedPoints} centroids={projectedCentroids}/>}
        </>)
}