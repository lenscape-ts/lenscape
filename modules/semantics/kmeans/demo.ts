// Example usage:
import {loadLabeledVectors} from "./src/load.embeddings";
import {kMeans, squaredDistance} from "./src/kmeans.clustering";
import {evaluateKRange, findElbow, findElbowAdjustAndThenKMeans, maybeAdjustElbow} from "./src/elbow";


(async () => {
    const vectors = await loadLabeledVectors('test/sample.json');
    console.log(`Loaded ${vectors.length} labeled vectors`);
    const {elbow, adjusted, result, elbowPoints} = findElbowAdjustAndThenKMeans(vectors, 3, 10, squaredDistance,100);
    console.log('Elbow inertia values:', elbowPoints);
    console.log('Elbow point:', elbow);
    console.log('---------------')
    console.log('Adjusted Elbow point:', adjusted);
    console.log('---------------')
    console.log('Clusters', Object.entries(result.clusterMembers).map(([cluster, members]) => ({cluster, members: members.length})));
    console.log('Inertia:', result.inertia);
    const inertiaPerPoint = result.inertia / vectors.length;
    const inertiaMeaning =
        inertiaPerPoint < 0.05 ? '🟢 Excellent — very tight clusters' :
            inertiaPerPoint < 0.15 ? '🟡 Decent, but some dispersion' :
                '🔴 Likely noisy or overlapping';
    console.log(`Avg inertia per point: ${result.inertia / vectors.length}`, inertiaMeaning);
    for (const centroid of result.centroids)
        console.log(`[${centroid.join(', ')}]`);


})();
