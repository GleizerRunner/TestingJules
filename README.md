# AI Person Analyzer

This is a simple web application that uses client-side AI (TensorFlow.js and face-api.js) to analyze a photo of a person and attempt to identify age, gender, emotion, and an estimated skin tone. It also provides a note about the limitations of identifying complex "health cues" with current client-side models.

## Features

*   **Image Upload:** Allows users to upload an image file (JPEG, PNG).
*   **Face Detection:** Detects faces in the uploaded image.
*   **Age Estimation:** Predicts the approximate age of the detected person.
*   **Gender Prediction:** Predicts the gender of the detected person.
*   **Emotion Recognition:** Identifies the dominant facial expression (e.g., happy, sad, neutral).
*   **Skin Tone Estimation:** Provides an estimated average RGB skin tone from a central region of the face. This is a conceptual feature and highly dependent on lighting conditions.
*   **Health Cues Note:** Displays a message about the current limitations in analyzing detailed visual health cues.
*   **Responsive (Basic):** The UI has basic styling for usability.

## How to Use

1.  Clone or download this repository.
2.  Open the `index.html` file in a modern web browser that supports JavaScript.
3.  Click the "Choose File" button to select an image of a person.
4.  The application will load AI models (this may take a moment on first load) and then analyze the image.
5.  Results will be displayed below the image.

## Technology Used

*   HTML
*   CSS
*   JavaScript
*   **TensorFlow.js:** For running machine learning models in the browser.
*   **face-api.js:** A JavaScript API for face detection and face recognition in the browser implemented on top of TensorFlow.js. Models are loaded from its CDN.

## Limitations

*   **Accuracy:** The AI predictions (age, emotion, gender, skin tone) are estimations and may not always be accurate. Accuracy can be affected by image quality, lighting, pose, occlusions, etc.
*   **Performance:** Model loading and analysis can take a few seconds, especially on less powerful devices. All processing is done client-side.
*   **Skin Tone:** The skin tone analysis is a very basic approximation (average color of a facial region) and is highly sensitive to lighting conditions in the photo. It is not a precise dermatological assessment.
*   **Health Cues:** The application does not perform medical diagnosis or detailed health cue analysis. It only notes that general facial features are analyzed by the other functions.
*   **Single Face Focus:** While the app can detect multiple faces, detailed analysis is currently performed and displayed only for the first detected face.

## Development Notes
This application was developed as a demonstration of using `face-api.js` for client-side image analysis.
