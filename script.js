// DOM Element References
const imageUpload = document.getElementById('imageUpload');
const uploadedImage = document.getElementById('uploadedImage');
const statusDisplay = document.getElementById('status');
const faceCountDisplay = document.getElementById('faceCount');
const analysisResultsContainer = document.getElementById('analysisResultsContainer');
const ageResultDisplay = document.getElementById('ageResult');
const emotionResultDisplay = document.getElementById('emotionResult');
const skinColorResultDisplay = document.getElementById('skinColorResult');
const healthCuesResultDisplay = document.getElementById('healthCuesResult');
// Note: genderResultDisplay is fetched inside functions, which is fine.

let modelsLoaded = false; // Flag to track if AI models have been loaded

// Asynchronously loads all necessary AI models from face-api.js CDN
async function loadModels() {
    const MODEL_URL = 'https://cdn.jsdelivr.net/npm/face-api.js@latest/weights'; // URL to model weights
    statusDisplay.textContent = 'Loading AI models... This may take a moment.';
    imageUpload.disabled = true; // Disable file input during model loading

    try {
        // Load all required models concurrently
        await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),    // For fast face detection
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),   // For detecting facial landmarks
            faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL), // Used for face recognition features (though primarily for landmarks here)
            faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL), // For recognizing facial expressions (emotions)
            faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL)         // For estimating age and gender
        ]);
        modelsLoaded = true;
        statusDisplay.textContent = 'Models loaded. Ready to analyze.';
        imageUpload.disabled = false; // Re-enable file input
        console.log("Models loaded successfully");
    } catch (error) {
        console.error("Error loading models:", error);
        statusDisplay.textContent = 'Error loading AI models. Please refresh. File input disabled.';
        modelsLoaded = false;
        imageUpload.disabled = true; // Keep disabled if models fail
    }
}

// Resets the displayed results to their initial state
function resetResults() {
    if (!modelsLoaded) {
        statusDisplay.textContent = imageUpload.disabled ? 'Error loading AI models. Please refresh.' : 'Awaiting image... (Models loading/failed)';
    } else if (uploadedImage.src && uploadedImage.src !== '#' && uploadedImage.style.display !== 'none') {
        statusDisplay.textContent = 'Ready for new analysis or select a new image.';
    } else {
        statusDisplay.textContent = 'Ready to analyze. Please select an image.';
    }

    faceCountDisplay.textContent = '0';
    ageResultDisplay.textContent = '-';
    emotionResultDisplay.textContent = '-';
    const genderResultDisplay = document.getElementById('genderResult');
    if(genderResultDisplay) genderResultDisplay.textContent = '-'; // Ensure gender is also reset
    skinColorResultDisplay.innerHTML = '-'; // Use innerHTML due to potential swatch
    healthCuesResultDisplay.textContent = '-';
    analysisResultsContainer.style.display = 'none'; // Hide the results container
}

// Event listener for the file input field
imageUpload.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) {
        // statusDisplay.textContent = 'No file selected.'; // User might cancel, don't be too chatty
        return;
    }

    statusDisplay.textContent = 'Loading image...';
    uploadedImage.style.display = 'none';      // Hide current image while new one loads
    analysisResultsContainer.style.display = 'none'; // Hide old results

    const reader = new FileReader(); // Used to read the selected file

    // Executed when the file is successfully loaded
    reader.onload = async function(e) {
        uploadedImage.src = e.target.result;   // Set the image source to the loaded file
        uploadedImage.style.display = 'block'; // Display the image

        if (!modelsLoaded) {
            statusDisplay.textContent = 'Please wait, AI models are still loading or failed to load.';
            return; 
        }
        statusDisplay.textContent = 'Image loaded. Analyzing...';
        await analyzeImage(); // Trigger the main analysis function
    }

    // Executed if there's an error loading the file
    reader.onerror = function() {
        statusDisplay.textContent = 'Error loading image.';
        uploadedImage.style.display = 'none';
        resetResults(); // Clear out any previous results
    }

    reader.readAsDataURL(file); // Read the file as a Data URL
});

