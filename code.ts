try {
	// Global Variables
	const nodeNames = [];
	var convertedNode = {};
	var vectorNode = {};

	// Displays Modal
	if (figma.command === 'applyMockup') {
		figma.showUI(__html__, { width: 790, height: 500 });
	}

	// NOTE CurrentSelection Check

	// Give message when there is no user selection
	if (figma.currentPage.selection[0] === undefined) {
		figma.notify('please choose a mockup');
		figma.closePlugin();
	}

	if (
		figma.currentPage.selection[0].type === 'INSTANCE' &&
		figma.currentPage.selection[0].children[0].type !== 'RECTANGLE'
	) {
		figma.notify(
			`Your current selection is a ${figma.currentPage.selection[0].children[0].type}. Please choose a vector or rectangle.`
		);
		figma.closePlugin();
	}

	if (
		figma.currentPage.selection[0].type !== 'VECTOR' &&
		figma.currentPage.selection[0].type !== 'RECTANGLE' &&
		figma.currentPage.selection[0].type !== 'INSTANCE'
	) {
		figma.notify(
			`Your current selection is a ${figma.currentPage.selection[0].type}. Please choose a vector or rectangle.`
		);
		figma.closePlugin();
	}

	// put a fill (black and white image) if the node has an empty fill
	if (figma.currentPage.selection[0].fills.length === 0) {
		console.log('there is no fill');
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

	function findSelectedNode(selectedNodeName) {
		var result;
		figma.currentPage.children.filter(node => {
			if (node.name === selectedNodeName) {
				result = node;
			}
		});
		return result;
	}

	// Returns The Bytes Of The Passed In Node
	async function invertImages(node) {
		for (const paint of node.fills) {
			// Get the (encoded) bytes for this image.
			if (paint.type === 'IMAGE') {
				const image = figma.getImageByHash(paint.imageHash);
				const bytes = await image.getBytesAsync();

				return bytes;
			}
		}
	}
	// Returns The Byte Of The Node If It Is A Group || Frame
	async function invertNode(node) {
		// figma.currentPage.selection[0].parent.exportAsync().then(response => console.log(response));
		const unit8 = await node.exportAsync({
			format: 'PNG',
			constraint: { type: 'SCALE', value: 3 }
		});
		return unit8;
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

	function angleArtboard(
		node,
		artboard,
		orientation,
		pixel,
		quality,
		coordinates,
		nodeWidth,
		nodeHeight
	) {
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
			} catch (error) {}
		}
	}

	// All Functions
	function getAllNodeNames() {
		// Loop over all the nodes and retrieve only the nodes with the type of FRAME and send that to the UI
		figma.currentPage.children.map(function(node) {
			if (node.type === 'FRAME') {
				nodeNames.push(node.name);
			}
		});
		return nodeNames;
	}

	function clone(val) {
		return JSON.parse(JSON.stringify(val));
	}

	function replacingNodeFills(node, fillType) {
		console.log(node);
		const fills = Array.from(node.fills);
		if (fillType.toLowerCase() === 'image') {
			fills.push({
				type: 'IMAGE',
				visible: true,
				opacity: 1,
				scaleMode: 'FILL',
				imageHash: 'efe98099a0aa97c1aa64e286bc82e633cc9aed22'
			});
			node.fills = fills;
		} else if (fillType.toLowerCase() === 'solid') {
			const fills = clone(node.fills);
			fills[0].color.r = 0.5;
			node.fills = fills;
		}
	}

	function checkForNodeFills(node) {
		try {
			if (node.fills.length === 0) {
				// not any fills -> put fill
				replacingNodeFills(node, 'image');
			} else if (node.fills.length > 1) {
				node.fills = node.fills.slice(0, 1);
			}
		} catch (error) {}
	}

	function vectorConversion(node) {
		return figma.flatten([node]);
	}

	function getCoordinates(node) {
		const coordinates = {};
		// TOP LEFT
		coordinates.topLeftX = node.vectorNetwork.vertices[0].x;
		coordinates.topLeftY = node.vectorNetwork.vertices[0].y;
		// TOP RIGHT
		coordinates.topRightX = node.vectorNetwork.vertices[1].x;
		coordinates.topRightY = node.vectorNetwork.vertices[1].y;
		// BOTTOM LEFT
		coordinates.bottomLeftX = node.vectorNetwork.vertices[2].x;
		coordinates.bottomLeftY = node.vectorNetwork.vertices[2].y;
		//  BOTTOM RIGHT
		coordinates.bottomRightX = node.vectorNetwork.vertices[3].x;
		coordinates.bottomRightY = node.vectorNetwork.vertices[3].y;
		return coordinates;
	}

	function networkResponse(nodeFills, response, node) {
		const cloneOfScreen = clone(nodeFills);
		const fills = clone(nodeFills);
		const selectedImage = angleFill(response, node);

		if (cloneOfScreen.length > 1) {
			const c = cloneOfScreen.slice(1);
			c[0] = selectedImage[0];
			node.fills = c;
		}

		figma.closePlugin();
	}

	function networkRequest(node) {
		figma.ui.on('message', uiResponse => {
			if (uiResponse.selectedArtboard.length === 0) {
				figma.closePlugin();
				figma.notify('Please choose an artboard');
			}
			if (uiResponse.type === 'convertSelectedArtboard') {
				if (uiResponse.selectedArtboard.length !== 0) {
					const selectedNode = findSelectedNode(uiResponse.selectedArtboard);
					angleArtboard(
						node,
						selectedNode,
						uiResponse.orientation,
						uiResponse.pixel,
						uiResponse.quality,
						getCoordinates(node),
						node.width,
						node.height
					);
				}
			}

			if (uiResponse.type === 'networkResponse') {
				networkResponse(node.fills, uiResponse.response, node);
			}
			if (uiResponse.type === 'cancel-modal') {
				figma.closePlugin();
			} else if (uiResponse.type === 'netWorkError') {
				figma.notify(uiResponse.message);
			} else if (uiResponse.type === 'cloudinaryError') {
				figma.closePlugin();
				figma.notify(uiResponse.message);
			}
		});
	}

	if (figma.currentPage.selection[0].type === 'VECTOR') {
		console.log('the node is a vectorrrrrrrr');
		const names = getAllNodeNames();
		figma.ui.postMessage({ type: 'allNodeNames', nodeNames: names });

		// checkForNodeFills(figma.currentPage.selection[0]);
		// networkRequest(figma.currentPage.selection[0]);

		figma.ui.on('message', uiResponse => {
			try {
				if (uiResponse.type === 'cancel-modal') {
					figma.closePlugin();
				}

				if (uiResponse.type === 'netWorkError') {
					figma.notify(uiResponse.message);
				}

				if (uiResponse.type === 'cloudinaryError') {
					figma.closePlugin();
					figma.notify(uiResponse.message);
				}

				if (uiResponse.selectedArtboard.length === 0) {
					figma.closePlugin();
					figma.notify('Please choose an artboard');
				}

				if (uiResponse.type === 'convertSelectedArtboard') {
					if (uiResponse.selectedArtboard.length !== 0) {
						const selectedNode = findSelectedNode(uiResponse.selectedArtboard);
						angleArtboard(
							figma.currentPage.selection[0],
							selectedNode,
							uiResponse.orientation,
							uiResponse.pixel,
							uiResponse.quality,
							getCoordinates(figma.currentPage.selection[0]),
							figma.currentPage.selection[0].width,
							figma.currentPage.selection[0].height
						);
					}
				}
			} catch (error) {}
			if (uiResponse.type === 'networkResponse') {
				const cloneOfScreen = clone(figma.currentPage.selection[0].fills);
				const selectedImage = angleFill(
					uiResponse.response,
					figma.currentPage.selection[0]
				);
				if (cloneOfScreen.length > 1) {
					const c = cloneOfScreen.slice(1);
					c[0] = selectedImage[0];
					figma.currentPage.selection[0].fills = c;
				}
				figma.closePlugin();
			}
		});
	}

	if (
		(figma.currentPage.selection[0].type === 'RECTANGLE' &&
			figma.currentPage.selection[0].parent.parent.parent === undefined) ||
		figma.currentPage.selection[0].parent.parent.parent === null
	) {
		console.log('rectangle is not in an instance');
		// for regular rectangle that are not in an instance
		convertedNode = vectorConversion(figma.currentPage.selection[0]);

		const names = getAllNodeNames();
		figma.ui.postMessage({ type: 'allNodeNames', nodeNames: names });

		if (
			figma.currentPage.selection[0] === undefined &&
			convertedNode.type !== undefined &&
			convertedNode.type === 'VECTOR'
		) {
			// checkForNodeFills(convertedNode);
			// networkRequest(convertedNode);

			figma.ui.on('message', uiResponse => {
				try {
					if (uiResponse.type === 'cancel-modal') {
						figma.closePlugin();
					}

					if (uiResponse.type === 'netWorkError') {
						figma.notify(uiResponse.message);
					}

					if (uiResponse.type === 'cloudinaryError') {
						figma.closePlugin();
						figma.notify(uiResponse.message);
					}

					if (uiResponse.selectedArtboard.length === 0) {
						figma.closePlugin();
						figma.notify('Please choose an artboard');
					}

					if (uiResponse.type === 'convertSelectedArtboard') {
						if (uiResponse.selectedArtboard.length !== 0) {
							const selectedNode = findSelectedNode(uiResponse.selectedArtboard);
							angleArtboard(
								convertedNode,
								selectedNode,
								uiResponse.orientation,
								uiResponse.pixel,
								uiResponse.quality,
								getCoordinates(convertedNode),
								convertedNode.width,
								convertedNode.height
							);
						}
					}
				} catch (error) {}
				if (uiResponse.type === 'networkResponse') {
					console.log('currentSelection: ', figma.currentPage.selection[0]);
					const cloneOfScreen = clone(convertedNode.fills);
					const selectedImage = angleFill(uiResponse.response, convertedNode);
					if (cloneOfScreen.length > 1) {
						const c = cloneOfScreen.slice(1);
						c[0] = selectedImage[0];
						convertedNode.fills = c;
					}
					figma.closePlugin();
				}
			});
		}
	}

	if (
		figma.currentPage.selection[0].parent.parent.parent.type === 'INSTANCE' &&
		figma.currentPage.selection[0].type === 'RECTANGLE'
	) {
		console.log('rectangle is in instance');
		const a = figma.currentPage.selection[0].clone();
		vectorNode = figma.flatten([a]);

		const names = getAllNodeNames();
		figma.ui.postMessage({ type: 'allNodeNames', nodeNames: names });

		replacingNodeFills(figma.currentPage.selection[0], 'image');

		figma.ui.on('message', uiResponse => {
			try {
				if (uiResponse.type === 'cancel-modal') {
					figma.closePlugin();
				}

				if (uiResponse.selectedArtboard.length === 0) {
					figma.closePlugin();
					figma.notify('Please choose an artboard');
				}

				if (uiResponse.type === 'convertSelectedArtboard') {
					if (
						figma.currentPage.selection[0].type === 'RECTANGLE' &&
						vectorNode.type === 'VECTOR'
					) {
						console.log('yes it is');
						const selectedNode = findSelectedNode(uiResponse.selectedArtboard);
						console.log(selectedNode);

						// User Selection Of Artboard
						if (selectedNode.type === 'FRAME' || selectedNode.type === 'GROUP') {
							invertNode(selectedNode).then(response => {
								figma.ui.postMessage({
									selectedOrientation: uiResponse.orientation,
									selectedQuality: uiResponse.quality,
									selectedPixelDensity: uiResponse.selectedPixelDensity,
									type: 'networkRequest',
									uint8Array: response,
									ponits: getCoordinates(vectorNode),
									width: figma.currentPage.selection[0].width,
									height: figma.currentPage.selection[0].height
								});
							});
						}
					}
				}
			} catch (error) {}

			if (uiResponse.type === 'networkResponse') {
				// uiResponse.response
				const selectedImage = angleFill(
					uiResponse.response,
					figma.currentPage.selection[0]
				);
				console.log(358, selectedImage);
				if (figma.currentPage.selection[0].fills) {
					const c = clone(figma.currentPage.selection[0].fills);
					c[0] = selectedImage[0];
					figma.currentPage.selection[0].fills = c;
				}
				if (figma.currentPage.selection[0].fills.length > 1) {
					const newFills = figma.currentPage.selection[0].fills.slice(0, 1);
					figma.currentPage.selection[0].fills = newFills;
				}
				figma.closePlugin();
			}
		});
	}

	if (
		figma.currentPage.selection[0].type === 'RECTANGLE' &&
		figma.currentPage.selection[0].parent.parent.type === 'INSTANCE'
	) {
		figma.closePlugin();
		figma.notify('could not find the root node');
	}
} catch (error) {}
