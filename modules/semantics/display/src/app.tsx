import {LabeledVector} from "@lenscape/semantics_kmeans";
import {PointPlot} from "./display/display.data.points";

export type AppProps = {
    clusters: Record<number, LabeledVector[]>
    centroids: number[][]
}

export function App({clusters, centroids}: AppProps) {
    return (
        <div>
            <h1>Display Module</h1>
            <p>This is the display module of the application.</p>
            <PointPlot clusters={clusters} centroids={centroids}/>
        </div>
    );
}