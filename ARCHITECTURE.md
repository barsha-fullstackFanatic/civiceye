# CivicEye Architecture & Plan

## 1. Folder Structure
```text
/src
  /assets          # Static assets (icons, markers, splash images)
  /components
    /common        # Buttons, Inputs, Dialogs (Tailwind UI)
    /map           # Google Maps wrappers, markers, clustering
    /reports       # Report cards, submission forms, feed layouts
    /layout        # Navbar, Sidebar, Page containers
  /contexts        # AuthContext, ThemeContext
  /hooks           # useAuth, useReports (Firestore sync), useLocation
  /lib             # Utility functions
  /services
    firebase.ts    # Firebase init & config
    gemini.ts      # Gemini API wrappers (Auto-Triage logic)
  /pages
    Landing.tsx    # Splash page & Intro
    Dashboard.tsx  # Main map & community feed view
    Report.tsx     # Issue submission flow
  /types           # TypeScript interfaces (Report, User, AIAnalysis)
  App.tsx          # Root routing and context providers
  main.tsx         # React entry point
```

## 2. Component Hierarchy
```html
<App>
  <AuthProvider>
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        
        <Route path="/dashboard" element={<Dashboard />}>
          <MapContainer />
          <ReportFeed>
            <ReportCard />
          </ReportFeed>
        </Route>
        
        <Route path="/report" element={<ReportFlow />}>
          <ImageUploader />
          <AIAnalysisPreview /> <!-- Highlights Agentic Intelligence -->
          <LocationPicker />
          <SubmissionForm />
        </Route>
      </Routes>
    </Router>
  </AuthProvider>
</App>
```

## 3. Firestore Collections

**`users`**
* `uid`: string (Primary Key)
* `displayName`: string
* `email`: string
* `role`: 'citizen' | 'admin'
* `points`: number (Gamification for good reporting)
* `created_at`: timestamp

**`reports`**
* `id`: string (Primary Key)
* `author_uid`: string (Foreign Key -> users)
* `location`: GeoPoint (lat, lng)
* `image_url`: string
* `status`: 'PENDING' | 'ACKNOWLEDGED' | 'RESOLVED'
* `upvotes`: number
* `ai_metadata`: Map `{ category: string, severity: string, summary: string }`
* `created_at`: timestamp

## 4. Development Roadmap (5 Days)
* **Day 1: Foundation & Auth.** Setup Vite/React, Tailwind, Firebase (Storage, Auth, Firestore). Build the Landing Page & Google Sign-in flow.
* **Day 2: Mapping & Core UI.** Integrate the Google Maps API. Build the Dashboard UI to render map markers and a side-feed of dummy issues.
* **Day 3: The "Magic" (Gemini + Upload).** Implement the Report Flow. Add Firebase Storage for image uploads. Pass the image array to the Gemini Multimodal API to auto-categorize and rank the severity of the issue based strictly on the visual evidence.
* **Day 4: Integration.** Connect the submission flow to Firestore. Ensure the Dashboard feed and Map sync in real-time with Firestore using listeners. Add an upvoting mechanic.
* **Day 5: Polish & Pitch.** Refine UI/UX (loading states, location permissions, toast notifications). Optimize the pitch deck, heavily emphasizing the custom 'Smart Triage' automation.

## 5. MVP Feature List
1. **Google OAuth Authentication:** Simple, frictionless sign-in for citizens.
2. **Interactive Map Radar:** Real-time Google Maps integration showing localized issues as clustered hot spots.
3. **Smart Triage Reporting (Agentic Depth):** Users just snap a photo; Gemini multimodal models analyze the image, detect the problem type (e.g., "Pothole", "Water Leak"), assess scale/severity, and auto-populate the metadata.
4. **Community Validation:** Upvote mechanics to prevent duplicate reports and surface the most critical community pains to city admins.

## 6. Recommended Project Architecture
* **Client Frontend:** React Single Page Application (built via Vite). Componentized structure leveraging Tailwind CSS for rapid styling without complex asset management.
* **State Management:** Keep it light. React Context for Auth, standard local hooks for UI state, and Firebase SDK listeners for real-time remote data sync across the community feeds.
* **Backend as a Service (BaaS):** Rely purely on Firebase. Writing a strict custom backend in 5 days is a time-sink. Use Firebase Storage for photos, Firestore for NoSQL queries (e.g., geospatial report pulling).
* **AI Invocation Orchestration:** For the scope of a hackathon, initiate Gemini API calls securely via a light server-side route (e.g. `server.ts` Express layer proxying AI requests) so the front-end remains secure but logic is executed quickly without writing full microservices.
