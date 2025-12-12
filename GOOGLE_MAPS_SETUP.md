# Google Maps Setup for Web

To enable the map view functionality on web, you need to set up a Google Maps API key:

## Steps:

1. **Get a Google Maps API Key:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the "Maps JavaScript API" and "Places API"
   - Create credentials (API Key)
   - Restrict the key to your domain for security

2. **Add the API Key:**
   - Open `web/index.html`
   - Find the line: `<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY_HERE&libraries=places"`
   - Replace `YOUR_API_KEY_HERE` with your actual API key

3. **For Native (iOS/Android):**
   - Add your Google Maps API key to `app.json`:
   ```json
   "android": {
     "config": {
       "googleMaps": {
         "apiKey": "YOUR_ANDROID_API_KEY"
       }
     }
   },
   "ios": {
     "config": {
       "googleMapsApiKey": "YOUR_IOS_API_KEY"
     }
   }
   ```

## Testing:

After adding your API key:
1. Restart the Expo development server
2. Click the "Google map" button in the compass view
3. The map should open with the compass overlay

## Free Tier:

Google Maps offers a generous free tier:
- $200 free credit per month
- Enough for 28,000 map loads per month
- No credit card required for development/testing

