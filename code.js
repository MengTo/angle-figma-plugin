var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
try {
    figma.showUI(__html__, { width: 790, height: 500 });
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
            const unit8 = yield node.exportAsync({
                format: 'PNG',
                constraint: { type: 'SCALE', value: 3 }
            });
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
    function angleArtboard(node, artboard, orientation, pixel, quality, coordinates, nodeWidth, nodeHeight) {
        // User Selection Of Artboard
        if (artboard.type === 'FRAME' || artboard.type === 'GROUP') {
            invertNode(artboard).then(response => {
                figma.ui.postMessage({
                    selectedOrientation: orientation,
                    selectedQuality: quality,
                    selectedPixelDensity: pixel,
                    type: 'networkRequest',
                    uint8Array: response,
                    ponits: coordinates,
                    width: node.width,
                    height: node.height
                });
            });
            try {
                if (node.fills) {
                    const fills = Array.from(node.fills);
                    fills.push({
                        type: 'IMAGE',
                        visible: true,
                        opacity: 1,
                        scaleMode: 'FILL',
                        imageHash: 'efe98099a0aa97c1aa64e286bc82e633cc9aed22'
                    });
                    node.fills = fills;
                }
            }
            catch (error) { }
        }
    }
    function clone(val) {
        return JSON.parse(JSON.stringify(val));
    }
    if (figma.currentPage.selection[0].type === 'COMPONENT') {
        figma.notify('Current does not work on components');
        figma.closePlugin();
    }
    if (figma.currentPage.selection[0].type === 'INSTANCE') {
        try {
            const instanceNodeNames = [];
            var convertedNode = {};
            var selectedNode;
            const coordinates = {
                topLeftX: undefined,
                topLeftY: undefined,
                topRightX: undefined,
                topRightY: undefined,
                bottomLeftX: undefined,
                bottomLeftY: undefined,
                bottomRightX: undefined,
                bottomRightY: undefined,
            };
            // loop over all the names and push all the frames
            figma.currentPage.children.map(function (node) {
                if (node.type === 'FRAME') {
                    instanceNodeNames.push(node.name);
                }
            });
            figma.ui.postMessage({ type: 'allNodeNames', nodeNames: instanceNodeNames });
            if (figma.currentPage.selection[0].masterComponent.children[0].type !== 'VECTOR' &&
                figma.currentPage.selection[0].masterComponent.children[0].type !== 'RECTANGLE') {
                figma.closePlugin();
                figma.notify(`Your current selected screen is a ${figma.currentPage.selection[0].masterComponent.children[0].type} node. Please choose a Vector node instead.`);
            }
            console.log('currentSelection:', figma.currentPage.selection[0].masterComponent.children[0]);
            if (figma.currentPage.selection[0].masterComponent.children[0].type === 'RECTANGLE') {
                // convert the whole rectangle thing
                convertedNode = figma.flatten([
                    figma.currentPage.selection[0].masterComponent.children[0]
                ]);
            }
            figma.ui.on('message', uiResponse => {
                if (uiResponse.type === 'convertSelectedArtboard') {
                    if (uiResponse.selectedArtboard.length !== 0) {
                        figma.currentPage.children.filter(function (node) {
                            if (node.name === uiResponse.selectedArtboard) {
                                selectedNode = node;
                            }
                        });
                        if (figma.currentPage.selection[0].type ===
                            'VECTOR') {
                            // TOP LEFT
                            coordinates.topLeftX =
                                figma.currentPage.selection[0].vectorNetwork.vertices[0].x;
                            coordinates.topLeftY =
                                figma.currentPage.selection[0].vectorNetwork.vertices[0].y;
                            // TOP RIGHT
                            coordinates.topRightX =
                                figma.currentPage.selection[0].vectorNetwork.vertices[1].x;
                            coordinates.topRightY =
                                figma.currentPage.selection[0].vectorNetwork.vertices[1].y;
                            // BOTTOM LEFT
                            coordinates.bottomLeftX =
                                figma.currentPage.selection[0].vectorNetwork.vertices[2].x;
                            coordinates.bottomLeftY =
                                figma.currentPage.selection[0].vectorNetwork.vertices[2].y;
                            //  BOTTOM RIGHT
                            coordinates.bottomRightX =
                                figma.currentPage.selection[0].vectorNetwork.vertices[3].x;
                            coordinates.bottomRightY =
                                figma.currentPage.selection[0].vectorNetwork.vertices[3].y;
                            angleArtboard(figma.currentPage.selection[0], selectedNode, uiResponse.orientation, uiResponse.pixel, uiResponse.quality, coordinates, figma.currentPage.selection[0].width, figma.currentPage.selection[0].height);
                        }
                        if (convertedNode.type === 'VECTOR') {
                            console.log(true);
                            // TOP LEFT
                            coordinates.topLeftX = convertedNode.vectorNetwork.vertices[0].x;
                            coordinates.topLeftY = convertedNode.vectorNetwork.vertices[0].y;
                            // TOP RIGHT
                            coordinates.topRightX = convertedNode.vectorNetwork.vertices[1].x;
                            coordinates.topRightY = convertedNode.vectorNetwork.vertices[1].y;
                            // BOTTOM LEFT
                            coordinates.bottomLeftX = convertedNode.vectorNetwork.vertices[2].x;
                            coordinates.bottomLeftY = convertedNode.vectorNetwork.vertices[2].y;
                            //  BOTTOM RIGHT
                            coordinates.bottomRightX = convertedNode.vectorNetwork.vertices[3].x;
                            coordinates.bottomRightY = convertedNode.vectorNetwork.vertices[3].y;
                            angleArtboard(convertedNode, selectedNode, uiResponse.orientation, uiResponse.pixel, uiResponse.quality, coordinates, convertedNode.width, convertedNode.height);
                        }
                    }
                }
                if (uiResponse.type === 'networkResponse') {
                    if (convertedNode.type === 'VECTOR') {
                        const cloneOfScreen = clone(convertedNode.fills);
                        const selectedImage = angleFill(uiResponse.response, convertedNode);
                        if (cloneOfScreen.length > 1) {
                            const c = cloneOfScreen.slice(1);
                            c[0] = selectedImage[0];
                            convertedNode.fills = c;
                        }
                        figma.closePlugin();
                    }
                    if (figma.currentPage.selection[0].type === 'VECTOR') {
                        const cloneOfScreen = clone(figma.currentPage.selection[0].fills);
                        const selectedImage = angleFill(uiResponse.response, figma.currentPage.selection[0]);
                        if (cloneOfScreen.length > 1) {
                            const c = cloneOfScreen.slice(1);
                            c[0] = selectedImage[0];
                            figma.currentPage.selection[0].fills = c;
                        }
                        figma.closePlugin();
                    }
                }
                if (uiResponse.type === 'cancel-modal') {
                    figma.closePlugin();
                }
            });
        }
        catch (_a) { }
    }
    if (figma.currentPage.selection.length === 0) {
        figma.closePlugin();
        figma.notify('Please select a Vector.');
    }
    // removes extra fills
    if (figma.currentPage.selection[0].fills.length > 1) {
        const copyOfFills = clone(figma.currentPage.selection[0].fills);
        copyOfFills.splice(1);
        figma.currentPage.selection[0].fills = copyOfFills;
    }
    if (figma.currentPage.selection[0].type === 'FRAME' ||
        figma.currentPage.selection[0].type === 'GROUP') {
        figma.closePlugin();
        figma.notify('Please select a Vector.');
    }
    if (figma.currentPage.selection[0].fills === undefined ||
        figma.currentPage.selection[0].fills.length === 0) {
        const fills = Array.from(figma.currentPage.selection[0].fills);
        fills.push({
            type: 'IMAGE',
            visible: true,
            opacity: 1,
            scaleMode: 'FILL',
            imageHash: 'efe98099a0aa97c1aa64e286bc82e633cc9aed22'
        });
        figma.currentPage.selection[0].fills = fills;
    }
    var convertedNode = {};
    // NOTE Convert Rectangle Node to Vector Node
    if (figma.currentPage.selection[0].type === 'RECTANGLE') {
        // NOTE faltten the currentSelection to convert to vector -> this will lose the currentSelection value
        convertedNode = figma.flatten(figma.currentPage.selection);
    }
    if (convertedNode.type === undefined) {
        // The selection is not a rectangle
        if (figma.currentPage.selection[0].type !== 'VECTOR') {
            figma.closePlugin();
            figma.notify(`Your current selected screen is a ${figma.currentPage.selection[0].type} node. Please choose a Vector node instead.`);
        }
    }
    // if (convertedNode.type === 'VECTOR' && figma.currentPage.selection[0] === undefined) {
    // 	// The selection is a rectangle converted to a vector
    // 	console.log('is a rectangle', convertedNode);
    // }
    const currentUserSelection = figma.currentPage.selection[0];
    const allFigmaNodes = figma.currentPage.children;
    // NOTE Loop Over All The Node Names And Send It To The UI
    let nodesNames = [];
    const getRootFrame = node => {
        if (node.parent && node.parent.type === 'FRAME') {
            return node.parent.name;
        }
        else {
            return getRootFrame(node.parent);
        }
    };
    figma.currentPage.children.map(function (node) {
        // FIXME doesn't filter out again -> needs fixing
        // if (node.type === 'FRAME') {
        // 	if (currentUserSelection.parent.type === 'PAGE') {
        // 		nodesNames.push(node.name);
        // 	} else {
        // 		nodesNames.push(node.name);
        // 		const filterSelection = nodesNames.filter(
        // 			nodesNames => nodesNames !== getRootFrame(currentUserSelection)
        // 		);
        // 		nodesNames = filterSelection;
        // 	}
        // } else {
        // 	return;
        // }
        // NOTE for now
        // nodesNames.push(node.name);
        if (node.type === 'FRAME') {
            nodesNames.push(node.name);
        }
    });
    figma.ui.postMessage({ type: 'allNodeNames', nodeNames: nodesNames });
    /*
NOTE Steps For The Angle Fill (Perspective Transform)
1. Recieve The Selected Node From The User Via The UI and Grab The Unit 8 Array From That
2. Convert The Unit 8 Array Into a Base64 String
3. Grab The 8 Ponits, Width, and Height, and Base64 String Of The Selected Node And Send it Back To The UI to Make An API Call
4. Recieve The Modifyed Unit8 Array From The API And Replace That As the Unit8 Array in The Fill Of The Selected Node
*/
    // Listen For All postMessages Coming Back From The UI
    figma.ui.on('message', uiResponse => {
        try {
            if (uiResponse.type === 'convertSelectedArtboard') {
                if (uiResponse.selectedArtboard.length !== 0) {
                    const selectedNode = findSelectedNode(uiResponse.selectedArtboard);
                    const coordinates = {
                        topLeftX: undefined,
                        topLeftY: undefined,
                        topRightX: undefined,
                        topRightY: undefined,
                        bottomLeftX: undefined,
                        bottomLeftY: undefined,
                        bottomRightX: undefined,
                        bottomRightY: undefined,
                    };
                    // console.log('currentSelection', currentUserSelection);
                    // console.log('convertedNode', convertedNode);
                    if (currentUserSelection !== undefined &&
                        currentUserSelection.type === 'VECTOR') {
                        console.log('not a rectangle', currentUserSelection);
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
                        // invertImages(selectedNode).then(arr => {
                        // 	figma.ui.postMessage({
                        // 		type: 'networkRequest',
                        // 		uint8Array: arr,
                        // 		ponits: coordinates,
                        // 		selectedPixelDensity: uiResponse.selectedPixelDensity,
                        // 		selectedQuality: uiResponse.selectedQuality,
                        // 		width: currentUserSelection.width,
                        // 		height: currentUserSelection.height
                        // 	});
                        // });
                        angleArtboard(currentUserSelection, selectedNode, uiResponse.selectedOrientation, uiResponse.selectedPixelDensity, uiResponse.selectedQuality, coordinates, currentUserSelection.width, currentUserSelection.height);
                    }
                    if (currentUserSelection === undefined && convertedNode.type === 'VECTOR') {
                        console.log('converting rectangle to vector...');
                        coordinates.topLeftX = convertedNode.vectorNetwork.vertices[0].x;
                        coordinates.topLeftY = convertedNode.vectorNetwork.vertices[0].y;
                        // // TOP RIGHT
                        coordinates.topRightX = convertedNode.vectorNetwork.vertices[1].x;
                        coordinates.topRightY = convertedNode.vectorNetwork.vertices[1].y;
                        // // BOTTOM LEFT
                        coordinates.bottomLeftX = convertedNode.vectorNetwork.vertices[2].x;
                        coordinates.bottomLeftY = convertedNode.vectorNetwork.vertices[2].y;
                        // // BOTTOM RIGHT
                        coordinates.bottomRightX = convertedNode.vectorNetwork.vertices[3].x;
                        coordinates.bottomRightY = convertedNode.vectorNetwork.vertices[3].y;
                        console.log(coordinates);
                        // invertImages(selectedNode).then(arr => {
                        // 	figma.ui.postMessage({
                        // 		type: 'networkRequest',
                        // 		uint8Array: arr,
                        // 		ponits: coordinates,
                        // 		selectedPixelDensity: uiResponse.selectedPixelDensity,
                        // 		selectedQuality: uiResponse.selectedQuality,
                        // 		width: convertedNode.width,
                        // 		height: convertedNode.height
                        // 	});
                        // });
                        angleArtboard(convertedNode, selectedNode, uiResponse.selectedOrientation, uiResponse.selectedPixelDensity, uiResponse.selectedQuality, coordinates, convertedNode.width, convertedNode.height);
                    }
                    const selectedOrientation = uiResponse.selectedOrientation;
                    const selectedQuality = uiResponse.selectedQuality;
                    const selectedPixelDensity = uiResponse.selectedPixelDensity;
                    // base image if the selected artboard is an image
                    const cloneOfScreen = clone(figma.currentPage.selection[0].fills);
                    const selectedImage = selectedNode.fills;
                    cloneOfScreen[0] = selectedImage[0];
                    figma.currentPage.selection[0].fills = cloneOfScreen;
                }
                else if (uiResponse.selectedArtboard.length === 0) {
                    figma.closePlugin();
                    figma.notify('Please choose an artboard');
                }
            }
            else if (uiResponse.type === 'networkResponse') {
                if (figma.currentPage.selection[0] === undefined &&
                    convertedNode.type === 'VECTOR') {
                    const cloneOfScreen = clone(convertedNode.fills);
                    const fills = clone(convertedNode.fills);
                    const selectedImage = angleFill(uiResponse.response, convertedNode);
                    if (cloneOfScreen.length > 1) {
                        const c = cloneOfScreen.slice(1);
                        c[0] = selectedImage[0];
                        convertedNode.fills = c;
                    }
                    figma.closePlugin();
                }
                if (figma.currentPage.selection[0] !== undefined &&
                    convertedNode.type === undefined) {
                    const cloneOfScreen = clone(figma.currentPage.selection[0].fills);
                    const fills = clone(currentUserSelection.fills);
                    const selectedImage = angleFill(uiResponse.response, currentUserSelection);
                    if (cloneOfScreen.length > 1) {
                        const c = cloneOfScreen.slice(1);
                        c[0] = selectedImage[0];
                        figma.currentPage.selection[0].fills = c;
                    }
                    figma.closePlugin();
                }
            }
            else if (uiResponse.type === 'cancel-modal') {
                figma.closePlugin();
            }
            else if (uiResponse.type === 'netWorkError') {
                figma.notify(uiResponse.message);
            }
            else if (uiResponse.type === 'cloudinaryError') {
                figma.closePlugin();
                figma.notify(uiResponse.message);
            }
            console.log(uiResponse);
        }
        catch (error) {
            console.log(`Error: ${error}`);
            if (String(error).includes('Image is too large')) {
                figma.notify('Error: Image is too large. Reduce the mockup size before applying artboard.');
                figma.closePlugin();
            }
            else {
                figma.notify(`Error: ${error}`);
                figma.closePlugin();
            }
        }
    });
}
catch (error) {
    console.log(`Error: ${error}`);
    figma.notify(`Error: ${error}`);
    figma.closePlugin();
}
