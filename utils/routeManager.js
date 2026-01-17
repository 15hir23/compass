import { Platform, BackHandler } from 'react-native';

class RouteManager {
  constructor() {
    this.routeHistory = ['home'];
    this.listeners = [];
    this.currentRoute = 'home';
  }

  // Get current route
  getCurrentRoute() {
    return this.currentRoute;
  }

  // Navigate to a route
  navigate(route, params = {}) {
    console.log('RouteManager.navigate called with route:', route);
    this.routeHistory.push(route);
    this.currentRoute = route;
    this.updateURL(route);
    console.log('RouteManager: Updated URL, current route:', this.currentRoute);
    this.notifyListeners(route, params);
  }

  // Go back
  goBack() {
    if (this.routeHistory.length > 1) {
      this.routeHistory.pop();
      const previousRoute = this.routeHistory[this.routeHistory.length - 1];
      this.currentRoute = previousRoute;
      // Use replaceState when going back programmatically to avoid duplicate history entries
      // Browser back button will be handled by popstate event
      this.updateURL(previousRoute, true);
      this.notifyListeners(previousRoute, {});
      return true; // Can go back
    }
    return false; // Cannot go back, should close app
  }

  // Update URL for web
  updateURL(route, replace = false) {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const routeMap = {
        'home': '/home',
        'compass': '/compass',
        'upload': '/upload',
        'camera': '/camera',
        'map': '/map',
      };
      const path = routeMap[route] || '/home';
      console.log('RouteManager.updateURL: route=', route, 'path=', path, 'replace=', replace);
      if (replace) {
        window.history.replaceState({ route }, '', path);
      } else {
        window.history.pushState({ route }, '', path);
      }
      console.log('RouteManager.updateURL: URL updated to', window.location.pathname);
    }
  }

  // Initialize from URL (for web)
  initFromURL() {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const path = window.location.pathname;
      console.log('RouteManager.initFromURL: path=', path);
      const routeMap = {
        '/': 'home',
        '/home': 'home',
        '/compass': 'compass',
        '/upload': 'upload',
        '/camera': 'camera',
        '/map': 'map',
      };
      const route = routeMap[path] || 'home';
      console.log('RouteManager.initFromURL: route=', route);
      this.routeHistory = [route];
      this.currentRoute = route;
      return route;
    }
    return 'home';
  }

  // Subscribe to route changes
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Notify listeners
  notifyListeners(route, params) {
    this.listeners.forEach(listener => {
      listener(route, params);
    });
  }

  // Setup Android back button handler
  setupBackHandler(onBackPress) {
    if (Platform.OS === 'android') {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        if (this.routeHistory.length > 1) {
          const canGoBack = this.goBack();
          if (canGoBack) {
            onBackPress(this.currentRoute);
            return true; // Prevent default (closing app)
          }
        }
        return false; // Allow default (close app)
      });
      return () => backHandler.remove();
    }
    return () => {}; // No-op for non-Android
  }

  // Setup web browser back button handler
  setupWebBackHandler(onBackPress) {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handlePopState = (event) => {
        // Browser has already navigated, so we need to sync our state
        const path = window.location.pathname;
        const routeMap = {
          '/': 'home',
          '/home': 'home',
          '/compass': 'compass',
          '/upload': 'upload',
          '/camera': 'camera',
          '/map': 'map',
        };
        const targetRoute = routeMap[path] || 'home';
        
        // If we're already at the target route, do nothing
        if (targetRoute === this.currentRoute) {
          return;
        }
        
        // Check if the target route is in our history (going back)
        const historyIndex = this.routeHistory.lastIndexOf(targetRoute);
        if (historyIndex >= 0) {
          // We're going back/forward to a route in our history
          // Trim history to that point
          this.routeHistory = this.routeHistory.slice(0, historyIndex + 1);
          this.currentRoute = targetRoute;
          this.notifyListeners(targetRoute, {});
          onBackPress(targetRoute);
        } else {
          // Target route is not in our history
          // This could mean:
          // 1. User navigated to a route we haven't seen (shouldn't happen in SPA)
          // 2. User is trying to go back beyond our history
          
          // If we can go back in our history, do that instead
          if (this.routeHistory.length > 1) {
            this.routeHistory.pop();
            const previousRoute = this.routeHistory[this.routeHistory.length - 1];
            this.currentRoute = previousRoute;
            // Sync URL to our route history
            this.updateURL(previousRoute, true);
            this.notifyListeners(previousRoute, {});
            onBackPress(previousRoute);
          } else {
            // Can't go back, stay at home (don't exit app)
            this.currentRoute = 'home';
            this.routeHistory = ['home'];
            this.updateURL('home', true);
            onBackPress('home');
          }
        }
      };

      // Listen for browser back/forward button
      window.addEventListener('popstate', handlePopState);

      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
    return () => {}; // No-op for non-web
  }
}

export const routeManager = new RouteManager();
