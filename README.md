# 🦷 DentalAI — AI-Powered Dental Radiograph Analysis System

DentalAI is an advanced, AI-powered dental imaging and diagnostics assistant designed to support dental professionals, forensic practitioners, and students. By analyzing panoramic radiographs, the system automates anatomical structure identification, flags pathological conditions, estimates patient age using forensic parameters, and offers interactive student training tools.

---

## 🔒 User Verification & Role Workflows

The platform secures patient data and system access through a structured user approval workflow and role-based permissions:

*   **Verification Workflow**: During sign-up, new users upload their college ID card and enter their academic details. Registered accounts default to a pending status, during which access to diagnostic features is restricted.
*   **Approval & Rejection**: System administrators review the uploaded credentials. If the ID is verified, access is approved. If rejected (e.g., due to an blurry image), the user is notified of the rejection reason and can submit a re-application.
*   **User Access Roles**:
    *   **Student User**: Granted access to core diagnosis, landmark detection, comparative panels, and educational quiz/drawing tools.
    *   **Moderator Admin**: Inherits student privileges and gains access to the verification dashboard to approve/reject signups, inspect credentials, and manage active AI model configurations.
    *   **Platform Super Admin**: Possesses master control to toggle specific system modules on or off, configure blocked college keywords to screen signups, manually provision credentials, and manage accounts.

---

## 🚀 Core Features & Modules

### 1. Panoramic Landmark Detection
Automatically identifies and annotates anatomical structures on dental radiographs:
*   **Anatomical Classification**: Automatically detects and groups features into key regions: **Mandible**, **TMJ**, **Maxilla**, **Midline**, and **Other**.
*   **Interactive Visual Overlays**: Toggle polygon outlines and name tags directly over the radiograph.
*   **Custom Opacity Controls**: Adjust overlay transparency dynamically (from 0 to 100%) to trace underlying structures.
*   **Focused Navigation**: Toggle between **One by One** focus (highlighting a single structure with its clinical description and significance) and **Show All** mode.
*   **Radiograph Validation**: Automatically scans and validates if the uploaded file is a valid panoramic radiograph before initiating analysis.

---

### 2. Student Education & Quizzing
An interactive diagnostic training module:
*   **Dynamic Quiz Generation**: Randomly compiles 10-question multiple-choice quizzes based on AI landmark detections.
*   **Visual Prompts**: Places a visual crosshair marker on the target structure alongside its highlighted polygon boundary on the radiograph.
*   **Timer Modes**: Support for customizable countdown timers (15s, 30s, 45s, 60s, or unlimited). The timer changes color as it runs down to indicate urgency.
*   **Instant Clinical Feedback**: Shows correct answers and provides clinical definitions for correct responses, or highlights incorrect selections and outlines the expected structure.
*   **Radial Progress Charting**: Displays final test scores in a visual progress circle with history logs.

---

### 3. Landmark Drawing Practice
A training interface for manual anatomical mapping:
*   **Interactive Drawing Canvas**: Students sketch polygon outlines of requested anatomical landmarks by placing vertices directly on the radiograph.
*   **Drawing Controls**: Supports vertex undo operations, canvas clearing, and automatic polygon closing.
*   **Reference Guidance**: Toggles a dashed boundary showing the expected anatomical outline and centroid to guide the student.
*   **Real-Time Grading Engine**: Analyzes drawings against ground truth by calculating:
    *   **Centroid Distance**: Measure of positional alignment.
    *   **Bounding Box Overlap**: Score of overall shape and coverage accuracy.
    *   **Symmetry Alignment**: Automatically detects if a bilateral structure was drawn on the contralateral side and adjusts coordinates for fair scoring.
*   **Performance Metrics**: Returns an accuracy score, descriptive feedback, and highlighted corrections.

---

