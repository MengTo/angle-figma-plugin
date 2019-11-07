// figma.showUI(__html__, { width: 770, height: 500 });

// // do not show a modal
// // figma.showUI(__html__, { visible: false });

// const userSelection = figma.currentPage.selection[0];

// // get image bytes
// async function invertImages(node) {
// 	const newFills = [];
// 	for (const paint of node.fills) {
// 		if (paint.type === 'IMAGE') {
// 			// Get the (encoded) bytes for this image.
// 			const image = figma.getImageByHash(paint.imageHash);
// 			const bytes = await image.getBytesAsync();

// 			return bytes;
// 		}
// 	}
// }

// // NOTE base64 converter
// function randomString() {
// 	return Math.random()
// 		.toString(36)
// 		.substring(7);
// }

// function base64Convert(arrayBuffer) {
// 	let base64 = '';
// 	let encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

// 	let bytes = new Uint8Array(arrayBuffer);
// 	let byteLength = bytes.byteLength;
// 	let byteRemainder = byteLength % 3;
// 	let mainLength = byteLength - byteRemainder;

// 	let a, b, c, d;
// 	let chunk;

// 	// Main loop deals with bytes in chunks of 3
// 	for (let i = 0; i < mainLength; i = i + 3) {
// 		// Combine the three bytes into a single integer
// 		chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];

// 		// Use bitmasks to extract 6-bit segments from the triplet
// 		a = (chunk & 16515072) >> 18; // 16515072 = (2^6 - 1) << 18
// 		b = (chunk & 258048) >> 12; // 258048   = (2^6 - 1) << 12
// 		c = (chunk & 4032) >> 6; // 4032     = (2^6 - 1) << 6
// 		d = chunk & 63; // 63       = 2^6 - 1

// 		// Convert the raw binary segments to the appropriate ASCII encoding
// 		base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d];
// 	}

// 	// Deal with the remaining bytes and padding
// 	if (byteRemainder == 1) {
// 		chunk = bytes[mainLength];

// 		a = (chunk & 252) >> 2; // 252 = (2^6 - 1) << 2

// 		// Set the 4 least significant bits to zero
// 		b = (chunk & 3) << 4; // 3   = 2^2 - 1

// 		base64 += encodings[a] + encodings[b] + '==';
// 	} else if (byteRemainder == 2) {
// 		chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1];

// 		a = (chunk & 64512) >> 10; // 64512 = (2^6 - 1) << 10
// 		b = (chunk & 1008) >> 4; // 1008  = (2^6 - 1) << 4

// 		// Set the 2 least significant bits to zero
// 		c = (chunk & 15) << 2; // 15    = 2^4 - 1

// 		base64 += encodings[a] + encodings[b] + encodings[c] + '=';
// 	}

// 	return base64;
// }
// let imageNames = [];

// /* NOTE  looping all nodes on page */
// figma.currentPage.children.map(function(node) {
// 	imageNames.push(node.name);
// });

// figma.ui.postMessage({
// 	nodeNames: imageNames
// });

// // fourPonits of the node
// const coordinates = {};
// const size = {};

// // TOP LEFT
// coordinates.topLeftX = figma.currentPage.selection[0].vectorNetwork.vertices[0].x;
// coordinates.topLeftY = figma.currentPage.selection[0].vectorNetwork.vertices[0].y;

// // TOP RIGHT
// coordinates.topRightX = figma.currentPage.selection[0].vectorNetwork.vertices[1].x;
// coordinates.topRightY = figma.currentPage.selection[0].vectorNetwork.vertices[1].y;

// // BOTTOM LEFT
// coordinates.bottomLeftX = figma.currentPage.selection[0].vectorNetwork.vertices[2].x;
// coordinates.bottomLeftY = figma.currentPage.selection[0].vectorNetwork.vertices[2].y;

// // BOTTOM RIGHT
// coordinates.bottomRightX = figma.currentPage.selection[0].vectorNetwork.vertices[3].x;
// coordinates.bottomRightY = figma.currentPage.selection[0].vectorNetwork.vertices[3].y;

// size.width = figma.currentPage.selection[0].width;
// size.height = figma.currentPage.selection[0].height;

// function perspectiveTransform(selection) {
// 	// send the base64 string to the UI
// 	invertImages(selection).then(result => {
// 		// begin network request
// 		console.log('result', result);
// 		const base64String = base64Convert(result);

// 		// figma.ui.postMessage({
// 		// 	type: 'perspectiveTransform',
// 		// 	result: base64String,
// 		// 	nodeNames: imageNames,
// 		// 	ponits: coordinates,
// 		// 	size: size
// 		// });
// 	});
// }

