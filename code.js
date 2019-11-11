var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
figma.showUI(__html__, { width: 790, height: 475 });
// figma.currentPage.selection[0].parent.exportAsync().then(response => console.log(response));
// All Variables
const currentUserSelection = figma.currentPage.selection[0];
const allFigmaNodes = figma.currentPage.children;
const testerNode = allFigmaNodes[2];
// NOTE Loop Over All The Node Names And Send It To The UI
let nodesNames = [];
figma.currentPage.children.map(function (node) {
    nodesNames.push(node.name);
});
figma.ui.postMessage({ type: 'allNodeNames', nodeNames: nodesNames });
/*
NOTE Steps For The Angle Fill (Perspective Transform)
1. Recieve The Selected Node From The User Via The UI and Grab The Unit 8 Array From That
2. Convert The Unit 8 Array Into a Base64 String
3. Grab The 8 Ponits, Width, and Height, and Base64 String Of The Selected Node And Send it Back To The UI to Make An API Call
4. Recieve The Modifyed Unit8 Array From The API And Replace That As the Unit8 Array in The Fill Of The Selected Node
*/
function clone(val) {
    return JSON.parse(JSON.stringify(val));
}
// Will Loop Over All The Nodes And Return The Selected Node
function findSelectedNode(selectedNodeName) {
    var result;
    allFigmaNodes.filter(node => {
        if (node.name === selectedNodeName) {
            result = node;
        }
    });
    return result;
}
// Returns The Bytes Of The Passed In Node
function invertImages(node) {
    return __awaiter(this, void 0, void 0, function* () {
        const newFills = [];
        for (const paint of node.fills) {
            // Get the (encoded) bytes for this image.
            if (paint.type === 'IMAGE') {
                const image = figma.getImageByHash(paint.imageHash);
                const bytes = yield image.getBytesAsync();
                return bytes;
            }
        }
    });
}
// Returns The Byte Of The Node If It Is A Group || Frame
function invertNode(node) {
    return __awaiter(this, void 0, void 0, function* () {
        // figma.currentPage.selection[0].parent.exportAsync().then(response => console.log(response));
        const unit8 = yield node.exportAsync();
        return unit8;
    });
}
function angleFill(array, node) {
    const newFills = [];
    for (const paint of node.fills) {
        if (paint.type === 'IMAGE') {
            const newPaint = JSON.parse(JSON.stringify(paint));
            newPaint.imageHash = figma.createImage(array).hash;
            newFills.push(newPaint);
        }
    }
    return newFills;
}
// Listen For All postMessages Coming Back From The UI
figma.ui.on('message', uiResponse => {
    if (uiResponse.type === 'convertSelectedArtboard') {
        const selectedNode = findSelectedNode(uiResponse.selectedArtboard);
        const coordinates = {};
        if (currentUserSelection.type === 'VECTOR') {
            coordinates.topLeftX = currentUserSelection.vectorNetwork.vertices[0].x;
            coordinates.topLeftY = currentUserSelection.vectorNetwork.vertices[0].y;
            // // TOP RIGHT
            coordinates.topRightX = currentUserSelection.vectorNetwork.vertices[1].x;
            coordinates.topRightY = currentUserSelection.vectorNetwork.vertices[1].y;
            // // BOTTOM LEFT
            coordinates.bottomLeftX = currentUserSelection.vectorNetwork.vertices[2].x;
            coordinates.bottomLeftY = currentUserSelection.vectorNetwork.vertices[2].y;
            // // BOTTOM RIGHT
            coordinates.bottomRightX = currentUserSelection.vectorNetwork.vertices[3].x;
            coordinates.bottomRightY = currentUserSelection.vectorNetwork.vertices[3].y;
        }
        const selectedOrientation = uiResponse.selectedOrientation;
        const selectedQuality = uiResponse.selectedQuality;
        const selectedPixelDensity = uiResponse.selectedPixelDensity;
        invertImages(selectedNode).then(arr => {
            figma.ui.postMessage({
                type: 'networkRequest',
                uint8Array: arr,
                ponits: coordinates,
                width: currentUserSelection.width,
                height: currentUserSelection.height
            });
        });
        // User Selection Of Artboard
        if (selectedNode.type === 'FRAME' || selectedNode.type === 'GROUP') {
            invertNode(selectedNode).then(response => {
                figma.ui.postMessage({
                    selectedOrientation: selectedOrientation,
                    selectedQuality: selectedQuality,
                    selectedPixelDensity: selectedPixelDensity,
                    type: 'networkRequest',
                    uint8Array: response,
                    ponits: coordinates,
                    width: currentUserSelection.width,
                    height: currentUserSelection.height
                });
            });
            // base image if the selected artboard is a frame or group
            for (const selectedNode of figma.currentPage.selection) {
                const fills = clone(selectedNode.fills || []);
                fills.push({
                    type: 'IMAGE',
                    scaleMode: 'FIT',
                    imageHash: figma.createImage(new Uint8Array()).hash
                });
                currentUserSelection.fills = fills;
            }
        }
        // base image if the selected artboard is an image
        const cloneOfScreen = clone(figma.currentPage.selection[0].fills);
        const selectedImage = selectedNode.fills;
        cloneOfScreen[0] = selectedImage[0];
        figma.currentPage.selection[0].fills = cloneOfScreen;
    }
    else if (uiResponse.type === 'networkResponse') {
        const cloneOfScreen = clone(figma.currentPage.selection[0].fills);
        const selectedImage = angleFill(uiResponse.response, currentUserSelection);
        cloneOfScreen[0] = selectedImage[0];
        figma.currentPage.selection[0].fills = cloneOfScreen;
        figma.closePlugin();
    }
    else if (uiResponse.type === 'cancel-modal') {
        figma.closePlugin();
    }
});
