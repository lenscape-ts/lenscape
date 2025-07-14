import React from "react";
import {createRoot} from "react-dom/client";
import {App} from "./app";
import {findElbowAdjustAndThenKMeans, squaredDistance, transformIntoLabeledVectors} from "@lenscape/semantics_kmeans";
import {sample} from "./sample";

const root = createRoot(document.getElementById('root') as HTMLElement);

const transformed = transformIntoLabeledVectors(sample)
const {elbow, adjusted, result, elbowPoints} = findElbowAdjustAndThenKMeans(transformed, 3, 10, squaredDistance, 100);

root.render(<React.StrictMode>
    <App clusters={result.clusterMembers} centroids={result.centroids}/>

</React.StrictMode>)



