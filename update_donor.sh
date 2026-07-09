sed -i 's/setActiveLauncher("donor");/if (onNavigateToDonor) onNavigateToDonor();/g' src/components/LandingView.tsx