// const fills = clone(figma.currentPage.selection[0].fills);
// const userFill = clone(figma.currentPage.children[2].fills);
// fills[0] = userFill[0];
// figma.currentPage.selection[0].fills = fills;

// // send the base64 string to the UI
// // invertImages(userSelection).then(result => {
// // 	// begin network request

// // 	const base64String = base64Convert(result);

// // 	figma.ui.postMessage({
// // 		type: 'perspectiveTransform',
// // 		result: base64String,
// // 		nodeNames: imageNames,
// // 		ponits: coordinates,
// // 		size: size
// // 	});
// // });

// function frameConverter(image) {
// 	let layer = image;
// 	layer
// 		.exportAsync({
// 			format: 'PNG'
// 		})
// 		.then(uint8Array => {
// 			console.log(uint8Array);
// 		});
// }

// /* NOTE REPLACEING FILLS */
// function nodeFill(selectedFill) {
// 	var imageFill = '';
// 	figma.currentPage.children.map(function(node) {
// 		if (node.name === selectedFill) {
// 			// works image artboards
// 			if (node.fills) {
// 				// const fills = clone(figma.currentPage.selection[0].fills);
// 				// const userFill = clone(node.fills);
// 				// fills[0] = userFill[0];
// 				//figma.currentPage.selection[0].fills = fills;

// 				invertImages(node).then(result => {
// 					// begin network request
// 					const base64String = base64Convert(result);
// 				});
// 			} else {
// 				frameConverter(node);
// 			}
// 		}
// 	});
// }
// figma.ui.on('message', pluginMessage => {
// 	console.log('pluginMessage', pluginMessage);

// 	if (pluginMessage.type === 'get-selections') {
// 		figma.currentPage.children.map(function(node) {
// 			if (node.name === pluginMessage.selectedArtboard) {
// 				invertImages(node).then(img => {
// 					figma.ui.postMessage({ base64: img });
// 				});
// 			}
// 		});
// 	}
// 	figma.closePlugin();
// });
// // figma.ui.onmessage = message => {
// // 	if (message.type === 'angle-fill') {
// // 		const newFill = angleFill(message.response, figma.currentPage.selection[0]);
// // 		const cloneOfScreen = clone(figma.currentPage.selection[0].fills);
// // 		const selectedImage = newFill;
// // 		cloneOfScreen[0] = selectedImage[0];
// // 		figma.currentPage.selection[0].fills = cloneOfScreen;
// // 		figma.closePlugin();
// // 	} else if (message.type === 'get-selections') {
// // 		//(message.selectedArtboard);
// // 		figma.closePlugin();
// // 	} else if (message.type === 'cancel-modal') {
// // 		figma.closePlugin();
// // 	}
// // 	//console.log(message);
// // 	console.log(message);
// // };

// // figma.ui.onmessage = async msg => {
// // 	figma.closePlugin();
// // };

figma.showUI(__html__, { width: 800, height: 600 });

// All Variables
const currentUserSelection = figma.currentPage.selection[0];
const allFigmaNodes = figma.currentPage.children;
const testerNode = allFigmaNodes[2];

// NOTE Loop Over All The Node Names And Send It To The UI
let nodesNames = [];
figma.currentPage.children.map(function(node) {
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
async function invertImages(node) {
	const newFills = [];
	for (const paint of node.fills) {
		// Get the (encoded) bytes for this image.
		if (paint.type === 'IMAGE') {
			const image = figma.getImageByHash(paint.imageHash);
			const bytes = await image.getBytesAsync();

			return bytes;
		}
	}
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

		invertImages(selectedNode).then(arr => {
			figma.ui.postMessage({
				type: 'networkRequest',
				uint8Array: arr,
				ponits: coordinates,
				width: currentUserSelection.width,
				height: currentUserSelection.height
			});
		});

		const cloneOfScreen = clone(figma.currentPage.selection[0].fills);
		const selectedImage = selectedNode.fills;
		cloneOfScreen[0] = selectedImage[0];
		figma.currentPage.selection[0].fills = cloneOfScreen;
	} else if (uiResponse.type === 'networkResponse') {
		const cloneOfScreen = clone(figma.currentPage.selection[0].fills);
		const selectedImage = angleFill(uiResponse.response, currentUserSelection);

		cloneOfScreen[0] = selectedImage[0];
		figma.currentPage.selection[0].fills = cloneOfScreen;
		figma.closePlugin();
	}
});