### 4. Patient Diagnosis
Pathology detection and abnormality mapping:
*   **Condition Detection**: Flags pathological anomalies (such as cavities, impacted teeth, bone loss, periapical lesions, and restorations).
*   **Severity Highlighting**: Color-codes bounding boxes based on condition severity (Severe in Red, Moderate in Orange, Mild in Green).
*   **Hover Tooltips**: Displays condition names, severity levels, and confidence ratings when hovering over a flagged zone.
*   **Per-Tooth Health Reports**: Automatically groups detected anomalies by dental quadrant and provides recommendations for clinical follow-ups.

---

### 5. Forensic Odontology
Chronological age estimation using dental development indices:
*   **Developmental Parameters**: Estimates patient age by analyzing indicators:
    *   Teeth eruption patterns.
    *   Presence of developing tooth buds.
    *   Extent of root apex closure.
    *   Narrowing of pulp chambers.
    *   Cementum deposition.
*   **Visual Age Dial**: Displays the estimated age in a visual gauge alongside the calculated min-max age range.
*   **Metric Contribution Weights**: Lists the weight contribution (%) of each parameter to show how the final age was calculated.

---

### 6. Side-by-Side Image Comparison
Comparative panel for longitudinal patient monitoring:
*   **Double Panel Layout**: Upload two patient radiographs side-by-side (ideal for before-and-after treatment analysis).
*   **Variance Tracker**: Identifies clinical changes and highlights the difference in total conditions between the two scans.

---

### 7. Interactive Tooth Chart
A digital dental charting system:
*   **FDI Numbering Grid**: Renders all 32 permanent teeth in an anatomical arch layout.
*   **Health Status Coloring**: Colors teeth by clinical status: **Healthy** (Cream), **Pathology** (Red), **Restored** (Blue), and **Missing** (Gray).
*   **Detail Inspector**: Click any tooth to open a side panel detailing its clinical findings and treatment history.

---

### 8. Case History Manager
A dashboard compiling patient records:
*   **Records Table**: Logs past diagnostic sessions, thumbnail previews, patient details, and summary results.
*   **Export Functions**: Generates and downloads patient records database as raw **JSON** or formatted **CSV** sheets.
*   **Security Erasure**: Employs a double-confirmation delete mechanism to prevent accidental data loss.

---

## 💎 Advanced & Nested Features

### 1. 3D Interactive Tooth Viewer
An interactive 3D simulation of the patient's dentition:
*   **Procedural 3D Modeling**: Generates anatomical crowns and root structures dynamically for molars, premolars, canines, and incisors, wrapping them inside upper and lower gum arches.
*   **Dynamic Pathology Mapping**: Connects to the diagnosis engine to highlight affected teeth in 3D using color codes based on severity.
*   **Hover Interactivity**: Auto-rotates, responds to drag and zoom gestures, and displays floating tooltips identifying specific tooth numbers and clinical statuses.

---

### 2. Standalone Medical Report Generator
Compiles diagnostics and forensics findings into official documentation:
*   **Zero-Dependency Charts**: Draws visual analytics directly onto canvas surfaces to allow chart exports without external dependencies.
    *   **Severity Distribution**: Pie chart breaking down findings by classification.
    *   **Confidence Levels**: Horizontal bar chart mapping the confidence score of each finding.
*   **Official Document Headers**: Formats headers with reference numbers, generation timestamps, and patient details.
*   **Export Actions**:
    *   **Print / Save PDF**: Loads document layouts in the background to launch the browser's native print screen.
    *   **HTML Package**: Downloads the report, base64 radiograph, and charts compiled into a single offline file.

---

## ⚙️ Administrative Controls

### Moderator Admin Panel
*   **Dashboard Stats**: Visualizes counters of pending, approved, rejected, and total users.
*   **Active AI Switcher**: Allows administrators to toggle the system's active backend analysis model.
*   **Account Approval Queue**: Lists registration applications, shows college ID card uploads in an expandable lightbox, and handles access approvals and rejections.

### Super Admin Panel
*   **Feature Flag Toggles**: Master switches to enable or disable individual pages (Landmarks, Diagnosis, Forensics, Compare, Education) across the platform.
*   **Registration Blocklist**: Screens college name keywords to automatically block registration attempts from matching entries.
*   **Credential Provisioning**: Allows direct user and administrator account creation, bypassing the registration queue.
