sed -i 's/setActiveLauncher("intake");/if (onNavigateToTab) onNavigateToTab("intake");/g' src/components/LandingView.tsx
