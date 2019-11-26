try {
  function clone(val) {
    return JSON.parse(JSON.stringify(val));
  }

  if (figma.currentPage.selection.length === 0) {
    figma.closePlugin();
    figma.notify("Please select a Vector.");
  }

  if (figma.currentPage.selection[0].type !== "VECTOR") {
    figma.closePlugin();
    figma.notify(
      `Your current selected screen is a ${figma.currentPage.selection[0].type} node. Please choose a Vector node instead.`
    );
  }

  if (figma.command === "applyMockup") {
    figma.showUI(__html__, { width: 790, height: 500 });
  }

  if (
    figma.currentPage.selection[0].type === "FRAME" ||
    figma.currentPage.selection[0].type === "GROUP"
  ) {
    figma.closePlugin();
    figma.notify("Please select a Vector.");
  }

  if (
    figma.currentPage.selection[0].fills === undefined ||
    figma.currentPage.selection[0].fills.length === 0
  ) {
    const fills = Array.from(figma.currentPage.selection[0].fills);

    fills.push({
      type: "IMAGE",
      visible: true,
      opacity: 1,
      scaleMode: "FILL",
      imageHash: "efe98099a0aa97c1aa64e286bc82e633cc9aed22"
    });

    figma.currentPage.selection[0].fills = fills;
    console.log(figma.currentPage.selection[0].fills);
  }

  const currentUserSelection = figma.currentPage.selection[0];
  const allFigmaNodes = figma.currentPage.children;

  // NOTE Loop Over All The Node Names And Send It To The UI
  let nodesNames = [];

  const getRootFrame = node => {
    if (node.parent && node.parent.type === "FRAME") {
      return node.parent.name;
    } else {
      return getRootFrame(node.parent);
    }
  };
  figma.currentPage.children.map(function(node) {
    if (node.type === "FRAME") {
      if (currentUserSelection.parent.type === "PAGE") {
        nodesNames.push(node.name);
      } else {
        nodesNames.push(node.name);
        const filterSelection = nodesNames.filter(
          nodesNames => nodesNames !== getRootFrame(currentUserSelection)
        );
        nodesNames = filterSelection;
      }
    } else {
      return;
    }
  });

  figma.ui.postMessage({ type: "allNodeNames", nodeNames: nodesNames });

  /*
NOTE Steps For The Angle Fill (Perspective Transform)
1. Recieve The Selected Node From The User Via The UI and Grab The Unit 8 Array From That 
2. Convert The Unit 8 Array Into a Base64 String 
3. Grab The 8 Ponits, Width, and Height, and Base64 String Of The Selected Node And Send it Back To The UI to Make An API Call
4. Recieve The Modifyed Unit8 Array From The API And Replace That As the Unit8 Array in The Fill Of The Selected Node
*/

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
    for (const paint of node.fills) {
      // Get the (encoded) bytes for this image.
      if (paint.type === "IMAGE") {
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
      format: "PNG",
      constraint: { type: "SCALE", value: 3 }
    });
    return unit8;
  }

  function angleFill(array, node) {
    const newFills = [];
    for (const paint of node.fills) {
      if (paint.type === "IMAGE") {
        const newPaint = JSON.parse(JSON.stringify(paint));
        newPaint.imageHash = figma.createImage(array).hash;
        newFills.push(newPaint);
      }
    }
    return newFills;
  }

  // Listen For All postMessages Coming Back From The UI
  figma.ui.on("message", uiResponse => {
    try {
      if (uiResponse.type === "convertSelectedArtboard") {
        if (uiResponse.selectedArtboard.length !== 0) {
          const selectedNode = findSelectedNode(uiResponse.selectedArtboard);
          const coordinates = {};

          if (currentUserSelection.type === "VECTOR") {
            console.log(currentUserSelection);
            coordinates.topLeftX =
              currentUserSelection.vectorNetwork.vertices[0].x;
            coordinates.topLeftY =
              currentUserSelection.vectorNetwork.vertices[0].y;
            // // TOP RIGHT
            coordinates.topRightX =
              currentUserSelection.vectorNetwork.vertices[1].x;
            coordinates.topRightY =
              currentUserSelection.vectorNetwork.vertices[1].y;
            // // BOTTOM LEFT
            coordinates.bottomLeftX =
              currentUserSelection.vectorNetwork.vertices[2].x;
            coordinates.bottomLeftY =
              currentUserSelection.vectorNetwork.vertices[2].y;
            // // BOTTOM RIGHT
            coordinates.bottomRightX =
              currentUserSelection.vectorNetwork.vertices[3].x;
            coordinates.bottomRightY =
              currentUserSelection.vectorNetwork.vertices[3].y;
            invertImages(selectedNode).then(arr => {
              figma.ui.postMessage({
                type: "networkRequest",
                uint8Array: arr,
                ponits: coordinates,
                selectedPixelDensity: uiResponse.selectedPixelDensity,
                selectedQuality: uiResponse.selectedQuality,
                width: currentUserSelection.width,
                height: currentUserSelection.height
              });
            });
          }
          const selectedOrientation = uiResponse.selectedOrientation;
          const selectedQuality = uiResponse.selectedQuality;
          const selectedPixelDensity = uiResponse.selectedPixelDensity;

          // User Selection Of Artboard
          if (selectedNode.type === "FRAME" || selectedNode.type === "GROUP") {
            invertNode(selectedNode).then(response => {
              figma.ui.postMessage({
                selectedOrientation: selectedOrientation,
                selectedQuality: selectedQuality,
                selectedPixelDensity: selectedPixelDensity,
                type: "networkRequest",
                uint8Array: response,
                ponits: coordinates,
                width: currentUserSelection.width,
                height: currentUserSelection.height
              });
            });
            try {
              if (figma.currentPage.selection[0].fills) {
                const fills = Array.from(figma.currentPage.selection[0].fills);
                fills.push({
                  type: "IMAGE",
                  visible: true,
                  opacity: 1,
                  scaleMode: "FILL",
                  imageHash: "efe98099a0aa97c1aa64e286bc82e633cc9aed22"
                });
                figma.currentPage.selection[0].fills = fills;
              }
            } catch (error) {}
          }

          // base image if the selected artboard is an image
          const cloneOfScreen = clone(figma.currentPage.selection[0].fills);
          const selectedImage = selectedNode.fills;
          cloneOfScreen[0] = selectedImage[0];
          figma.currentPage.selection[0].fills = cloneOfScreen;
        } else if (uiResponse.selectedArtboard.length === 0) {
          figma.closePlugin();
          figma.notify("Please choose an artboard");
        }
      } else if (uiResponse.type === "networkResponse") {
        const cloneOfScreen = clone(figma.currentPage.selection[0].fills);
        const fills = clone(currentUserSelection.fills);
        const selectedImage = angleFill(
          uiResponse.response,
          currentUserSelection
        );

        if (cloneOfScreen.length > 1) {
          const c = cloneOfScreen.slice(1);
          c[0] = selectedImage[0];
          figma.currentPage.selection[0].fills = c;
        }

        figma.closePlugin();
      } else if (uiResponse.type === "cancel-modal") {
        figma.closePlugin();
      } else if (uiResponse.type === "netWorkError") {
        figma.notify(uiResponse.message);
      } else if (uiResponse.type === "cloudinaryError") {
        figma.closePlugin();
        figma.notify(uiResponse.message);
      }
      console.log(uiResponse);
    } catch (error) {
      console.log("loading...");
    }
  });
} catch (error) {}