// Main function to perform AI analysis on the uploaded image
async function analyzeImage() {
    if (!modelsLoaded || !uploadedImage.src || uploadedImage.src.startsWith('#') || uploadedImage.style.display === 'none') {
        statusDisplay.textContent = 'Models not loaded or no image displayed for analysis.';
        console.log('Analyze image called without models or visible image');
        return;
    }

    statusDisplay.textContent = 'Detecting faces... This can take a few seconds.';
    console.log("Starting face detection...");
    analysisResultsContainer.style.display = 'none'; // Hide results until new ones are ready
    faceCountDisplay.textContent = '...'; // Indicate activity during detection


    try {
        // Perform face detection and analysis using face-api.js
        const detections = await faceapi
            .detectAllFaces(uploadedImage, new faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.5 })) // Use TinyFaceDetector for speed
            .withFaceLandmarks()    // Get facial landmark positions
            .withFaceExpressions()  // Get emotion predictions
            .withAgeAndGender();    // Get age and gender predictions

        console.log("Detections found:", detections);
        faceCountDisplay.textContent = detections.length; // Display number of faces detected

        if (detections.length > 0) {
            const firstFace = detections[0]; // Focus on the first detected face for simplicity

            // Display Age
            if (firstFace.age) {
                ageResultDisplay.textContent = `${Math.round(firstFace.age)} years (approx.)`;
            } else {
                ageResultDisplay.textContent = "N/A";
            }
            
            // Display Emotion (dominant expression)
            if (firstFace.expressions && Object.keys(firstFace.expressions).length > 0) {
                let maxConfidence = 0;
                let dominantExpression = "N/A";
                for (const [expression, confidence] of Object.entries(firstFace.expressions)) {
                    if (confidence > maxConfidence) {
                        maxConfidence = confidence;
                        dominantExpression = expression;
                    }
                }
                emotionResultDisplay.textContent = `${dominantExpression} (${(maxConfidence * 100).toFixed(1)}%)`;
            } else {
                emotionResultDisplay.textContent = "N/A";
            }

            // Display Gender
            const genderResultDisplay = document.getElementById('genderResult');
            if (firstFace.gender && genderResultDisplay) {
                genderResultDisplay.textContent = `${firstFace.gender} (${(firstFace.genderProbability * 100).toFixed(1)}%)`;
            } else if (genderResultDisplay){
                genderResultDisplay.textContent = "N/A";
            }

            // Perform and display conceptual skin tone analysis
            const skinTone = await getAverageSkinTone(firstFace, uploadedImage);
            if (skinTone) {
                skinColorResultDisplay.innerHTML = `RGB(${skinTone.r}, ${skinTone.g}, ${skinTone.b}) <div style="width:20px; height:20px; background-color:rgb(${skinTone.r},${skinTone.g},${skinTone.b}); display:inline-block; border:1px solid #fff; margin-left:5px; vertical-align: middle;"></div>`;
            } else {
                skinColorResultDisplay.textContent = "N/A or Error";
            }

            // Display message about health cues
            healthCuesResultDisplay.textContent = 'Detailed visual health cue analysis is not available with current client-side models. General facial features are analyzed above.';
            
            analysisResultsContainer.style.display = 'block'; // Show the results container
            statusDisplay.textContent = `Analysis complete. ${detections.length} face(s) processed.`;

        } else {
            statusDisplay.textContent = 'No faces detected in the image.';
            resetResults(); // Clear results if no faces are found
            faceCountDisplay.textContent = '0'; // Explicitly set face count to 0
        }
    } catch (error) {
        console.error("Error during face analysis:", error);
        statusDisplay.textContent = 'Error during analysis. See console for details.';
        resetResults(); // Clear results on analysis error
    }
}

// Calculates an approximate average skin tone from a central region of a detected face
async function getAverageSkinTone(faceDetection, imageElement) {
    if (!faceDetection || !imageElement.src || imageElement.src.startsWith('#')) {
        console.warn("Cannot get skin tone, face detection or image element is invalid.");
        return null;
    }

    const box = faceDetection.detection.box; // Bounding box of the detected face
    const tempCanvas = document.createElement('canvas'); // Temporary canvas for processing
    const tempCtx = tempCanvas.getContext('2d');

    // Define a smaller central region of the face to sample pixels from
    // This helps avoid hair, beards, or parts of the background.
    const regionWidth = box.width * 0.4;  // Use 40% of the width
    const regionHeight = box.height * 0.5; // Use 50% of the height
    const regionX = box.x + (box.width - regionWidth) / 2;
    const regionY = box.y + (box.height - regionHeight) / 2; // Start a bit higher in the typical forehead/cheek area
    
    tempCanvas.width = regionWidth;
    tempCanvas.height = regionHeight;

    try {
        // Draw the selected face region onto the temporary canvas
        tempCtx.drawImage(
            imageElement, // Source image
            regionX, regionY, regionWidth, regionHeight, // Source rectangle (from original image)
            0, 0, regionWidth, regionHeight             // Destination rectangle (on temp canvas)
        );

        const imageData = tempCtx.getImageData(0, 0, regionWidth, regionHeight); // Get pixel data
        const data = imageData.data;
        let r = 0, g = 0, b = 0;
        let count = 0; // Number of pixels included in the average

        // Iterate over pixels (RGBA)
        for (let i = 0; i < data.length; i += 4) {
            // Basic filter to ignore very dark or very light pixels (potential outliers)
            if (data[i] > 15 && data[i] < 240 && 
                data[i+1] > 15 && data[i+1] < 240 &&
                data[i+2] > 15 && data[i+2] < 240) {
                r += data[i];     // Sum of red values
                g += data[i + 1]; // Sum of green values
                b += data[i + 2]; // Sum of blue values
                count++;
            }
        }

        if (count === 0) {
            console.warn("No suitable pixels found for skin tone analysis in the region.");
            return null; 
        }

        // Calculate average RGB values
        r = Math.floor(r / count);
        g = Math.floor(g / count);
        b = Math.floor(b / count);

        return { r, g, b };

    } catch (error) {
        console.error("Error in getAverageSkinTone:", error);
        return null; // Return null if an error occurs
    }
}

// Initial actions when the script loads:
loadModels();     // Start loading AI models immediately
resetResults();   // Set initial UI state
